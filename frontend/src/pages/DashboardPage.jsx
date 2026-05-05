import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Zap, Layers, BookOpen, BarChart3, Activity,
  Cpu, Server, ArrowRight, Clock, RefreshCw, Trash2, Database,
} from 'lucide-react'
import { StatBox, Tag, Spinner } from '../components/ui'
import { getStats, getHealth, getCacheInfo, getFewShotExamples, refreshFewShot, clearCache } from '../api'

const SPRING = { type: 'spring', stiffness: 300, damping: 30 }

const ACTIONS = [
  { to: '/classify', icon: Zap, label: 'Classify', sub: 'Single complaint' },
  { to: '/batch', icon: Layers, label: 'Batch', sub: 'Up to 50 at once' },
  { to: '/knowledge', icon: BookOpen, label: 'Knowledge', sub: 'Manage corpus' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics', sub: 'Accuracy and latency' },
]

const PIPE = ['Query', 'BM25', 'Dense', 'RRF', 'Re-rank', 'HyDE', 'LLM', 'Report']

function Row({ label, value, tone = 'var(--text-secondary)' }) {
  return (
    <div className="flex items-center justify-between border-b py-3 last:border-0" style={{ borderColor: 'var(--edge-soft)' }}>
      <p className="label">{label}</p>
      <p className="type-caption numeric font-medium" style={{ color: tone }}>{value}</p>
    </div>
  )
}

function ServiceRow({ label, ok, icon: Icon, detail }) {
  return (
    <div className="grid grid-cols-[8px_20px_1fr_auto] items-center gap-3 px-4 py-4">
      <motion.span
        className="h-2 w-2 rounded-full"
        style={{ background: ok ? 'var(--accent)' : 'var(--danger)' }}
        animate={{ scale: ok ? [1, 1.18, 1] : 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 18, repeat: ok ? Infinity : 0, repeatType: 'mirror' }}
      />
      <Icon className="h-5 w-5 text-flint" />
      <div className="min-w-0">
        <p className="type-caption font-semibold text-ink">{label}</p>
        <p className="type-micro truncate text-flint">{detail}</p>
      </div>
      <span className="type-micro numeric" style={{ color: ok ? 'var(--accent)' : 'var(--danger)' }}>{ok ? 'OK' : 'ERR'}</span>
    </div>
  )
}

export default function DashboardPage() {
  const [stats, setStats] = useState(null)
  const [health, setHealth] = useState(null)
  const [cache, setCache] = useState(null)
  const [fewShot, setFewShot] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const [clearing, setClearing] = useState(false)

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

  const cacheTotal = (stats?.cache_hits ?? 0) + (stats?.cache_misses ?? 0)
  const cacheRate = stats ? Math.round((stats.cache_hits ?? 0) / (cacheTotal || 1) * 100) : null

  return (
    <div className="mx-auto max-w-6xl px-8 py-8">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={SPRING} className="mb-8 flex items-end justify-between gap-6 border-b pb-4" style={{ borderColor: 'var(--edge-soft)' }}>
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full" style={{ background: 'var(--accent)' }} />
            <p className="label">System cockpit</p>
          </div>
          <h1 className="type-title">ResolveAI overview</h1>
        </div>
        <motion.button whileTap={{ scale: 0.97 }} transition={SPRING} onClick={load} className="btn">
          <RefreshCw className="h-4 w-4" /> Refresh
        </motion.button>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...SPRING, delay: 0.04 }} className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatBox label="Documents" value={stats?.total_documents ?? '—'} />
        <StatBox label="Classified" value={stats?.total_classifications ?? '—'} accent="var(--accent)" />
        <StatBox label="Avg latency" value={stats ? `${stats.avg_processing_ms}ms` : '—'} accent="var(--warning)" />
        <StatBox label="Cache hit rate" value={cacheRate != null ? `${cacheRate}%` : '—'} accent="var(--accent)" />
      </motion.div>

      <div className="mb-8 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...SPRING, delay: 0.08 }} className="instrument p-4">
          <div className="mb-4 flex items-center justify-between">
            <p className="label">Primary actions</p>
            <Tag>ready</Tag>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {ACTIONS.map(({ to, icon: Icon, label, sub }) => (
              <Link key={to} to={to}>
                <motion.div whileTap={{ scale: 0.98 }} transition={SPRING} className="panel-quiet h-full p-4">
                  <div className="mb-6 flex items-center justify-between">
                    <Icon className="h-5 w-5" style={{ color: label === 'Classify' ? 'var(--accent)' : 'var(--text-muted)' }} />
                    <ArrowRight className="h-4 w-4 text-flint" />
                  </div>
                  <p className="type-body font-semibold text-ink">{label}</p>
                  <p className="type-caption mt-1 text-flint">{sub}</p>
                </motion.div>
              </Link>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...SPRING, delay: 0.12 }} className="instrument overflow-hidden">
          <div className="border-b px-4 py-4" style={{ borderColor: 'var(--edge-soft)' }}>
            <p className="label">System status</p>
          </div>
          <div className="divide-y" style={{ borderColor: 'var(--edge-soft)' }}>
            <ServiceRow label="Ollama LLM" ok={health?.ollama_reachable} icon={Cpu} detail={stats?.llm_model ?? '—'} />
            <ServiceRow label="BM25 index" ok={health?.bm25_index_ready} icon={Activity} detail={`${stats?.total_documents ?? 0} docs`} />
            <ServiceRow label="Vector DB" ok={(health?.vector_db_count ?? 0) > 0} icon={Server} detail={`${health?.vector_db_count ?? 0} vectors`} />
          </div>
        </motion.div>
      </div>

      <div className="mb-8 grid gap-4 lg:grid-cols-3">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...SPRING, delay: 0.16 }} className="instrument p-4">
          <div className="mb-4 flex items-center justify-between">
            <p className="label">Cache layer</p>
            <button onClick={handleClear} disabled={clearing} className="btn btn-danger h-8">
              {clearing ? <Spinner size="sm" /> : <><Trash2 className="h-4 w-4" /> Clear</>}
            </button>
          </div>
          {cache ? (
            <div className="space-y-4">
              {[
                { label: 'Query cache', data: cache.query },
                { label: 'Embed cache', data: cache.embed },
              ].map(({ label, data }) => {
                const pct = Math.round((data?.hit_rate ?? 0) * 100)
                return (
                  <div key={label}>
                    <div className="mb-2 flex justify-between">
                      <p className="type-caption font-medium text-slate">{label}</p>
                      <p className="type-caption numeric" style={{ color: 'var(--accent)' }}>{pct}%</p>
                    </div>
                    <div className="sbar"><motion.div className="sbar-fill" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={SPRING} /></div>
                    <p className="type-micro mt-2 text-flint">{data?.size ?? 0} items · {data?.hits ?? 0} hits</p>
                  </div>
                )
              })}
              <Row label="Backend" value={cache.query?.backend ?? 'in-process'} tone="var(--accent)" />
            </div>
          ) : (
            <div className="flex justify-center py-8"><Spinner /></div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...SPRING, delay: 0.2 }} className="instrument p-4">
          <div className="mb-4 flex items-center justify-between">
            <p className="label">Few-shot prompts</p>
            <button onClick={handleRefresh} disabled={refreshing || !fewShot?.enabled} className="btn h-8">
              {refreshing ? <Spinner size="sm" /> : <><RefreshCw className="h-4 w-4" /> Refresh</>}
            </button>
          </div>
          {fewShot ? (
            fewShot.enabled ? (
              <div className="space-y-4">
                <Row label="Active examples" value={fewShot.count} tone="var(--accent)" />
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-flint" />
                  <p className="type-caption text-flint">Last: {fewShot.last_refresh ? new Date(fewShot.last_refresh).toLocaleTimeString() : 'Never'}</p>
                </div>
                {fewShot.examples?.slice(0, 3).map((ex, i) => (
                  <p key={i} className="panel-quiet type-caption truncate p-3 text-slate">{ex}</p>
                ))}
              </div>
            ) : (
              <p className="type-caption py-8 text-center text-flint">Disabled in settings</p>
            )
          ) : (
            <div className="flex justify-center py-8"><Spinner /></div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...SPRING, delay: 0.24 }} className="instrument p-4">
          <div className="mb-4 flex items-center justify-between">
            <p className="label">Retrieval mix</p>
            <Database className="h-5 w-5 text-flint" />
          </div>
          <Row label="Keyword weight" value={stats?.keyword_weight ? `${Math.round(stats.keyword_weight * 100)}%` : '35%'} />
          <Row label="Semantic weight" value={stats?.semantic_weight ? `${Math.round(stats.semantic_weight * 100)}%` : '65%'} />
          <Row label="Fusion" value="RRF k=60" tone="var(--accent)" />
          <Row label="Embed model" value={stats?.embedding_model?.split(' ')[0] ?? 'nomic-embed'} />
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...SPRING, delay: 0.28 }} className="instrument p-4">
        <div className="mb-4 flex items-center justify-between">
          <p className="label">Pipeline architecture</p>
          <span className="type-micro text-flint">input to report</span>
        </div>
        <div className="grid gap-3 md:grid-cols-8">
          {PIPE.map((label, i) => (
            <div key={label} className="relative">
              <div className="panel-quiet h-full p-3">
                <p className="type-micro numeric text-flint">0{i + 1}</p>
                <p className="type-caption mt-3 font-semibold text-ink">{label}</p>
              </div>
              {i < PIPE.length - 1 && <div className="absolute left-full top-1/2 hidden h-px w-3 md:block" style={{ background: 'var(--edge-strong)' }} />}
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
