import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BrainCircuit, Timer, Users, Clock, ListChecks,
  AlertTriangle, ThumbsUp, ThumbsDown, CheckCircle2, ChevronDown,
} from 'lucide-react'
import { UrgencyPill, SentimentBadge, ScoreBar, CopyButton } from './ui'
import { submitFeedback } from '../api'

export default function StructuredOutput({ classification: c, timing, complaintId }) {
  const [fbSent, setFbSent]     = useState(false)
  const [fbLoading, setFbLoading] = useState(false)
  const [showReason, setShowReason] = useState(false)

  const sendFeedback = async (isCorrect) => {
    if (fbSent || !complaintId) return
    setFbLoading(true)
    try {
      await submitFeedback(complaintId, isCorrect)
      setFbSent(true)
    } catch {}
    setFbLoading(false)
  }

  const confidencePct = Math.round(c.confidence * 100)
  const confColor = c.confidence >= 0.8 ? 'from-mint to-cyan-400'
                  : c.confidence >= 0.6 ? 'from-amber-400 to-orange-400'
                  : 'from-coral to-red-400'

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="glass border-glow-mint overflow-hidden"
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.04]">
        <div className="flex items-center gap-2">
          <BrainCircuit className="w-4 h-4 text-mint" />
          <h3 className="font-display font-semibold text-slate-200">Classification Result</h3>
        </div>
        <div className="flex items-center gap-3">
          {c.escalate_to_human && (
            <span className="flex items-center gap-1.5 text-xs font-mono text-amber-400 px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <AlertTriangle className="w-3 h-3" />
              Escalate
            </span>
          )}
          <span className="text-xs font-mono text-slate-500 flex items-center gap-1">
            <Timer className="w-3 h-3" />{timing}ms
          </span>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* Category + badges row */}
        <div className="flex flex-wrap items-start gap-3">
          <div>
            <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest mb-1">Category</p>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-display font-bold text-slate-100">{c.category}</span>
              <span className="text-sm font-mono text-violet-400">{c.subcategory}</span>
            </div>
          </div>
          <div className="ml-auto flex flex-wrap gap-2 items-center">
            <UrgencyPill level={c.urgency} />
            <SentimentBadge sentiment={c.sentiment} />
          </div>
        </div>

        {/* Confidence */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">Confidence</p>
            <span className={`text-sm font-mono font-bold ${
              c.confidence >= 0.8 ? 'text-mint' : c.confidence >= 0.6 ? 'text-amber-400' : 'text-coral'
            }`}>{confidencePct}%</span>
          </div>
          <ScoreBar value={c.confidence} color={confColor} />
        </div>

        {/* Assignment grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl p-3 border border-white/[0.04]" style={{ background: 'rgba(8,13,30,0.6)' }}>
            <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest mb-1">Assigned Team</p>
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-violet-400" />
              <span className="text-sm font-medium text-slate-200">{c.assigned_team}</span>
            </div>
          </div>
          <div className="rounded-xl p-3 border border-white/[0.04]" style={{ background: 'rgba(8,13,30,0.6)' }}>
            <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest mb-1">Est. Resolution</p>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-sm font-medium text-slate-200">{c.estimated_resolution_hours}h SLA</span>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="rounded-xl p-4" style={{ background: 'rgba(0,240,181,0.04)', border: '1px solid rgba(0,240,181,0.1)' }}>
          <p className="text-[10px] font-mono text-mint/60 uppercase tracking-widest mb-1.5">Summary</p>
          <p className="text-sm text-slate-300 leading-relaxed">{c.summary}</p>
        </div>

        {/* Reasoning — collapsible */}
        <div>
          <button
            onClick={() => setShowReason(r => !r)}
            className="flex items-center gap-2 text-[10px] font-mono text-slate-500 uppercase tracking-widest hover:text-slate-300 transition-colors mb-2"
          >
            <ChevronDown className={`w-3 h-3 transition-transform ${showReason ? 'rotate-180' : ''}`} />
            Reasoning chain
          </button>
          <AnimatePresence>
            {showReason && (
              <motion.div
                initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="rounded-xl p-4 relative" style={{ background: 'rgba(8,13,30,0.8)', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <div className="absolute top-3 right-3">
                    <CopyButton text={c.reasoning} />
                  </div>
                  <p className="text-sm text-slate-400 leading-relaxed whitespace-pre-wrap pr-12">{c.reasoning}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Action items */}
        <div>
          <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <ListChecks className="w-3 h-3" /> Recommended Actions
          </p>
          <div className="space-y-1.5">
            {c.action_items.map((action, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + i * 0.07 }}
                className="flex items-start gap-2.5 p-2.5 rounded-lg"
                style={{ background: 'rgba(8,13,30,0.5)', border: '1px solid rgba(255,255,255,0.03)' }}
              >
                <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[9px] font-bold font-mono text-mint"
                  style={{ background: 'rgba(0,240,181,0.08)', border: '1px solid rgba(0,240,181,0.2)' }}>
                  {i + 1}
                </div>
                <span className="text-sm text-slate-300">{action}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Feedback */}
        <div className="flex items-center justify-between pt-2 border-t border-white/[0.04]">
          <p className="text-xs text-slate-600">Was this classification correct?</p>
          {fbSent ? (
            <span className="flex items-center gap-1.5 text-xs font-mono text-mint">
              <CheckCircle2 className="w-3.5 h-3.5" /> Feedback recorded
            </span>
          ) : (
            <div className="flex gap-2">
              <button disabled={fbLoading} onClick={() => sendFeedback(true)}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/10 border border-white/[0.04] hover:border-emerald-500/20 transition-all">
                <ThumbsUp className="w-3 h-3" /> Yes
              </button>
              <button disabled={fbLoading} onClick={() => sendFeedback(false)}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg text-coral hover:bg-coral/10 border border-white/[0.04] hover:border-coral/20 transition-all">
                <ThumbsDown className="w-3 h-3" /> No
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}