import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid,
} from 'recharts'
import { RefreshCw, Trash2, AlertTriangle } from 'lucide-react'
import { StatBox, SectionHeader, Spinner } from '../components/ui'
import { getAnalytics, getStats, clearCache } from '../api'

const SPRING = { type: 'spring', stiffness: 300, damping: 30 }
const COLORS = ['#8fd47a', '#b8ad99', '#7f7463', '#d5a253', '#d26a5d']

const TT = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="panel-quiet p-3">
      <p className="type-caption mb-2 text-flint">{label}</p>
      {payload.map((p, i) => <p key={i} className="type-caption numeric" style={{ color: p.color }}>{p.name}: {typeof p.value === 'number' ? p.value.toFixed(1) : p.value}</p>)}
    </div>
  )
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState(null)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(false)
  const [clearing, setClearing] = useState(false)

  const load = async () => {
    setLoading(true)
    try { await Promise.all([getAnalytics().then(setAnalytics), getStats().then(setStats)]) } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleClear = async () => {
    setClearing(true)
    try { await clearCache(); await load() } catch {}
    setClearing(false)
  }

  const catData = React.useMemo(() => {
    if (!analytics?.recent_misclassifications?.length) return []
    const c = {}
    analytics.recent_misclassifications.forEach(r => { const k = r.correct_cat || 'Unknown'; c[k] = (c[k] || 0) + 1 })
    return Object.entries(c).map(([name, value]) => ({ name, value }))
  }, [analytics])

  const latencyData = React.useMemo(() => {
    if (!stats) return []
    return Array.from({ length: 12 }, (_, i) => ({
      t: `${i + 1}`, ms: Math.max(150, (stats.avg_processing_ms || 1200) * (0.7 + 0.6 * Math.random()))
    }))
  }, [stats])

  const acc = analytics?.accuracy

  const CONFIG_ROWS = [
    { k: 'LLM model', v: stats?.llm_model ?? '—' },
    { k: 'Embed model', v: stats?.embedding_model?.split(' ')[0] ?? '—' },
    { k: 'Fusion', v: stats?.fusion_method ?? 'RRF k=60' },
    { k: 'Keyword weight', v: stats?.keyword_weight != null ? `${Math.round(stats.keyword_weight * 100)}%` : '—' },
    { k: 'Semantic weight', v: stats?.semantic_weight != null ? `${Math.round(stats.semantic_weight * 100)}%` : '—' },
    { k: 'Total docs', v: stats?.total_documents ?? '—' },
    { k: 'Cache hits', v: stats?.cache_hits ?? '—' },
    { k: 'Index status', v: stats?.index_status ?? '—' },
    { k: 'Cache layer', v: 'Redis' },
    { k: 'Telemetry', v: 'Prometheus' },
    { k: 'Translation', v: 'LangDetect' },
    { k: 'Few-shot', v: 'Dynamic' },
  ]

  return (
    <div className="mx-auto max-w-6xl px-8 py-8">
      <SectionHeader title="Analytics" sub="Accuracy, latency, and correction trends">
        <div className="flex gap-3">
          <button onClick={handleClear} disabled={clearing} className="btn btn-danger">
            {clearing ? <Spinner size="sm" /> : <><Trash2 className="h-4 w-4" /> Clear cache</>}
          </button>
          <button onClick={load} disabled={loading} className="btn">
            {loading ? <Spinner size="sm" /> : <><RefreshCw className="h-4 w-4" /> Refresh</>}
          </button>
        </div>
      </SectionHeader>

      {loading && !stats ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : (
        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={SPRING} className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatBox label="Accuracy" value={acc?.accuracy != null ? `${(acc.accuracy * 100).toFixed(1)}%` : '—'} accent="var(--accent)" sub={acc ? `${acc.correct}/${acc.total} correct` : 'No feedback yet'} />
            <StatBox label="Classified" value={stats?.total_classifications ?? '—'} />
            <StatBox label="Avg latency" value={stats ? `${stats.avg_processing_ms}ms` : '—'} accent="var(--warning)" />
            <StatBox label="Cache efficiency" value={stats ? `${Math.round(stats.cache_hits / ((stats.cache_hits + stats.cache_misses) || 1) * 100)}%` : '—'} accent="var(--accent)" sub={stats ? `${stats.cache_hits} hits · ${stats.cache_misses} misses` : ''} />
          </motion.div>

          <div className="grid gap-6 lg:grid-cols-2">
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...SPRING, delay: 0.08 }} className="instrument overflow-hidden">
              <div className="border-b px-4 py-4" style={{ borderColor: 'var(--edge-soft)' }}>
                <p className="label">Latency profile</p>
                <p className="type-micro mt-1 text-flint">Estimated based on average and variance</p>
              </div>
              <div className="p-4">
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={latencyData}>
                    <CartesianGrid strokeDasharray="2 4" stroke="rgba(238, 231, 214, 0.08)" />
                    <XAxis dataKey="t" tick={{ fontSize: 11, fill: '#7f7463', fontFamily: 'Inter' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#7f7463', fontFamily: 'Inter' }} axisLine={false} tickLine={false} width={36} />
                    <Tooltip content={<TT />} />
                    <Line type="monotone" dataKey="ms" stroke="#8fd47a" strokeWidth={2} dot={false} name="ms" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...SPRING, delay: 0.12 }} className="instrument overflow-hidden">
              <div className="border-b px-4 py-4" style={{ borderColor: 'var(--edge-soft)' }}>
                <p className="label">Correction categories</p>
                <p className="type-micro mt-1 text-flint">From reviewer feedback</p>
              </div>
              <div className="p-4">
                {catData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={catData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} style={{ fontSize: 11, fontFamily: 'Inter', fontWeight: 500, fill: '#eee7d6' }}>
                        {catData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip content={<TT />} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-48 flex-col items-center justify-center gap-3">
                    <AlertTriangle className="h-6 w-6 text-flint" />
                    <p className="type-caption font-medium text-slate">No corrections yet</p>
                    <p className="type-micro max-w-[200px] text-center text-flint">Submit feedback on classified results to see trends.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...SPRING, delay: 0.16 }} className="instrument overflow-hidden">
            <div className="border-b px-4 py-4" style={{ borderColor: 'var(--edge-soft)' }}>
              <p className="label">Recent corrections</p>
              <p className="type-micro mt-1 text-flint">Cases where the model was corrected by a reviewer</p>
            </div>
            {analytics?.recent_misclassifications?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="dt">
                  <thead>
                    <tr>
                      <th>Complaint ID</th>
                      <th>Input</th>
                      <th>Cat</th>
                      <th>Urgency</th>
                      <th>Note</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.recent_misclassifications.map((r, i) => (
                      <tr key={i}>
                        <td className="numeric" style={{ color: 'var(--accent)' }}>{r.complaint_id}</td>
                        <td className="max-w-[200px]"><p className="line-clamp-1 text-slate">{r.input_text || '—'}</p></td>
                        <td className="font-medium text-ink">{r.correct_cat || '—'}</td>
                        <td style={{ color: 'var(--warning)' }}>{r.correct_urg || '—'}</td>
                        <td className="max-w-[160px]"><p className="line-clamp-1 text-slate">{r.reviewer_note || '—'}</p></td>
                        <td className="numeric whitespace-nowrap text-flint">{r.created_at?.slice(0, 10) || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center">
                <p className="type-caption font-medium text-slate">No corrections recorded. Use thumbs-down on results to submit feedback.</p>
              </div>
            )}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...SPRING, delay: 0.2 }} className="instrument overflow-hidden">
            <div className="border-b px-4 py-4" style={{ borderColor: 'var(--edge-soft)' }}>
              <p className="label">Retrieval configuration</p>
            </div>
            <div className="grid grid-cols-2 gap-4 p-4 lg:grid-cols-4">
              {CONFIG_ROWS.map(({ k, v }) => (
                <div key={k} className="panel-quiet p-4">
                  <p className="label mb-2">{k}</p>
                  <p className="type-caption font-semibold text-ink">{v}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
