import React from 'react'
import { clsx } from 'clsx'

export function UrgencyPill({ level }) {
  const cls = { critical: 'urg-critical', high: 'urg-high', medium: 'urg-medium', low: 'urg-low' }[level] || 'urg-low'
  const dot = { critical: '#E11D48', high: '#D97706', medium: '#CA8A04', low: '#475569' }[level] || '#475569'
  return <span className={`urg ${cls}`}><span style={{ width: 4, height: 4, borderRadius: '50%', background: dot, display: 'inline-block', marginRight: 4 }} />{level}</span>
}

export function SentimentBadge({ sentiment }) {
  const cls = { angry: 'sent-angry', frustrated: 'sent-frustrated', neutral: 'sent-neutral', concerned: 'sent-concerned' }[sentiment] || 'sent-neutral'
  return <span className={`sent ${cls}`}>{sentiment}</span>
}

export function MethodTag({ method }) {
  const cls = { fused: 'method-fused', keyword: 'method-keyword', semantic: 'method-semantic' }[method] || 'method-fused'
  return <span className={`method ${cls}`}>{method}</span>
}

export function ScoreBar({ value, color = '#F4F4F5', delay = 0 }) {
  return (
    <div className="sbar w-full">
      <div className="sbar-fill" style={{ width: `${Math.round(value * 100)}%`, background: color, transitionDelay: `${delay}s` }} />
    </div>
  )
}

export function StatBox({ label, value, sub, accent = '#F4F4F5', mono = true }) {
  return (
    <div className="stat-box">
      <p className="label">{label}</p>
      <p className={clsx('font-semibold text-xl tracking-tight leading-none', mono && 'font-mono')} style={{ color: accent }}>{value}</p>
      {sub && <p className="text-[11px] text-flint">{sub}</p>}
    </div>
  )
}

export function Spinner({ size = 'sm' }) {
  const s = size === 'sm' ? 14 : 20
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 0.8s linear infinite' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      <circle cx="12" cy="12" r="10" stroke="#1E1E20" strokeWidth="2.5" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="#FAFAFA" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}

export function EmptyState({ icon: Icon, title, sub }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
      <div className="w-10 h-10 panel flex items-center justify-center rounded-full">
        <Icon className="w-5 h-5" style={{ color: '#71717A' }} />
      </div>
      <div>
        <p className="text-sm font-medium text-slate">{title}</p>
        {sub && <p className="text-[11px] text-flint mt-1 max-w-xs mx-auto leading-relaxed">{sub}</p>}
      </div>
    </div>
  )
}

export function SectionHeader({ title, sub, children }) {
  return (
    <div className="flex items-center justify-between mb-6 pb-4 border-b" style={{ borderColor: '#1E1E20' }}>
      <div>
        <h2 className="text-sm font-semibold text-quartz tracking-tight">{title}</h2>
        {sub && <p className="text-[12px] text-flint mt-1">{sub}</p>}
      </div>
      {children}
    </div>
  )
}

export function Tag({ children, color = '#FAFAFA' }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-medium tracking-wide uppercase rounded"
      style={{ background: 'rgba(250,250,250,0.05)', color, border: '1px solid rgba(250,250,250,0.1)' }}>
      {children}
    </span>
  )
}