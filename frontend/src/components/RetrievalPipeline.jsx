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
    border: 'border-violet-500/30',
    glow: 'rgba(139, 92, 246, 0.1)',
    bg: 'bg-violet-500/10',
  },
  {
    id: 'retrieval_start_2',
    icon: Brain,
    label: 'Dense Semantic Search',
    sub: 'Embedding query · HNSW nearest-neighbour',
    color: 'text-cyan-400',
    border: 'border-cyan-500/30',
    glow: 'rgba(6, 182, 212, 0.1)',
    bg: 'bg-cyan-500/10',
  },
  {
    id: 'retrieval_complete',
    icon: GitMerge,
    label: 'Reciprocal Rank Fusion',
    sub: 'Merging ranked lists · weighted RRF k=60',
    color: 'text-amber-400',
    border: 'border-amber-500/30',
    glow: 'rgba(245, 158, 11, 0.1)',
    bg: 'bg-amber-500/10',
  },
  {
    id: 'llm_start',
    icon: Cpu,
    label: 'LLM Structured Generation',
    sub: 'Context-augmented · JSON schema enforced',
    color: 'text-mint',
    border: 'border-mint/30',
    glow: 'rgba(20, 184, 166, 0.1)',
    bg: 'bg-mint/10',
  },
]

export default function RetrievalPipeline({ streamStage, chunksFound }) {
  const stageIndex =
    !streamStage ? -1 :
      streamStage === 'retrieval_start' ? 0 :
        streamStage === 'retrieval_complete' ? 2 :
          streamStage === 'llm_start' ? 3 :
            streamStage === 'complete' ? 4 : 1

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="glass-card p-6 space-y-4"
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-mint flex items-center justify-center">
          <Loader2 className="w-4 h-4 text-white animate-spin" />
        </div>
        <h3 className="font-semibold text-white">Hybrid Retrieval Pipeline</h3>
        {chunksFound != null && (
          <span className="ml-auto text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded-lg">
            {chunksFound} chunks retrieved
          </span>
        )}
      </div>

      {/* Vertical connector */}
      <div className="relative pl-8">
        <div className="absolute left-[27px] top-4 bottom-4 w-px"
          style={{ background: 'linear-gradient(to bottom, #8b5cf6, #06b6d4, #f59e0b, #14b8a6)' }} />

        <div className="space-y-3">
          {STAGES.map((stage, i) => {
            const isDone = i < stageIndex
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
                <div className={`absolute -left-[3px] w-7 h-7 rounded-full flex items-center justify-center shrink-0 border-2
                  ${isDone ? 'bg-mint/20 border-mint/40' : isActive ? `${stage.bg} ${stage.border}` : 'border-white/10 bg-slate-800'}
                  `}
                >
                  {isDone
                    ? <CheckCircle2 className="w-4 h-4 text-mint" />
                    : isActive
                      ? <Loader2 className={`w-3.5 h-3.5 ${stage.color} animate-spin`} />
                      : <stage.icon className="w-3.5 h-3.5 text-slate-600" />}
                </div>

                <div className="flex items-center gap-3 w-full pl-2">
                  <div className={`p-2 rounded-lg shrink-0 border ${isActive || isDone ? `${stage.bg} ${stage.border}` : 'border-white/5 bg-slate-800/50'}`}
                    style={isActive ? { background: stage.glow } : {}}>
                    <stage.icon className={`w-4 h-4 ${isDone || isActive ? stage.color : 'text-slate-600'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${isDone || isActive ? 'text-white' : 'text-slate-500'}`}>
                      {stage.label}
                    </p>
                    <p className={`text-xs mt-0.5 ${isActive ? 'text-slate-400' : 'text-slate-600'}`}>
                      {stage.sub}
                    </p>
                  </div>
                  {isActive && (
                    <div className="flex gap-1">
                      {[0, 1, 2].map(j => (
                        <motion.div key={j} className="w-1.5 h-1.5 rounded-full bg-cyan-400"
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1.2, delay: j * 0.2, repeat: Infinity }} />
                      ))}
                    </div>
                  )}
                  {isDone && (
                    <span className="text-[10px] font-mono text-mint/60 bg-mint/5 px-2 py-0.5 rounded">done</span>
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