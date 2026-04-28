import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend,
} from 'recharts'
import { BarChart3, TrendingUp, Target, RefreshCw, Trash2, AlertTriangle } from 'lucide-react'
import { StatCard, SectionHeader, Spinner } from '../components/ui'
import { getAnalytics, getStats, clearCache } from '../api'

const COLORS = ['#00f0b5','#7c3aed','#ff2d6b','#f59e0b','#60a5fa','#a78bfa','#34d399']

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="glass px-3 py-2 text-xs font-mono" style={{ border: '1px solid rgba(0,240,181,0.15)' }}>
      <p className="text-slate-400 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: {typeof p.value === 'number' ? p.value.toFixed ? p.value.toFixed(3) : p.value : p.value}</p>
      ))}
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
    try {
      const [a, s] = await Promise.all([getAnalytics(), getStats()])
      setAnalytics(a); setStats(s)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleClearCache = async () => {
    setClearing(true)
    try { await clearCache(); await load() } catch {}
    setClearing(false)
  }

  // Build category breakdown from misclassified items
  const categoryData = React.useMemo(() => {
    if (!analytics?.recent_misclassifications?.length) return []
    const counts = {}
    analytics.recent_misclassifications.forEach(r => {
      const cat = r.correct_cat || 'Unknown'
      counts[cat] = (counts[cat] || 0) + 1
    })
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [analytics])

  // Simulated latency sparkline (real data would come from a metrics endpoint)
  const sparkData = React.useMemo(() => {
    if (!stats) return []
    return Array.from({ length: 12 }, (_, i) => ({
      t: `${i+1}`,
      ms: Math.max(200, (stats.avg_processing_ms || 1500) * (0.7 + 0.6 * Math.random())),
    }))
  }, [stats])

  const acc = analytics?.accuracy

  return (
    <div className="px-8 py-8 max-w-6xl">
      <SectionHeader title="Analytics" sub="Classification accuracy, latency and distribution">
        <div className="flex gap-2">
          <button onClick={handleClearCache} disabled={clearing} className="btn-ghost text-sm">
            {clearing ? <Spinner size="sm" /> : <Trash2 className="w-4 h-4" />}
            Clear Cache
          </button>
          <button onClick={load} disabled={loading} className="btn-ghost text-sm">
            {loading ? <Spinner size="sm" /> : <RefreshCw className="w-4 h-4" />}
            Refresh
          </button>
        </div>
      </SectionHeader>

      {loading && !stats ? (
        <div className="flex justify-center py-24"><Spinner /></div>
      ) : (
        <div className="space-y-6">
          {/* KPIs */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Accuracy"         icon={Target}    color="text-mint"
              value={acc?.accuracy != null ? `${(acc.accuracy * 100).toFixed(1)}%` : '—'}
              sub={acc ? `${acc.correct}/${acc.total} correct` : 'No feedback yet'} />
            <StatCard label="Total Classified"  icon={BarChart3} color="text-violet-400"
              value={stats?.total_classifications ?? '—'} />
            <StatCard label="Avg Latency"       icon={TrendingUp} color="text-amber-400"
              value={stats ? `${stats.avg_processing_ms}ms` : '—'} />
            <StatCard label="Cache Efficiency"  icon={RefreshCw} color="text-cyan-400"
              value={stats ? `${Math.round(stats.cache_hits / ((stats.cache_hits + stats.cache_misses) || 1) * 100)}%` : '—'}
              sub={stats ? `${stats.cache_hits} hits · ${stats.cache_misses} misses` : ''} />
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Latency chart */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="glass p-6">
              <h3 className="font-display font-semibold text-slate-200 mb-1 text-sm">Latency Profile</h3>
              <p className="text-xs text-slate-600 mb-4 font-mono">Estimated based on avg ± variance</p>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={sparkData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="t" tick={{ fontSize: 10, fill: '#4a5568' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#4a5568' }} axisLine={false} tickLine={false} width={40} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="ms" stroke="#00f0b5" strokeWidth={2} dot={false} name="ms" />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Misclassified category pie */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="glass p-6">
              <h3 className="font-display font-semibold text-slate-200 mb-1 text-sm">Correction Categories</h3>
              <p className="text-xs text-slate-600 mb-4 font-mono">Categories from user feedback corrections</p>
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={categoryData} cx="50%" cy="50%" outerRadius={75} dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}
                      labelLine={false}
                      style={{ fontSize: 10 }}>
                      {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-48 flex flex-col items-center justify-center text-center">
                  <AlertTriangle className="w-6 h-6 text-slate-700 mb-2" />
                  <p className="text-sm text-slate-600">No corrections yet</p>
                  <p className="text-xs text-slate-700 mt-1">Submit feedback on classification results to see trends</p>
                </div>
              )}
            </motion.div>
          </div>

          {/* Misclassified table */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="glass overflow-hidden">
            <div className="px-6 py-4 border-b border-white/[0.04]">
              <h3 className="font-display font-semibold text-slate-200 text-sm">Recent Corrections</h3>
              <p className="text-xs text-slate-600 mt-0.5 font-mono">Cases where the LLM was corrected by a reviewer</p>
            </div>
            {analytics?.recent_misclassifications?.length > 0 ? (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Complaint ID</th>
                    <th>Input</th>
                    <th>Corrected Category</th>
                    <th>Corrected Urgency</th>
                    <th>Note</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.recent_misclassifications.map((r, i) => (
                    <tr key={i}>
                      <td className="font-mono text-xs text-violet-400">{r.complaint_id}</td>
                      <td className="max-w-[200px]">
                        <p className="text-xs text-slate-400 line-clamp-1">{r.input_text || '—'}</p>
                      </td>
                      <td className="text-xs text-mint font-mono">{r.correct_cat || '—'}</td>
                      <td className="text-xs font-mono text-amber-400">{r.correct_urg || '—'}</td>
                      <td className="max-w-[160px]">
                        <p className="text-xs text-slate-500 line-clamp-1">{r.reviewer_note || '—'}</p>
                      </td>
                      <td className="text-[10px] font-mono text-slate-600 whitespace-nowrap">
                        {r.created_at?.slice(0, 10) || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="py-12 flex flex-col items-center text-center">
                <p className="text-sm text-slate-600">No corrections recorded yet.</p>
                <p className="text-xs text-slate-700 mt-1">Use the thumbs-down button on any classification result to submit feedback.</p>
              </div>
            )}
          </motion.div>

          {/* System config card */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="glass p-6">
            <h3 className="font-display font-semibold text-slate-200 text-sm mb-4">Retrieval Configuration</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { k: 'LLM Model',        v: stats?.llm_model ?? '—'    },
                { k: 'Embed Model',      v: stats?.embedding_model?.split(' ')[0] ?? '—' },
                { k: 'Fusion',           v: stats?.fusion_method ?? 'RRF' },
                { k: 'Keyword Weight',   v: stats?.keyword_weight != null ? `${Math.round(stats.keyword_weight*100)}%` : '—' },
                { k: 'Semantic Weight',  v: stats?.semantic_weight != null ? `${Math.round(stats.semantic_weight*100)}%` : '—' },
                { k: 'Docs in Corpus',   v: stats?.total_documents ?? '—' },
                { k: 'Cache Hits',       v: stats?.cache_hits ?? '—' },
                { k: 'Index Status',     v: stats?.index_status ?? '—' },
              ].map(({ k, v }) => (
                <div key={k} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <p className="text-[10px] font-mono text-slate-600 mb-0.5 uppercase tracking-widest">{k}</p>
                  <p className="text-sm font-mono text-mint">{v}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}