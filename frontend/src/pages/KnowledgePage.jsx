import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, Plus, Trash2, Search, RefreshCw, ChevronLeft, ChevronRight, Edit3, CheckCircle2, X } from 'lucide-react'
import { SectionHeader, Spinner, EmptyState } from '../components/ui'
import { listDocuments, upsertDocument, deleteDocument } from '../api'

const PAGE = 10
const SPRING = { type: 'spring', stiffness: 300, damping: 30 }

export default function KnowledgePage() {
  const [docs, setDocs] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ id: '', text: '', category: '', subcategory: '', urgency: 'medium' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [delId, setDelId] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try { const r = await listDocuments(PAGE, page * PAGE); setDocs(r.documents); setTotal(r.total) } catch {}
    setLoading(false)
  }, [page])

  useEffect(() => { load() }, [load])

  const filtered = search
    ? docs.filter(d => d.text.toLowerCase().includes(search.toLowerCase()) || d.id.includes(search))
    : docs

  const handleSave = async () => {
    if (!form.id.trim() || !form.text.trim()) return
    setSaving(true)
    try {
      await upsertDocument(form.id, form.text, { category: form.category, subcategory: form.subcategory, urgency: form.urgency })
      setSaved(true)
      setTimeout(() => { setSaved(false); setShowAdd(false); setForm({ id: '', text: '', category: '', subcategory: '', urgency: 'medium' }); load() }, 1200)
    } catch {}
    setSaving(false)
  }

  const handleDel = async (id) => {
    if (!confirm(`Delete "${id}"?`)) return
    setDelId(id)
    try { await deleteDocument(id); load() } catch {}
    setDelId(null)
  }

  const pages = Math.ceil(total / PAGE)
  const urgencyColor = u => ({ critical: 'var(--danger)', high: 'var(--warning)', medium: 'var(--accent)', low: 'var(--text-muted)' }[u] || 'var(--text-muted)')

  return (
    <div className="mx-auto max-w-5xl px-8 py-8">
      <SectionHeader title="Knowledge base" sub={`${total} documents in corpus`}>
        <div className="flex gap-3">
          <button onClick={load} className="btn" aria-label="Refresh"><RefreshCw className="h-4 w-4" /></button>
          <motion.button whileTap={{ scale: 0.97 }} transition={SPRING} onClick={() => setShowAdd(true)} className="btn btn-acid">
            <Plus className="h-4 w-4" /> Add document
          </motion.button>
        </div>
      </SectionHeader>

      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-flint" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Filter by text or ID..." className="input pl-12" />
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={SPRING} className="mb-6 overflow-hidden">
            <div className="instrument space-y-4 p-4">
              <div className="flex items-center justify-between">
                <p className="label" style={{ color: 'var(--accent)' }}>New document</p>
                <button onClick={() => setShowAdd(false)} className="btn h-8 w-8 p-0" aria-label="Close">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="label mb-2">ID *</p>
                  <input value={form.id} onChange={e => setForm(p => ({ ...p, id: e.target.value }))} placeholder="comp_016" className="input" />
                </div>
                <div>
                  <p className="label mb-2">Category</p>
                  <input value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} placeholder="Billing" className="input" />
                </div>
                <div>
                  <p className="label mb-2">Subcategory</p>
                  <input value={form.subcategory} onChange={e => setForm(p => ({ ...p, subcategory: e.target.value }))} placeholder="double-charge" className="input" />
                </div>
                <div>
                  <p className="label mb-2">Urgency</p>
                  <select value={form.urgency} onChange={e => setForm(p => ({ ...p, urgency: e.target.value }))} className="input">
                    {['critical', 'high', 'medium', 'low'].map(u => <option key={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <p className="label mb-2">Text *</p>
                <textarea value={form.text} onChange={e => setForm(p => ({ ...p, text: e.target.value }))} placeholder="Complaint or knowledge-base text..." className="input h-24" />
              </div>
              <div className="flex justify-end">
                <motion.button whileTap={{ scale: 0.97 }} transition={SPRING} onClick={handleSave} disabled={saving || !form.id || !form.text} className="btn btn-acid px-6">
                  {saved ? <><CheckCircle2 className="h-4 w-4" /> Saved</> : saving ? <><Spinner size="sm" /> Saving</> : <><Edit3 className="h-4 w-4" /> Save</>}
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={SPRING} className="instrument">
          <EmptyState icon={BookOpen} title="No documents" sub="Add your first source document above." />
        </motion.div>
      ) : (
        <div className="instrument overflow-hidden">
          <div className="overflow-x-auto">
            <table className="dt">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Text</th>
                  <th>Category</th>
                  <th>Urgency</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filtered.map((doc, i) => (
                    <motion.tr key={doc.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ ...SPRING, delay: i * 0.02 }}>
                      <td className="numeric" style={{ color: 'var(--accent)' }}>{doc.id}</td>
                      <td className="max-w-[350px]"><p className="line-clamp-2 text-ink">{doc.text}</p></td>
                      <td>
                        <p className="font-medium text-ink">{doc.metadata?.category || '—'}</p>
                        {doc.metadata?.subcategory && <p className="type-micro mt-1 text-flint">{doc.metadata.subcategory}</p>}
                      </td>
                      <td>
                        {doc.metadata?.urgency && (
                          <span className="tag" style={{ color: urgencyColor(doc.metadata.urgency) }}>
                            {doc.metadata.urgency}
                          </span>
                        )}
                      </td>
                      <td className="text-right">
                        <button onClick={() => handleDel(doc.id)} disabled={delId === doc.id} className="btn h-8 w-8 p-0" aria-label="Delete document">
                          {delId === doc.id ? <Spinner size="sm" /> : <Trash2 className="h-4 w-4" />}
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {pages > 1 && (
            <div className="flex items-center justify-between border-t px-4 py-4" style={{ borderColor: 'var(--edge-soft)', background: 'var(--bg-canvas)' }}>
              <p className="type-caption text-flint">{page * PAGE + 1} to {Math.min((page + 1) * PAGE, total)} of {total}</p>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => p - 1)} disabled={page === 0} className="btn h-8 w-8 p-0" aria-label="Previous page"><ChevronLeft className="h-4 w-4" /></button>
                <button onClick={() => setPage(p => p + 1)} disabled={page >= pages - 1} className="btn h-8 w-8 p-0" aria-label="Next page"><ChevronRight className="h-4 w-4" /></button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
