import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Play, X, Zap, Brain, Shield, Globe2, RefreshCw, Activity, Layers, GitBranch, Database, FlaskConical } from 'lucide-react'
import ParticleField from '../components/ParticleField'

const PIPELINE = ['Input', 'Detect Lang', 'BM25', 'Dense Embed', 'RRF Fusion', 'Re-rank', 'LLM', 'JSON Out']
const PIPE_COLORS = ['#4a566e','#2ee8d4','#9b6fff','#2ee8d4','#f5a623','#ff4d6a','#d4f43c','#4a566e']

const FEATS = [
  { icon: GitBranch, label: 'BM25 + Dense Retrieval',  sub: 'RRF-fused hybrid search',          color: '#2ee8d4' },
  { icon: Brain,     label: 'Local Ollama LLM',         sub: 'Zero data leaves infra',           color: '#9b6fff' },
  { icon: Zap,       label: 'Neural Re-ranking',         sub: 'Cross-encoder ms-marco-MiniLM',   color: '#d4f43c' },
  { icon: Globe2,    label: 'Multi-language',            sub: 'Auto-detect + translate (55 langs)', color: '#2ee8d4' },
  { icon: RefreshCw, label: 'Dynamic Few-Shot',          sub: 'Self-improves from feedback',      color: '#f5a623' },
  { icon: Database,  label: 'Redis + ChromaDB',          sub: 'Distributed cache layer',          color: '#9b6fff' },
  { icon: Shield,    label: 'API Key Auth',              sub: 'Rate-limited, auditable',          color: '#d4f43c' },
  { icon: Activity,  label: 'Prometheus Metrics',        sub: '/metrics + Grafana ready',         color: '#2ee8d4' },
  { icon: FlaskConical, label: 'Human-in-the-Loop',     sub: 'Feedback store + correction UI',   color: '#f5a623' },
]

const STATS = [
  { v: '<50ms',  l: 'Avg Retrieval' },
  { v: '55+',    l: 'Languages' },
  { v: '100%',   l: 'On-Premise' },
  { v: '50',     l: 'Max Batch' },
]

