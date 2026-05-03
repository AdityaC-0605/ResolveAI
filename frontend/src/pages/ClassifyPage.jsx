import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, AlertTriangle } from 'lucide-react'
import ComplaintInput    from '../components/ComplaintInput'
import RetrievalPipeline from '../components/RetrievalPipeline'
import TopKContext       from '../components/TopKContext'
import StructuredOutput  from '../components/StructuredOutput'
import { EmptyState }    from '../components/ui'
import { useComplaintPipeline } from '../hooks/useComplaintPipeline'

export default function ClassifyPage() {
  const { state, streamStage, chunksFound, result, chunks, debug, error, translated, startPipeline } = useComplaintPipeline()

  return (
    <div className="px-6 py-6">
      {/* Header */}
      <div className="mb-6 pb-4 border-b border-border flex items-end justify-between">
        <div>
          <p className="label mb-1">Mode: single</p>
          <h1 className="text-xl font-mono font-semibold text-silver">Classify</h1>
        </div>
        {state === 'done' && (
          <span className="text-[9px] font-mono text-dim px-2 py-1 border border-border">
            pipeline complete
          </span>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Left */}
        <div className="space-y-4">
          <ComplaintInput onSubmit={startPipeline} loading={state === 'streaming'} />

          <AnimatePresence mode="wait">
            {state === 'streaming' && (
              <RetrievalPipeline key="pipe" streamStage={streamStage} chunksFound={chunksFound} translated={translated} />
            )}
            {state === 'error' && (
              <motion.div key="err" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                className="panel-coral panel px-4 py-3 flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#ff4d6a' }} />
                <div>
                  <p className="text-[11px] font-mono font-semibold" style={{ color: '#ff4d6a' }}>Error</p>
                  <p className="text-[10px] font-mono text-dim mt-0.5">{error}</p>
                </div>
              </motion.div>
            )}
            {state === 'done' && chunks?.length > 0 && (
              <TopKContext key="chunks" chunks={chunks} debug={debug} />
            )}
          </AnimatePresence>
        </div>

        {/* Right */}
        <div>
          <AnimatePresence mode="wait">
            {state === 'idle' && (
              <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="panel min-h-[400px] flex items-center justify-center">
                <EmptyState icon={Brain} title="Ready to classify"
                  sub="Paste a customer complaint on the left to run the full hybrid pipeline." />
              </motion.div>
            )}

            {state === 'streaming' && (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="panel min-h-[400px] p-4 space-y-4">
                <p className="label cursor">Awaiting result</p>
                <div className="space-y-3">
                  {[100, 80, 60, 45, 70].map((w, i) => (
                    <div key={i} className="space-y-1.5">
                      <div className="skel h-2 rounded-none" style={{ width: `${w * 0.4}%` }} />
                      <div className="skel h-3 rounded-none" style={{ width: `${w}%` }} />
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {state === 'done' && result && (
              <motion.div key="result" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <StructuredOutput classification={result} timing={result.processing_time_ms} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}