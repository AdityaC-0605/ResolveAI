import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Clock, ListChecks, ChevronDown, ThumbsUp, ThumbsDown, Check, AlertTriangle, Timer } from 'lucide-react'
import { UrgencyPill, SentimentBadge, ScoreBar } from './ui'
import { submitFeedback } from '../api'

export default function StructuredOutput({ classification: c, timing, complaintId }) {
  const [fbSent, setFbSent] = useState(false)
  const [fbLoading, setFbLoading] = useState(false)
  const [showReasoning, setShowR] = useState(false)

  const send = async (ok) => {
    if (fbSent) return
    setFbLoading(true)
    try { await submitFeedback(complaintId, ok); setFbSent(true) } catch {}
    setFbLoading(false)
  }

  const confColor = c.confidence >= 0.8 ? '#059669' : c.confidence >= 0.6 ? '#D97706' : '#E11D48'

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 400, damping: 30 }} className="panel overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#1E1E20]"
        style={{ borderLeftWidth: 3, borderLeftColor: '#059669' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-[#059669] animate-pulse" />
          <span className="text-[11px] font-medium uppercase tracking-wider text-flint">Classification</span>
        </div>
        <div className="flex items-center gap-4">
          {c.escalate_to_human && (
            <span className="flex items-center gap-1.5 text-[10px] font-medium px-2.5 py-1 rounded border"
              style={{ color: '#D97706', borderColor: '#D9770630', background: '#D9770608' }}>
              <AlertTriangle className="w-3 h-3" /> ESCALATE
            </span>
          )}
          {timing && (
            <span className="text-[11px] font-mono text-slate flex items-center gap-1.5">
              <Timer className="w-3.5 h-3.5" />{Math.round(timing)}ms
            </span>
          )}
        </div>
      </div>

      <div className="p-5 space-y-6">
        {/* Category row */}
        <div className="flex items-start justify-between gap-5">
          <div>
            <p className="label mb-1.5">Category</p>
            <p className="text-xl font-medium text-quartz tracking-tight leading-none">{c.category}</p>
            <p className="text-[12px] mt-1" style={{ color: '#818CF8' }}>{c.subcategory}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <UrgencyPill level={c.urgency} />
            <SentimentBadge sentiment={c.sentiment} />
          </div>
        </div>

        {/* Confidence bar */}
        <div>
          <div className="flex justify-between mb-2">
            <p className="label">Confidence</p>
            <span className="text-[12px] font-mono font-medium" style={{ color: confColor }}>
              {Math.round(c.confidence * 100)}%
            </span>
          </div>
          <ScoreBar value={c.confidence} color={confColor} />
        </div>

        {/* Assignment */}
        <div className="grid grid-cols-2 gap-3">
          <div className="panel px-4 py-3 bg-[#0A0A0B]">
            <p className="label mb-1.5">Team</p>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" style={{ color: '#818CF8' }} />
              <p className="text-[12px] font-medium text-quartz">{c.assigned_team}</p>
            </div>
          </div>
          <div className="panel px-4 py-3 bg-[#0A0A0B]">
            <p className="label mb-1.5">SLA</p>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" style={{ color: '#3B82F6' }} />
              <p className="text-[12px] font-medium text-quartz">{c.estimated_resolution_hours}h</p>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="px-4 py-3 border border-[#1E1E20] rounded" style={{ borderLeftColor: '#059669', borderLeftWidth: 3, background: 'rgba(5,150,105,0.03)' }}>
          <p className="label mb-1.5">Summary</p>
          <p className="text-[13px] font-medium text-quartz leading-relaxed">{c.summary}</p>
        </div>

        {/* Reasoning */}
        <div>
          <button onClick={() => setShowR(r => !r)}
            className="flex items-center gap-2 label mb-2 hover:text-quartz transition-colors cursor-pointer">
            <ChevronDown className="w-4 h-4 transition-transform" style={{ transform: showReasoning ? 'rotate(180deg)' : '' }} />
            Reasoning chain
          </button>
          <AnimatePresence>
            {showReasoning && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="panel px-4 py-3 bg-[#0A0A0B]">
                  <p className="text-[12px] font-medium text-slate leading-relaxed whitespace-pre-wrap">{c.reasoning}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Actions */}
        <div>
          <p className="label mb-3 flex items-center gap-2"><ListChecks className="w-4 h-4" /> Actions</p>
          <div className="space-y-1.5">
            {c.action_items?.map((a, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.05, type: 'spring', stiffness: 400, damping: 30 }}
                className="flex items-start gap-3 px-4 py-3 border border-[#1E1E20] rounded bg-[#0A0A0B]">
                <span className="text-[10px] font-mono w-5 shrink-0 mt-0.5" style={{ color: '#059669' }}>
                  {String(i+1).padStart(2,'0')}
                </span>
                <p className="text-[12px] font-medium text-quartz">{a}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Feedback */}
        <div className="flex items-center justify-between pt-4 border-t border-[#1E1E20]">
          <p className="text-[11px] font-medium text-flint uppercase tracking-wider">Correct?</p>
          {fbSent ? (
            <span className="text-[11px] font-medium flex items-center gap-1.5" style={{ color: '#059669' }}>
              <Check className="w-4 h-4" /> Recorded
            </span>
          ) : (
            <div className="flex gap-2">
              <button disabled={fbLoading} onClick={() => send(true)}
                className="btn py-1.5 px-3 text-xs hover:border-[#059669]/50 hover:text-[#059669]">
                <ThumbsUp className="w-3.5 h-3.5" /> Yes
              </button>
              <button disabled={fbLoading} onClick={() => send(false)}
                className="btn btn-danger py-1.5 px-3 text-xs">
                <ThumbsDown className="w-3.5 h-3.5" /> No
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}