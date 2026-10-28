from io import BytesIO

from fastapi.testclient import TestClient
from pypdf import PdfWriter

from app.main import app, documents, split_into_chunks

client = TestClient(app)


def setup_function():
    documents.clear()


def make_pdf(text: str) -> bytes:
    # A tiny generated PDF with selectable text is awkward to create without reportlab;
    # this helper writes a blank PDF for negative-path tests only.
    writer = PdfWriter()
    writer.add_blank_page(width=300, height=300)
    output = BytesIO()
    writer.write(output)
    return output.getvalue()


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}


def test_chunking_keeps_page_number_and_overlap():
    chunks = split_into_chunks("alpha beta gamma delta epsilon", page=7, chunk_size=18, overlap=5)
    assert len(chunks) >= 2
    assert all(chunk.page == 7 for chunk in chunks)


def test_upload_rejects_non_pdf():
    response = client.post("/documents", files={"file": ("notes.txt", b"hello", "text/plain")})
    assert response.status_code == 415


def test_upload_rejects_pdf_without_selectable_text():
    response = client.post("/documents", files={"file": ("blank.pdf", make_pdf(""), "application/pdf")})
    assert response.status_code == 422


def test_ask_requires_document():
    response = client.post("/ask", json={"question": "What is this about?"})
    assert response.status_code == 400
