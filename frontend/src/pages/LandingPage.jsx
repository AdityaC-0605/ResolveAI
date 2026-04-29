import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import * as THREE from 'three'
import { 
  Zap, Layers, Shield, Brain, Database, Cpu, 
  ArrowRight, Play, ChevronDown, CheckCircle2, Clock,
  MessageSquare, GitBranch, FlaskConical, FileText, Rocket, Sparkles, Activity
} from 'lucide-react'

function ParticleBackground({ className = '' }) {
  const mountRef = useRef(null)

  useEffect(() => {
    const el = mountRef.current
    if (!el) return

    const W = el.clientWidth, H = el.clientHeight
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(75, W / H, 0.1, 1000)
    camera.position.z = 50

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(W, H)
    renderer.setClearColor(0x000000, 0)
    el.appendChild(renderer.domElement)

    const PARTICLE_COUNT = 2000
    const positions = new Float32Array(PARTICLE_COUNT * 3)
    const colors = new Float32Array(PARTICLE_COUNT * 3)
    const sizes = new Float32Array(PARTICLE_COUNT)

    const colorPalette = [
      new THREE.Color(0x06b6d4),
      new THREE.Color(0x8b5cf6),
      new THREE.Color(0xec4899),
      new THREE.Color(0x22d3ee),
      new THREE.Color(0x14b8a6),
    ]

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 200
      positions[i * 3 + 1] = (Math.random() - 0.5) * 200
      positions[i * 3 + 2] = (Math.random() - 0.5) * 200

      const color = colorPalette[Math.floor(Math.random() * colorPalette.length)]
      colors[i * 3] = color.r
      colors[i * 3 + 1] = color.g
      colors[i * 3 + 2] = color.b

      sizes[i] = Math.random() * 2 + 0.5
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

    const material = new THREE.PointsMaterial({
      size: 0.15,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true,
    })

    const particles = new THREE.Points(geometry, material)
    scene.add(particles)

    const mouse = { x: 0, y: 0 }
    const onMouseMove = (e) => {
      mouse.x = (e.clientX / window.innerWidth - 0.5) * 20
      mouse.y = (e.clientY / window.innerHeight - 0.5) * 20
    }
    window.addEventListener('mousemove', onMouseMove)

    const onResize = () => {
      const w = el.clientWidth, h = el.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', onResize)

    let raf
    const clock = new THREE.Clock()

    const animate = () => {
      raf = requestAnimationFrame(animate)
      const t = clock.getElapsedTime()

      particles.rotation.y = t * 0.02
      particles.rotation.x = t * 0.01

      camera.position.x += (mouse.x - camera.position.x) * 0.02
      camera.position.y += (-mouse.y - camera.position.y) * 0.02
      camera.lookAt(scene.position)

      renderer.render(scene, camera)
    }

    animate()

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement)
    }
  }, [])

  return <div ref={mountRef} className={`absolute inset-0 ${className}`} />
}

