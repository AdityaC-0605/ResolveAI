import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, AlertTriangle, CheckCircle2 } from 'lucide-react'
import ComplaintInput from '../components/ComplaintInput'
import RetrievalPipeline from '../components/RetrievalPipeline'
import TopKContext from '../components/TopKContext'
import StructuredOutput from '../components/StructuredOutput'
import { EmptyState } from '../components/ui'
import { useComplaintPipeline } from '../hooks/useComplaintPipeline'

const SPRING = { type: 'spring', stiffness: 300, damping: 30 }

export default function ClassifyPage() {
  const { state, streamStage, chunksFound, result, chunks, debug, error, translated, complaintId, startPipeline } = useComplaintPipeline()

  return (
    <div className="mx-auto max-w-7xl px-8 py-8">
      <div className="mb-8 flex items-end justify-between gap-6 border-b pb-4" style={{ borderColor: 'var(--edge-soft)' }}>
        <div>
          <p className="label mb-2">Mode: single</p>
          <h1 className="type-title">Classify complaint</h1>
        </div>
        {state === 'done' && (
          <span className="tag" style={{ color: 'var(--accent)' }}>
            <CheckCircle2 className="h-4 w-4" /> Complete
          </span>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-6">
          <ComplaintInput onSubmit={startPipeline} loading={state === 'streaming'} />

          <AnimatePresence mode="wait">
            {state === 'streaming' && (
              <RetrievalPipeline key="pipe" streamStage={streamStage} chunksFound={chunksFound} translated={translated} />
            )}
            {state === 'error' && (
              <motion.div key="err" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={SPRING} className="instrument flex items-start gap-4 p-4" style={{ borderColor: 'rgba(210, 106, 93, 0.28)', background: 'rgba(210, 106, 93, 0.08)' }}>
                <AlertTriangle className="mt-1 h-5 w-5 shrink-0" style={{ color: 'var(--danger)' }} />
                <div>
                  <p className="type-body font-semibold" style={{ color: 'var(--danger)' }}>Pipeline error</p>
                  <p className="type-caption mt-1 text-slate">{error}</p>
                </div>
              </motion.div>
            )}
            {state === 'done' && chunks?.length > 0 && (
              <TopKContext key="chunks" chunks={chunks} debug={debug} />
            )}
          </AnimatePresence>
        </div>

        <div>
          <AnimatePresence mode="wait">
            {state === 'idle' && (
              <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={SPRING} className="instrument flex min-h-[448px] items-center justify-center">
                <EmptyState icon={Brain} title="Ready to classify" sub="Paste a customer complaint on the left to run retrieval, generation, and report assembly." />
              </motion.div>
            )}

            {state === 'streaming' && (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={SPRING} className="instrument min-h-[448px] p-6">
                <div className="mb-6 flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full" style={{ background: 'var(--accent)' }} />
                  <p className="label">Assembling report</p>
                </div>
                <div className="space-y-4">
                  {[64, 48, 88, 72, 56].map((w, i) => (
                    <motion.div key={i} className="space-y-2" initial={{ opacity: 0.42 }} animate={{ opacity: [0.42, 0.78, 0.42] }} transition={{ type: 'spring', stiffness: 180, damping: 20, repeat: Infinity, repeatType: 'mirror', delay: i * 0.04 }}>
                      <div className="skel h-2" style={{ width: `${Math.max(24, w - 24)}%` }} />
                      <div className="skel h-4" style={{ width: `${w}%` }} />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {state === 'done' && result && (
              <motion.div key="result" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={SPRING}>
                <StructuredOutput classification={result} timing={result.processing_time_ms} complaintId={complaintId} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
