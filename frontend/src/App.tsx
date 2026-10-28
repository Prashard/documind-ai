import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react'
import { BookOpen, CheckCircle2, ChevronRight, CircleHelp, FileText, Github, LoaderCircle, MessageSquareText, Plus, Send, ShieldCheck, Sparkles, Trash2, UploadCloud, X } from 'lucide-react'

type DocumentItem = { id: string; name: string; pages_with_text: number; chunks: number }
type Source = { document_id: string; document_name: string; page: number; excerpt: string; score: number }
type Answer = { answer: string; mode: string; sources: Source[]; disclaimer: string }
const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '')

function App() {
  const [docs, setDocs] = useState<DocumentItem[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [question, setQuestion] = useState('What are the key points in this document?')
  const [answer, setAnswer] = useState<Answer | null>(null)
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [apiOnline, setApiOnline] = useState<boolean | null>(null)
  const [dragging, setDragging] = useState(false)

  const selectedDocs = useMemo(() => docs.filter(d => selected.includes(d.id)), [docs, selected])

  async function loadDocuments() {
    try {
      const response = await fetch(`${API_URL}/documents`)
      if (!response.ok) throw new Error('API unavailable')
      const data = await response.json()
      setDocs(data.documents)
      setApiOnline(true)
    } catch {
      setApiOnline(false)
    }
  }

  useEffect(() => { void loadDocuments() }, [])

  async function uploadFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList)
    if (!files.length) return
    setError('')
    setUploading(true)
    try {
      for (const file of files) {
        if (!file.name.toLowerCase().endsWith('.pdf')) throw new Error(`${file.name}: only PDF files are supported.`)
        const form = new FormData()
        form.append('file', file)
        const response = await fetch(`${API_URL}/documents`, { method: 'POST', body: form })
        const payload = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(payload.detail || `Could not upload ${file.name}`)
        const doc = payload as DocumentItem
        setDocs(prev => [...prev.filter(item => item.id !== doc.id), doc])
        setSelected(prev => [...new Set([...prev, doc.id])])
      }
      setAnswer(null)
      setApiOnline(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed. Check that the API is running.')
    } finally {
      setUploading(false)
    }
  }

  async function askQuestion(event: FormEvent) {
    event.preventDefault()
    if (question.trim().length < 3) { setError('Enter a question with at least 3 characters.'); return }
    if (!selected.length) { setError('Upload a PDF and select it before asking a question.'); return }
    setBusy(true); setError(''); setAnswer(null)
    try {
      const response = await fetch(`${API_URL}/ask`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, document_ids: selected }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.detail || 'Could not answer this question.')
      setAnswer(payload as Answer)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed. Check the backend connection.')
    } finally { setBusy(false) }
  }

  async function removeDocument(id: string) {
    setError('')
    try {
      const response = await fetch(`${API_URL}/documents/${id}`, { method: 'DELETE' })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.detail || 'Could not delete document.')
      setDocs(prev => prev.filter(doc => doc.id !== id))
      setSelected(prev => prev.filter(docId => docId !== id))
      setAnswer(null)
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not delete document.') }
  }

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files) void uploadFiles(event.target.files)
    event.target.value = ''
  }

  return <div className="app-shell">
    <aside className="sidebar">
      <a className="brand" href="#top" aria-label="DocuMind AI home"><span className="brand-mark"><Sparkles size={19} /></span><span>documind<span className="brand-ai">.ai</span><small>KNOWLEDGE, CONNECTED.</small></span></a>
      <div className="side-label">WORKSPACE</div>
      <button className="nav-item active"><MessageSquareText size={17} /> Document chat <span className="nav-dot" /></button>
      <div className="side-label library-heading"><span>YOUR LIBRARY</span><span>{docs.length.toString().padStart(2, '0')}</span></div>
      <div className="library-list">
        {docs.length === 0 && <p className="empty-library">Your library is empty.<br />Add a PDF to begin.</p>}
        {docs.map(doc => <div className={`library-item ${selected.includes(doc.id) ? 'chosen' : ''}`} key={doc.id}>
          <button className="doc-select" onClick={() => setSelected(prev => prev.includes(doc.id) ? prev.filter(id => id !== doc.id) : [...prev, doc.id])} title="Select document"><FileText size={16} /><span>{doc.name}<small>{doc.pages_with_text} pages · {doc.chunks} chunks</small></span></button>
          <button className="icon-button delete-doc" title={`Remove ${doc.name}`} onClick={() => void removeDocument(doc.id)}><Trash2 size={14} /></button>
        </div>)}
      </div>
      <label className="sidebar-add"><Plus size={16} /> Add documents<input type="file" accept="application/pdf,.pdf" multiple onChange={onFileChange} /></label>
      <div className="sidebar-bottom"><div className="privacy-note"><ShieldCheck size={17} /><span><b>Your sources matter.</b><small>Answers link back to the pages they came from.</small></span></div><a className="github-link" href="https://github.com/" target="_blank" rel="noreferrer"><Github size={15} /> Built for transparent answers <ChevronRight size={14} /></a></div>
    </aside>

    <main className="main-panel" id="top">
      <header className="topbar"><div className="breadcrumb">Workspace <ChevronRight size={14} /> <b>Document chat</b></div><div className="topbar-right"><span className={`status-pill ${apiOnline === false ? 'offline' : ''}`}><span />{apiOnline === false ? 'API disconnected' : apiOnline ? 'System operational' : 'Connecting'}</span><div className="avatar">ZL</div></div></header>
      <section className="hero"><div className="eyebrow"><span className="eyebrow-line" /> YOUR PERSONAL KNOWLEDGE ENGINE</div><h1>Every document has<br />an <span>answer.</span></h1><p className="hero-copy">Ask better questions. Find the right information.<br className="desktop-break" /> Know exactly where every answer comes from.</p><div className="trust-row"><span><ShieldCheck size={15} /> Source-grounded answers</span><i /> <span><BookOpen size={15} /> Page-level citations</span><i /> <span><Sparkles size={15} /> AI-ready workflow</span></div></section>

      <section className="content-grid">
        <div className="left-column">
          <div className="section-heading"><div><span className="step-number">01</span><div><h2>Build your knowledge base</h2><p>Upload a PDF to get started.</p></div></div><span className="tiny-counter">PDF / MAX 10 MB</span></div>
          <label className={`upload-zone ${dragging ? 'dragging' : ''} ${uploading ? 'uploading' : ''}`} onDragOver={e => { e.preventDefault(); setDragging(true) }} onDragLeave={() => setDragging(false)} onDrop={e => { e.preventDefault(); setDragging(false); void uploadFiles(e.dataTransfer.files) }}>
            <input type="file" accept="application/pdf,.pdf" multiple onChange={onFileChange} />
            <div className="upload-icon">{uploading ? <LoaderCircle className="spin" size={23} /> : <UploadCloud size={23} />}</div><b>{uploading ? 'Processing your document…' : 'Drop your PDF here'}</b><span>or <u>browse files</u> from your computer</span><small>PDF documents only · Select multiple files</small>
          </label>
          {selectedDocs.length > 0 && <div className="selection-note"><CheckCircle2 size={15} /> {selectedDocs.length} document{selectedDocs.length > 1 ? 's' : ''} selected for this conversation</div>}
          <div className="section-heading question-heading"><div><span className="step-number">02</span><div><h2>Ask your documents</h2><p>Get an answer backed by retrieved passages.</p></div></div></div>
          <form className="question-form" onSubmit={askQuestion}><label htmlFor="question">YOUR QUESTION</label><textarea id="question" value={question} onChange={e => setQuestion(e.target.value)} placeholder="What would you like to understand?" rows={3} maxLength={1000} /><div className="question-footer"><span>{question.length}/1000 characters</span><button type="submit" disabled={busy || uploading || !selected.length}>{busy ? <><LoaderCircle size={16} className="spin" /> Searching…</> : <>Find answer <Send size={15} /></>}</button></div></form>
          <div className="suggestions"><span>TRY ASKING</span>{['Summarize the key findings', 'What dates or deadlines are mentioned?', 'What are the main risks?'].map(item => <button key={item} onClick={() => setQuestion(item)}>{item}<ChevronRight size={13} /></button>)}</div>
        </div>

        <div className="right-column"><div className="answer-head"><div><span className="step-number">03</span><div><h2>Answer & evidence</h2><p>Responses grounded in your sources.</p></div></div><span className="live-label"><span /> LIVE</span></div>
          <div className={`answer-card ${answer ? 'has-answer' : ''}`}>
            {!answer && !busy && <div className="answer-empty"><div className="answer-orbit"><div className="orbit-dot dot-one" /><div className="orbit-dot dot-two" /><div className="orbit-core"><Sparkles size={25} /></div></div><h3>Your answer will appear here</h3><p>Upload a document and ask a question. DocuMind will retrieve relevant passages and show the source pages for verification.</p><div className="empty-steps"><span><i>1</i> Upload</span><ChevronRight size={13} /><span><i>2</i> Ask</span><ChevronRight size={13} /><span><i>3</i> Verify</span></div></div>}
            {busy && <div className="loading-state"><LoaderCircle size={27} className="spin" /><b>Searching your documents</b><span>Ranking passages by relevance…</span></div>}
            {answer && <div className="answer-content"><div className="answer-label"><span><Sparkles size={14} /> GENERATED RESPONSE</span><span className="mode-tag">{answer.mode === 'llm+retrieval' ? 'AI + RETRIEVAL' : 'RETRIEVAL MODE'}</span></div><div className="answer-text">{answer.answer}</div><div className="answer-disclaimer"><CircleHelp size={15} /> {answer.disclaimer}</div><div className="source-title"><div><h3>Retrieved sources</h3><p>{answer.sources.length} relevant passage{answer.sources.length === 1 ? '' : 's'} returned</p></div><span className="source-badge">CITATIONS</span></div>{answer.sources.length === 0 ? <p className="no-sources">No relevant source passages were found for this question.</p> : answer.sources.map((source, index) => <article className="source-card" key={`${source.document_id}-${source.page}-${index}`}><div className="source-card-top"><span className="source-number">S{index + 1}</span><span className="source-file"><FileText size={14} />{source.document_name}</span><span className="page-tag">PAGE {source.page}</span></div><p>{source.excerpt}</p><div className="source-card-bottom"><span>Relevance score</span><b>{(source.score * 100).toFixed(1)}%</b></div><div className="score-track"><span style={{ width: `${Math.min(100, source.score * 100)}%` }} /></div></article>)}</div>}
          </div>
          <div className="evidence-note"><ShieldCheck size={17} /><span><b>Verify before you rely.</b><small>Retrieval relevance is not proof of correctness. Always check the original page.</small></span></div>
        </div>
      </section>
      {error && <div className="toast-error" role="alert"><X size={17} /><span>{error}</span><button onClick={() => setError('')} aria-label="Dismiss error"><X size={15} /></button></div>}
      <footer className="footer"><span>DOCUMIND AI <i>•</i> A SOURCE-FIRST KNOWLEDGE TOOL</span><span>BUILT WITH CARE <Sparkles size={12} /></span></footer>
    </main>
  </div>
}

export default App
