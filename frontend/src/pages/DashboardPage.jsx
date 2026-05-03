import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Zap, Layers, BookOpen, BarChart3, Database, Activity,
  Cpu, Server, ArrowRight, BrainCircuit, Clock, RefreshCw, Trash2,
} from 'lucide-react'
import { StatBox, Tag, Spinner } from '../components/ui'
import { getStats, getHealth, getCacheInfo, getFewShotExamples, refreshFewShot, clearCache } from '../api'

const ACTIONS = [
  { to: '/classify',  icon: Zap,      label: 'Classify',       sub: 'Single complaint',       accent: '#d4f43c' },
  { to: '/batch',     icon: Layers,   label: 'Batch',          sub: 'Up to 50 at once',       accent: '#9b6fff' },
  { to: '/knowledge', icon: BookOpen, label: 'Knowledge',      sub: 'Manage corpus',          accent: '#f5a623' },
  { to: '/analytics', icon: BarChart3,label: 'Analytics',      sub: 'Accuracy & latency',     accent: '#2ee8d4' },
]

const PIPE = [
  { label: 'Query',      color: '#4a566e' },
  { label: '→',          arrow: true },
  { label: 'BM25',       color: '#9b6fff' },
  { label: '+',          arrow: true },
  { label: 'Dense',      color: '#2ee8d4' },
  { label: '→',          arrow: true },
  { label: 'RRF',        color: '#f5a623' },
  { label: '→',          arrow: true },
  { label: 'Re-rank',    color: '#ff4d6a' },
  { label: '→',          arrow: true },
  { label: 'HyDE',       color: '#9b6fff' },
  { label: '→',          arrow: true },
  { label: 'LLM',        color: '#d4f43c' },
  { label: '→',          arrow: true },
  { label: 'JSON',       color: '#4a566e' },
]

function Row({ label, value, accent = '#8494a8' }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
      <p className="text-[10px] font-mono text-dim uppercase tracking-widest">{label}</p>
      <p className="text-[11px] font-mono font-medium" style={{ color: accent }}>{value}</p>
    </div>
  )
}

