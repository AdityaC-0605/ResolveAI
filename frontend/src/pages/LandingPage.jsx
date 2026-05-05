import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Play, X, Zap, Brain, Shield, Globe2, RefreshCw, Activity, Layers, GitBranch, Database, FlaskConical, Braces, CircleDot } from 'lucide-react'
import ParticleField from '../components/ParticleField'

const SPRING = { type: 'spring', stiffness: 260, damping: 30 }

const FEATS = [
  { icon: GitBranch, label: 'Hybrid retrieval', sub: 'BM25 and dense search are fused before generation.' },
  { icon: Brain, label: 'Local reasoning', sub: 'Ollama inference keeps sensitive complaint data on premise.' },
  { icon: Zap, label: 'Re-ranked context', sub: 'Cross-encoder scoring sharpens evidence before classification.' },
  { icon: Globe2, label: 'Language aware', sub: 'Incoming complaints are detected, translated, and traced.' },
  { icon: RefreshCw, label: 'Feedback loop', sub: 'Corrections refresh few-shot examples without retraining.' },
  { icon: Database, label: 'Operational memory', sub: 'Redis and ChromaDB separate cache speed from semantic recall.' },
  { icon: Shield, label: 'Auditable access', sub: 'API-key boundaries, rate limits, and metrics are built in.' },
  { icon: Activity, label: 'Observable pipeline', sub: 'Prometheus surfaces latency, cache efficiency, and outcomes.' },
  { icon: FlaskConical, label: 'Human override', sub: 'Escalations are treated as first-class triage decisions.' },
]

const STATS = [
  { v: '<50ms', l: 'Retrieval' },
  { v: '55+', l: 'Languages' },
  { v: '100%', l: 'On premise' },
  { v: '50', l: 'Batch cap' },
]

function BrandMark() {
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-md" style={{ background: 'var(--accent)' }}>
      <svg viewBox="0 0 18 18" fill="none" width="16" height="16" aria-hidden="true">
        <path d="M4 9h4.8M8.8 9l3.4-4.2M8.8 9l3.4 4.2" stroke="#172112" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="4" cy="9" r="2" fill="#172112" />
        <circle cx="13" cy="4" r="2" fill="#172112" />
        <circle cx="13" cy="14" r="2" fill="#172112" />
      </svg>
    </div>
  )
}

