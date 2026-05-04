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
  { to: '/classify',  icon: Zap,      label: 'Classify',       sub: 'Single complaint',       accent: '#FAFAFA' },
  { to: '/batch',     icon: Layers,   label: 'Batch',          sub: 'Up to 50 at once',       accent: '#4F46E5' },
  { to: '/knowledge', icon: BookOpen, label: 'Knowledge',      sub: 'Manage corpus',          accent: '#D97706' },
  { to: '/analytics', icon: BarChart3,label: 'Analytics',      sub: 'Accuracy & latency',     accent: '#059669' },
]

const PIPE = [
  { label: 'Query',      color: '#71717A' },
  { label: '→',          arrow: true },
  { label: 'BM25',       color: '#4F46E5' },
  { label: '+',          arrow: true },
  { label: 'Dense',      color: '#059669' },
  { label: '→',          arrow: true },
  { label: 'RRF',        color: '#D97706' },
  { label: '→',          arrow: true },
  { label: 'Re-rank',    color: '#E11D48' },
  { label: '→',          arrow: true },
  { label: 'HyDE',       color: '#4F46E5' },
  { label: '→',          arrow: true },
  { label: 'LLM',        color: '#FAFAFA' },
  { label: '→',          arrow: true },
  { label: 'JSON',       color: '#71717A' },
]

