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
      className="glass-card p-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-semibold text-white flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-violet-500/10 flex items-center justify-center">
            <Database className="w-4 h-4 text-violet-400" />
          </div>
          Retrieved Context
          <span className="text-xs font-mono text-slate-500 bg-slate-800/50 px-2 py-0.5 rounded-lg">Top-{chunks.length}</span>
        </h3>
        <div className="flex gap-2 text-xs font-mono">
          <span className="px-2.5 py-1 rounded-lg bg-violet-500/10 text-violet-400 border border-violet-500/20">
            kw {debug.keyword_hits}
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            sem {debug.semantic_hits}
          </span>
          {debug.reranked && (
            <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
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
            className="rounded-xl overflow-hidden border border-white/5 hover:border-white/10 transition-all bg-slate-900/50"
          >
            <button
              onClick={() => setExpanded(expanded === i ? null : i)}
              className="w-full flex items-start gap-3 p-4 text-left"
            >
              {/* Rank badge */}
              <div className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-mono font-bold text-slate-500 bg-slate-800">
                {i + 1}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-mono text-slate-500">#{chunk.id}</span>
                  <MethodTag method={chunk.retrieval_method} />
                  {chunk.metadata?.category && (
                    <span className="text-[10px] font-mono text-violet-400/70">{chunk.metadata.category}</span>
                  )}
                </div>
                <p className="text-sm text-slate-300 leading-relaxed line-clamp-2">{chunk.text}</p>
              </div>

              {/* Score */}
              <div className="shrink-0 flex flex-col items-end gap-1">
                <div className="flex items-center gap-1.5 text-xs font-mono text-slate-500 bg-slate-800/50 px-2 py-1 rounded-lg">
                  <BarChart3 className="w-3 h-3" />
                  {chunk.score.toFixed(4)}
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-600 transition-transform ${expanded === i ? 'rotate-180' : ''}`} />
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
                  <div className="px-4 pb-4 pt-0">
                    <div className="h-px bg-white/5 mb-4" />
                    <p className="text-sm text-slate-400 leading-relaxed">{chunk.text}</p>
                    {chunk.metadata && Object.keys(chunk.metadata).length > 0 && (
                      <div className="mt-4 flex gap-2 flex-wrap">
                        {Object.entries(chunk.metadata).map(([k, v]) => (
                          <span key={k} className="text-[10px] font-mono px-2.5 py-1 rounded-lg bg-slate-800/50 text-slate-500 border border-white/5">
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