function FloatingCard({ children, delay = 0, className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ 
        y: [0, -10, 0],
        opacity: 1
      }}
      transition={{ 
        duration: 4,
        repeat: Infinity,
        ease: 'easeInOut',
        delay,
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

const FEATURES = [
  {
    icon: GitBranch,
    title: 'Hybrid Retrieval',
    desc: 'BM25 keyword search + dense semantic embeddings fused with RRF for superior recall',
    gradient: 'from-cyan-500 to-blue-500',
  },
  {
    icon: Brain,
    title: 'Local LLM',
    desc: 'Ollama-powered inference. Your data never leaves your infrastructure',
    gradient: 'from-violet-500 to-purple-500',
  },
  {
    icon: Activity,
    title: 'Real-time Streaming',
    desc: 'Watch the pipeline work live with granular stage-by-stage updates',
    gradient: 'from-amber-500 to-orange-500',
  },
  {
    icon: Shield,
    title: 'Zero External APIs',
    desc: '100% on-premise. Complete data sovereignty and compliance',
    gradient: 'from-mint-500 to-teal-500',
  },
  {
    icon: Database,
    title: 'Dual Index',
    desc: 'ChromaDB vectors + Elasticsearch BM25. Best of both worlds',
    gradient: 'from-pink-500 to-rose-500',
  },
  {
    icon: FlaskConical,
    title: 'Feedback Loop',
    desc: 'Correct misclassifications to continuously improve accuracy',
    gradient: 'from-indigo-500 to-blue-500',
  },
]

const STATS = [
  { value: '<50ms', label: 'Avg Latency' },
  { value: '99.9%', label: 'Uptime' },
  { value: '0', label: 'Data Leaks' },
  { value: '50+', label: 'Batch Size' },
]

const BENEFITS = [
  { icon: Clock, title: 'Instant Setup', desc: 'Run locally in minutes, not days' },
  { icon: Rocket, title: 'Production Ready', desc: 'Scale to thousands of complaints' },
  { icon: FileText, title: 'Structured Output', desc: 'JSON with category, urgency, team' },
  { icon: MessageSquare, title: 'Explainable', desc: 'View reasoning chain for every classification' },
]

export default function LandingPage() {
  const { scrollYProgress } = useScroll()
  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -80])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0])
  const [showDemo, setShowDemo] = useState(false)

  return (
    <div className="min-h-screen bg-[#030712] relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <ParticleBackground />
        <div className="absolute inset-0 bg-gradient-to-b from-[#030712] via-transparent to-[#030712]" />
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-transparent to-violet-500/5" />
      </div>

      {/* Floating decorative elements */}
      <FloatingCard delay={0} className="absolute top-32 left-[10%] hidden lg:block">
        <div className="w-20 h-20 rounded-2xl glass-card flex items-center justify-center">
          <Database className="w-8 h-8 text-cyan-400" />
        </div>
      </FloatingCard>
      <FloatingCard delay={1} className="absolute top-48 right-[15%] hidden lg:block">
        <div className="w-16 h-16 rounded-2xl glass-card flex items-center justify-center">
          <Brain className="w-7 h-7 text-violet-400" />
        </div>
      </FloatingCard>
      <FloatingCard delay={2} className="absolute bottom-32 left-[20%] hidden lg:block">
        <div className="w-14 h-14 rounded-2xl glass-card flex items-center justify-center">
          <Shield className="w-6 h-6 text-mint" />
        </div>
      </FloatingCard>

      {/* Navigation */}
      <motion.nav 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="relative z-50 flex items-center justify-between px-6 lg:px-12 py-5"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 via-violet-500 to-pink-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl text-white tracking-tight">ResolveAI</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/classify" className="hidden sm:flex btn-ghost">Demo</Link>
          <Link to="/dashboard" className="btn-primary text-sm">
            Launch App <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <motion.div style={{ y: heroY, opacity: heroOpacity }} className="relative z-10 px-6 lg:px-12 pt-12 pb-24 lg:py-20">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="inline-flex items-center gap-3 px-4 py-2 rounded-full glass-card mb-8"
          >
            <div className="relative">
              <div className="w-2 h-2 rounded-full bg-cyan-400" />
              <div className="absolute inset-0 w-2 h-2 rounded-full bg-cyan-400 animate-ping opacity-75" />
            </div>
            <span className="text-xs font-semibold text-cyan-400 tracking-wide">NOW WITH OLLAMA INTEGRATION</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-[1.1]"
          >
            Classify complaints
            <br />
            <span className="text-gradient">intelligently</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-lg lg:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Hybrid retrieval meets local LLMs. Build production-grade complaint classification
            <span className="block mt-2 text-slate-500">with zero data leaving your infrastructure.</span>
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button 
              onClick={() => setShowDemo(true)}
              className="btn-primary text-base px-8 py-3.5 flex items-center gap-2"
            >
              <Play className="w-5 h-5" /> Try Demo
            </button>
            <Link to="/dashboard" className="btn-secondary text-base px-8 py-3.5">
              View Dashboard <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-16 flex flex-wrap justify-center gap-8 lg:gap-16"
          >
            {STATS.map((stat, i) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl lg:text-4xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-sm text-slate-500">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </motion.div>

      {/* Demo Modal */}
      <AnimatePresence>
        {showDemo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            onClick={() => setShowDemo(false)}
          >
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative glass-card p-8 max-w-2xl w-full"
              onClick={e => e.stopPropagation()}
            >
              <button 
                onClick={() => setShowDemo(false)}
                className="absolute top-4 right-4 text-slate-500 hover:text-white"
              >
                ✕
              </button>
              <h3 className="text-2xl font-bold text-white mb-4">Try the Classifier</h3>
              <p className="text-slate-400 mb-6">Experience the power of hybrid retrieval + local LLM classification.</p>
              <Link 
                to="/classify" 
                className="btn-primary w-full justify-center py-4 text-lg"
                onClick={() => setShowDemo(false)}
              >
                Launch Classifier <ArrowRight className="w-5 h-5" />
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pipeline Visual */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="relative z-10 px-6 lg:px-12 py-12"
      >
        <div className="max-w-4xl mx-auto">
          <div className="glass-card p-6 lg:p-8">
            <div className="flex items-center gap-2 flex-wrap justify-center">
              {[
                { label: 'Input', color: 'bg-slate-700/80 text-slate-200' },
                { label: '→', color: 'text-slate-600 text-xl', arrow: true },
                { label: 'BM25', color: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' },
                { label: '+', color: 'text-slate-600 text-xl', arrow: true },
                { label: 'Dense', color: 'bg-violet-500/20 text-violet-400 border border-violet-500/30' },
                { label: '→', color: 'text-slate-600 text-xl', arrow: true },
                { label: 'RRF', color: 'bg-amber-500/20 text-amber-400 border border-amber-500/30' },
                { label: '→', color: 'text-slate-600 text-xl', arrow: true },
                { label: 'LLM', color: 'bg-mint/20 text-mint border border-mint/30' },
                { label: '→', color: 'text-slate-600 text-xl', arrow: true },
                { label: 'JSON', color: 'bg-slate-700/80 text-slate-200' },
              ].map((item, i) => (
                <span key={i} className={item.arrow ? item.color : `px-3 py-1.5 rounded-lg text-xs font-mono ${item.color}`}>
                  {item.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Benefits */}
      <div className="relative z-10 px-6 lg:px-12 py-16">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              Why <span className="text-gradient-cyan">ResolveAI</span>?
            </h2>
            <p className="text-slate-400">Built for teams who care about data privacy</p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {BENEFITS.map((benefit, i) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-subtle p-5 rounded-xl hover:bg-white/[0.04] transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-violet-500/20 flex items-center justify-center mb-3">
                  <benefit.icon className="w-5 h-5 text-cyan-400" />
                </div>
                <h3 className="font-semibold text-white mb-1">{benefit.title}</h3>
                <p className="text-sm text-slate-500">{benefit.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Features */}
      <div id="features" className="relative z-10 px-6 lg:px-12 py-20">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              Production-Ready <span className="text-gradient">Features</span>
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Everything you need to build enterprise-grade complaint classification
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -5 }}
                className="glass-card p-6 group cursor-pointer"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="relative z-10 px-6 lg:px-12 py-20"
      >
        <div className="max-w-3xl mx-auto text-center">
          <div className="glass-card p-10 lg:p-14 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-violet-500/10 to-pink-500/10" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-cyan-500/20 blur-[100px]" />
            <div className="relative">
              <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
                Ready to get started?
              </h2>
              <p className="text-slate-400 text-lg mb-8 max-w-lg mx-auto">
                Launch the classifier and experience the power of hybrid retrieval + local LLM
              </p>
              <Link to="/classify" className="btn-primary text-lg px-10 py-4 inline-flex">
                Launch Classifier <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Footer */}
      <footer className="relative z-10 px-6 lg:px-12 py-8 border-t border-white/5">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <span className="text-slate-500 text-sm font-medium">ResolveAI</span>
          </div>
          <p className="text-slate-600 text-sm">Hybrid RAG · Local LLM · 100% Private</p>
        </div>
      </footer>
    </div>
  )
}