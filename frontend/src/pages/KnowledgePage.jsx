import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen, Plus, Trash2, Search, RefreshCw,
  ChevronLeft, ChevronRight, Edit3, CheckCircle2, X,
} from 'lucide-react'
import { SectionHeader, Spinner, EmptyState } from '../components/ui'
import { listDocuments, upsertDocument, deleteDocument } from '../api'

const PAGE_SIZE = 10

export default function KnowledgePage() {
  const [docs, setDocs] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [newDoc, setNewDoc] = useState({ id: '', text: '', category: '', subcategory: '', urgency: 'medium' })
  const [saving, setSaving] = useState(false)
  const [deletingId, setDel] = useState(null)
  const [saved, setSaved] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await listDocuments(PAGE_SIZE, page * PAGE_SIZE)
      setDocs(res.documents)
      setTotal(res.total)
    } catch {}
    setLoading(false)
  }, [page])

  useEffect(() => { load() }, [load])

  const filtered = search
    ? docs.filter(d => d.text.toLowerCase().includes(search.toLowerCase()) || d.id.includes(search))
    : docs

  const handleSave = async () => {
    if (!newDoc.id.trim() || !newDoc.text.trim()) return
    setSaving(true)
    try {
      await upsertDocument(newDoc.id, newDoc.text, {
        category: newDoc.category, subcategory: newDoc.subcategory, urgency: newDoc.urgency,
      })
      setSaved(true)
      setTimeout(() => { setSaved(false); setShowAdd(false); setNewDoc({ id: '', text: '', category: '', subcategory: '', urgency: 'medium' }); load() }, 1200)
    } catch {}
    setSaving(false)
  }

  const handleDelete = async (id) => {
    if (!confirm(`Delete document "${id}"?`)) return
    setDel(id)
    try { await deleteDocument(id); load() } catch {}
    setDel(null)
  }

  const pages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="p-8 max-w-6xl">
      <SectionHeader title="Knowledge Base" sub={`${total} documents in corpus`}>
        <div className="flex gap-3">
          <button onClick={load} className="btn-ghost text-sm"><RefreshCw className="w-4 h-4" /></button>
          <button onClick={() => setShowAdd(true)} className="btn-primary text-sm">
            <Plus className="w-4 h-4" /> Add Document
          </button>
        </div>
      </SectionHeader>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Filter by text or ID…"
          className="input-field pl-12" />
      </div>

      {/* Add document panel */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-6">
            <div className="glass-card p-5 space-y-4" style={{ borderColor: 'rgba(6, 182, 212, 0.2)' }}>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-white text-sm">New Document</h3>
                <button onClick={() => setShowAdd(false)} className="text-slate-500 hover:text-slate-300">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-mono text-slate-500 mb-2 block">Document ID *</label>
                  <input value={newDoc.id} onChange={e => setNewDoc(p => ({ ...p, id: e.target.value }))}
                    placeholder="comp_013" className="input-field text-sm" />
                </div>
                <div>
                  <label className="text-xs font-mono text-slate-500 mb-2 block">Category</label>
                  <input value={newDoc.category} onChange={e => setNewDoc(p => ({ ...p, category: e.target.value }))}
                    placeholder="Billing" className="input-field text-sm" />
                </div>
                <div>
                  <label className="text-xs font-mono text-slate-500 mb-2 block">Subcategory</label>
                  <input value={newDoc.subcategory} onChange={e => setNewDoc(p => ({ ...p, subcategory: e.target.value }))}
                    placeholder="double-charge" className="input-field text-sm" />
                </div>
                <div>
                  <label className="text-xs font-mono text-slate-500 mb-2 block">Urgency</label>
                  <select value={newDoc.urgency} onChange={e => setNewDoc(p => ({ ...p, urgency: e.target.value }))}
                    className="input-field text-sm">
                    {['critical', 'high', 'medium', 'low'].map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-mono text-slate-500 mb-2 block">Document Text *</label>
                <textarea value={newDoc.text} onChange={e => setNewDoc(p => ({ ...p, text: e.target.value }))}
                  placeholder="Paste the complaint or knowledge-base text…"
                  className="input-field h-24 resize-none text-sm" />
              </div>
              <div className="flex justify-end">
                <button onClick={handleSave} disabled={saving || !newDoc.id || !newDoc.text}
                  className="btn-primary text-sm">
                  {saved ? <><CheckCircle2 className="w-4 h-4" /> Saved!</> :
                    saving ? <><Spinner size="sm" /> Saving…</> : <><Edit3 className="w-4 h-4" /> Save Document</>}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Doc list */}
      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={BookOpen} title="No documents" sub="Add your first document above to build the corpus." />
      ) : (
        <div className="glass-card overflow-hidden">
          <table className="data-table">
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
                  <motion.tr key={doc.id}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    transition={{ delay: i * 0.02 }}>
                    <td className="font-mono text-xs text-violet-400 whitespace-nowrap">{doc.id}</td>
                    <td className="max-w-[320px]">
                      <p className="text-sm text-slate-300 line-clamp-2 leading-relaxed">{doc.text}</p>
                    </td>
                    <td>
                      <div>
                        <p className="text-xs font-mono text-slate-400">{doc.metadata?.category || '—'}</p>
                        {doc.metadata?.subcategory && (
                          <p className="text-[10px] font-mono text-slate-600">{doc.metadata.subcategory}</p>
                        )}
                      </div>
                    </td>
                    <td>
                      {doc.metadata?.urgency && (
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase
                          ${doc.metadata.urgency === 'critical' ? 'text-pink-400 bg-pink-400/10' :
                            doc.metadata.urgency === 'high' ? 'text-amber-400 bg-amber-400/10' :
                            doc.metadata.urgency === 'medium' ? 'text-blue-400 bg-blue-400/10' :
                            'text-cyan-400 bg-cyan-400/10'}`}>
                          {doc.metadata.urgency}
                        </span>
                      )}
                    </td>
                    <td>
                      <button onClick={() => handleDelete(doc.id)}
                        disabled={deletingId === doc.id}
                        className="p-2 text-slate-600 hover:text-pink-400 transition-colors rounded-lg hover:bg-pink-400/10">
                        {deletingId === doc.id ? <Spinner size="sm" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-white/5">
              <p className="text-xs font-mono text-slate-500">
                {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}
              </p>
              <div className="flex gap-1">
                <button onClick={() => setPage(p => p - 1)} disabled={page === 0} className="btn-ghost text-xs py-1 px-2 disabled:opacity-30">
                  <ChevronLeft className="w-3 h-3" />
                </button>
                <button onClick={() => setPage(p => p + 1)} disabled={page >= pages - 1} className="btn-ghost text-xs py-1 px-2 disabled:opacity-30">
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