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
    <div className="px-8 py-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 pb-5 border-b flex items-end justify-between" style={{ borderColor: '#1E1E20' }}>
        <div>
          <p className="label mb-1.5">Mode: single</p>
          <h1 className="text-2xl font-semibold text-quartz tracking-tight">Classify</h1>
        </div>
        {state === 'done' && (
          <span className="text-[10px] font-medium text-slate px-2.5 py-1 border rounded" style={{ borderColor: '#1E1E20', background: '#121214' }}>
            Pipeline Complete
          </span>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Left */}
        <div className="space-y-5">
          <ComplaintInput onSubmit={startPipeline} loading={state === 'streaming'} />

          <AnimatePresence mode="wait">
            {state === 'streaming' && (
              <RetrievalPipeline key="pipe" streamStage={streamStage} chunksFound={chunksFound} translated={translated} />
            )}
            {state === 'error' && (
              <motion.div key="err" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                className="panel px-5 py-4 flex items-start gap-4" style={{ borderColor: 'rgba(225,29,72,0.3)', background: 'rgba(225,29,72,0.05)' }}>
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#E11D48' }} />
                <div>
                  <p className="text-[13px] font-medium" style={{ color: '#E11D48' }}>Error</p>
                  <p className="text-[11px] text-[#FDA4AF] mt-1">{error}</p>
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
                className="panel min-h-[400px] flex items-center justify-center border-dashed">
                <EmptyState icon={Brain} title="Ready to classify"
                  sub="Paste a customer complaint on the left to run the full hybrid pipeline." />
              </motion.div>
            )}

            {state === 'streaming' && (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="panel min-h-[400px] p-6 space-y-5">
                <p className="label cursor">Awaiting result</p>
                <div className="space-y-4">
                  {[100, 80, 60, 45, 70].map((w, i) => (
                    <div key={i} className="space-y-2">
                      <div className="skel h-2 rounded" style={{ width: `${w * 0.4}%` }} />
                      <div className="skel h-3 rounded" style={{ width: `${w}%` }} />
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {state === 'done' && result && (
              <motion.div key="result" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 400, damping: 30 }}>
                <StructuredOutput classification={result} timing={result.processing_time_ms} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}