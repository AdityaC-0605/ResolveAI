import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Database, ChevronDown, BarChart3 } from 'lucide-react'
import { MethodTag } from './ui'

export default function TopKContext({ chunks, debug }) {
  const [expanded, setExpanded] = useState(null)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-display font-semibold text-slate-200 flex items-center gap-2">
          <Database className="w-4 h-4 text-violet-400" />
          Retrieved Context
          <span className="text-xs font-mono text-slate-500">Top-{chunks.length}</span>
        </h3>
        <div className="flex gap-2 text-xs font-mono">
          <span className="px-2 py-0.5 rounded-md bg-violet-500/10 text-violet-400 border border-violet-500/15">
            kw {debug.keyword_hits}
          </span>
          <span className="px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/15">
            sem {debug.semantic_hits}
          </span>
          {debug.reranked && (
            <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/15">
              reranked
            </span>
          )}
        </div>
      </div>

      {/* Chunk list */}
      <div className="space-y-2">
        {chunks.map((chunk, i) => (
          <motion.div
            key={chunk.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
            className="rounded-xl overflow-hidden border border-white/[0.04] hover:border-white/[0.08] transition-colors"
            style={{ background: 'rgba(8,13,30,0.6)' }}
          >
            <button
              onClick={() => setExpanded(expanded === i ? null : i)}
              className="w-full flex items-start gap-3 p-3.5 text-left"
            >
              {/* Rank badge */}
              <div className="shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-mono font-bold text-slate-500"
                style={{ background: 'rgba(255,255,255,0.04)' }}>
                {i + 1}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs font-mono text-slate-600">#{chunk.id}</span>
                  <MethodTag method={chunk.retrieval_method} />
                  {chunk.metadata?.category && (
                    <span className="text-[10px] font-mono text-violet-400/70">{chunk.metadata.category}</span>
                  )}
                </div>
                <p className="text-sm text-slate-300 leading-relaxed line-clamp-2">{chunk.text}</p>
              </div>

              {/* Score */}
              <div className="shrink-0 flex flex-col items-end gap-1">
                <div className="flex items-center gap-1 text-xs font-mono text-slate-500">
                  <BarChart3 className="w-3 h-3" />
                  {chunk.score.toFixed(4)}
                </div>
                <ChevronDown className={`w-3 h-3 text-slate-600 transition-transform ${expanded === i ? 'rotate-180' : ''}`} />
              </div>
            </button>

            {/* Expanded full text */}
            <AnimatePresence>
              {expanded === i && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-3.5 pb-3.5 pt-0">
                    <div className="h-px bg-white/[0.04] mb-3" />
                    <p className="text-sm text-slate-400 leading-relaxed">{chunk.text}</p>
                    {chunk.metadata && Object.keys(chunk.metadata).length > 0 && (
                      <div className="mt-3 flex gap-2 flex-wrap">
                        {Object.entries(chunk.metadata).map(([k, v]) => (
                          <span key={k} className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.03] text-slate-500 border border-white/[0.05]">
                            {k}: {v}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}