function Row({ label, value, accent = '#A1A1AA' }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b last:border-0" style={{ borderColor: '#1E1E20' }}>
      <p className="text-[11px] font-medium text-flint uppercase tracking-wider">{label}</p>
      <p className="text-[12px] font-medium" style={{ color: accent }}>{value}</p>
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
    <div className="px-8 py-8 max-w-6xl mx-auto">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 400, damping: 30 }} 
        className="mb-8 flex items-end justify-between border-b pb-5" style={{ borderColor: '#1E1E20' }}>
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#059669] animate-pulse" />
            <p className="text-[10px] font-medium uppercase tracking-wider text-flint">System dashboard</p>
          </div>
          <h1 className="text-2xl font-semibold text-quartz tracking-tight">ResolveAI Overview</h1>
        </div>
        <button onClick={load} className="btn py-1.5">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </motion.div>

      {/* KPI row */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05, type: 'spring', stiffness: 400, damping: 30 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <StatBox label="Documents"       value={stats?.total_documents ?? '—'} accent="#FAFAFA" />
        <StatBox label="Classified"      value={stats?.total_classifications ?? '—'} accent="#4F46E5" />
        <StatBox label="Avg Latency"     value={stats ? `${stats.avg_processing_ms}ms` : '—'} accent="#D97706" />
        <StatBox label="Cache Hit Rate"  value={stats ? `${Math.round(stats.cache_hits / (stats.cache_hits + stats.cache_misses || 1) * 100)}%` : '—'} accent="#059669" />
      </motion.div>

      {/* Quick actions */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, type: 'spring', stiffness: 400, damping: 30 }} className="mb-8">
        <p className="label mb-3">Quick actions</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {ACTIONS.map(({ to, icon: Icon, label, sub, accent }) => (
            <Link key={to} to={to}>
              <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}
                className="panel p-5 cursor-pointer transition-colors hover:border-[#3F3F46] group"
                style={{ borderLeftWidth: 2, borderLeftColor: accent + '30' }}
                onMouseEnter={e => e.currentTarget.style.borderLeftColor = accent}
                onMouseLeave={e => e.currentTarget.style.borderLeftColor = accent + '30'}>
                <Icon className="w-4 h-4 mb-4" style={{ color: accent }} />
                <p className="text-[13px] font-semibold text-quartz">{label}</p>
                <p className="text-[11px] text-slate mt-1">{sub}</p>
                <ArrowRight className="w-3.5 h-3.5 text-[#3F3F46] mt-4 group-hover:text-slate transition-colors" />
              </motion.div>
            </Link>
          ))}
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-4 mb-4">

        {/* System status */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, type: 'spring', stiffness: 400, damping: 30 }}
          className="panel overflow-hidden">
          <div className="px-5 py-3.5 border-b" style={{ borderColor: '#1E1E20' }}>
            <p className="text-[10px] font-medium uppercase tracking-wider text-flint">System status</p>
          </div>
          <div className="divide-y divide-[#1E1E20]">
            {[
              { label: 'Ollama LLM',  ok: health?.ollama_reachable,    icon: Cpu,      detail: stats?.llm_model ?? '—' },
              { label: 'BM25 Index',  ok: health?.bm25_index_ready,    icon: Activity, detail: `${stats?.total_documents ?? 0} docs` },
              { label: 'Vector DB',   ok: (health?.vector_db_count ?? 0) > 0, icon: Server,   detail: `${health?.vector_db_count ?? 0} vectors` },
            ].map(({ label, ok, icon: Icon, detail }) => (
              <div key={label} className="flex items-center gap-3 px-5 py-3.5">
                <div className="relative w-2 h-2 shrink-0">
                  <div className="absolute inset-0 rounded-full" style={{ background: ok ? '#059669' : '#E11D48' }} />
                  {ok && <div className="absolute inset-0 rounded-full animate-ping opacity-40" style={{ background: '#059669' }} />}
                </div>
                <Icon className="w-4 h-4 shrink-0 text-slate" />
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-medium text-quartz">{label}</p>
                  <p className="text-[10px] text-flint truncate mt-0.5">{detail}</p>
                </div>
                <span className="text-[10px] font-medium" style={{ color: ok ? '#059669' : '#E11D48' }}>{ok ? 'OK' : 'ERR'}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Cache info */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, type: 'spring', stiffness: 400, damping: 30 }}
          className="panel overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: '#1E1E20' }}>
            <p className="text-[10px] font-medium uppercase tracking-wider text-flint">Cache layer</p>
            <button onClick={handleClear} disabled={clearing} className="btn btn-danger py-1 px-2.5 text-[10px]">
              {clearing ? <Spinner size="sm" /> : <><Trash2 className="w-3 h-3" /> Clear</>}
            </button>
          </div>
          <div className="p-5 space-y-4">
            {cache ? (
              <>
                <div>
                  <div className="flex justify-between mb-1.5">
                    <p className="label">Query Cache</p>
                    <p className="text-[11px] font-medium" style={{ color: '#FAFAFA' }}>{Math.round((cache.query?.hit_rate ?? 0) * 100)}% hit</p>
                  </div>
                  <div className="h-1 bg-[#1E1E20] overflow-hidden rounded-full">
                    <div className="h-full bg-brand rounded-full" style={{ width: `${Math.round((cache.query?.hit_rate ?? 0) * 100)}%`, transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)' }} />
                  </div>
                  <p className="text-[10px] text-flint mt-1.5">{cache.query?.size ?? 0} items · {cache.query?.hits ?? 0} hits</p>
                </div>
                <div>
                  <div className="flex justify-between mb-1.5">
                    <p className="label">Embed Cache</p>
                    <p className="text-[11px] font-medium" style={{ color: '#4F46E5' }}>{Math.round((cache.embed?.hit_rate ?? 0) * 100)}% hit</p>
                  </div>
                  <div className="h-1 bg-[#1E1E20] overflow-hidden rounded-full">
                    <div className="h-full rounded-full" style={{ width: `${Math.round((cache.embed?.hit_rate ?? 0) * 100)}%`, background: '#4F46E5', transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)' }} />
                  </div>
                  <p className="text-[10px] text-flint mt-1.5">{cache.embed?.size ?? 0} items · {cache.embed?.hits ?? 0} hits</p>
                </div>
                <Row label="Backend" value={cache.query?.backend ?? 'in-process'} accent="#059669" />
              </>
            ) : (
              <div className="flex items-center justify-center py-6"><Spinner /></div>
            )}
          </div>
        </motion.div>

        {/* Few-shot */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, type: 'spring', stiffness: 400, damping: 30 }}
          className="panel overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: '#1E1E20' }}>
            <p className="text-[10px] font-medium uppercase tracking-wider text-flint">Few-shot prompts</p>
            <button onClick={handleRefresh} disabled={refreshing || !fewShot?.enabled} className="btn btn-outline-cyan py-1 px-2.5 text-[10px] disabled:opacity-30">
              {refreshing ? <Spinner size="sm" /> : <><RefreshCw className="w-3 h-3" /> Refresh</>}
            </button>
          </div>
          <div className="p-5">
            {fewShot ? (
              fewShot.enabled ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="label">Active examples</p>
                    <Tag color="#FAFAFA">{fewShot.count}</Tag>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-flint" />
                    <p className="text-[11px] text-flint font-mono">
                      Last: {fewShot.last_refresh ? new Date(fewShot.last_refresh).toLocaleTimeString() : 'Never'}
                    </p>
                  </div>
                  {fewShot.examples?.length > 0 && (
                    <div className="space-y-1 mt-3">
                      {fewShot.examples.slice(0, 3).map((ex, i) => (
                        <div key={i} className="px-3 py-2 border rounded text-[10px] font-mono text-slate line-clamp-1" style={{ borderColor: '#1E1E20' }}>
                          {ex.slice(0, 80)}…
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-[11px] text-flint py-6 text-center">Disabled in settings</p>
              )
            ) : (
              <div className="flex items-center justify-center py-6"><Spinner /></div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Pipeline architecture */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, type: 'spring', stiffness: 400, damping: 30 }}
        className="panel overflow-hidden">
        <div className="px-5 py-3.5 border-b" style={{ borderColor: '#1E1E20' }}>
          <p className="text-[10px] font-medium uppercase tracking-wider text-flint">Pipeline architecture</p>
        </div>
        <div className="p-5">
          <div className="flex items-center gap-1.5 flex-wrap">
            {PIPE.map(({ label, color, arrow }, i) => (
              arrow
                ? <span key={i} className="text-[11px] font-mono text-[#3F3F46]">{label}</span>
                : <span key={i} className="text-[11px] font-mono px-3 py-1.5 rounded border"
                    style={{ color, borderColor: color + '20', background: color + '08' }}>{label}</span>
            ))}
          </div>
          <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { k: 'Keyword Weight', v: stats?.keyword_weight ? `${Math.round(stats.keyword_weight*100)}%` : '35%' },
              { k: 'Semantic Weight', v: stats?.semantic_weight ? `${Math.round(stats.semantic_weight*100)}%` : '65%' },
              { k: 'Fusion',         v: 'RRF k=60' },
              { k: 'Embed Model',    v: stats?.embedding_model?.split(' ')[0] ?? 'nomic-embed' },
            ].map(({ k, v }) => (
              <div key={k} className="panel px-4 py-3 bg-[#0A0A0B]">
                <p className="label mb-1">{k}</p>
                <p className="text-[12px] font-mono" style={{ color: '#FAFAFA' }}>{v}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  )
}