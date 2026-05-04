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

  const URG_COLORS = { critical: '#E11D48', high: '#D97706', medium: '#059669', low: '#A1A1AA' }

  return (
    <div className="px-8 py-8 max-w-5xl mx-auto">
      <SectionHeader title="Knowledge Base" sub={`${total} documents in corpus`}>
        <div className="flex gap-3">
          <button onClick={load} className="btn text-sm py-2"><RefreshCw className="w-4 h-4" /></button>
          <button onClick={() => setShowAdd(true)} className="btn btn-acid text-sm py-2">
            <Plus className="w-4 h-4" /> Add Document
          </button>
        </div>
      </SectionHeader>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Filter by text or ID..." className="input pl-11 text-sm bg-[#0A0A0B]" />
      </div>

      {/* Add panel */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-6">
            <div className="panel p-5 space-y-4" style={{ borderColor: 'rgba(79,70,229,0.3)', background: 'rgba(79,70,229,0.05)' }}>
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-medium uppercase tracking-wider text-[#818CF8]">New Document</p>
                <button onClick={() => setShowAdd(false)} className="text-slate hover:text-quartz transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="label mb-1.5">ID *</p>
                  <input value={form.id} onChange={e => setForm(p => ({ ...p, id: e.target.value }))}
                    placeholder="comp_016" className="input text-xs" />
                </div>
                <div>
                  <p className="label mb-1.5">Category</p>
                  <input value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                    placeholder="Billing" className="input text-xs" />
                </div>
                <div>
                  <p className="label mb-1.5">Subcategory</p>
                  <input value={form.subcategory} onChange={e => setForm(p => ({ ...p, subcategory: e.target.value }))}
                    placeholder="double-charge" className="input text-xs" />
                </div>
                <div>
                  <p className="label mb-1.5">Urgency</p>
                  <select value={form.urgency} onChange={e => setForm(p => ({ ...p, urgency: e.target.value }))}
                    className="input text-xs">
                    {['critical','high','medium','low'].map(u => <option key={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <p className="label mb-1.5">Text *</p>
                <textarea value={form.text} onChange={e => setForm(p => ({ ...p, text: e.target.value }))}
                  placeholder="// complaint or knowledge-base text..." className="input h-24 text-xs resize-none" />
              </div>
              <div className="flex justify-end pt-2">
                <button onClick={handleSave} disabled={saving || !form.id || !form.text} className="btn btn-acid text-xs py-2 px-6">
                  {saved ? <><CheckCircle2 className="w-3.5 h-3.5" /> Saved</> :
                   saving ? <><Spinner size="sm" /> Saving…</> : <><Edit3 className="w-3.5 h-3.5" /> Save</>}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-20"><Spinner /></div>
      ) : filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-dashed border-[#1E1E20] border rounded-lg">
           <EmptyState icon={BookOpen} title="No documents" sub="Add your first document above." />
        </motion.div>
      ) : (
        <div className="panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="dt w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#1E1E20] bg-[#0A0A0B]">
                  <th className="px-5 py-3 text-[10px] font-medium uppercase tracking-wider text-flint">ID</th>
                  <th className="px-5 py-3 text-[10px] font-medium uppercase tracking-wider text-flint">Text</th>
                  <th className="px-5 py-3 text-[10px] font-medium uppercase tracking-wider text-flint">Category</th>
                  <th className="px-5 py-3 text-[10px] font-medium uppercase tracking-wider text-flint">Urgency</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E1E20]">
                <AnimatePresence>
                  {filtered.map((doc, i) => (
                    <motion.tr key={doc.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ delay: i * 0.02 }} className="hover:bg-[#121214] transition-colors">
                      <td className="px-5 py-3 text-[#818CF8] text-[11px] font-mono whitespace-nowrap">{doc.id}</td>
                      <td className="px-5 py-3 max-w-[350px]">
                        <p className="text-[12px] text-quartz line-clamp-2 leading-relaxed">{doc.text}</p>
                      </td>
                      <td className="px-5 py-3">
                        <p className="text-[12px] text-quartz font-medium">{doc.metadata?.category || '—'}</p>
                        {doc.metadata?.subcategory && <p className="text-[10px] text-slate mt-0.5">{doc.metadata.subcategory}</p>}
                      </td>
                      <td className="px-5 py-3">
                        {doc.metadata?.urgency && (
                          <span className="text-[10px] font-medium px-2 py-1 rounded border"
                            style={{ color: URG_COLORS[doc.metadata.urgency] || '#A1A1AA',
                                     borderColor: (URG_COLORS[doc.metadata.urgency] || '#A1A1AA') + '30',
                                     background: (URG_COLORS[doc.metadata.urgency] || '#A1A1AA') + '08' }}>
                            {doc.metadata.urgency}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button onClick={() => handleDel(doc.id)} disabled={delId === doc.id}
                          className="p-2 text-slate hover:text-[#E11D48] transition-colors hover:bg-[#E11D48]/10 rounded disabled:opacity-30">
                          {delId === doc.id ? <Spinner size="sm" /> : <Trash2 className="w-4 h-4" />}
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {pages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-[#1E1E20] bg-[#0A0A0B]">
              <p className="text-[11px] font-medium text-slate">{page * PAGE + 1}–{Math.min((page+1)*PAGE, total)} of {total}</p>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => p-1)} disabled={page === 0} className="btn py-1.5 px-3 text-[11px] disabled:opacity-30">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={() => setPage(p => p+1)} disabled={page >= pages-1} className="btn py-1.5 px-3 text-[11px] disabled:opacity-30">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}