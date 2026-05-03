const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

async function req(path, opts = {}) {
  const r = await fetch(`${BASE}${path}`, { headers: { 'Content-Type': 'application/json', ...opts.headers }, ...opts })
  if (!r.ok) { const e = await r.json().catch(() => ({ detail: r.statusText })); throw new Error(e.detail || 'API Error') }
  return r.json()
}

export const classifyComplaint  = (text, customer_id, source) => req('/classify', { method: 'POST', body: JSON.stringify({ text, customer_id, source }) })
export const classifyBatch      = (complaints) => req('/classify/batch', { method: 'POST', body: JSON.stringify({ complaints }) })
export const classifyStream     = (text) => fetch(`${BASE}/classify/stream`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) })
export const listDocuments      = (limit = 50, offset = 0) => req(`/documents?limit=${limit}&offset=${offset}`)
export const upsertDocument     = (id, text, metadata = {}) => req('/documents', { method: 'POST', body: JSON.stringify({ id, text, metadata }) })
export const deleteDocument     = (id) => req(`/documents/${id}`, { method: 'DELETE' })
export const submitFeedback     = (complaint_id, is_correct, correct_category, correct_urgency, reviewer_note) =>
  req('/feedback', { method: 'POST', body: JSON.stringify({ complaint_id, is_correct, correct_category, correct_urgency, reviewer_note }) })
export const getHealth          = () => req('/health')
export const getStats           = () => req('/stats')
export const getAnalytics       = (limit = 500) => req(`/analytics?limit=${limit}`)
export const getCacheInfo       = () => req('/cache/info')
export const clearCache         = () => req('/cache', { method: 'DELETE' })
export const getFewShotExamples = () => req('/admin/few-shot-examples')
export const refreshFewShot     = () => req('/admin/refresh-prompts', { method: 'POST' })