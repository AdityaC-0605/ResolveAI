import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Play, Download, CheckCircle2, Zap, Globe2 } from 'lucide-react'
import { UrgencyPill, SentimentBadge, SectionHeader, Spinner } from '../components/ui'
import { classifyBatch } from '../api'

const SPRING = { type: 'spring', stiffness: 300, damping: 30 }
const empty = () => ({ id: crypto.randomUUID(), text: '' })

export default function BatchPage() {
  const [inputs, setInputs] = useState([empty(), empty()])
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const addRow = () => setInputs(p => [...p, empty()])
  const removeRow = id => setInputs(p => p.filter(r => r.id !== id))
  const update = (id, text) => setInputs(p => p.map(r => r.id === id ? { ...r, text } : r))

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
    const rows = [['#', 'Input', 'Category', 'Subcategory', 'Urgency', 'Sentiment', 'Confidence', 'Team', 'ETA(h)']]
    results.results.forEach((r, i) => {
      const c = r.classification
      if (c) rows.push([i + 1, `"${(r.input_text || '').replace(/"/g, '""')}"`, c.category, c.subcategory, c.urgency, c.sentiment, c.confidence?.toFixed(2), c.assigned_team, c.estimated_resolution_hours])
    })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([rows.map(r => r.join(',')).join('\n')], { type: 'text/csv' }))
    a.download = `batch-${Date.now()}.csv`; a.click()
  }

  const validCount = inputs.filter(r => r.text.trim().length >= 5).length

  return (
    <div className="mx-auto max-w-5xl px-8 py-8">
      <SectionHeader title="Batch classification" sub="Concurrent triage for up to 50 complaints">
        <div className="flex gap-3">
          {results && (
            <button onClick={exportCSV} className="btn">
              <Download className="h-4 w-4" /> Export CSV
            </button>
          )}
          <motion.button whileTap={{ scale: 0.97 }} transition={SPRING} onClick={run} disabled={loading || validCount === 0} className="btn btn-acid">
            {loading ? <><Spinner size="sm" /> Processing {validCount}</> : <><Play className="h-4 w-4" /> Run {validCount}</>}
          </motion.button>
        </div>
      </SectionHeader>

      <div className="instrument mb-6 overflow-hidden">
        <div className="divide-y" style={{ borderColor: 'var(--edge-soft)' }}>
          <AnimatePresence>
            {inputs.map((row, i) => (
              <motion.div key={row.id} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={SPRING} className="grid grid-cols-[32px_1fr_32px] items-center gap-4 overflow-hidden px-4 py-4 hover:bg-surface">
                <span className="type-micro numeric text-flint">{String(i + 1).padStart(2, '0')}</span>
                <textarea value={row.text} onChange={e => update(row.id, e.target.value)} placeholder={`Complaint ${i + 1}`} className="type-body h-8 resize-none bg-transparent text-ink placeholder:text-flint focus:h-24 focus:outline-none" />
                <button onClick={() => removeRow(row.id)} disabled={inputs.length === 1} className="btn h-8 w-8 p-0 opacity-70 disabled:opacity-20" aria-label="Remove row">
                  <Trash2 className="h-4 w-4" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        <button onClick={addRow} disabled={inputs.length >= 50} className="type-caption flex w-full items-center justify-center gap-2 border-t py-4 font-medium text-slate hover:bg-surface hover:text-ink disabled:opacity-40" style={{ borderColor: 'var(--edge-soft)' }}>
          <Plus className="h-4 w-4" /> Add row {inputs.length < 50 ? `(${50 - inputs.length} left)` : '(max)'}
        </button>
      </div>

      {error && (
        <div className="instrument mb-6 p-4" style={{ borderColor: 'rgba(210, 106, 93, 0.28)', background: 'rgba(210, 106, 93, 0.08)' }}>
          <p className="type-caption font-medium" style={{ color: 'var(--danger)' }}>{error}</p>
        </div>
      )}

      <AnimatePresence>
        {results && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={SPRING} className="instrument overflow-hidden">
            <div className="flex items-center justify-between border-b px-4 py-4" style={{ borderColor: 'var(--edge-soft)' }}>
              <p className="label">Results</p>
              <div className="flex gap-4">
                <span className="type-caption numeric" style={{ color: 'var(--accent)' }}>{results.successful} ok</span>
                <span className="type-caption numeric" style={{ color: 'var(--danger)' }}>{results.failed} failed</span>
                <span className="type-caption numeric text-flint">{Math.round(results.processing_time_ms)}ms</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="dt">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Input</th>
                    <th>Category</th>
                    <th>Urgency</th>
                    <th>Sentiment</th>
                    <th>Conf</th>
                    <th>Team</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {results.results.map((r, i) => (
                    <tr key={i}>
                      <td className="numeric">{String(i + 1).padStart(2, '0')}</td>
                      <td className="max-w-[200px]"><p className="truncate text-ink">{r.input_text}</p></td>
                      {r.classification ? (
                        <>
                          <td>
                            <p className="font-medium text-ink">{r.classification.category}</p>
                            <p className="type-micro mt-1" style={{ color: 'var(--accent)' }}>{r.classification.subcategory}</p>
                          </td>
                          <td><UrgencyPill level={r.classification.urgency} /></td>
                          <td><SentimentBadge sentiment={r.classification.sentiment} /></td>
                          <td className="numeric" style={{ color: 'var(--accent)' }}>{Math.round(r.classification.confidence * 100)}%</td>
                          <td className="text-ink">{r.classification.assigned_team}</td>
                          <td>
                            <div className="flex items-center gap-2">
                              {r.cached && <Zap className="h-4 w-4" style={{ color: 'var(--warning)' }} title="Cached" />}
                              {r.classification?.metadata?.was_translated && <Globe2 className="h-4 w-4" style={{ color: 'var(--accent)' }} title="Translated" />}
                              {!r.cached && !r.classification?.metadata?.was_translated && <CheckCircle2 className="h-4 w-4" style={{ color: 'var(--accent)' }} />}
                            </div>
                          </td>
                        </>
                      ) : (
                        <td colSpan={6} style={{ color: 'var(--danger)' }}>{r.error || 'failed'}</td>
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
