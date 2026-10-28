# Deployment checklist

- [ ] Run backend tests (`pytest -q`).
- [ ] Run frontend build (`npm run build`).
- [ ] Confirm `.env`, `.env.local`, uploaded PDFs, and secrets are not committed.
- [ ] Deploy backend; test `/health`.
- [ ] Set backend `CORS_ORIGINS` to the exact frontend origin.
- [ ] Set frontend `VITE_API_URL` to the backend URL.
- [ ] Upload a non-sensitive, text-based PDF and ask a question.
- [ ] Confirm source document names and page numbers make sense.
- [ ] Test with no API key (retrieval-only mode).
- [ ] If using LLM mode, set the key only in the backend host's secret/environment settings.
- [ ] Test errors: non-PDF, blank PDF, large PDF, no documents selected.
- [ ] Add screenshots and a short demo GIF/video to the README.
- [ ] Clearly document in-memory storage and other limitations.
