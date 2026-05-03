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
    <div className="px-6 py-6 max-w-5xl">
      <SectionHeader title="Batch Classification" sub={`Up to 50 complaints — concurrent processing`}>
        <div className="flex gap-2">
          {results && (
            <button onClick={exportCSV} className="btn text-[10px] py-1.5">
              <Download className="w-3 h-3" /> Export CSV
            </button>
          )}
          <button onClick={run} disabled={loading || validCount === 0} className="btn btn-acid text-[10px] py-1.5">
            {loading ? <><Spinner size="sm" /> Processing {validCount}…</> : <><Play className="w-3 h-3" /> Run {validCount}</>}
          </button>
        </div>
      </SectionHeader>

      {/* Input rows */}
      <div className="panel overflow-hidden mb-4">
        <div className="divide-y divide-border">
          <AnimatePresence>
            {inputs.map((row, i) => (
              <motion.div key={row.id}
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.15 }}
                className="flex items-center gap-3 px-4 py-3 hover:bg-edge transition-colors group overflow-hidden">
                <span className="text-[10px] font-mono text-muted shrink-0 w-5">{String(i+1).padStart(2,'0')}</span>
                <textarea
                  value={row.text} onChange={e => update(row.id, e.target.value)}
                  placeholder={`// complaint ${i+1}`}
                  className="flex-1 bg-transparent text-[12px] font-mono text-ghost placeholder-muted focus:outline-none resize-none leading-relaxed h-8 focus:h-16 transition-all"
                />
                <button onClick={() => removeRow(row.id)} disabled={inputs.length === 1}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-dim hover:text-coral disabled:opacity-0 shrink-0">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        <button onClick={addRow} disabled={inputs.length >= 50}
          className="w-full py-2.5 text-[10px] font-mono text-dim hover:text-ghost hover:bg-edge transition-colors flex items-center justify-center gap-1.5 border-t border-border disabled:opacity-30">
          <Plus className="w-3 h-3" /> Add row {inputs.length < 50 ? `(${50 - inputs.length} left)` : '(max)'}
        </button>
      </div>

      {error && (
        <div className="panel-coral panel px-4 py-3 mb-4">
          <p className="text-[11px] font-mono" style={{ color: '#ff4d6a' }}>{error}</p>
        </div>
      )}

      {/* Results table */}
      <AnimatePresence>
        {results && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="panel overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <p className="text-[10px] font-mono uppercase tracking-widest text-ghost">Results</p>
              <div className="flex gap-4 text-[10px] font-mono">
                <span style={{ color: '#d4f43c' }}>{results.successful} ok</span>
                <span style={{ color: '#ff4d6a' }}>{results.failed} failed</span>
                <span className="text-dim">{Math.round(results.processing_time_ms)}ms</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="dt">
                <thead>
                  <tr><th>#</th><th>Input</th><th>Category</th><th>Urgency</th><th>Sentiment</th><th>Conf</th><th>Team</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {results.results.map((r, i) => (
                    <tr key={i}>
                      <td className="text-muted">{String(i+1).padStart(2,'0')}</td>
                      <td className="max-w-[180px]"><p className="truncate text-[11px]">{r.input_text}</p></td>
                      {r.classification ? (
                        <>
                          <td>
                            <p className="text-[11px] text-silver font-medium">{r.classification.category}</p>
                            <p className="text-[9px] text-violet">{r.classification.subcategory}</p>
                          </td>
                          <td><UrgencyPill level={r.classification.urgency} /></td>
                          <td><SentimentBadge sentiment={r.classification.sentiment} /></td>
                          <td style={{ color: '#d4f43c' }}>{Math.round(r.classification.confidence * 100)}%</td>
                          <td className="text-[11px]">{r.classification.assigned_team}</td>
                          <td>
                            <div className="flex items-center gap-1">
                              {r.cached && <Zap className="w-3 h-3" style={{ color: '#f5a623' }} title="Cached" />}
                              {r.classification?.metadata?.was_translated && <Globe2 className="w-3 h-3" style={{ color: '#2ee8d4' }} title="Translated" />}
                              {!r.cached && !r.classification?.metadata?.was_translated && <CheckCircle2 className="w-3.5 h-3.5" style={{ color: '#d4f43c' }} />}
                            </div>
                          </td>
                        </>
                      ) : (
                        <td colSpan={6} className="text-[10px]" style={{ color: '#ff4d6a' }}>{r.error || 'failed'}</td>
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