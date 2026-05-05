import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Database, ChevronDown } from 'lucide-react'
import { MethodTag } from './ui'

const SPRING = { type: 'spring', stiffness: 300, damping: 30 }

export default function TopKContext({ chunks = [], debug }) {
  const [expanded, setExpanded] = useState(null)

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={SPRING} className="instrument overflow-hidden">
      <div className="flex items-center justify-between border-b px-4 py-4" style={{ borderColor: 'var(--edge-soft)' }}>
        <div className="flex items-center gap-3">
          <Database className="h-4 w-4" style={{ color: 'var(--accent)' }} />
          <span className="label">Context</span>
          <span className="type-micro numeric text-flint">top-{chunks.length}</span>
        </div>
        {debug && (
          <div className="hidden gap-3 md:flex">
            <span className="type-micro numeric text-flint">kw:{debug.keyword_hits}</span>
            <span className="type-micro numeric text-flint">sem:{debug.semantic_hits}</span>
            {debug.reranked && <span className="type-micro text-flint">reranked</span>}
            {debug.hyde_used && <span className="type-micro" style={{ color: 'var(--accent)' }}>hyde</span>}
          </div>
        )}
      </div>

      <div className="divide-y" style={{ borderColor: 'var(--edge-soft)' }}>
        {chunks.map((c, i) => (
          <div key={c.id || i}>
            <button onClick={() => setExpanded(expanded === i ? null : i)} className="grid w-full grid-cols-[32px_1fr_auto] gap-3 px-4 py-4 text-left hover:bg-surface">
              <span className="type-micro numeric text-flint">{String(i + 1).padStart(2, '0')}</span>
              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="type-micro numeric text-flint">{c.id}</span>
                  <MethodTag method={c.retrieval_method || 'fused'} />
                  {c.metadata?.category && <span className="type-micro" style={{ color: 'var(--accent)' }}>{c.metadata.category}</span>}
                </div>
                <p className="type-caption line-clamp-2 font-medium text-ink">{c.text || c.preview}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end">
                <p className="type-micro numeric" style={{ color: 'var(--accent)' }}>{typeof c.score === 'number' ? c.score.toFixed(4) : c.score}</p>
                <ChevronDown className="mt-2 h-4 w-4 text-flint" style={{ transform: expanded === i ? 'rotate(180deg)' : 'rotate(0deg)' }} />
              </div>
            </button>

            <AnimatePresence>
              {expanded === i && c.text && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={SPRING} className="overflow-hidden" style={{ background: 'var(--bg-canvas)' }}>
                  <div className="px-12 pb-4">
                    <div className="mb-3 h-px" style={{ background: 'var(--edge-soft)' }} />
                    <p className="type-caption text-slate">{c.text}</p>
                    {c.metadata && Object.keys(c.metadata).length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {Object.entries(c.metadata).map(([k, v]) => (
                          <span key={k} className="tag numeric">{k}:{v}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
