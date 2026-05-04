import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Play, Download, CheckCircle2, Zap, Globe2 } from 'lucide-react'
import { UrgencyPill, SentimentBadge, SectionHeader, Spinner } from '../components/ui'
import { classifyBatch } from '../api'

const empty = () => ({ id: crypto.randomUUID(), text: '' })

export default function BatchPage() {
  const [inputs, setInputs]   = useState([empty(), empty()])
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  const addRow    = () => setInputs(p => [...p, empty()])
  const removeRow = id => setInputs(p => p.filter(r => r.id !== id))
  const update    = (id, text) => setInputs(p => p.map(r => r.id === id ? { ...r, text } : r))

  const run = async () => {
    const valid = inputs.filter(r => r.text.trim().length >= 5)
    if (!valid.length) return
    setLoading(true); setError(null); setResults(null)
    try { setResults(await classifyBatch(valid.map(c => ({ text: c.text })))) }
    catch (e) { setError(e.message) }
    setLoading(false)
  }

  const exportCSV = () => {
    if (!results) return
    const rows = [['#','Input','Category','Subcategory','Urgency','Sentiment','Confidence','Team','ETA(h)']]
    results.results.forEach((r, i) => {
      const c = r.classification
      if (c) rows.push([i+1, `"${(r.input_text||'').replace(/"/g,'""')}"`,
        c.category, c.subcategory, c.urgency, c.sentiment,
        c.confidence?.toFixed(2), c.assigned_team, c.estimated_resolution_hours])
    })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([rows.map(r=>r.join(',')).join('\n')], { type: 'text/csv' }))
    a.download = `batch-${Date.now()}.csv`; a.click()
  }

  const validCount = inputs.filter(r => r.text.trim().length >= 5).length

  return (
    <div className="px-8 py-8 max-w-5xl mx-auto">
      <SectionHeader title="Batch Classification" sub={`Up to 50 complaints — concurrent processing`}>
        <div className="flex gap-3">
          {results && (
            <button onClick={exportCSV} className="btn text-sm py-2">
              <Download className="w-4 h-4" /> Export CSV
            </button>
          )}
          <button onClick={run} disabled={loading || validCount === 0} className="btn btn-acid text-sm py-2">
            {loading ? <><Spinner size="sm" /> Processing {validCount}…</> : <><Play className="w-4 h-4" /> Run {validCount}</>}
          </button>
        </div>
      </SectionHeader>

      {/* Input rows */}
      <div className="panel overflow-hidden mb-6">
        <div className="divide-y divide-[#1E1E20]">
          <AnimatePresence>
            {inputs.map((row, i) => (
              <motion.div key={row.id}
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.15 }}
                className="flex items-center gap-4 px-5 py-4 hover:bg-[#121214] transition-colors group overflow-hidden">
                <span className="text-[11px] font-mono text-slate shrink-0 w-6">{String(i+1).padStart(2,'0')}</span>
                <textarea
                  value={row.text} onChange={e => update(row.id, e.target.value)}
                  placeholder={`// complaint ${i+1}`}
                  className="flex-1 bg-transparent text-[13px] font-medium text-quartz placeholder-slate focus:outline-none resize-none leading-relaxed h-8 focus:h-20 transition-all"
                />
                <button onClick={() => removeRow(row.id)} disabled={inputs.length === 1}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-slate hover:text-[#E11D48] disabled:opacity-0 shrink-0">
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        <button onClick={addRow} disabled={inputs.length >= 50}
          className="w-full py-3.5 text-[12px] font-medium text-slate hover:text-quartz hover:bg-[#121214] transition-colors flex items-center justify-center gap-2 border-t border-[#1E1E20] disabled:opacity-30">
          <Plus className="w-4 h-4" /> Add row {inputs.length < 50 ? `(${50 - inputs.length} left)` : '(max)'}
        </button>
      </div>

      {error && (
        <div className="panel px-5 py-4 mb-6" style={{ borderColor: 'rgba(225,29,72,0.3)', background: 'rgba(225,29,72,0.05)' }}>
          <p className="text-[12px] font-medium" style={{ color: '#E11D48' }}>{error}</p>
        </div>
      )}

      {/* Results table */}
      <AnimatePresence>
        {results && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 400, damping: 30 }} className="panel overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#1E1E20]">
              <p className="text-[10px] font-medium uppercase tracking-wider text-flint">Results</p>
              <div className="flex gap-5 text-[11px] font-medium">
                <span style={{ color: '#059669' }}>{results.successful} ok</span>
                <span style={{ color: '#E11D48' }}>{results.failed} failed</span>
                <span className="text-slate font-mono">{Math.round(results.processing_time_ms)}ms</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="dt w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#1E1E20] bg-[#0A0A0B]">
                    <th className="px-5 py-3 text-[10px] font-medium uppercase tracking-wider text-flint">#</th>
                    <th className="px-5 py-3 text-[10px] font-medium uppercase tracking-wider text-flint">Input</th>
                    <th className="px-5 py-3 text-[10px] font-medium uppercase tracking-wider text-flint">Category</th>
                    <th className="px-5 py-3 text-[10px] font-medium uppercase tracking-wider text-flint">Urgency</th>
                    <th className="px-5 py-3 text-[10px] font-medium uppercase tracking-wider text-flint">Sentiment</th>
                    <th className="px-5 py-3 text-[10px] font-medium uppercase tracking-wider text-flint">Conf</th>
                    <th className="px-5 py-3 text-[10px] font-medium uppercase tracking-wider text-flint">Team</th>
                    <th className="px-5 py-3 text-[10px] font-medium uppercase tracking-wider text-flint">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E1E20]">
                  {results.results.map((r, i) => (
                    <tr key={i} className="hover:bg-[#121214] transition-colors">
                      <td className="px-5 py-3 text-[11px] font-mono text-slate">{String(i+1).padStart(2,'0')}</td>
                      <td className="px-5 py-3 max-w-[200px]"><p className="truncate text-[12px] text-quartz">{r.input_text}</p></td>
                      {r.classification ? (
                        <>
                          <td className="px-5 py-3">
                            <p className="text-[12px] text-quartz font-medium">{r.classification.category}</p>
                            <p className="text-[10px] text-[#818CF8] mt-0.5">{r.classification.subcategory}</p>
                          </td>
                          <td className="px-5 py-3"><UrgencyPill level={r.classification.urgency} /></td>
                          <td className="px-5 py-3"><SentimentBadge sentiment={r.classification.sentiment} /></td>
                          <td className="px-5 py-3 text-[11px] font-mono" style={{ color: '#059669' }}>{Math.round(r.classification.confidence * 100)}%</td>
                          <td className="px-5 py-3 text-[12px] text-quartz">{r.classification.assigned_team}</td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-1.5">
                              {r.cached && <Zap className="w-3.5 h-3.5" style={{ color: '#D97706' }} title="Cached" />}
                              {r.classification?.metadata?.was_translated && <Globe2 className="w-3.5 h-3.5" style={{ color: '#3B82F6' }} title="Translated" />}
                              {!r.cached && !r.classification?.metadata?.was_translated && <CheckCircle2 className="w-4 h-4" style={{ color: '#059669' }} />}
                            </div>
                          </td>
                        </>
                      ) : (
                        <td colSpan={6} className="px-5 py-3 text-[11px] font-medium" style={{ color: '#E11D48' }}>{r.error || 'failed'}</td>
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