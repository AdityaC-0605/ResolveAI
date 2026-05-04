import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Database, ChevronDown } from 'lucide-react'
import { MethodTag } from './ui'

export default function TopKContext({ chunks = [], debug }) {
  const [expanded, setExpanded] = useState(null)

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 400, damping: 30 }} className="panel overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#1E1E20]">
        <div className="flex items-center gap-2.5">
          <Database className="w-3.5 h-3.5" style={{ color: '#818CF8' }} />
          <span className="text-[11px] font-medium uppercase tracking-wider text-flint">Context</span>
          <span className="text-[10px] text-slate font-mono">top-{chunks.length}</span>
        </div>
        {debug && (
          <div className="flex gap-3 text-[10px] font-mono">
            <span style={{ color: '#818CF8' }}>kw:{debug.keyword_hits}</span>
            <span style={{ color: '#3B82F6' }}>sem:{debug.semantic_hits}</span>
            {debug.reranked && <span style={{ color: '#D97706' }}>reranked</span>}
            {debug.hyde_used && <span style={{ color: '#059669' }}>hyde</span>}
          </div>
        )}
      </div>

      <div className="divide-y divide-[#1E1E20]">
        {chunks.map((c, i) => (
          <div key={c.id || i} className="group">
            <button onClick={() => setExpanded(expanded === i ? null : i)}
              className="w-full flex items-start gap-3 px-5 py-4 text-left hover:bg-[#121214] transition-colors">
              <span className="text-[11px] font-mono text-slate w-6 shrink-0 mt-0.5">{String(i+1).padStart(2,'0')}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5 mb-1.5">
                  <span className="text-[10px] font-mono text-slate">{c.id}</span>
                  <MethodTag method={c.retrieval_method || 'fused'} />
                  {c.metadata?.category && <span className="text-[10px] font-medium" style={{ color: '#818CF8' }}>{c.metadata.category}</span>}
                </div>
                <p className="text-[12px] font-medium text-quartz leading-relaxed line-clamp-2">{c.text || c.preview}</p>
              </div>
              <div className="shrink-0 text-right flex flex-col items-end">
                <p className="text-[11px] font-mono" style={{ color: '#059669' }}>{typeof c.score === 'number' ? c.score.toFixed(4) : c.score}</p>
                <ChevronDown className="w-4 h-4 text-slate mt-1.5 transition-transform group-hover:text-quartz" style={{ transform: expanded === i ? 'rotate(180deg)' : '' }} />
              </div>
            </button>

            <AnimatePresence>
              {expanded === i && c.text && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  exit={{ height: 0, opacity: 0 }} className="overflow-hidden bg-[#0A0A0B]">
                  <div className="px-5 pb-4 pt-1 pl-[3.25rem]">
                    <div className="h-px bg-[#1E1E20] mb-3" />
                    <p className="text-[12px] font-medium text-slate leading-relaxed">{c.text}</p>
                    {c.metadata && Object.keys(c.metadata).length > 0 && (
                      <div className="flex gap-2 flex-wrap mt-3">
                        {Object.entries(c.metadata).map(([k, v]) => (
                          <span key={k} className="text-[10px] font-mono px-2 py-1 border border-[#1E1E20] rounded text-slate bg-[#121214]">{k}:{v}</span>
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