import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Clock, ListChecks, ChevronDown, ThumbsUp, ThumbsDown, Check, AlertTriangle, Timer, FileText } from 'lucide-react'
import { UrgencyPill, SentimentBadge, ScoreBar } from './ui'
import { submitFeedback } from '../api'

const SPRING = { type: 'spring', stiffness: 300, damping: 30 }

function ReportField({ label, children, icon: Icon }) {
  return (
    <div className="border-b pb-4 last:border-b-0 last:pb-0" style={{ borderColor: 'var(--edge-soft)' }}>
      <div className="mb-2 flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4 text-flint" />}
        <p className="label">{label}</p>
      </div>
      {children}
    </div>
  )
}

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

  const confColor = c.confidence >= 0.8 ? 'var(--accent)' : c.confidence >= 0.6 ? 'var(--warning)' : 'var(--danger)'

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={SPRING} className="instrument overflow-hidden">
      <div className="flex items-center justify-between border-b px-4 py-4" style={{ borderColor: 'var(--edge-soft)' }}>
        <div className="flex items-center gap-3">
          <FileText className="h-5 w-5" style={{ color: 'var(--accent)' }} />
          <span className="label">Classification report</span>
        </div>
        <div className="flex items-center gap-4">
          {c.escalate_to_human && (
            <span className="tag" style={{ color: 'var(--warning)' }}>
              <AlertTriangle className="h-4 w-4" /> Escalate
            </span>
          )}
          {timing && (
            <span className="type-caption numeric flex items-center gap-2 text-slate">
              <Timer className="h-4 w-4" />{Math.round(timing)}ms
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-6 p-6 lg:grid-cols-[1fr_220px]">
        <div className="space-y-4">
          <ReportField label="Category">
            <h2 className="type-title">{c.category}</h2>
            <p className="type-body mt-1" style={{ color: 'var(--accent)' }}>{c.subcategory}</p>
          </ReportField>

          <ReportField label="Summary">
            <p className="type-body font-medium text-ink">{c.summary}</p>
          </ReportField>

          <ReportField label="Action plan" icon={ListChecks}>
            <div className="space-y-3">
              {c.action_items?.map((a, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ ...SPRING, delay: i * 0.04 }} className="grid grid-cols-[32px_1fr] gap-3">
                  <span className="type-micro numeric flex h-8 w-8 items-center justify-center rounded-md" style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <p className="type-caption font-medium text-slate">{a}</p>
                </motion.div>
              ))}
            </div>
          </ReportField>

          <div>
            <button onClick={() => setShowR(r => !r)} className="label mb-2 flex cursor-pointer items-center gap-2 hover:text-ink">
              <ChevronDown className="h-4 w-4" style={{ transform: showReasoning ? 'rotate(180deg)' : 'rotate(0deg)' }} />
              Reasoning chain
            </button>
            <AnimatePresence>
              {showReasoning && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={SPRING} className="overflow-hidden">
                  <div className="panel-quiet p-4">
                    <p className="type-caption whitespace-pre-wrap text-slate">{c.reasoning}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="panel-quiet p-4">
            <div className="mb-4 flex items-center justify-between">
              <p className="label">Confidence</p>
              <span className="type-caption numeric font-semibold" style={{ color: confColor }}>{Math.round(c.confidence * 100)}%</span>
            </div>
            <ScoreBar value={c.confidence} color={confColor} />
          </div>

          <div className="panel-quiet p-4">
            <p className="label mb-3">Signals</p>
            <div className="flex flex-wrap gap-2">
              <UrgencyPill level={c.urgency} />
              <SentimentBadge sentiment={c.sentiment} />
            </div>
          </div>

          <div className="panel-quiet space-y-4 p-4">
            <ReportField label="Team" icon={Users}>
              <p className="type-caption font-semibold text-ink">{c.assigned_team}</p>
            </ReportField>
            <ReportField label="SLA" icon={Clock}>
              <p className="type-caption numeric font-semibold text-ink">{c.estimated_resolution_hours}h</p>
            </ReportField>
          </div>
        </aside>
      </div>

      <div className="flex items-center justify-between border-t px-4 py-4" style={{ borderColor: 'var(--edge-soft)' }}>
        <p className="label">Reviewer verdict</p>
        {fbSent ? (
          <span className="type-caption flex items-center gap-2 font-medium" style={{ color: 'var(--accent)' }}>
            <Check className="h-4 w-4" /> Recorded
          </span>
        ) : (
          <div className="flex gap-2">
            <motion.button whileTap={{ scale: 0.97 }} transition={SPRING} disabled={fbLoading} onClick={() => send(true)} className="btn">
              <ThumbsUp className="h-4 w-4" /> Yes
            </motion.button>
            <motion.button whileTap={{ scale: 0.97 }} transition={SPRING} disabled={fbLoading} onClick={() => send(false)} className="btn btn-danger">
              <ThumbsDown className="h-4 w-4" /> No
            </motion.button>
          </div>
        )}
      </div>
    </motion.div>
  )
}
