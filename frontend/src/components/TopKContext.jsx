import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Database, ChevronDown } from 'lucide-react'
import { MethodTag } from './ui'

export default function TopKContext({ chunks = [], debug }) {
  const [expanded, setExpanded] = useState(null)

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="panel overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Database className="w-3 h-3" style={{ color: '#9b6fff' }} />
          <span className="text-[10px] font-mono uppercase tracking-widest text-ghost">Context</span>
          <span className="text-[9px] font-mono text-dim">top-{chunks.length}</span>
        </div>
        {debug && (
          <div className="flex gap-2 text-[9px] font-mono">
            <span style={{ color: '#9b6fff' }}>kw:{debug.keyword_hits}</span>
            <span style={{ color: '#2ee8d4' }}>sem:{debug.semantic_hits}</span>
            {debug.reranked && <span style={{ color: '#f5a623' }}>reranked</span>}
            {debug.hyde_used && <span style={{ color: '#d4f43c' }}>hyde</span>}
          </div>
        )}
      </div>

      <div className="divide-y" style={{ borderColor: '#1e2334' }}>
        {chunks.map((c, i) => (
          <div key={c.id || i}>
            <button onClick={() => setExpanded(expanded === i ? null : i)}
              className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-edge transition-colors">
              <span className="text-[10px] font-mono text-dim w-5 shrink-0 mt-0.5">{String(i+1).padStart(2,'0')}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[9px] font-mono text-dim">{c.id}</span>
                  <MethodTag method={c.retrieval_method || 'fused'} />
                  {c.metadata?.category && <span className="text-[9px] font-mono" style={{ color: '#9b6fff' }}>{c.metadata.category}</span>}
                </div>
                <p className="text-[11px] font-mono text-ghost leading-relaxed line-clamp-2">{c.text || c.preview}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-[10px] font-mono" style={{ color: '#d4f43c' }}>{typeof c.score === 'number' ? c.score.toFixed(4) : c.score}</p>
                <ChevronDown className="w-3 h-3 text-dim mt-1 ml-auto transition-transform" style={{ transform: expanded === i ? 'rotate(180deg)' : '' }} />
              </div>
            </button>

            <AnimatePresence>
              {expanded === i && c.text && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18 }} className="overflow-hidden">
                  <div className="px-4 pb-3 pt-0 pl-12">
                    <div className="h-px bg-border mb-2" />
                    <p className="text-[11px] font-mono text-ghost leading-relaxed">{c.text}</p>
                    {c.metadata && Object.keys(c.metadata).length > 0 && (
                      <div className="flex gap-1.5 flex-wrap mt-2">
                        {Object.entries(c.metadata).map(([k, v]) => (
                          <span key={k} className="text-[9px] font-mono px-1.5 py-0.5 border border-border text-dim">{k}:{v}</span>
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