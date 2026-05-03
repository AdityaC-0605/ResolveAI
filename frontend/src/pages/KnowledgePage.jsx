import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, Plus, Trash2, Search, RefreshCw, ChevronLeft, ChevronRight, Edit3, CheckCircle2, X } from 'lucide-react'
import { SectionHeader, Spinner, EmptyState } from '../components/ui'
import { listDocuments, upsertDocument, deleteDocument } from '../api'

const PAGE = 10

export default function KnowledgePage() {
  const [docs, setDocs]       = useState([])
  const [total, setTotal]     = useState(0)
  const [page, setPage]       = useState(0)
  const [loading, setLoading] = useState(false)
  const [search, setSearch]   = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm]       = useState({ id: '', text: '', category: '', subcategory: '', urgency: 'medium' })
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)
  const [delId, setDelId]     = useState(null)

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

  const URG_COLORS = { critical: '#ff4d6a', high: '#f5a623', medium: '#2ee8d4', low: '#8494a8' }

  return (
    <div className="px-6 py-6 max-w-5xl">
      <SectionHeader title="Knowledge Base" sub={`${total} documents in corpus`}>
        <div className="flex gap-2">
          <button onClick={load} className="btn text-[10px] py-1.5"><RefreshCw className="w-3 h-3" /></button>
          <button onClick={() => setShowAdd(true)} className="btn btn-acid text-[10px] py-1.5">
            <Plus className="w-3 h-3" /> Add Document
          </button>
        </div>
      </SectionHeader>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-dim" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="// filter by text or id..." className="input pl-9" />
      </div>

      {/* Add panel */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-4">
            <div className="panel-accent panel p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-mono uppercase tracking-widest text-ghost">New Document</p>
                <button onClick={() => setShowAdd(false)} className="text-dim hover:text-ghost">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="label mb-1">ID *</p>
                  <input value={form.id} onChange={e => setForm(p => ({ ...p, id: e.target.value }))}
                    placeholder="comp_016" className="input text-xs" />
                </div>
                <div>
                  <p className="label mb-1">Category</p>
                  <input value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                    placeholder="Billing" className="input text-xs" />
                </div>
                <div>
                  <p className="label mb-1">Subcategory</p>
                  <input value={form.subcategory} onChange={e => setForm(p => ({ ...p, subcategory: e.target.value }))}
                    placeholder="double-charge" className="input text-xs" />
                </div>
                <div>
                  <p className="label mb-1">Urgency</p>
                  <select value={form.urgency} onChange={e => setForm(p => ({ ...p, urgency: e.target.value }))}
                    className="input text-xs">
                    {['critical','high','medium','low'].map(u => <option key={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <p className="label mb-1">Text *</p>
                <textarea value={form.text} onChange={e => setForm(p => ({ ...p, text: e.target.value }))}
                  placeholder="// complaint or knowledge-base text..." className="input h-20 text-xs" />
              </div>
              <div className="flex justify-end">
                <button onClick={handleSave} disabled={saving || !form.id || !form.text} className="btn btn-acid text-[10px] py-1.5">
                  {saved ? <><CheckCircle2 className="w-3 h-3" /> Saved</> :
                   saving ? <><Spinner size="sm" /> Saving…</> : <><Edit3 className="w-3 h-3" /> Save</>}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={BookOpen} title="No documents" sub="Add your first document above." />
      ) : (
        <div className="panel overflow-hidden">
          <table className="dt">
            <thead>
              <tr><th>ID</th><th>Text</th><th>Category</th><th>Urgency</th><th /></tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filtered.map((doc, i) => (
                  <motion.tr key={doc.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ delay: i * 0.02 }}>
                    <td className="text-violet text-[10px] whitespace-nowrap">{doc.id}</td>
                    <td className="max-w-[300px]">
                      <p className="text-[11px] text-ghost line-clamp-2">{doc.text}</p>
                    </td>
                    <td>
                      <p className="text-[10px] text-ghost">{doc.metadata?.category || '—'}</p>
                      {doc.metadata?.subcategory && <p className="text-[9px] text-dim">{doc.metadata.subcategory}</p>}
                    </td>
                    <td>
                      {doc.metadata?.urgency && (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 border"
                          style={{ color: URG_COLORS[doc.metadata.urgency] || '#8494a8',
                                   borderColor: (URG_COLORS[doc.metadata.urgency] || '#8494a8') + '30',
                                   background: (URG_COLORS[doc.metadata.urgency] || '#8494a8') + '08' }}>
                          {doc.metadata.urgency}
                        </span>
                      )}
                    </td>
                    <td>
                      <button onClick={() => handleDel(doc.id)} disabled={delId === doc.id}
                        className="p-1.5 text-dim hover:text-coral transition-colors hover:bg-coral/10 disabled:opacity-30">
                        {delId === doc.id ? <Spinner size="sm" /> : <Trash2 className="w-3.5 h-3.5" />}
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>

          {pages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <p className="text-[10px] font-mono text-dim">{page * PAGE + 1}–{Math.min((page+1)*PAGE, total)} of {total}</p>
              <div className="flex gap-1">
                <button onClick={() => setPage(p => p-1)} disabled={page === 0} className="btn py-1 px-2 text-[10px] disabled:opacity-30">
                  <ChevronLeft className="w-3 h-3" />
                </button>
                <button onClick={() => setPage(p => p+1)} disabled={page >= pages-1} className="btn py-1 px-2 text-[10px] disabled:opacity-30">
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}