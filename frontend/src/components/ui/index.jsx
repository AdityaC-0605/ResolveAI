import React from 'react'
import { clsx } from 'clsx'

export function UrgencyPill({ level }) {
  const cls = { critical: 'urg-critical', high: 'urg-high', medium: 'urg-medium', low: 'urg-low' }[level] || 'urg-low'
  const dot = { critical: '#ff4d6a', high: '#f5a623', medium: '#2ee8d4', low: '#4a566e' }[level] || '#4a566e'
  return <span className={`urg ${cls}`}><span style={{ width: 5, height: 5, borderRadius: '50%', background: dot, display: 'inline-block' }} />{level}</span>
}

export function SentimentBadge({ sentiment }) {
  const cls = { angry: 'sent-angry', frustrated: 'sent-frustrated', neutral: 'sent-neutral', concerned: 'sent-concerned' }[sentiment] || 'sent-neutral'
  return <span className={`sent ${cls}`}>{sentiment}</span>
}

export function MethodTag({ method }) {
  const cls = { fused: 'method-fused', keyword: 'method-keyword', semantic: 'method-semantic' }[method] || 'method-fused'
  return <span className={`method ${cls}`}>{method}</span>
}

export function ScoreBar({ value, color = '#d4f43c', delay = 0 }) {
  return (
    <div className="sbar w-full">
      <div className="sbar-fill" style={{ width: `${Math.round(value * 100)}%`, background: color, transitionDelay: `${delay}s` }} />
    </div>
  )
}

export function StatBox({ label, value, sub, accent = '#d4f43c', mono = true }) {
  return (
    <div className="stat-box">
      <p className="label">{label}</p>
      <p className={clsx('font-semibold text-xl leading-none', mono && 'font-mono')} style={{ color: accent }}>{value}</p>
      {sub && <p className="text-[10px] font-mono text-dim">{sub}</p>}
    </div>
  )
}

export function Spinner({ size = 'sm' }) {
  const s = size === 'sm' ? 14 : 20
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 0.8s linear infinite' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      <circle cx="12" cy="12" r="10" stroke="#1e2334" strokeWidth="2.5" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="#d4f43c" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}

export function EmptyState({ icon: Icon, title, sub }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
      <div className="w-10 h-10 panel flex items-center justify-center">
        <Icon className="w-5 h-5 text-muted" style={{ color: '#2a3044' }} />
      </div>
      <div>
        <p className="text-xs font-mono text-ghost font-medium">{title}</p>
        {sub && <p className="text-[11px] font-mono text-dim mt-1 max-w-xs">{sub}</p>}
      </div>
    </div>
  )
}

export function SectionHeader({ title, sub, children }) {
  return (
    <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
      <div>
        <h2 className="text-sm font-mono font-semibold text-silver tracking-tight">{title}</h2>
        {sub && <p className="text-[11px] font-mono text-dim mt-0.5">{sub}</p>}
      </div>
      {children}
    </div>
  )
}

export function Tag({ children, color = '#d4f43c' }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-mono uppercase tracking-widest"
      style={{ background: `${color}12`, color, border: `1px solid ${color}30`, borderRadius: 1 }}>
      {children}
    </span>
  )
}