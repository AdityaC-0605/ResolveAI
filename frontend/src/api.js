/**
 * api.js — Centralized API client for the Hybrid RAG backend.
 * All endpoints from main.py are represented here.
 */

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || 'API Error')
  }
  return res.json()
}

// ── Classification ──────────────────────────────────────────────────────────

export const classifyComplaint = (text, customerId, source) =>
  request('/classify', {
    method: 'POST',
    body: JSON.stringify({ text, customer_id: customerId, source }),
  })

export const classifyBatch = (complaints) =>
  request('/classify/batch', {
    method: 'POST',
    body: JSON.stringify({ complaints }),
  })

/**
 * Returns an EventSource for the streaming endpoint.
 * Caller is responsible for closing it.
 */
export const classifyStream = (text) => {
  // SSE requires GET or POST via EventSource. We use fetch for POST-SSE.
  return fetch(`${BASE}/classify/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  })
}

// ── Documents ───────────────────────────────────────────────────────────────

export const listDocuments = (limit = 50, offset = 0) =>
  request(`/documents?limit=${limit}&offset=${offset}`)

export const upsertDocument = (id, text, metadata = {}) =>
  request('/documents', {
    method: 'POST',
    body: JSON.stringify({ id, text, metadata }),
  })

export const deleteDocument = (docId) =>
  request(`/documents/${docId}`, { method: 'DELETE' })

// ── Feedback ────────────────────────────────────────────────────────────────

export const submitFeedback = (complaintId, isCorrect, correctCategory, correctUrgency, note) =>
  request('/feedback', {
    method: 'POST',
    body: JSON.stringify({
      complaint_id: complaintId,
      is_correct: isCorrect,
      correct_category: correctCategory,
      correct_urgency: correctUrgency,
      reviewer_note: note,
    }),
  })

// ── System ──────────────────────────────────────────────────────────────────

export const getHealth  = ()           => request('/health')
export const getStats   = ()           => request('/stats')
export const getAnalytics = (limit=500) => request(`/analytics?limit=${limit}`)
export const clearCache = ()           => request('/cache', { method: 'DELETE' })