export default function DashboardPage() {
  const [stats, setStats]         = useState(null)
  const [health, setHealth]       = useState(null)
  const [cache, setCache]         = useState(null)
  const [fewShot, setFewShot]     = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const [clearing, setClearing]   = useState(false)

  const load = async () => {
    await Promise.allSettled([
      getStats().then(setStats).catch(() => {}),
      getHealth().then(setHealth).catch(() => {}),
      getCacheInfo().then(setCache).catch(() => {}),
      getFewShotExamples().then(setFewShot).catch(() => {}),
    ])
  }

  useEffect(() => { load() }, [])

  const handleRefresh = async () => {
    setRefreshing(true)
    try { await refreshFewShot(); await getFewShotExamples().then(setFewShot) } catch {}
    setRefreshing(false)
  }

  const handleClear = async () => {
    setClearing(true)
    try { await clearCache(); await getCacheInfo().then(setCache) } catch {}
    setClearing(false)
  }

  return (
    <div className="px-6 py-6 max-w-6xl">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex items-end justify-between border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1.5 h-1.5 rounded-full bg-acid animate-pulse" />
            <p className="text-[9px] font-mono uppercase tracking-widest text-dim">System dashboard</p>
          </div>
          <h1 className="text-xl font-mono font-semibold text-silver">ResolveAI</h1>
        </div>
        <button onClick={load} className="btn text-[10px] py-1.5">
          <RefreshCw className="w-3 h-3" /> Refresh
        </button>
      </motion.div>

      {/* KPI row */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-6">
        <StatBox label="Documents"       value={stats?.total_documents ?? '—'} accent="#d4f43c" />
        <StatBox label="Classified"      value={stats?.total_classifications ?? '—'} accent="#9b6fff" />
        <StatBox label="Avg Latency"     value={stats ? `${stats.avg_processing_ms}ms` : '—'} accent="#f5a623" />
        <StatBox label="Cache Hit Rate"  value={stats ? `${Math.round(stats.cache_hits / (stats.cache_hits + stats.cache_misses || 1) * 100)}%` : '—'} accent="#2ee8d4" />
      </motion.div>

      {/* Quick actions */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-6">
        <p className="label mb-3">Quick actions</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          {ACTIONS.map(({ to, icon: Icon, label, sub, accent }) => (
            <Link key={to} to={to}>
              <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}
                className="panel p-4 cursor-pointer transition-colors hover:border-muted group"
                style={{ borderLeftWidth: 2, borderLeftColor: accent + '40' }}
                onMouseEnter={e => e.currentTarget.style.borderLeftColor = accent}
                onMouseLeave={e => e.currentTarget.style.borderLeftColor = accent + '40'}>
                <Icon className="w-4 h-4 mb-3" style={{ color: accent }} />
                <p className="text-[12px] font-mono font-semibold text-silver">{label}</p>
                <p className="text-[10px] font-mono text-dim mt-0.5">{sub}</p>
                <ArrowRight className="w-3 h-3 text-muted mt-3 group-hover:text-ghost transition-colors" />
              </motion.div>
            </Link>
          ))}
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-4 mb-4">

        {/* System status */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="panel overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-[10px] font-mono uppercase tracking-widest text-ghost">System status</p>
          </div>
          <div className="divide-y divide-border">
            {[
              { label: 'Ollama LLM',  ok: health?.ollama_reachable,    icon: Cpu,      detail: stats?.llm_model ?? '—' },
              { label: 'BM25 Index',  ok: health?.bm25_index_ready,    icon: Activity, detail: `${stats?.total_documents ?? 0} docs` },
              { label: 'Vector DB',   ok: (health?.vector_db_count ?? 0) > 0, icon: Server,   detail: `${health?.vector_db_count ?? 0} vectors` },
            ].map(({ label, ok, icon: Icon, detail }) => (
              <div key={label} className="flex items-center gap-3 px-4 py-3">
                <div className="relative w-1.5 h-1.5 shrink-0">
                  <div className="absolute inset-0 rounded-full" style={{ background: ok ? '#d4f43c' : '#ff4d6a' }} />
                  {ok && <div className="absolute inset-0 rounded-full animate-ping opacity-50" style={{ background: '#d4f43c' }} />}
                </div>
                <Icon className="w-3.5 h-3.5 shrink-0 text-dim" />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-mono text-silver">{label}</p>
                  <p className="text-[9px] font-mono text-dim truncate">{detail}</p>
                </div>
                <span className="text-[9px] font-mono" style={{ color: ok ? '#d4f43c' : '#ff4d6a' }}>{ok ? 'OK' : 'ERR'}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Cache info */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="panel overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <p className="text-[10px] font-mono uppercase tracking-widest text-ghost">Cache layer</p>
            <button onClick={handleClear} disabled={clearing} className="btn btn-danger py-1 px-2.5 text-[9px]">
              {clearing ? <Spinner size="sm" /> : <><Trash2 className="w-2.5 h-2.5" /> Clear</>}
            </button>
          </div>
          <div className="p-4 space-y-3">
            {cache ? (
              <>
                <div>
                  <div className="flex justify-between mb-1">
                    <p className="label">Query Cache</p>
                    <p className="text-[10px] font-mono" style={{ color: '#d4f43c' }}>{Math.round((cache.query?.hit_rate ?? 0) * 100)}% hit</p>
                  </div>
                  <div className="h-px bg-border overflow-hidden">
                    <div className="h-full bg-acid" style={{ width: `${Math.round((cache.query?.hit_rate ?? 0) * 100)}%`, transition: 'width 1s' }} />
                  </div>
                  <p className="text-[9px] font-mono text-dim mt-0.5">{cache.query?.size ?? 0} items · {cache.query?.hits ?? 0} hits</p>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <p className="label">Embed Cache</p>
                    <p className="text-[10px] font-mono" style={{ color: '#9b6fff' }}>{Math.round((cache.embed?.hit_rate ?? 0) * 100)}% hit</p>
                  </div>
                  <div className="h-px bg-border overflow-hidden">
                    <div className="h-full" style={{ width: `${Math.round((cache.embed?.hit_rate ?? 0) * 100)}%`, background: '#9b6fff', transition: 'width 1s' }} />
                  </div>
                  <p className="text-[9px] font-mono text-dim mt-0.5">{cache.embed?.size ?? 0} items · {cache.embed?.hits ?? 0} hits</p>
                </div>
                <Row label="Backend" value={cache.query?.backend ?? 'in-process'} accent="#2ee8d4" />
              </>
            ) : (
              <div className="flex items-center justify-center py-6"><Spinner /></div>
            )}
          </div>
        </motion.div>

        {/* Few-shot */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="panel overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <p className="text-[10px] font-mono uppercase tracking-widest text-ghost">Few-shot prompts</p>
            <button onClick={handleRefresh} disabled={refreshing || !fewShot?.enabled} className="btn btn-outline-cyan py-1 px-2.5 text-[9px] disabled:opacity-30">
              {refreshing ? <Spinner size="sm" /> : <><RefreshCw className="w-2.5 h-2.5" /> Refresh</>}
            </button>
          </div>
          <div className="p-4">
            {fewShot ? (
              fewShot.enabled ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="label">Active examples</p>
                    <Tag color="#d4f43c">{fewShot.count}</Tag>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3 text-dim" />
                    <p className="text-[10px] font-mono text-dim">
                      Last: {fewShot.last_refresh ? new Date(fewShot.last_refresh).toLocaleTimeString() : 'Never'}
                    </p>
                  </div>
                  {fewShot.examples?.length > 0 && (
                    <div className="space-y-1 mt-2">
                      {fewShot.examples.slice(0, 3).map((ex, i) => (
                        <div key={i} className="px-2 py-1.5 border border-border text-[9px] font-mono text-dim line-clamp-1">
                          {ex.slice(0, 80)}…
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-[10px] font-mono text-dim py-4 text-center">Disabled in settings</p>
              )
            ) : (
              <div className="flex items-center justify-center py-6"><Spinner /></div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Pipeline architecture */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="panel overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <p className="text-[10px] font-mono uppercase tracking-widest text-ghost">Pipeline architecture</p>
        </div>
        <div className="p-4">
          <div className="flex items-center gap-1 flex-wrap">
            {PIPE.map(({ label, color, arrow }, i) => (
              arrow
                ? <span key={i} className="text-[10px] font-mono text-muted">{label}</span>
                : <span key={i} className="text-[10px] font-mono px-2.5 py-1 border"
                    style={{ color, borderColor: color + '30', background: color + '08' }}>{label}</span>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-2">
            {[
              { k: 'Keyword Weight', v: stats?.keyword_weight ? `${Math.round(stats.keyword_weight*100)}%` : '35%' },
              { k: 'Semantic Weight', v: stats?.semantic_weight ? `${Math.round(stats.semantic_weight*100)}%` : '65%' },
              { k: 'Fusion',         v: 'RRF k=60' },
              { k: 'Embed Model',    v: stats?.embedding_model?.split(' ')[0] ?? 'nomic-embed' },
            ].map(({ k, v }) => (
              <div key={k} className="panel px-3 py-2">
                <p className="label mb-0.5">{k}</p>
                <p className="text-[11px] font-mono" style={{ color: '#d4f43c' }}>{v}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  )
}