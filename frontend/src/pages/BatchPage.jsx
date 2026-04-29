import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Layers, Plus, Trash2, Play, Download, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { UrgencyPill, SentimentBadge, SectionHeader, Spinner } from '../components/ui'
import { classifyBatch } from '../api'

const empty = () => ({ id: crypto.randomUUID(), text: '' })

export default function BatchPage() {
  const [inputs, setInputs] = useState([empty(), empty()])
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const addRow = () => setInputs(p => [...p, empty()])
  const removeRow = (id) => setInputs(p => p.filter(r => r.id !== id))
  const update = (id, text) => setInputs(p => p.map(r => r.id === id ? { ...r, text } : r))

  const run = async () => {
    const complaints = inputs.filter(r => r.text.trim().length >= 5)
    if (!complaints.length) return
    setLoading(true); setError(null); setResults(null)
    try {
      const res = await classifyBatch(complaints.map(c => ({ text: c.text })))
      setResults(res)
    } catch (e) { setError(e.message) }
    setLoading(false)
  }

  const exportCSV = () => {
    if (!results) return
    const rows = [['#', 'Input', 'Category', 'Subcategory', 'Urgency', 'Sentiment', 'Confidence', 'Team', 'ETA']]
    results.results.forEach((r, i) => {
      const c = r.classification
      if (c) rows.push([i + 1, `"${r.input_text.replace(/"/g, '""')}"`, c.category, c.subcategory,
        c.urgency, c.sentiment, c.confidence, c.assigned_team, c.estimated_resolution_hours])
    })
    const csv = rows.map(r => r.join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = `batch-results-${Date.now()}.csv`
    a.click()
  }

  const validCount = inputs.filter(r => r.text.trim().length >= 5).length

  return (
    <div className="p-8 max-w-6xl">
      <SectionHeader title="Batch Classification" sub="Process up to 50 complaints simultaneously">
        <div className="flex gap-3">
          {results && (
            <button onClick={exportCSV} className="btn-secondary text-sm">
              <Download className="w-4 h-4" /> Export CSV
            </button>
          )}
          <button onClick={run} disabled={loading || validCount === 0} className="btn-primary">
            {loading ? <><Spinner size="sm" /> Processing {validCount}…</> : <><Play className="w-4 h-4" /> Run {validCount} complaints</>}
          </button>
        </div>
      </SectionHeader>

      {/* Input area */}
      <div className="glass-card mb-6 overflow-hidden">
        <div className="divide-y divide-white/5">
          <AnimatePresence>
            {inputs.map((row, i) => (
              <motion.div
                key={row.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-3 px-5 py-4 hover:bg-white/[0.02] group"
              >
                <span className="w-6 flex items-center justify-center text-xs font-mono text-slate-600 shrink-0">{i + 1}</span>
                <textarea
                  value={row.text}
                  onChange={e => update(row.id, e.target.value)}
                  placeholder={`Complaint ${i + 1}…`}
                  className="flex-1 bg-transparent resize-none text-sm text-slate-300 placeholder:text-slate-600 focus:outline-none leading-relaxed"
                />
                <button onClick={() => removeRow(row.id)} disabled={inputs.length === 1}
                  className="opacity-40 group-hover:opacity-100 transition-opacity text-slate-600 hover:text-pink-400 shrink-0 disabled:opacity-20 disabled:hover:text-slate-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <button onClick={addRow} disabled={inputs.length >= 50}
          className="w-full py-3 text-sm text-slate-500 hover:text-slate-300 hover:bg-white/[0.02] transition-colors flex items-center justify-center gap-2 disabled:opacity-30 border-t border-white/5">
          <Plus className="w-4 h-4" /> Add complaint {inputs.length < 50 ? `(${50 - inputs.length} remaining)` : '(max reached)'}
        </button>
      </div>

      {error && (
        <div className="glass-card p-4 mb-4" style={{ borderColor: 'rgba(236, 72, 153, 0.3)', background: 'rgba(236, 72, 153, 0.05)' }}>
          <p className="text-sm text-pink-400 font-mono">{error}</p>
        </div>
      )}

      {/* Results table */}
      <AnimatePresence>
        {results && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-card overflow-hidden">
            <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
              <h3 className="font-semibold text-lg text-white flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center">
                  <Layers className="w-4 h-4 text-white" />
                </div>
                Results
              </h3>
              <div className="flex gap-4 text-xs font-mono">
                <span className="text-cyan-400">{results.successful} ok</span>
                <span className="text-pink-400">{results.failed} failed</span>
                <span className="text-slate-500">{results.processing_time_ms?.toFixed(0)}ms total</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Input</th>
                    <th>Category</th>
                    <th>Urgency</th>
                    <th>Sentiment</th>
                    <th>Confidence</th>
                    <th>Team</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {results.results.map((r, i) => (
                    <tr key={i}>
                      <td className="font-mono text-slate-600 text-xs">{i + 1}</td>
                      <td className="max-w-[200px]">
                        <p className="truncate text-xs text-slate-400">{r.input_text}</p>
                      </td>
                      {r.classification ? (
                        <>
                          <td>
                            <div>
                              <p className="text-sm text-white font-medium">{r.classification.category}</p>
                              <p className="text-[10px] font-mono text-violet-400">{r.classification.subcategory}</p>
                            </div>
                          </td>
                          <td><UrgencyPill level={r.classification.urgency} /></td>
                          <td><SentimentBadge sentiment={r.classification.sentiment} /></td>
                          <td>
                            <span className="font-mono text-xs text-cyan-400">
                              {(r.classification.confidence * 100).toFixed(0)}%
                            </span>
                          </td>
                          <td className="text-xs text-slate-400">{r.classification.assigned_team}</td>
                          <td><CheckCircle2 className="w-4 h-4 text-cyan-400" /></td>
                        </>
                      ) : (
                        <td colSpan={6} className="text-xs text-pink-400 font-mono">
                          {r.error || 'Failed'}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}