function PipelineDiagram() {
  const steps = [
    { title: 'Input', icon: Braces, detail: 'Complaint text' },
    { title: 'Processing', icon: CircleDot, detail: 'Retrieve · fuse · reason' },
    { title: 'Output', icon: Layers, detail: 'Structured report' },
  ]

  return (
    <div className="instrument relative overflow-hidden p-6">
      <div className="absolute inset-x-0 top-1/2 h-px" style={{ background: 'linear-gradient(90deg, transparent, var(--edge-strong), transparent)' }} />
      <div className="relative grid gap-4 md:grid-cols-3">
        {steps.map(({ title, icon: Icon, detail }, i) => (
          <motion.div key={title} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ ...SPRING, delay: i * 0.08 }} className="panel-quiet p-4">
            <div className="mb-4 flex items-center justify-between">
              <Icon className="h-5 w-5" style={{ color: i === 1 ? 'var(--accent)' : 'var(--text-muted)' }} />
              <span className="type-micro numeric text-muted">0{i + 1}</span>
            </div>
            <h3 className="type-body font-semibold text-ink">{title}</h3>
            <p className="type-caption mt-1 text-flint">{detail}</p>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default function LandingPage() {
  const [demo, setDemo] = useState(false)

  return (
    <div className="app-shell relative min-h-screen overflow-hidden">
      <div className="field-map fixed inset-0 pointer-events-none" />
      <div className="fixed inset-0 pointer-events-none">
        <ParticleField />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 18%, transparent 0%, rgba(18,16,13,0.44) 42%, var(--bg-root) 88%)' }} />
      </div>

      <nav className="relative z-20 flex items-center justify-between border-b px-8 py-4" style={{ borderColor: 'var(--edge-soft)', background: 'rgba(18, 16, 13, 0.72)' }}>
        <div className="flex items-center gap-3">
          <BrandMark />
          <div>
            <p className="type-body font-semibold text-ink">ResolveAI</p>
            <p className="type-micro text-flint">Hybrid RAG · local LLM</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/classify" className="btn">Demo</Link>
          <Link to="/dashboard" className="btn btn-acid">
            Launch <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </nav>

      <section className="relative z-10 mx-auto grid min-h-[calc(100vh-64px)] max-w-6xl items-center gap-8 px-8 py-16 lg:grid-cols-[1.08fr_0.92fr]">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={SPRING}>
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border px-3 py-2" style={{ background: 'rgba(143, 212, 122, 0.08)', borderColor: 'rgba(143, 212, 122, 0.18)' }}>
            <span className="h-2 w-2 rounded-full" style={{ background: 'var(--accent)' }} />
            <span className="type-micro text-slate">Ollama · ChromaDB · Redis online</span>
          </div>
          <h1 className="type-display max-w-3xl">Turn complaint noise into accountable triage.</h1>
          <p className="type-body mt-6 max-w-xl text-slate">
            ResolveAI classifies customer issues with hybrid retrieval, local reasoning, and structured escalation so support teams can act before queues become fires.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <motion.button whileTap={{ scale: 0.97 }} transition={SPRING} onClick={() => setDemo(true)} className="btn btn-acid px-6">
              <Play className="h-4 w-4" /> Try demo
            </motion.button>
            <Link to="/dashboard" className="btn px-6">
              View cockpit <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ ...SPRING, delay: 0.1 }} className="instrument p-6">
          <div className="mb-6 flex items-center justify-between">
            <p className="label">Live triage frame</p>
            <span className="tag" style={{ color: 'var(--accent)' }}>local</span>
          </div>
          <div className="space-y-4">
            <div className="panel-quiet p-4">
              <p className="type-caption text-flint">Incoming complaint</p>
              <p className="type-body mt-2 text-ink">“Charged twice and my account is locked. I need someone to fix this today.”</p>
            </div>
            <PipelineDiagram />
            <div className="grid grid-cols-2 gap-4">
              <div className="panel-quiet p-4">
                <p className="label">Urgency</p>
                <p className="type-title mt-2" style={{ color: 'var(--warning)' }}>High</p>
              </div>
              <div className="panel-quiet p-4">
                <p className="label">Confidence</p>
                <p className="type-title mt-2" style={{ color: 'var(--accent)' }}>92%</p>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      <section className="relative z-10 border-y px-8 py-12" style={{ borderColor: 'var(--edge-soft)', background: 'rgba(29, 26, 20, 0.62)' }}>
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 md:grid-cols-4">
          {STATS.map(({ v, l }, i) => (
            <motion.div key={l} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ ...SPRING, delay: i * 0.04 }}>
              <p className="type-title numeric">{v}</p>
              <p className="label mt-1">{l}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-6xl px-8 py-16">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="label mb-3">Capabilities</p>
            <h2 className="type-title">Designed around the work, not around cards.</h2>
            <p className="type-body mt-4 text-slate">Each subsystem has a job: retrieve evidence, reason locally, expose uncertainty, and keep the human escalation path visible.</p>
          </div>
          <div className="space-y-4">
            {FEATS.map(({ icon: Icon, label, sub }, i) => (
              <motion.div key={label} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ ...SPRING, delay: i * 0.03 }} className="grid grid-cols-[32px_1fr] gap-4 border-b pb-4 last:border-b-0" style={{ borderColor: 'var(--edge-soft)' }}>
                <div className="flex h-8 w-8 items-center justify-center rounded-md" style={{ background: i % 3 === 0 ? 'var(--accent-dim)' : 'var(--surface-2)' }}>
                  <Icon className="h-4 w-4" style={{ color: i % 3 === 0 ? 'var(--accent)' : 'var(--text-muted)' }} />
                </div>
                <div>
                  <h3 className="type-body font-semibold text-ink">{label}</h3>
                  <p className="type-caption mt-1 text-flint">{sub}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-4xl px-8 pb-16">
        <div className="instrument p-8 text-center">
          <h2 className="type-title">Classify a case in the live pipeline.</h2>
          <p className="type-body mx-auto mt-3 max-w-lg text-slate">Run a single complaint, inspect retrieved evidence, and review the structured report that drives assignment.</p>
          <Link to="/classify" className="btn btn-acid mt-6 px-6">
            Open classifier <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <footer className="relative z-10 flex items-center justify-between border-t px-8 py-6" style={{ borderColor: 'var(--edge-soft)' }}>
        <p className="type-micro text-flint">ResolveAI · local complaint intelligence</p>
        <p className="type-micro text-flint">No telemetry · auditable retrieval</p>
      </footer>

      <AnimatePresence>
        {demo && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-6" onClick={() => setDemo(false)}>
            <div className="absolute inset-0" style={{ background: 'rgba(18, 16, 13, 0.86)' }} />
            <motion.div initial={{ scale: 0.96, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 12 }} transition={SPRING} className="instrument relative w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
              <button onClick={() => setDemo(false)} className="btn absolute right-4 top-4 h-8 w-8 p-0" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
              <p className="label mb-3">Quick access</p>
              <h3 className="type-title mb-6">Choose a run mode</h3>
              <div className="space-y-3">
                <Link to="/classify" onClick={() => setDemo(false)} className="panel-quiet flex items-center justify-between p-4">
                  <div>
                    <p className="type-body font-semibold text-ink">Single classify</p>
                    <p className="type-caption text-flint">Real-time streaming pipeline</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-flint" />
                </Link>
                <Link to="/batch" onClick={() => setDemo(false)} className="panel-quiet flex items-center justify-between p-4">
                  <div>
                    <p className="type-body font-semibold text-ink">Batch mode</p>
                    <p className="type-caption text-flint">Up to 50 complaints at once</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-flint" />
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
