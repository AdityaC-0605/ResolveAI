import React from 'react'
import { motion } from 'framer-motion'
import { Search, Brain, GitMerge, Cpu, Check, Globe2 } from 'lucide-react'

const SPRING = { type: 'spring', stiffness: 300, damping: 30 }

const STAGES = [
  { id: 'retrieval_start', icon: Search, label: 'BM25 keyword', sub: 'Tokenise · score corpus' },
  { id: 'retrieval_start_2', icon: Brain, label: 'Dense semantic', sub: 'Embed · HNSW search' },
  { id: 'retrieval_complete', icon: GitMerge, label: 'RRF fusion', sub: 'Merge ranked lists k=60' },
  { id: 'llm_start', icon: Cpu, label: 'LLM generate', sub: 'Context-augmented report' },
]

export default function RetrievalPipeline({ streamStage, chunksFound, translated }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={SPRING} className="instrument overflow-hidden">
      <div className="flex items-center justify-between border-b px-4 py-4" style={{ borderColor: 'var(--edge-soft)' }}>
        <div className="flex items-center gap-3">
          {streamStage !== 'complete'
            ? <motion.span className="h-2 w-2 rounded-full" style={{ background: 'var(--accent)' }} animate={{ scale: [1, 1.24, 1] }} transition={{ type: 'spring', stiffness: 260, damping: 18, repeat: Infinity, repeatType: 'mirror' }} />
            : <Check className="h-4 w-4" style={{ color: 'var(--accent)' }} />}
          <span className="label">Pipeline</span>
        </div>
        {chunksFound != null && <span className="type-caption numeric" style={{ color: 'var(--accent)' }}>{chunksFound} chunks</span>}
      </div>

      {translated && (
        <div className="mx-4 mt-4 flex items-center gap-2 rounded-md border px-3 py-2" style={{ background: 'var(--accent-dim)', borderColor: 'rgba(143, 212, 122, 0.2)' }}>
          <Globe2 className="h-4 w-4" style={{ color: 'var(--accent)' }} />
          <span className="type-caption text-slate">
            Detected <b>{translated.from}</b> · translated via {translated.method}
          </span>
        </div>
      )}

      <div className="space-y-3 p-4">
        {STAGES.map((s, i) => {
          let active = false
          let done = false

          if (streamStage === 'retrieval_start') {
            if (i === 0 || i === 1) active = true
          } else if (streamStage === 'retrieval_complete') {
            if (i < 2) done = true
            if (i === 2) active = true
          } else if (streamStage === 'llm_start') {
            if (i < 3) done = true
            if (i === 3) active = true
          } else if (streamStage === 'complete') {
            done = true
          }

          const Icon = s.icon
          return (
            <motion.div key={s.id} layout transition={SPRING} className={`pipe-step ${active ? 'active' : ''} ${done ? 'done' : ''}`} style={{ opacity: active || done ? 1 : 0.46 }}>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border" style={{ borderColor: active ? 'rgba(143, 212, 122, 0.32)' : 'var(--edge-soft)', background: active ? 'var(--accent-dim)' : 'transparent' }}>
                {done ? <Check className="h-4 w-4" style={{ color: 'var(--accent)' }} /> : <Icon className="h-4 w-4" style={{ color: active ? 'var(--accent)' : 'var(--text-muted)' }} />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="type-caption font-semibold" style={{ color: active || done ? 'var(--text-primary)' : 'var(--text-muted)' }}>{s.label}</p>
                <p className="type-micro text-flint">{s.sub}</p>
              </div>
              {active && (
                <div className="flex gap-1 pr-2">
                  {[0, 1, 2].map(j => (
                    <motion.div key={j} className="h-1 w-1 rounded-full" style={{ background: 'var(--accent)' }} animate={{ scale: [0.7, 1.3, 0.7], opacity: [0.35, 1, 0.35] }} transition={{ type: 'spring', stiffness: 240, damping: 18, repeat: Infinity, repeatType: 'mirror', delay: j * 0.08 }} />
                  ))}
                </div>
              )}
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}
