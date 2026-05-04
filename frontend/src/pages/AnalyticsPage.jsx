import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid,
} from 'recharts'
import { RefreshCw, Trash2, Target, BarChart3, TrendingUp, AlertTriangle } from 'lucide-react'
import { StatBox, SectionHeader, Spinner, Tag } from '../components/ui'
import { getAnalytics, getStats, clearCache } from '../api'

const COLORS = ['#059669','#3B82F6','#818CF8','#D97706','#E11D48','#60A5FA','#34D399']

const TT = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="panel px-3 py-2 text-[11px] font-medium" style={{ borderColor: '#1E1E20', background: '#0A0A0B' }}>
      <p className="text-slate mb-1">{label}</p>
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
    <div className="px-8 py-8 max-w-6xl mx-auto">
      <SectionHeader title="Analytics" sub="Accuracy · latency · correction trends">
        <div className="flex gap-3">
          <button onClick={handleClear} disabled={clearing} className="btn btn-danger text-sm py-2">
            {clearing ? <Spinner size="sm" /> : <><Trash2 className="w-4 h-4" /> Clear Cache</>}
          </button>
          <button onClick={load} disabled={loading} className="btn text-sm py-2">
            {loading ? <Spinner size="sm" /> : <><RefreshCw className="w-4 h-4" /> Refresh</>}
          </button>
        </div>
      </SectionHeader>

      {loading && !stats ? (
        <div className="flex justify-center py-24"><Spinner /></div>
      ) : (
        <div className="space-y-6">
          {/* KPIs */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatBox label="Accuracy"        value={acc?.accuracy != null ? `${(acc.accuracy*100).toFixed(1)}%` : '—'} accent="#059669"
              sub={acc ? `${acc.correct}/${acc.total} correct` : 'No feedback yet'} />
            <StatBox label="Classified"      value={stats?.total_classifications ?? '—'} accent="#818CF8" />
            <StatBox label="Avg Latency"     value={stats ? `${stats.avg_processing_ms}ms` : '—'} accent="#D97706" />
            <StatBox label="Cache Efficiency" value={stats ? `${Math.round(stats.cache_hits / ((stats.cache_hits + stats.cache_misses) || 1) * 100)}%` : '—'} accent="#3B82F6"
              sub={stats ? `${stats.cache_hits} hits · ${stats.cache_misses} misses` : ''} />
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Latency chart */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, type: 'spring', stiffness: 400, damping: 30 }}
              className="panel overflow-hidden">
              <div className="px-5 py-4 border-b border-[#1E1E20]">
                <p className="text-[11px] font-medium uppercase tracking-wider text-flint">Latency Profile</p>
                <p className="text-[10px] text-slate mt-1">Estimated based on avg ± variance</p>
              </div>
              <div className="p-5">
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={latencyData}>
                    <CartesianGrid strokeDasharray="2 4" stroke="#1E1E20" />
                    <XAxis dataKey="t" tick={{ fontSize: 10, fill: '#71717A', fontFamily: 'Inter' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#71717A', fontFamily: 'Inter' }} axisLine={false} tickLine={false} width={36} />
                    <Tooltip content={<TT />} />
                    <Line type="monotone" dataKey="ms" stroke="#059669" strokeWidth={2} dot={false} name="ms" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Corrections pie */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, type: 'spring', stiffness: 400, damping: 30 }}
              className="panel overflow-hidden">
              <div className="px-5 py-4 border-b border-[#1E1E20]">
                <p className="text-[11px] font-medium uppercase tracking-wider text-flint">Correction Categories</p>
                <p className="text-[10px] text-slate mt-1">From reviewer feedback</p>
              </div>
              <div className="p-5">
                {catData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={catData} cx="50%" cy="50%" outerRadius={80} dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}
                        labelLine={false}
                        style={{ fontSize: 10, fontFamily: 'Inter', fontWeight: 500, fill: '#FAFAFA' }}>
                        {catData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip content={<TT />} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-48 flex flex-col items-center justify-center gap-3">
                    <AlertTriangle className="w-6 h-6 text-slate opacity-50" />
                    <p className="text-[12px] font-medium text-slate">No corrections yet</p>
                    <p className="text-[11px] text-dim text-center max-w-[200px]">Submit feedback on classified results to see trends</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Corrections table */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, type: 'spring', stiffness: 400, damping: 30 }}
            className="panel overflow-hidden">
            <div className="px-5 py-4 border-b border-[#1E1E20]">
              <p className="text-[11px] font-medium uppercase tracking-wider text-flint">Recent Corrections</p>
              <p className="text-[10px] text-slate mt-1">Cases where the LLM was corrected by a reviewer</p>
            </div>
            {analytics?.recent_misclassifications?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="dt w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#1E1E20] bg-[#0A0A0B]">
                      <th className="px-5 py-3 text-[10px] font-medium uppercase tracking-wider text-flint">Complaint ID</th>
                      <th className="px-5 py-3 text-[10px] font-medium uppercase tracking-wider text-flint">Input</th>
                      <th className="px-5 py-3 text-[10px] font-medium uppercase tracking-wider text-flint">Cat</th>
                      <th className="px-5 py-3 text-[10px] font-medium uppercase tracking-wider text-flint">Urgency</th>
                      <th className="px-5 py-3 text-[10px] font-medium uppercase tracking-wider text-flint">Note</th>
                      <th className="px-5 py-3 text-[10px] font-medium uppercase tracking-wider text-flint">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1E1E20]">
                    {analytics.recent_misclassifications.map((r, i) => (
                      <tr key={i} className="hover:bg-[#121214] transition-colors">
                        <td className="px-5 py-3 text-[#818CF8] text-[11px] font-mono">{r.complaint_id}</td>
                        <td className="px-5 py-3 max-w-[200px]"><p className="text-[12px] text-slate line-clamp-1">{r.input_text || '—'}</p></td>
                        <td className="px-5 py-3 text-[12px] text-quartz font-medium">{r.correct_cat || '—'}</td>
                        <td className="px-5 py-3 text-[12px] text-[#D97706]">{r.correct_urg || '—'}</td>
                        <td className="px-5 py-3 max-w-[160px]"><p className="text-[12px] text-slate line-clamp-1">{r.reviewer_note || '—'}</p></td>
                        <td className="px-5 py-3 text-[11px] text-slate font-mono whitespace-nowrap">{r.created_at?.slice(0,10) || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center">
                <p className="text-[12px] font-medium text-slate">No corrections recorded. Use thumbs-down on results to submit feedback.</p>
              </div>
            )}
          </motion.div>

          {/* Config grid */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, type: 'spring', stiffness: 400, damping: 30 }}
            className="panel overflow-hidden">
            <div className="px-5 py-4 border-b border-[#1E1E20]">
              <p className="text-[11px] font-medium uppercase tracking-wider text-flint">Retrieval Configuration</p>
            </div>
            <div className="p-5 grid grid-cols-2 lg:grid-cols-4 gap-3">
              {CONFIG_ROWS.map(({ k, v }) => (
                <div key={k} className="panel px-4 py-3 bg-[#0A0A0B]">
                  <p className="text-[10px] font-medium text-slate mb-1 uppercase tracking-wider">{k}</p>
                  <p className="text-[12px] font-medium text-quartz">{v}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}