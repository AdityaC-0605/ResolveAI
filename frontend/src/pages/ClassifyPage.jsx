import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'
import ComplaintInput     from '../components/ComplaintInput'
import RetrievalPipeline  from '../components/RetrievalPipeline'
import TopKContext        from '../components/TopKContext'
import StructuredOutput   from '../components/StructuredOutput'
import { EmptyState }     from '../components/ui'
import { Brain }          from 'lucide-react'
import { useComplaintPipeline } from '../hooks/useComplaintPipeline'

export default function ClassifyPage() {
  const { state, streamStage, chunksFound, result, error, startPipeline } = useComplaintPipeline()

  return (
    <div className="px-8 py-8">
      <div className="mb-6">
        <h1 className="font-display font-bold text-2xl text-slate-100">Classify</h1>
        <p className="text-slate-500 text-sm mt-1">Real-time streaming pipeline with structured LLM output</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left — input + pipeline */}
        <div className="space-y-6">
          <ComplaintInput onSubmit={startPipeline} loading={state === 'streaming'} />

          <AnimatePresence mode="wait">
            {(state === 'streaming') && (
              <RetrievalPipeline key="pipeline" streamStage={streamStage} chunksFound={chunksFound} />
            )}
            {state === 'error' && (
              <motion.div key="err"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="glass p-5 flex items-start gap-3"
                style={{ borderColor: 'rgba(255,45,107,0.2)', background: 'rgba(255,45,107,0.04)' }}>
                <AlertTriangle className="w-4 h-4 text-coral shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-coral">Error</p>
                  <p className="text-xs text-red-300/70 font-mono mt-1">{error}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right — results */}
        <div className="space-y-6">
          <AnimatePresence mode="wait">
            {state === 'idle' && (
              <motion.div key="idle" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                className="glass h-full min-h-[400px] flex items-center justify-center">
                <EmptyState icon={Brain} title="Ready to classify"
                  sub="Enter a complaint on the left to see the full hybrid retrieval + LLM pipeline in action." />
              </motion.div>
            )}

            {state === 'streaming' && (
              <motion.div key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="glass h-full min-h-[400px] p-6 space-y-5"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-indigo-500/20 ring-2 ring-indigo-500/30" />
                    <div className="h-4 w-32 rounded-full bg-gradient-to-r from-slate-700/30 via-slate-600/50 to-slate-700/30 animate-pulse" />
                  </div>
                  <div className="h-px bg-gradient-to-r from-transparent via-slate-700/50 to-transparent" />
                </div>
                <div className="space-y-4 pt-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="space-y-2">
                      <div className="h-3 w-20 rounded-full bg-gradient-to-r from-slate-700/30 via-slate-600/50 to-slate-700/30 animate-pulse" />
                      <div className="h-4 w-full rounded-lg bg-gradient-to-r from-slate-800/40 via-slate-700/60 to-slate-800/40 animate-pulse" style={{ animationDelay: `${i * 150}ms` }} />
                    </div>
                  ))}
                </div>
                <div className="pt-4 space-y-3">
                  <div className="h-3 w-16 rounded-full bg-gradient-to-r from-slate-700/30 via-slate-600/50 to-slate-700/30 animate-pulse" />
                  <div className="flex gap-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-6 w-16 rounded-lg bg-gradient-to-r from-indigo-500/20 via-indigo-400/30 to-indigo-500/20 animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {state === 'done' && result && (
              <motion.div key="results" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }} className="space-y-5">
                <StructuredOutput
                  classification={result}
                  timing={result.processing_time_ms ?? '—'}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}