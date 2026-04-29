import React from 'react'
import { motion } from 'framer-motion'
import { clsx } from 'clsx'

/* ── Urgency pill ──────────────────────────────────────────────────────────── */
const URGENCY_MAP = {
  critical: { cls: 'pill-critical', dot: 'bg-red-500' },
  high: { cls: 'pill-high', dot: 'bg-amber-400' },
  medium: { cls: 'pill-medium', dot: 'bg-blue-400' },
  low: { cls: 'pill-low', dot: 'bg-slate-400' },
}
export function UrgencyPill({ level }) {
  const { cls, dot } = URGENCY_MAP[level] || URGENCY_MAP.medium
  return (
    <span className={cls}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {level}
    </span>
  )
}

/* ── Sentiment badge ───────────────────────────────────────────────────────── */
const SENT_MAP = {
  angry: 'bg-red-500/10 text-red-400 border border-red-500/20',
  frustrated: 'bg-orange-500/10 text-orange-400 border border-orange-500/20',
  neutral: 'bg-slate-500/10 text-slate-400 border border-slate-500/20',
  concerned: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
}
export function SentimentBadge({ sentiment }) {
  return (
    <span className={clsx('inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize',
      SENT_MAP[sentiment] || SENT_MAP.neutral)}>
      {sentiment}
    </span>
  )
}

/* ── Animated score bar ────────────────────────────────────────────────────── */
export function ScoreBar({ value, delay = 0, color = 'from-cyan-500 to-cyan-400' }) {
  return (
    <div className="score-bar-track overflow-hidden">
      <motion.div
        className={`h-full rounded-full bg-gradient-to-r ${color}`}
        initial={{ width: 0 }}
        animate={{ width: `${Math.round(value * 100)}%` }}
        transition={{ duration: 1, delay, ease: [0.4, 0, 0.2, 1] }}
      />
    </div>
  )
}

/* ── Stat card ─────────────────────────────────────────────────────────────── */
export function StatCard({ label, value, sub, icon: Icon, color = 'text-cyan-400', glow = false }) {
  return (
    <div className={clsx('stat-card', glow && 'glow-cyan')}>
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-widest">{label}</p>
        {Icon && <Icon className={`w-5 h-5 ${color} opacity-70`} />}
      </div>
      <p className={`text-3xl font-bold text-white`}>{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  )
}

/* ── Section header ────────────────────────────────────────────────────────── */
export function SectionHeader({ title, sub, children }) {
  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <h2 className="text-2xl font-bold text-white">{title}</h2>
        {sub && <p className="text-sm text-slate-500 mt-1">{sub}</p>}
      </div>
      {children}
    </div>
  )
}

/* ── Spinner ────────────────────────────────────────────────────────────────── */
export function Spinner({ size = 'md' }) {
  const s = size === 'sm' ? 'w-4 h-4 border-[2px]' : 'w-6 h-6 border-2'
  return (
    <div className={clsx(s, 'rounded-full border-slate-700 border-t-cyan-400 animate-spin')} />
  )
}

/* ── Tag (retrieval method) ────────────────────────────────────────────────── */
const METHOD_MAP = {
  fused: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  semantic: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20',
  keyword: 'bg-violet-500/10 text-violet-400 border border-violet-500/20',
}
export function MethodTag({ method }) {
  return (
    <span className={clsx('tag', METHOD_MAP[method] || METHOD_MAP.fused)}>
      {method}
    </span>
  )
}

/* ── Empty state ────────────────────────────────────────────────────────────── */
export function EmptyState({ icon: Icon, title, sub }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="relative mb-5">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-500/20 to-violet-500/20 blur-xl" />
        <div className="relative w-16 h-16 rounded-2xl glass flex items-center justify-center">
          <Icon className="w-7 h-7 text-slate-500" />
        </div>
      </div>
      <p className="font-semibold text-lg text-white mb-2">{title}</p>
      {sub && <p className="text-sm text-slate-500 max-w-xs">{sub}</p>}
    </div>
  )
}

/* ── Copy button ────────────────────────────────────────────────────────────── */
export function CopyButton({ text }) {
  const [copied, setCopied] = React.useState(false)
  const copy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button onClick={copy} className="text-xs font-mono text-slate-500 hover:text-cyan-400 transition-colors">
      {copied ? '✓ copied' : 'copy'}
    </button>
  )
}