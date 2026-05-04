import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Play, X, Zap, Brain, Shield, Globe2, RefreshCw, Activity, Layers, GitBranch, Database, FlaskConical } from 'lucide-react'
import ParticleField from '../components/ParticleField'

const PIPELINE = ['Input', 'Detect Lang', 'BM25', 'Dense Embed', 'RRF Fusion', 'Re-rank', 'LLM', 'JSON Out']
const PIPE_COLORS = ['#71717A','#4F46E5','#059669','#4F46E5','#D97706','#E11D48','#FAFAFA','#71717A']

const FEATS = [
  { icon: GitBranch, label: 'BM25 + Dense Retrieval',  sub: 'RRF-fused hybrid search',          color: '#4F46E5' },
  { icon: Brain,     label: 'Local Ollama LLM',         sub: 'Zero data leaves infra',           color: '#059669' },
  { icon: Zap,       label: 'Neural Re-ranking',         sub: 'Cross-encoder ms-marco-MiniLM',   color: '#FAFAFA' },
  { icon: Globe2,    label: 'Multi-language',            sub: 'Auto-detect + translate (55 langs)', color: '#4F46E5' },
  { icon: RefreshCw, label: 'Dynamic Few-Shot',          sub: 'Self-improves from feedback',      color: '#CA8A04' },
  { icon: Database,  label: 'Redis + ChromaDB',          sub: 'Distributed cache layer',          color: '#059669' },
  { icon: Shield,    label: 'API Key Auth',              sub: 'Rate-limited, auditable',          color: '#FAFAFA' },
  { icon: Activity,  label: 'Prometheus Metrics',        sub: '/metrics + Grafana ready',         color: '#4F46E5' },
  { icon: FlaskConical, label: 'Human-in-the-Loop',     sub: 'Feedback store + correction UI',   color: '#CA8A04' },
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
    <div className="min-h-screen relative overflow-hidden" style={{ background: '#0A0A0B' }}>
      {/* Grid background */}
      <div className="fixed inset-0 grid-bg opacity-30 pointer-events-none" />

      {/* Particle hero - full viewport */}
      <div className="fixed inset-0 pointer-events-none">
        <ParticleField />
        {/* Vignette */}
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, transparent 20%, #0A0A0B 85%)' }} />
      </div>

      {/* Scanline */}
      <div className="fixed inset-0 pointer-events-none scanline-wrap" />

      {/* ── Nav ─────────────────────────────────────────────────────────────── */}
      <nav className="relative z-50 flex items-center justify-between px-8 py-5 border-b" style={{ borderColor: '#1E1E20' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 flex items-center justify-center rounded" style={{ background: '#FAFAFA' }}>
            <svg viewBox="0 0 16 16" fill="none" width="12" height="12">
              <circle cx="4" cy="8" r="2" fill="#0A0A0B" />
              <circle cx="12" cy="4" r="2" fill="#0A0A0B" />
              <circle cx="12" cy="12" r="2" fill="#0A0A0B" />
              <line x1="6" y1="7" x2="10" y2="5" stroke="#0A0A0B" strokeWidth="1" />
              <line x1="6" y1="9" x2="10" y2="11" stroke="#0A0A0B" strokeWidth="1" />
            </svg>
          </div>
          <div>
            <p className="text-[13px] font-semibold text-quartz tracking-tight leading-none">ResolveAI</p>
            <p className="text-[10px] text-flint tracking-wide mt-1">Hybrid RAG · v2</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/classify" className="btn text-sm font-medium">Demo</Link>
          <Link to="/dashboard" className="btn btn-acid text-sm">
            Launch App <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="relative z-10 pt-32 pb-24 px-8 max-w-5xl mx-auto text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, type: 'spring', stiffness: 300, damping: 30 }}>
          <div className="inline-flex items-center gap-2 px-3 py-1 border rounded-full mb-10"
            style={{ background: 'rgba(250,250,250,0.03)', borderColor: 'rgba(250,250,250,0.1)' }}>
            <div className="w-1.5 h-1.5 rounded-full bg-[#059669] animate-pulse" />
            <span className="text-[11px] font-medium tracking-wide text-slate">
              System Online · Ollama · ChromaDB · Redis
            </span>
          </div>

          <h1 className="text-[80px] leading-none tracking-tighter text-quartz mb-8 font-semibold select-none">
            ResolveAI
          </h1>

          <p className="text-base text-slate max-w-lg mx-auto leading-relaxed mb-10">
            Hybrid RAG complaint classifier. BM25 keyword search fused with dense semantic retrieval via RRF, powered by a local Ollama LLM. Zero data leaves your infrastructure.
          </p>

          <div className="flex items-center justify-center gap-3">
            <button onClick={() => setDemo(true)} className="btn btn-acid px-6 py-2.5 text-sm">
              <Play className="w-4 h-4" /> Try Demo
            </button>
            <Link to="/dashboard" className="btn btn-outline-cyan px-6 py-2.5 text-sm" style={{ borderColor: 'rgba(79,70,229,0.3)', color: '#A5B4FC', background: 'rgba(79,70,229,0.05)' }}>
              Dashboard <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>

        {/* Stats row */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4, duration: 1 }}
          className="flex items-center justify-center gap-16 mt-24">
          {STATS.map(({ v, l }) => (
            <div key={l} className="text-center">
              <p className="text-3xl font-mono font-medium tracking-tight text-quartz">{v}</p>
              <p className="text-[11px] text-flint tracking-wider uppercase mt-1">{l}</p>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ── Pipeline strip ───────────────────────────────────────────────────── */}
      <motion.section initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
        className="relative z-10 px-8 py-10 border-y" style={{ background: 'rgba(18,18,20,0.4)', borderColor: '#1E1E20' }}>
        <div className="max-w-4xl mx-auto">
          <p className="label text-center mb-6">Pipeline architecture</p>
          <div className="flex items-center justify-center gap-1.5 flex-wrap">
            {PIPELINE.map((step, i) => (
              <React.Fragment key={step}>
                <span className="text-[11px] font-mono px-3 py-1.5 rounded border"
                  style={{ color: PIPE_COLORS[i], borderColor: `${PIPE_COLORS[i]}30`, background: `${PIPE_COLORS[i]}10` }}>
                  {step}
                </span>
                {i < PIPELINE.length - 1 && <span className="text-[10px] font-mono text-[#2E2E32]">→</span>}
              </React.Fragment>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ── Features grid ─────────────────────────────────────────────────────── */}
      <section className="relative z-10 px-8 py-24 max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="mb-14 text-center">
          <p className="label mb-2">Capabilities</p>
          <h2 className="text-3xl font-semibold text-quartz tracking-tight">Production-ready features</h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {FEATS.map(({ icon: Icon, label, sub, color }, i) => (
            <motion.div key={label}
              initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ delay: i * 0.05, type: 'spring', stiffness: 400, damping: 30 }}
              className="panel p-5 hover:border-[#3F3F46] group transition-colors"
              style={{ borderLeftWidth: 2, borderLeftColor: color + '40' }}
              onMouseEnter={e => e.currentTarget.style.borderLeftColor = color}
              onMouseLeave={e => e.currentTarget.style.borderLeftColor = color + '40'}>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded flex items-center justify-center shrink-0 border"
                  style={{ background: `${color}10`, borderColor: `${color}20` }}>
                  <Icon className="w-4 h-4" style={{ color }} />
                </div>
                <div>
                  <p className="text-[13px] font-medium text-quartz leading-none">{label}</p>
                  <p className="text-[11px] text-slate mt-1.5 leading-relaxed">{sub}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Ticker ───────────────────────────────────────────────────────────── */}
      <div className="relative z-10 border-t border-b py-3 overflow-hidden"
        style={{ background: 'rgba(250,250,250,0.02)', borderColor: '#1E1E20' }}>
        <div className="ticker-wrap">
          <div className="ticker-inner gap-10">
            {[...Array(2)].map((_, rep) =>
              ['BM25 SEARCH', 'DENSE RETRIEVAL', 'RRF FUSION', 'CROSS-ENCODER RE-RANK',
               'HYDE EXPANSION', 'OLLAMA LLM', 'REDIS CACHE', 'PROMETHEUS METRICS',
               'MULTI-LANGUAGE', 'FEW-SHOT REFRESH'].map((t, i) => (
                <span key={`${rep}-${i}`} className="text-[10px] font-mono uppercase tracking-wider px-6"
                  style={{ color: i % 3 === 0 ? '#FAFAFA' : i % 3 === 1 ? '#A1A1AA' : '#71717A' }}>
                  ▸ {t}
                </span>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── CTA ──────────────────────────────────────────────────────────────── */}
      <section className="relative z-10 px-8 py-32 max-w-3xl mx-auto text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="panel p-12" style={{ borderColor: 'rgba(250,250,250,0.1)' }}>
          <div className="absolute inset-0 pointer-events-none rounded"
            style={{ background: 'radial-gradient(ellipse at top, rgba(250,250,250,0.03), transparent 60%)' }} />
          <h2 className="text-3xl font-semibold text-quartz tracking-tight mb-3">Ready to classify?</h2>
          <p className="text-sm text-slate mb-8">Launch the classifier or explore the dashboard.</p>
          <Link to="/classify" className="btn btn-acid px-8 py-3 text-sm">
            Launch Classifier <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-8 py-6 border-t flex items-center justify-between" style={{ borderColor: '#1E1E20' }}>
        <p className="text-[11px] font-medium text-flint tracking-wide uppercase">ResolveAI · Hybrid RAG · Local LLM</p>
        <p className="text-[11px] font-medium text-flint tracking-wide uppercase">100% on-premise · zero telemetry</p>
      </footer>

      {/* Demo modal */}
      <AnimatePresence>
        {demo && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6"
            onClick={() => setDemo(false)}>
            <div className="absolute inset-0" style={{ background: 'rgba(10,10,11,0.85)', backdropFilter: 'blur(8px)' }} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="relative panel p-8 max-w-md w-full shadow-2xl" style={{ borderColor: 'rgba(250,250,250,0.1)' }}
              onClick={e => e.stopPropagation()}>
              <button onClick={() => setDemo(false)} className="absolute top-4 right-4 text-flint hover:text-quartz transition-colors">
                <X className="w-4 h-4" />
              </button>
              <p className="label mb-4">Quick access</p>
              <h3 className="text-xl font-semibold text-quartz mb-6 tracking-tight">Choose a mode</h3>
              <div className="space-y-3">
                <Link to="/classify" onClick={() => setDemo(false)}
                  className="flex items-center justify-between p-4 panel hover:border-[#FAFAFA] transition-colors group">
                  <div>
                    <p className="text-[13px] font-medium text-quartz">Single Classify</p>
                    <p className="text-[11px] text-slate mt-1">Real-time streaming pipeline</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-flint group-hover:text-brand transition-colors" />
                </Link>
                <Link to="/batch" onClick={() => setDemo(false)}
                  className="flex items-center justify-between p-4 panel hover:border-[#4F46E5] transition-colors group">
                  <div>
                    <p className="text-[13px] font-medium text-quartz">Batch Mode</p>
                    <p className="text-[11px] text-slate mt-1">Up to 50 complaints at once</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-flint group-hover:text-[#818CF8] transition-colors" />
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}