export default function LandingPage() {
  const [demo, setDemo] = useState(false)

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: '#07080d' }}>
      {/* Grid background */}
      <div className="fixed inset-0 grid-bg opacity-40 pointer-events-none" />

      {/* Particle hero - full viewport */}
      <div className="fixed inset-0 pointer-events-none">
        <ParticleField />
        {/* Vignette */}
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, transparent 30%, #07080d 80%)' }} />
      </div>

      {/* Scanline */}
      <div className="fixed inset-0 pointer-events-none scanline-wrap" />

      {/* ── Nav ─────────────────────────────────────────────────────────────── */}
      <nav className="relative z-50 flex items-center justify-between px-8 py-5 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 flex items-center justify-center" style={{ background: '#d4f43c' }}>
            <svg viewBox="0 0 16 16" fill="none" width="12" height="12">
              <circle cx="4" cy="8" r="2" fill="#07080d" />
              <circle cx="12" cy="4" r="2" fill="#07080d" />
              <circle cx="12" cy="12" r="2" fill="#07080d" />
              <line x1="6" y1="7" x2="10" y2="5" stroke="#07080d" strokeWidth="1" />
              <line x1="6" y1="9" x2="10" y2="11" stroke="#07080d" strokeWidth="1" />
            </svg>
          </div>
          <div>
            <p className="text-[11px] font-mono font-semibold text-snow tracking-widest uppercase leading-none">ResolveAI</p>
            <p className="text-[9px] font-mono text-dim tracking-widest">Hybrid RAG · v2</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/classify" className="btn text-[10px]">Demo</Link>
          <Link to="/dashboard" className="btn btn-acid text-[10px]">
            Launch App <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="relative z-10 pt-24 pb-20 px-8 max-w-5xl mx-auto text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-border mb-8"
            style={{ background: 'rgba(212,244,60,0.04)', borderColor: 'rgba(212,244,60,0.2)' }}>
            <div className="w-1 h-1 rounded-full bg-acid animate-pulse" />
            <span className="text-[9px] font-mono uppercase tracking-widest" style={{ color: '#d4f43c' }}>
              System Online · Ollama · ChromaDB · Redis
            </span>
          </div>

          {/* Display font headline */}
          <h1 className="font-display text-[96px] leading-none tracking-wide text-snow mb-6 select-none">
            RESOLVE<br />
            <span style={{ color: '#d4f43c' }}>AI</span>
          </h1>

          <p className="text-sm font-mono text-ghost max-w-lg mx-auto leading-relaxed mb-10">
            Hybrid RAG complaint classifier. BM25 keyword search fused with dense semantic retrieval via RRF, powered by a local Ollama LLM. Zero data leaves your infrastructure.
          </p>

          <div className="flex items-center justify-center gap-3">
            <button onClick={() => setDemo(true)} className="btn btn-acid px-6 py-2.5 text-[11px]">
              <Play className="w-3.5 h-3.5" /> Try Demo
            </button>
            <Link to="/dashboard" className="btn btn-outline-cyan px-6 py-2.5 text-[11px]">
              Dashboard <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </motion.div>

        {/* Stats row */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          className="flex items-center justify-center gap-12 mt-20">
          {STATS.map(({ v, l }) => (
            <div key={l} className="text-center">
              <p className="text-2xl font-mono font-semibold" style={{ color: '#d4f43c' }}>{v}</p>
              <p className="text-[10px] font-mono text-dim uppercase tracking-widest mt-0.5">{l}</p>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ── Pipeline strip ───────────────────────────────────────────────────── */}
      <motion.section initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
        className="relative z-10 px-8 py-8 border-y border-border" style={{ background: 'rgba(13,15,24,0.7)' }}>
        <div className="max-w-4xl mx-auto">
          <p className="label text-center mb-4">Pipeline architecture</p>
          <div className="flex items-center justify-center gap-1 flex-wrap">
            {PIPELINE.map((step, i) => (
              <React.Fragment key={step}>
                <span className="text-[10px] font-mono px-3 py-1.5 border border-border"
                  style={{ color: PIPE_COLORS[i], borderColor: `${PIPE_COLORS[i]}30`, background: `${PIPE_COLORS[i]}08` }}>
                  {step}
                </span>
                {i < PIPELINE.length - 1 && <span className="text-[10px] font-mono text-muted">→</span>}
              </React.Fragment>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ── Features grid ─────────────────────────────────────────────────────── */}
      <section className="relative z-10 px-8 py-20 max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="mb-12 text-center">
          <p className="label mb-2">Capabilities</p>
          <h2 className="text-3xl font-mono font-semibold text-silver">Production-ready features</h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {FEATS.map(({ icon: Icon, label, sub, color }, i) => (
            <motion.div key={label}
              initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ delay: i * 0.04 }}
              className="panel p-4 hover:border-border group transition-colors"
              style={{ borderLeftWidth: 2, borderLeftColor: color + '40' }}
              onMouseEnter={e => e.currentTarget.style.borderLeftColor = color}
              onMouseLeave={e => e.currentTarget.style.borderLeftColor = color + '40'}>
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 flex items-center justify-center shrink-0 border border-border"
                  style={{ background: `${color}10` }}>
                  <Icon className="w-3.5 h-3.5" style={{ color }} />
                </div>
                <div>
                  <p className="text-[11px] font-mono font-semibold text-silver leading-none">{label}</p>
                  <p className="text-[10px] font-mono text-dim mt-0.5">{sub}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Ticker ───────────────────────────────────────────────────────────── */}
      <div className="relative z-10 border-t border-b border-border py-2.5 overflow-hidden"
        style={{ background: 'rgba(212,244,60,0.03)' }}>
        <div className="ticker-wrap">
          <div className="ticker-inner gap-8">
            {[...Array(2)].map((_, rep) =>
              ['BM25 SEARCH', 'DENSE RETRIEVAL', 'RRF FUSION', 'CROSS-ENCODER RE-RANK',
               'HYDE EXPANSION', 'OLLAMA LLM', 'REDIS CACHE', 'PROMETHEUS METRICS',
               'MULTI-LANGUAGE', 'FEW-SHOT REFRESH'].map((t, i) => (
                <span key={`${rep}-${i}`} className="text-[9px] font-mono uppercase tracking-widest px-6"
                  style={{ color: i % 3 === 0 ? '#d4f43c' : i % 3 === 1 ? '#2ee8d4' : '#4a566e' }}>
                  ▸ {t}
                </span>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── CTA ──────────────────────────────────────────────────────────────── */}
      <section className="relative z-10 px-8 py-24 max-w-3xl mx-auto text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="panel p-10" style={{ borderColor: 'rgba(212,244,60,0.2)' }}>
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at top, rgba(212,244,60,0.05), transparent 60%)' }} />
          <h2 className="text-3xl font-mono font-semibold text-snow mb-3">Ready to classify?</h2>
          <p className="text-xs font-mono text-ghost mb-8">Launch the classifier or explore the dashboard.</p>
          <Link to="/classify" className="btn btn-acid px-8 py-3 text-[11px]">
            Launch Classifier <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-8 py-5 border-t border-border flex items-center justify-between">
        <p className="text-[10px] font-mono text-dim uppercase tracking-widest">ResolveAI · Hybrid RAG · Local LLM</p>
        <p className="text-[10px] font-mono text-muted">100% on-premise · zero telemetry</p>
      </footer>

      {/* Demo modal */}
      <AnimatePresence>
        {demo && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6"
            onClick={() => setDemo(false)}>
            <div className="absolute inset-0" style={{ background: 'rgba(7,8,13,0.85)', backdropFilter: 'blur(8px)' }} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative panel p-8 max-w-md w-full" style={{ borderColor: 'rgba(212,244,60,0.25)' }}
              onClick={e => e.stopPropagation()}>
              <button onClick={() => setDemo(false)} className="absolute top-4 right-4 text-dim hover:text-ghost">
                <X className="w-4 h-4" />
              </button>
              <p className="label mb-4">Quick access</p>
              <h3 className="text-xl font-mono font-semibold text-snow mb-6">Choose a mode</h3>
              <div className="space-y-2">
                <Link to="/classify" onClick={() => setDemo(false)}
                  className="flex items-center justify-between p-4 panel border-border hover:border-acid/30 transition-colors group">
                  <div>
                    <p className="text-[12px] font-mono font-semibold text-silver">Single Classify</p>
                    <p className="text-[10px] font-mono text-dim mt-0.5">Real-time streaming pipeline</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-dim group-hover:text-acid transition-colors" />
                </Link>
                <Link to="/batch" onClick={() => setDemo(false)}
                  className="flex items-center justify-between p-4 panel border-border hover:border-violet/30 transition-colors group">
                  <div>
                    <p className="text-[12px] font-mono font-semibold text-silver">Batch Mode</p>
                    <p className="text-[10px] font-mono text-dim mt-0.5">Up to 50 complaints at once</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-dim group-hover:text-violet transition-colors" />
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}