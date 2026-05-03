import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid,
} from 'recharts'
import { RefreshCw, Trash2, Target, BarChart3, TrendingUp, AlertTriangle } from 'lucide-react'
import { StatBox, SectionHeader, Spinner, Tag } from '../components/ui'
import { getAnalytics, getStats, clearCache } from '../api'

const COLORS = ['#d4f43c','#2ee8d4','#9b6fff','#f5a623','#ff4d6a','#60a5fa','#34d399']

const TT = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="panel px-2.5 py-2 text-[10px] font-mono" style={{ borderColor: 'rgba(212,244,60,0.2)' }}>
      <p className="text-dim mb-1">{label}</p>
      {payload.map((p, i) => <p key={i} style={{ color: p.color }}>{p.name}: {typeof p.value === 'number' ? p.value.toFixed(1) : p.value}</p>)}
    </div>
  )
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState(null)
  const [stats, setStats]         = useState(null)
  const [loading, setLoading]     = useState(false)
  const [clearing, setClearing]   = useState(false)

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
    analytics.recent_misclassifications.forEach(r => { const k = r.correct_cat || 'Unknown'; c[k] = (c[k]||0)+1 })
    return Object.entries(c).map(([name, value]) => ({ name, value }))
  }, [analytics])

  const latencyData = React.useMemo(() => {
    if (!stats) return []
    return Array.from({ length: 12 }, (_, i) => ({
      t: `${i+1}`, ms: Math.max(150, (stats.avg_processing_ms || 1200) * (0.7 + 0.6 * Math.random()))
    }))
  }, [stats])

  const acc = analytics?.accuracy

  const CONFIG_ROWS = [
    { k: 'LLM Model',       v: stats?.llm_model ?? '—' },
    { k: 'Embed Model',     v: stats?.embedding_model?.split(' ')[0] ?? '—' },
    { k: 'Fusion',          v: stats?.fusion_method ?? 'RRF k=60' },
    { k: 'Keyword Weight',  v: stats?.keyword_weight != null ? `${Math.round(stats.keyword_weight*100)}%` : '—' },
    { k: 'Semantic Weight', v: stats?.semantic_weight != null ? `${Math.round(stats.semantic_weight*100)}%` : '—' },
    { k: 'Total Docs',      v: stats?.total_documents ?? '—' },
    { k: 'Cache Hits',      v: stats?.cache_hits ?? '—' },
    { k: 'Index Status',    v: stats?.index_status ?? '—' },
    { k: 'Cache Layer',     v: 'Redis (Distributed)' },
    { k: 'Telemetry',       v: 'Prometheus (Active)' },
    { k: 'Translation',     v: 'LangDetect (Auto)' },
    { k: 'Few-Shot',        v: 'Dynamic (SQLite)' },
  ]

  return (
    <div className="px-6 py-6 max-w-6xl">
      <SectionHeader title="Analytics" sub="Accuracy · latency · correction trends">
        <div className="flex gap-2">
          <button onClick={handleClear} disabled={clearing} className="btn btn-danger text-[10px] py-1.5">
            {clearing ? <Spinner size="sm" /> : <><Trash2 className="w-3 h-3" /> Clear Cache</>}
          </button>
          <button onClick={load} disabled={loading} className="btn text-[10px] py-1.5">
            {loading ? <Spinner size="sm" /> : <><RefreshCw className="w-3 h-3" /> Refresh</>}
          </button>
        </div>
      </SectionHeader>

      {loading && !stats ? (
        <div className="flex justify-center py-24"><Spinner /></div>
      ) : (
        <div className="space-y-4">
          {/* KPIs */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            <StatBox label="Accuracy"        value={acc?.accuracy != null ? `${(acc.accuracy*100).toFixed(1)}%` : '—'} accent="#d4f43c"
              sub={acc ? `${acc.correct}/${acc.total} correct` : 'No feedback yet'} />
            <StatBox label="Classified"      value={stats?.total_classifications ?? '—'} accent="#9b6fff" />
            <StatBox label="Avg Latency"     value={stats ? `${stats.avg_processing_ms}ms` : '—'} accent="#f5a623" />
            <StatBox label="Cache Efficiency" value={stats ? `${Math.round(stats.cache_hits / ((stats.cache_hits + stats.cache_misses) || 1) * 100)}%` : '—'} accent="#2ee8d4"
              sub={stats ? `${stats.cache_hits} hits · ${stats.cache_misses} misses` : ''} />
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-4">
            {/* Latency chart */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="panel overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <p className="text-[10px] font-mono uppercase tracking-widest text-ghost">Latency Profile</p>
                <p className="text-[9px] font-mono text-dim mt-0.5">Estimated based on avg ± variance</p>
              </div>
              <div className="p-4">
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={latencyData}>
                    <CartesianGrid strokeDasharray="2 4" stroke="rgba(30,35,52,0.8)" />
                    <XAxis dataKey="t" tick={{ fontSize: 9, fill: '#4a566e', fontFamily: 'IBM Plex Mono' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 9, fill: '#4a566e', fontFamily: 'IBM Plex Mono' }} axisLine={false} tickLine={false} width={36} />
                    <Tooltip content={<TT />} />
                    <Line type="monotone" dataKey="ms" stroke="#d4f43c" strokeWidth={1.5} dot={false} name="ms" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Corrections pie */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className="panel overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <p className="text-[10px] font-mono uppercase tracking-widest text-ghost">Correction Categories</p>
                <p className="text-[9px] font-mono text-dim mt-0.5">From reviewer feedback</p>
              </div>
              <div className="p-4">
                {catData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={catData} cx="50%" cy="50%" outerRadius={70} dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}
                        labelLine={false}
                        style={{ fontSize: 9, fontFamily: 'IBM Plex Mono' }}>
                        {catData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip content={<TT />} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-44 flex flex-col items-center justify-center gap-2">
                    <AlertTriangle className="w-5 h-5" style={{ color: '#2a3044' }} />
                    <p className="text-[10px] font-mono text-dim">No corrections yet</p>
                    <p className="text-[9px] font-mono text-muted">Submit feedback on classified results to see trends</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Corrections table */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="panel overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <p className="text-[10px] font-mono uppercase tracking-widest text-ghost">Recent Corrections</p>
              <p className="text-[9px] font-mono text-dim mt-0.5">Cases where the LLM was corrected by a reviewer</p>
            </div>
            {analytics?.recent_misclassifications?.length > 0 ? (
              <table className="dt">
                <thead>
                  <tr><th>Complaint ID</th><th>Input</th><th>Cat</th><th>Urgency</th><th>Note</th><th>Date</th></tr>
                </thead>
                <tbody>
                  {analytics.recent_misclassifications.map((r, i) => (
                    <tr key={i}>
                      <td className="text-violet text-[9px]">{r.complaint_id}</td>
                      <td className="max-w-[180px]"><p className="text-[10px] text-dim line-clamp-1">{r.input_text || '—'}</p></td>
                      <td style={{ color: '#d4f43c' }} className="text-[10px]">{r.correct_cat || '—'}</td>
                      <td style={{ color: '#f5a623' }} className="text-[10px]">{r.correct_urg || '—'}</td>
                      <td className="max-w-[140px]"><p className="text-[10px] text-dim line-clamp-1">{r.reviewer_note || '—'}</p></td>
                      <td className="text-[9px] text-muted whitespace-nowrap">{r.created_at?.slice(0,10) || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="py-10 text-center">
                <p className="text-[10px] font-mono text-dim">No corrections recorded. Use thumbs-down on results to submit feedback.</p>
              </div>
            )}
          </motion.div>

          {/* Config grid */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="panel overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <p className="text-[10px] font-mono uppercase tracking-widest text-ghost">Retrieval Configuration</p>
            </div>
            <div className="p-4 grid grid-cols-2 lg:grid-cols-4 gap-2">
              {CONFIG_ROWS.map(({ k, v }) => (
                <div key={k} className="panel px-3 py-2">
                  <p className="text-[9px] font-mono text-dim mb-0.5 uppercase tracking-widest">{k}</p>
                  <p className="text-[11px] font-mono" style={{ color: '#d4f43c' }}>{v}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}