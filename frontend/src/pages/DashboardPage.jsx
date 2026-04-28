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
  { to: '/classify',  icon: Zap,       label: 'Classify',          sub: 'Analyse a single complaint',    accent: 'from-mint/20 to-cyan-400/10',  border: 'border-mint/15' },
  { to: '/batch',     icon: Layers,    label: 'Batch Mode',        sub: 'Process up to 50 at once',      accent: 'from-violet-400/15 to-violet-600/5', border: 'border-violet-400/15' },
  { to: '/knowledge', icon: BookOpen,  label: 'Knowledge Base',    sub: 'Manage complaint corpus',       accent: 'from-amber-400/15 to-orange-400/5',  border: 'border-amber-400/15' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics',         sub: 'Accuracy & trends',             accent: 'from-coral/15 to-pink-500/5',   border: 'border-coral/15'  },
]

export default function DashboardPage() {
  const [stats, setStats]   = useState(null)
  const [health, setHealth] = useState(null)

  useEffect(() => {
    getStats().then(setStats).catch(() => {})
    getHealth().then(setHealth).catch(() => {})
  }, [])

  return (
    <div className="min-h-full">
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div className="relative pt-12 pb-10 px-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md mb-6 bg-teal-500/10 border border-teal-500/20">
            <div className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
            <span className="text-[10px] font-semibold text-teal-400 uppercase tracking-widest">Hybrid RAG · v2.0</span>
          </div>
          <h1 className="font-bold text-4xl text-slate-50 leading-tight mb-3">
            Resolve<span className="text-gradient-primary">AI</span>
          </h1>
          <p className="text-slate-400 text-sm max-w-xl leading-relaxed">
            BM25 + dense retrieval fused via RRF, powered by a local Ollama LLM.
            <br />
            <span className="text-slate-500">Zero data leaves your infrastructure.</span>
          </p>
        </motion.div>
      </div>

      <div className="px-8 py-8 space-y-8">

        {/* ── Live stats ─────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <StatCard label="Documents"         value={stats?.total_documents ?? '—'}  icon={Database}   color="text-mint" />
          <StatCard label="Classifications"   value={stats?.total_classifications ?? '—'} icon={Activity} color="text-violet-400" />
          <StatCard label="Avg Latency"       value={stats ? `${stats.avg_processing_ms}ms` : '—'} icon={Zap} color="text-amber-400" />
          <StatCard label="Cache Hit Rate"    value={stats ? `${Math.round((stats.cache_hits/(stats.cache_hits+stats.cache_misses||1))*100)}%` : '—'} icon={TrendingUp} color="text-cyan-400" />
        </motion.div>

        {/* ── Quick actions ──────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <h2 className="font-display font-semibold text-slate-300 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {ACTIONS.map(({ to, icon: Icon, label, sub, accent, border }) => (
              <Link key={to} to={to}>
                <motion.div
                  whileHover={{ y: -3, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`glass glass-hover rounded-2xl p-5 h-full cursor-pointer bg-gradient-to-br ${accent} border ${border}`}
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <Icon className="w-5 h-5 text-slate-300" />
                  </div>
                  <p className="font-display font-semibold text-slate-200 mb-1">{label}</p>
                  <p className="text-xs text-slate-500">{sub}</p>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-600 mt-3" />
                </motion.div>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* ── System status ──────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <h2 className="font-display font-semibold text-slate-300 mb-4">System Status</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {[
              { label: 'Ollama LLM',     ok: health?.ollama_reachable,   icon: Cpu,      detail: stats?.llm_model ?? '—' },
              { label: 'BM25 Index',     ok: health?.bm25_index_ready,   icon: Activity, detail: `${stats?.total_documents ?? 0} docs indexed` },
              { label: 'Vector DB',      ok: health?.vector_db_count > 0, icon: Server,   detail: `ChromaDB · ${health?.vector_db_count ?? 0} embeddings` },
            ].map(({ label, ok, icon: Icon, detail }) => (
              <div key={label} className="glass scanline-container rounded-2xl p-4 flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0
                  ${ok ? 'bg-mint/10 border border-mint/20' : 'bg-coral/10 border border-coral/20'}`}>
                  <Icon className={`w-5 h-5 ${ok ? 'text-mint' : 'text-coral'}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-display font-semibold text-slate-200 text-sm">{label}</p>
                    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${ok ? 'bg-mint/10 text-mint' : 'bg-coral/10 text-coral'}`}>
                      {ok ? 'OK' : 'ERR'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">{detail}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Architecture mini-map ──────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
          <h2 className="font-display font-semibold text-slate-300 mb-4">Pipeline Architecture</h2>
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-2 flex-wrap">
              {[
                { label: 'Query',          color: 'bg-slate-700 text-slate-300' },
                { label: '→',              color: 'text-slate-600', arrow: true },
                { label: 'BM25 Search',    color: 'bg-violet-500/15 text-violet-400 border border-violet-500/20' },
                { label: '+',              color: 'text-slate-600', arrow: true },
                { label: 'Dense Search',   color: 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/20' },
                { label: '→',              color: 'text-slate-600', arrow: true },
                { label: 'RRF Fusion',     color: 'bg-amber-500/15 text-amber-400 border border-amber-500/20' },
                { label: '→',             color: 'text-slate-600', arrow: true },
                { label: 'Re-rank',        color: 'bg-orange-500/15 text-orange-400 border border-orange-500/20' },
                { label: '→',             color: 'text-slate-600', arrow: true },
                { label: 'LLM Generate',   color: 'bg-mint/10 text-mint border border-mint/20' },
                { label: '→',             color: 'text-slate-600', arrow: true },
                { label: 'JSON Output',    color: 'bg-slate-700 text-slate-300' },
              ].map(({ label, color, arrow }, i) => (
                <span key={i} className={`${arrow ? 'text-lg font-bold' : `px-3 py-1.5 rounded-lg text-xs font-mono`} ${color}`}>
                  {label}
                </span>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
              {[
                { k: 'Keyword Weight', v: stats?.keyword_weight ? `${stats.keyword_weight * 100}%` : '35%' },
                { k: 'Semantic Weight', v: stats?.semantic_weight ? `${stats.semantic_weight * 100}%` : '65%' },
                { k: 'Fusion Method',  v: 'RRF k=60' },
                { k: 'Embed Model',    v: stats?.embedding_model?.split(' ')[0] ?? 'nomic-embed-text' },
              ].map(({ k, v }) => (
                <div key={k} className="rounded-lg px-3 py-2" style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <p className="text-slate-600 mb-0.5">{k}</p>
                  <p className="text-mint">{v}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}