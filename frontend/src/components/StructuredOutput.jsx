import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BrainCircuit, Timer, Users, Clock, ListChecks,
  AlertTriangle, ThumbsUp, ThumbsDown, CheckCircle2, ChevronDown,
} from 'lucide-react'
import { UrgencyPill, SentimentBadge, ScoreBar, CopyButton } from './ui'
import { submitFeedback } from '../api'

export default function StructuredOutput({ classification: c, timing, complaintId }) {
  const [fbSent, setFbSent] = useState(false)
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
  const confColor = c.confidence >= 0.8 ? 'from-cyan-500 to-cyan-400'
    : c.confidence >= 0.6 ? 'from-amber-400 to-orange-400'
      : 'from-pink-500 to-red-400'

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="glass-card overflow-hidden"
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-mint flex items-center justify-center">
            <BrainCircuit className="w-4 h-4 text-white" />
          </div>
          <h3 className="font-semibold text-white">Classification Result</h3>
        </div>
        <div className="flex items-center gap-3">
          {c.escalate_to_human && (
            <span className="flex items-center gap-1.5 text-xs font-mono text-amber-400 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <AlertTriangle className="w-3 h-3" />
              Escalate
            </span>
          )}
          <span className="text-xs font-mono text-slate-500 flex items-center gap-1.5 bg-slate-800/50 px-2 py-1 rounded-lg">
            <Timer className="w-3 h-3" />{timing}ms
          </span>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Category + badges row */}
        <div className="flex flex-wrap items-start gap-4">
          <div>
            <p className="text-xs font-medium text-slate-500 mb-2">Category</p>
            <div className="flex items-baseline gap-3">
              <span className="text-2xl font-bold text-white">{c.category}</span>
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
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-slate-500">Confidence</p>
            <span className={`text-sm font-mono font-bold ${
              c.confidence >= 0.8 ? 'text-cyan-400' : c.confidence >= 0.6 ? 'text-amber-400' : 'text-pink-400'
            }`}>{confidencePct}%</span>
          </div>
          <ScoreBar value={c.confidence} color={confColor} />
        </div>

        {/* Assignment grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="glass-subtle p-4 rounded-xl">
            <p className="text-xs font-medium text-slate-500 mb-2">Assigned Team</p>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                <Users className="w-4 h-4 text-violet-400" />
              </div>
              <span className="text-base font-semibold text-white">{c.assigned_team}</span>
            </div>
          </div>
          <div className="glass-subtle p-4 rounded-xl">
            <p className="text-xs font-medium text-slate-500 mb-2">Est. Resolution</p>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                <Clock className="w-4 h-4 text-cyan-400" />
              </div>
              <span className="text-base font-semibold text-white">{c.estimated_resolution_hours}h SLA</span>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="rounded-xl p-5" style={{ background: 'linear-gradient(135deg, rgba(20, 184, 166, 0.08) 0%, rgba(6, 182, 212, 0.04) 100%)', border: '1px solid rgba(20, 184, 166, 0.15)' }}>
          <p className="text-xs font-medium text-cyan-400/60 mb-2">Summary</p>
          <p className="text-sm text-slate-300 leading-relaxed">{c.summary}</p>
        </div>

        {/* Reasoning — collapsible */}
        <div>
          <button
            onClick={() => setShowReason(r => !r)}
            className="flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-slate-300 transition-colors mb-3"
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${showReason ? 'rotate-180' : ''}`} />
            Reasoning chain
          </button>
          <AnimatePresence>
            {showReason && (
              <motion.div
                initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="glass-subtle p-4 rounded-xl relative">
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
          <p className="text-xs font-medium text-slate-500 mb-3 flex items-center gap-2">
            <ListChecks className="w-4 h-4" /> Recommended Actions
          </p>
          <div className="space-y-2">
            {c.action_items.map((action, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + i * 0.07 }}
                className="flex items-start gap-3 p-3 rounded-lg bg-slate-900/40 border border-white/5"
              >
                <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20">
                  {i + 1}
                </div>
                <span className="text-sm text-slate-300">{action}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Feedback */}
        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          <p className="text-sm text-slate-500">Was this classification correct?</p>
          {fbSent ? (
            <span className="flex items-center gap-2 text-sm font-medium text-cyan-400">
              <CheckCircle2 className="w-4 h-4" /> Feedback recorded
            </span>
          ) : (
            <div className="flex gap-2">
              <button disabled={fbLoading} onClick={() => sendFeedback(true)}
                className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg text-emerald-400 hover:bg-emerald-500/10 border border-emerald-500/20 transition-all">
                <ThumbsUp className="w-4 h-4" /> Yes
              </button>
              <button disabled={fbLoading} onClick={() => sendFeedback(false)}
                className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg text-pink-400 hover:bg-pink-500/10 border border-pink-500/20 transition-all">
                <ThumbsDown className="w-4 h-4" /> No
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}