import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Brain, GitMerge, Cpu, CheckCircle2, Loader2 } from 'lucide-react'

const STAGES = [
  {
    id: 'retrieval_start',
    icon: Search,
    label: 'BM25 Keyword Search',
    sub: 'Tokenising query · scoring against corpus',
    color: 'text-violet-400',
    border: 'border-violet-500/25',
    glow: 'rgba(124,58,237,0.08)',
  },
  {
    id: 'retrieval_start_2',
    icon: Brain,
    label: 'Dense Semantic Search',
    sub: 'Embedding query · HNSW nearest-neighbour',
    color: 'text-cyan-400',
    border: 'border-cyan-500/25',
    glow: 'rgba(0,240,181,0.08)',
  },
  {
    id: 'retrieval_complete',
    icon: GitMerge,
    label: 'Reciprocal Rank Fusion',
    sub: 'Merging ranked lists · weighted RRF k=60',
    color: 'text-amber-400',
    border: 'border-amber-500/25',
    glow: 'rgba(245,158,11,0.08)',
  },
  {
    id: 'llm_start',
    icon: Cpu,
    label: 'LLM Structured Generation',
    sub: 'Context-augmented · JSON schema enforced',
    color: 'text-mint',
    border: 'border-mint/25',
    glow: 'rgba(0,240,181,0.08)',
  },
]

export default function RetrievalPipeline({ streamStage, chunksFound }) {
  // Map incoming SSE stage → how many pipeline steps are active
  const stageIndex =
    !streamStage              ? -1 :
    streamStage === 'retrieval_start'    ? 0 :
    streamStage === 'retrieval_complete' ? 2 :
    streamStage === 'llm_start'         ? 3 :
    streamStage === 'complete'           ? 4 : 1

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="glass p-6 space-y-3"
    >
      <div className="flex items-center gap-3 mb-5">
        <Loader2 className="w-4 h-4 text-mint animate-spin" />
        <h3 className="font-display font-semibold text-slate-200">Hybrid Retrieval Pipeline</h3>
        {chunksFound != null && (
          <span className="ml-auto text-xs font-mono text-mint">
            {chunksFound} chunks retrieved
          </span>
        )}
      </div>

      {/* Vertical connector */}
      <div className="relative pl-6">
        <div className="absolute left-[23px] top-4 bottom-4 w-px"
          style={{ background: 'linear-gradient(to bottom, rgba(124,58,237,0.3), rgba(0,240,181,0.3))' }} />

        <div className="space-y-3">
          {STAGES.map((stage, i) => {
            const isDone   = i <  stageIndex
            const isActive = i === stageIndex

            return (
              <motion.div
                key={stage.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.18 }}
                className={`pipeline-node ${isActive ? 'active' : isDone ? 'done' : ''}`}
                style={isActive ? { background: stage.glow } : {}}
              >
                {/* Node dot */}
                <div className={`absolute -left-[1px] w-6 h-6 rounded-full flex items-center justify-center shrink-0
                  ${isDone ? 'bg-mint/10 border border-mint/30' : isActive ? `border ${stage.border}` : 'border border-white/5'}
                  `}
                  style={{ transform: 'translateX(-24px)' }}
                >
                  {isDone
                    ? <CheckCircle2 className="w-3 h-3 text-mint" />
                    : isActive
                    ? <Loader2 className={`w-3 h-3 ${stage.color} animate-spin`} />
                    : <stage.icon className="w-3 h-3 text-slate-700" />}
                </div>

                <div className="flex items-center gap-3 w-full">
                  <div className={`p-1.5 rounded-lg shrink-0 ${isActive || isDone ? `border ${stage.border}` : 'border border-white/5'}`}
                    style={isActive ? { background: stage.glow } : {}}>
                    <stage.icon className={`w-4 h-4 ${isDone || isActive ? stage.color : 'text-slate-700'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-display font-medium ${isDone || isActive ? 'text-slate-200' : 'text-slate-600'}`}>
                      {stage.label}
                    </p>
                    <p className={`text-xs mt-0.5 ${isActive ? 'text-slate-400' : 'text-slate-700'}`}>
                      {stage.sub}
                    </p>
                  </div>
                  {isActive && (
                    <div className="flex gap-0.5">
                      {[0, 1, 2].map(j => (
                        <motion.div key={j} className="w-1 h-1 rounded-full bg-mint"
                          animate={{ opacity: [0.2, 1, 0.2] }}
                          transition={{ duration: 1.2, delay: j * 0.2, repeat: Infinity }} />
                      ))}
                    </div>
                  )}
                  {isDone && (
                    <span className="text-[10px] font-mono text-mint/60">done</span>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}