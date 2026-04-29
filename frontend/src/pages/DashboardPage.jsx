import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Zap, Layers, BarChart3, BookOpen,
  Activity, Database, Cpu, Server, TrendingUp, ArrowRight,
} from 'lucide-react'
import { StatCard } from '../components/ui'
import { getStats, getHealth } from '../api'

const ACTIONS = [
  { to: '/classify', icon: Zap, label: 'Classify', sub: 'Single complaint analysis', accent: 'from-cyan-500/20 to-cyan-600/10', border: 'border-cyan-500/20', iconBg: 'bg-cyan-500/20 text-cyan-400' },
  { to: '/batch', icon: Layers, label: 'Batch Mode', sub: 'Process up to 50 at once', accent: 'from-violet-500/20 to-violet-600/10', border: 'border-violet-500/20', iconBg: 'bg-violet-500/20 text-violet-400' },
  { to: '/knowledge', icon: BookOpen, label: 'Knowledge Base', sub: 'Manage complaint corpus', accent: 'from-amber-500/20 to-amber-600/10', border: 'border-amber-500/20', iconBg: 'bg-amber-500/20 text-amber-400' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics', sub: 'Accuracy & trends', accent: 'from-pink-500/20 to-pink-600/10', border: 'border-pink-500/20', iconBg: 'bg-pink-500/20 text-pink-400' },
]

export default function DashboardPage() {
  const [stats, setStats] = useState(null)
  const [health, setHealth] = useState(null)

  useEffect(() => {
    getStats().then(setStats).catch(() => {})
    getHealth().then(setHealth).catch(() => {})
  }, [])

  return (
    <div className="min-h-full p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-10"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-subtle mb-4">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">Hybrid RAG v2.0</span>
        </div>
        <h1 className="text-4xl font-bold text-white mb-3">
          Dashboard
        </h1>
        <p className="text-slate-400 text-lg max-w-xl">
          Monitor system health, track classification metrics, and manage your AI pipeline.
        </p>
      </motion.div>

      <div className="space-y-8">

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
        >
          <StatCard label="Total Documents" value={stats?.total_documents ?? '—'} icon={Database} color="text-cyan-400" />
          <StatCard label="Classifications" value={stats?.total_classifications ?? '—'} icon={Activity} color="text-violet-400" />
          <StatCard label="Avg Latency" value={stats ? `${stats.avg_processing_ms}ms` : '—'} icon={Zap} color="text-amber-400" />
          <StatCard label="Cache Hit Rate" value={stats ? `${Math.round((stats.cache_hits / (stats.cache_hits + stats.cache_misses || 1)) * 100)}%` : '—'} icon={TrendingUp} color="text-mint" />
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <h2 className="text-xl font-semibold text-white mb-5">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {ACTIONS.map(({ to, icon: Icon, label, sub, accent, border, iconBg }) => (
              <Link key={to} to={to}>
                <motion.div
                  whileHover={{ y: -4, scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className={`glass-card p-5 h-full cursor-pointer bg-gradient-to-br ${accent} border ${border}`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${iconBg}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <p className="font-semibold text-white text-lg mb-1">{label}</p>
                  <p className="text-sm text-slate-400">{sub}</p>
                  <ArrowRight className="w-4 h-4 text-slate-500 mt-4" />
                </motion.div>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* System Status */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <h2 className="text-xl font-semibold text-white mb-5">System Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: 'Ollama LLM', ok: health?.ollama_reachable, icon: Cpu, detail: stats?.llm_model ?? '—', color: 'cyan' },
              { label: 'BM25 Index', ok: health?.bm25_index_ready, icon: Activity, detail: `${stats?.total_documents ?? 0} docs indexed`, color: 'violet' },
              { label: 'Vector DB', ok: health?.vector_db_count > 0, icon: Server, detail: `ChromaDB · ${health?.vector_db_count ?? 0} vectors`, color: 'pink' },
            ].map(({ label, ok, icon: Icon, detail, color }) => (
              <div key={label} className="glass-card p-5 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0
                  ${ok ? `bg-${color}-500/10 border border-${color}-500/20` : 'bg-pink-500/10 border border-pink-500/20'}`}>
                  <Icon className={`w-5 h-5 ${ok ? `text-${color}-400` : 'text-pink-400'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-white text-sm">{label}</p>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${ok ? 'bg-cyan-500/10 text-cyan-400' : 'bg-pink-500/10 text-pink-400'}`}>
                      {ok ? 'OK' : 'ERR'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-mono mt-1 truncate">{detail}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Pipeline Architecture */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <h2 className="text-xl font-semibold text-white mb-5">Pipeline Architecture</h2>
          <div className="glass-card p-6">
            <div className="flex items-center gap-2 flex-wrap justify-center">
              {[
                { label: 'Query', color: 'bg-slate-700/50 text-slate-300' },
                { label: '→', color: 'text-slate-600 text-xl', arrow: true },
                { label: 'BM25', color: 'bg-violet-500/15 text-violet-400 border border-violet-500/20' },
                { label: '+', color: 'text-slate-600 text-xl', arrow: true },
                { label: 'Dense', color: 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/20' },
                { label: '→', color: 'text-slate-600 text-xl', arrow: true },
                { label: 'RRF', color: 'bg-amber-500/15 text-amber-400 border border-amber-500/20' },
                { label: '→', color: 'text-slate-600 text-xl', arrow: true },
                { label: 'Re-rank', color: 'bg-pink-500/15 text-pink-400 border border-pink-500/20' },
                { label: '→', color: 'text-slate-600 text-xl', arrow: true },
                { label: 'LLM', color: 'bg-mint/10 text-mint border border-mint/20' },
                { label: '→', color: 'text-slate-600 text-xl', arrow: true },
                { label: 'JSON', color: 'bg-slate-700/50 text-slate-300' },
              ].map(({ label, color, arrow }, i) => (
                <span key={i} className={`${arrow ? color : `px-3 py-1.5 rounded-lg text-xs font-mono ${color}`}`}>
                  {label}
                </span>
              ))}
            </div>
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { k: 'Keyword Weight', v: stats?.keyword_weight ? `${stats.keyword_weight * 100}%` : '35%' },
                { k: 'Semantic Weight', v: stats?.semantic_weight ? `${stats.semantic_weight * 100}%` : '65%' },
                { k: 'Fusion Method', v: 'RRF k=60' },
                { k: 'Embed Model', v: stats?.embedding_model?.split(' ')[0] ?? 'nomic-embed' },
              ].map(({ k, v }) => (
                <div key={k} className="glass-subtle p-3 rounded-lg">
                  <p className="text-xs text-slate-500 mb-1">{k}</p>
                  <p className="text-sm font-mono text-cyan-400">{v}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}