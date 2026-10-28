# DocuMind AI

**A source-first PDF question-answering app.** Upload text-based PDFs, ask questions, retrieve relevant passages, and inspect page-level source excerpts. Optional LLM synthesis is enabled by a server-side API key.

> Portfolio project status: this repository contains an MVP implementation. Do not describe unimplemented features as complete.

## What works in this MVP

- Upload one or more text-based PDF files.
- Extract text page-by-page and split it into overlapping chunks.
- Search selected documents with TF-IDF ranking (no API key required).
- Return answer excerpts with document names, page numbers, relevance scores, and a verification warning.
- Optional OpenAI-compatible answer synthesis through the official OpenAI SDK; the API key stays on the backend.
- Delete uploaded documents from the current in-memory session.
- React + TypeScript responsive interface.
- FastAPI API, basic input/size/page limits, and pytest tests.

## Current limitations (be honest about these)

- **Storage is in memory.** Uploaded documents are lost when the backend restarts or sleeps; multiple server workers do not share state.
- **Scanned PDFs are not supported** because OCR is not implemented.
- TF-IDF is a lexical baseline, not a semantic embedding model. A relevant passage can be missed if wording differs substantially.
- If no `OPENAI_API_KEY` is configured, the app returns retrieved excerpts instead of a synthesized answer.
- LLM mode has not been evaluated as a production-grade factuality guarantee. Always verify citations against original pages.
- No authentication, per-user data isolation, rate limiting, malware scanning, persistent vector database, or production privacy controls yet. Do not upload confidential documents to a public demo.

## Architecture

```text
React + TypeScript (Vite)
       | HTTP / JSON + multipart PDF upload
       v
FastAPI backend
  ├── PDF extraction (pypdf), page labels
  ├── chunking with overlap
  ├── TF-IDF retrieval + cosine similarity
  ├── optional LLM synthesis (OPENAI_API_KEY on server only)
  └── response: answer + source excerpts + page numbers
       |
       v
In-memory document store (MVP only)
```

## Requirements

- Python 3.11 recommended
- Node.js 20+ recommended
- Git
- Optional: an OpenAI API key for synthesized answers. The retrieval-only mode works without one.

## Run locally

### 1. Backend

```bash
cd backend
python -m venv .venv
# Windows PowerShell:
.venv\\Scripts\\Activate.ps1
# macOS/Linux:
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Open http://localhost:8000/docs for interactive API documentation and http://localhost:8000/health for the health check.

Optional LLM mode: set `OPENAI_API_KEY` in your shell before starting the backend. Never put the secret in frontend code or commit it to Git.

```powershell
# Windows PowerShell (current terminal only)
$env:OPENAI_API_KEY="your-key-here"
$env:OPENAI_MODEL="gpt-4o-mini"
uvicorn app.main:app --reload --port 8000
```

```bash
# macOS/Linux (current terminal only)
export OPENAI_API_KEY="your-key-here"
export OPENAI_MODEL="gpt-4o-mini"
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend

Open a second terminal:

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

On Windows, create `frontend/.env.local` manually with this line:

```text
VITE_API_URL=http://localhost:8000
```

Vite prints the local URL, normally http://localhost:5173.

## API endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/health` | Health check |
| GET | `/documents` | List documents in current process |
| POST | `/documents` | Upload a PDF as multipart form field `file` |
| DELETE | `/documents/{document_id}` | Remove a document |
| POST | `/ask` | Ask a question; JSON `{ "question": "...", "document_ids": ["..."] }` |

## Tests

From `backend/` with the virtual environment active:

```bash
pytest -q
```

The tests cover health, chunking/page metadata, invalid uploads, textless PDFs, and asking before uploading. Expand them before claiming production readiness.

## Deploy for free (free tiers and limits can change)

Suggested split deployment: **Render for FastAPI** and **Vercel for the Vite frontend**. Free services may sleep, restart, or have resource limits; this MVP's in-memory data disappears on restart. Check each provider's current plan and terms before deploying.

### A. Push the project to GitHub

1. Create a new repository named `documind-ai`.
2. From the project root run:

```bash
git init
git add .
git commit -m "Build DocuMind AI PDF question answering MVP"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/documind-ai.git
git push -u origin main
```

Check `git status` and ensure no `.env`, API key, uploaded private PDF, or credential is staged.

### B. Deploy the backend to Render

1. Create a new Web Service from the GitHub repository.
2. Set **Root Directory** to `backend`.
3. Build command: `pip install -r requirements.txt`
4. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Set health check path to `/health` if the dashboard offers it.
6. Add environment variables in Render's dashboard:
   - `CORS_ORIGINS` = your Vercel URL, e.g. `https://your-app.vercel.app` (no trailing slash; comma-separated if several origins)
   - `OPENAI_API_KEY` = optional secret, only if you want LLM synthesis
   - `OPENAI_MODEL` = `gpt-4o-mini` (or a model available to your account)
7. Deploy and test `https://YOUR-API.onrender.com/health` and `/docs`.

Never commit the API key or put it in a `VITE_...` variable. Anything prefixed with `VITE_` is exposed to browser code.

### C. Deploy the frontend to Vercel

1. Import the same GitHub repository into Vercel.
2. Set **Root Directory** to `frontend`.
3. Framework preset: Vite.
4. Add environment variable `VITE_API_URL` = your Render API URL, e.g. `https://your-api.onrender.com`.
5. Deploy. Copy the final Vercel URL.
6. Update Render's `CORS_ORIGINS` with that exact Vercel origin and redeploy/restart the backend.
7. Test upload, asking, source excerpts, delete, and a refresh/restart scenario.

If Vercel asks for a build command, use `npm run build`; output directory is `dist`.

### D. Free-tier caveats

Hosting providers change free-plan eligibility, sleep behavior, build limits, and availability. Check current provider documentation and billing screens. The app is a portfolio demo, not a secure multi-user document service. Do not promise persistent document storage until you implement a database/object store.

## Suggested next improvements

1. Add semantic embeddings and a persistent vector store (e.g. PostgreSQL + pgvector).
2. Add OCR for scanned PDFs.
3. Add user authentication and per-user document isolation.
4. Persist file metadata and PDFs in object storage; add deletion/retention controls.
5. Add retrieval metrics: Recall@k, MRR/nDCG, answer faithfulness, citation precision, and a small gold question set.
6. Add background processing, rate limits, upload scanning, and structured logs.
7. Add CI (GitHub Actions), more tests, and a demo dataset containing public/non-confidential documents.

## Resume/portfolio description (edit to match what you actually implement)

**DocuMind AI — Source-grounded PDF Q&A | React, TypeScript, FastAPI, Python, scikit-learn**
- Built a full-stack application that extracts text from PDFs, chunks it by page, and retrieves relevant passages using TF-IDF and cosine similarity.
- Implemented a FastAPI API for uploads, document selection, question answering, and page-level source excerpts.
- Added optional server-side LLM synthesis with evidence-only prompting and a retrieval-only fallback when no API key is configured.
- Added input validation, file/page limits, API tests, and deployment configuration.

Only include features that you have run and verified yourself. Be prepared to explain the difference between lexical retrieval, embeddings, and generation.
