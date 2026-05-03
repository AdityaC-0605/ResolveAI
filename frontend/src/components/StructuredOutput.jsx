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

  const confColor = c.confidence >= 0.8 ? '#d4f43c' : c.confidence >= 0.6 ? '#f5a623' : '#ff4d6a'

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="panel overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border"
        style={{ borderLeftWidth: 2, borderLeftColor: '#d4f43c' }}>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-acid animate-pulse" />
          <span className="text-[10px] font-mono uppercase tracking-widest text-ghost">Classification</span>
        </div>
        <div className="flex items-center gap-3">
          {c.escalate_to_human && (
            <span className="flex items-center gap-1 text-[9px] font-mono px-2 py-1 border"
              style={{ color: '#f5a623', borderColor: '#f5a62330', background: '#f5a62308' }}>
              <AlertTriangle className="w-2.5 h-2.5" /> ESCALATE
            </span>
          )}
          {timing && (
            <span className="text-[9px] font-mono text-dim flex items-center gap-1">
              <Timer className="w-2.5 h-2.5" />{Math.round(timing)}ms
            </span>
          )}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Category row */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="label mb-1">Category</p>
            <p className="text-lg font-mono font-semibold text-snow leading-none">{c.category}</p>
            <p className="text-[11px] font-mono mt-0.5" style={{ color: '#9b6fff' }}>{c.subcategory}</p>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <UrgencyPill level={c.urgency} />
            <SentimentBadge sentiment={c.sentiment} />
          </div>
        </div>

        {/* Confidence bar */}
        <div>
          <div className="flex justify-between mb-1.5">
            <p className="label">Confidence</p>
            <span className="text-[11px] font-mono font-semibold" style={{ color: confColor }}>
              {Math.round(c.confidence * 100)}%
            </span>
          </div>
          <ScoreBar value={c.confidence} color={confColor} />
        </div>

        {/* Assignment */}
        <div className="grid grid-cols-2 gap-2">
          <div className="panel px-3 py-2">
            <p className="label mb-1">Team</p>
            <div className="flex items-center gap-1.5">
              <Users className="w-3 h-3" style={{ color: '#9b6fff' }} />
              <p className="text-[11px] font-mono text-silver">{c.assigned_team}</p>
            </div>
          </div>
          <div className="panel px-3 py-2">
            <p className="label mb-1">SLA</p>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3 h-3" style={{ color: '#2ee8d4' }} />
              <p className="text-[11px] font-mono text-silver">{c.estimated_resolution_hours}h</p>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="px-3 py-2.5 border border-border" style={{ borderLeftColor: '#d4f43c', borderLeftWidth: 2, background: 'rgba(212,244,60,0.03)' }}>
          <p className="label mb-1">Summary</p>
          <p className="text-[12px] font-sans text-ghost leading-relaxed">{c.summary}</p>
        </div>

        {/* Reasoning */}
        <div>
          <button onClick={() => setShowR(r => !r)}
            className="flex items-center gap-1.5 label mb-1.5 hover:text-ghost transition-colors cursor-pointer">
            <ChevronDown className="w-3 h-3 transition-transform" style={{ transform: showReasoning ? 'rotate(180deg)' : '' }} />
            Reasoning chain
          </button>
          <AnimatePresence>
            {showReasoning && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18 }} className="overflow-hidden">
                <div className="panel px-3 py-2.5">
                  <p className="text-[11px] font-mono text-dim leading-relaxed whitespace-pre-wrap">{c.reasoning}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Actions */}
        <div>
          <p className="label mb-2 flex items-center gap-1.5"><ListChecks className="w-3 h-3" /> Actions</p>
          <div className="space-y-1">
            {c.action_items?.map((a, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.06 }}
                className="flex items-start gap-2.5 px-3 py-2 border border-border">
                <span className="text-[9px] font-mono w-5 shrink-0 mt-0.5" style={{ color: '#d4f43c' }}>
                  {String(i+1).padStart(2,'0')}
                </span>
                <p className="text-[11px] font-mono text-ghost">{a}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Feedback */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <p className="text-[9px] font-mono text-dim uppercase tracking-widest">Correct?</p>
          {fbSent ? (
            <span className="text-[10px] font-mono flex items-center gap-1" style={{ color: '#2ee8d4' }}>
              <Check className="w-3 h-3" /> Recorded
            </span>
          ) : (
            <div className="flex gap-1.5">
              <button disabled={fbLoading} onClick={() => send(true)}
                className="btn py-1 px-2.5 text-[9px] hover:border-green-500/30 hover:text-green-400">
                <ThumbsUp className="w-3 h-3" /> Yes
              </button>
              <button disabled={fbLoading} onClick={() => send(false)}
                className="btn btn-danger py-1 px-2.5 text-[9px]">
                <ThumbsDown className="w-3 h-3" /> No
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}