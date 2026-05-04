import React from 'react'
import { motion } from 'framer-motion'
import { Search, Brain, GitMerge, Cpu, Check, Loader2, Globe2 } from 'lucide-react'
import { Spinner } from './ui'

const STAGES = [
  { id: 'retrieval_start',    icon: Search,   label: 'BM25 Keyword',    sub: 'Tokenise · score corpus',        color: '#818CF8' },
  { id: 'retrieval_start_2',  icon: Brain,    label: 'Dense Semantic',  sub: 'Embed · HNSW search',            color: '#3B82F6' },
  { id: 'retrieval_complete', icon: GitMerge, label: 'RRF Fusion',      sub: 'Merge ranked lists k=60',        color: '#D97706' },
  { id: 'llm_start',          icon: Cpu,      label: 'LLM Generate',    sub: 'Context-augmented JSON',         color: '#059669' },
]

export default function RetrievalPipeline({ streamStage, chunksFound, translated }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="panel space-y-1 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#1E1E20]">
        <div className="flex items-center gap-2.5">
          {streamStage !== 'complete' ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: '#059669' }} />
          ) : (
            <Check className="w-3.5 h-3.5" style={{ color: '#3B82F6' }} />
          )}
          <span className="text-[11px] font-medium uppercase tracking-wider text-flint">Pipeline</span>
        </div>
        {chunksFound != null && (
          <span className="text-[11px] font-medium" style={{ color: '#059669' }}>{chunksFound} chunks</span>
        )}
      </div>

      {/* Translation notice */}
      {translated && (
        <div className="mx-4 mt-3 flex items-center gap-2 px-3 py-2 border border-[#1E1E20] rounded"
          style={{ background: 'rgba(59,130,246,0.04)', borderColor: 'rgba(59,130,246,0.2)' }}>
          <Globe2 className="w-3.5 h-3.5" style={{ color: '#3B82F6' }} />
          <span className="text-[11px] font-medium" style={{ color: '#3B82F6' }}>
            Detected: <b>{translated.from}</b> → translated via {translated.method}
          </span>
        </div>
      )}

      {/* Steps */}
      <div className="p-4 space-y-2">
        {STAGES.map((s, i) => {
          let active = false;
          let done = false;

          if (streamStage === 'retrieval_start') {
            if (i === 0 || i === 1) active = true;
          } else if (streamStage === 'retrieval_complete') {
            if (i < 2) done = true;
            if (i === 2) active = true;
          } else if (streamStage === 'llm_start') {
            if (i < 3) done = true;
            if (i === 3) active = true;
          } else if (streamStage === 'complete') {
            done = true;
          }

          return (
            <div key={s.id} className={`pipe-step flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${active ? 'bg-[#121214]' : done ? '' : 'opacity-40'}`}>
              <div className="w-7 h-7 shrink-0 flex items-center justify-center border border-[#1E1E20] rounded"
                style={{ borderColor: active ? s.color + '50' : done ? '#3B82F630' : undefined, background: active ? s.color + '10' : undefined }}>
                {done
                  ? <Check className="w-3.5 h-3.5" style={{ color: '#3B82F6' }} />
                  : active
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: s.color }} />
                  : <s.icon className="w-3.5 h-3.5" style={{ color: '#71717A' }} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-medium leading-none mb-1"
                  style={{ color: done ? '#3B82F6' : active ? s.color : '#71717A' }}>{s.label}</p>
                <p className="text-[10px] text-slate" style={{ color: active ? '#A1A1AA' : '#71717A' }}>{s.sub}</p>
              </div>
              {active && (
                <div className="flex gap-1 pr-2">
                  {[0,1,2].map(j => (
                    <motion.div key={j} className="w-1.5 h-1.5 rounded-full"
                      style={{ background: s.color }}
                      animate={{ opacity: [0.2, 1, 0.2] }}
                      transition={{ duration: 1, delay: j * 0.2, repeat: Infinity }} />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}