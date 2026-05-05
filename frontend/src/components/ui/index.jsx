import React from 'react'
import { motion } from 'framer-motion'
import { clsx } from 'clsx'

const STATE_COLORS = {
  critical: 'urg-critical',
  high: 'urg-high',
  medium: 'urg-medium',
  low: 'urg-low',
}

const DOTS = {
  critical: 'var(--danger)',
  high: 'var(--warning)',
  medium: 'var(--text-secondary)',
  low: 'var(--text-muted)',
}

export function UrgencyPill({ level }) {
  const cls = STATE_COLORS[level] || 'urg-low'
  return <span className={`urg ${cls}`}><span style={{ width: 4, height: 4, borderRadius: '50%', background: DOTS[level] || DOTS.low }} />{level}</span>
}

export function SentimentBadge({ sentiment }) {
  const cls = { angry: 'sent-angry', frustrated: 'sent-frustrated', neutral: 'sent-neutral', concerned: 'sent-concerned' }[sentiment] || 'sent-neutral'
  return <span className={`sent ${cls}`}>{sentiment}</span>
}

export function MethodTag({ method }) {
  const cls = { fused: 'method-fused', keyword: 'method-keyword', semantic: 'method-semantic' }[method] || 'method-fused'
  return <span className={`method ${cls}`}>{method}</span>
}

export function ScoreBar({ value, color = 'var(--accent)', delay = 0 }) {
  return (
    <div className="sbar w-full">
      <motion.div
        className="sbar-fill"
        initial={{ width: 0 }}
        animate={{ width: `${Math.round(value * 100)}%` }}
        transition={{ type: 'spring', stiffness: 120, damping: 24, delay }}
        style={{ background: color }}
      />
    </div>
  )
}

export function StatBox({ label, value, sub, accent = 'var(--text-primary)', mono = true }) {
  return (
    <div className="instrument stat-box">
      <p className="label">{label}</p>
      <div>
        <p className={clsx('type-title numeric', mono && 'font-semibold')} style={{ color: accent }}>{value}</p>
        {sub && <p className="type-micro mt-1 text-flint">{sub}</p>}
      </div>
    </div>
  )
}

export function Spinner({ size = 'sm' }) {
  const s = size === 'sm' ? 14 : 20
  return (
    <motion.span
      aria-hidden="true"
      initial={{ scale: 0.88, opacity: 0.55 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 280, damping: 18, repeat: Infinity, repeatType: 'mirror' }}
      style={{ width: s, height: s, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block' }}
    />
  )
}

export function EmptyState({ icon: Icon, title, sub }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
      <div className="panel-quiet flex h-12 w-12 items-center justify-center rounded-md">
        <Icon className="h-6 w-6" style={{ color: 'var(--text-muted)' }} />
      </div>
      <div>
        <p className="type-body font-medium text-slate">{title}</p>
        {sub && <p className="type-caption mt-2 max-w-xs text-flint">{sub}</p>}
      </div>
    </div>
  )
}

export function SectionHeader({ title, sub, children }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4 border-b pb-4" style={{ borderColor: 'var(--edge-soft)' }}>
      <div>
        <h2 className="type-title">{title}</h2>
        {sub && <p className="type-caption mt-1 text-flint">{sub}</p>}
      </div>
      {children}
    </div>
  )
}

export function Tag({ children, color = 'var(--accent)' }) {
  return (
    <span className="tag" style={{ color }}>
      {children}
    </span>
  )
}
