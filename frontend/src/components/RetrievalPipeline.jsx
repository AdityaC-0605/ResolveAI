import React from 'react'
import { motion } from 'framer-motion'
import { Search, Brain, GitMerge, Cpu, Check, Loader2, Globe2 } from 'lucide-react'
import { Spinner } from './ui'

const STAGES = [
  { id: 'retrieval_start',    icon: Search,   label: 'BM25 Keyword',    sub: 'Tokenise · score corpus',        color: '#9b6fff' },
  { id: 'retrieval_start_2',  icon: Brain,    label: 'Dense Semantic',  sub: 'Embed · HNSW search',            color: '#2ee8d4' },
  { id: 'retrieval_complete', icon: GitMerge, label: 'RRF Fusion',      sub: 'Merge ranked lists k=60',        color: '#f5a623' },
  { id: 'llm_start',          icon: Cpu,      label: 'LLM Generate',    sub: 'Context-augmented JSON',         color: '#d4f43c' },
]

export default function RetrievalPipeline({ streamStage, chunksFound, translated }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="panel space-y-1 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          {streamStage !== 'complete' ? (
            <Loader2 className="w-3 h-3 animate-spin" style={{ color: '#d4f43c' }} />
          ) : (
            <Check className="w-3 h-3" style={{ color: '#2ee8d4' }} />
          )}
          <span className="text-[10px] font-mono uppercase tracking-widest text-ghost">Pipeline</span>
        </div>
        {chunksFound != null && (
          <span className="text-[10px] font-mono" style={{ color: '#d4f43c' }}>{chunksFound} chunks</span>
        )}
      </div>

      {/* Translation notice */}
      {translated && (
        <div className="mx-3 mt-2 flex items-center gap-2 px-2 py-1.5 border border-border"
          style={{ background: 'rgba(46,232,212,0.04)', borderColor: 'rgba(46,232,212,0.2)' }}>
          <Globe2 className="w-3 h-3" style={{ color: '#2ee8d4' }} />
          <span className="text-[10px] font-mono" style={{ color: '#2ee8d4' }}>
            Detected: <b>{translated.from}</b> → translated via {translated.method}
          </span>
        </div>
      )}

      {/* Steps */}
      <div className="p-3 space-y-1.5">
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
            <div key={s.id} className={`pipe-step ${active ? 'active' : done ? 'done' : ''}`}>
              <div className="w-6 h-6 shrink-0 flex items-center justify-center border border-border"
                style={{ borderColor: active ? s.color + '50' : done ? '#2ee8d430' : undefined, background: active ? s.color + '10' : undefined }}>
                {done
                  ? <Check className="w-3 h-3" style={{ color: '#2ee8d4' }} />
                  : active
                  ? <Loader2 className="w-3 h-3 animate-spin" style={{ color: s.color }} />
                  : <s.icon className="w-3 h-3" style={{ color: '#2a3044' }} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-mono font-semibold leading-none"
                  style={{ color: done ? '#2ee8d4' : active ? s.color : '#2a3044' }}>{s.label}</p>
                <p className="text-[9px] font-mono mt-0.5" style={{ color: active ? '#4a566e' : '#2a3044' }}>{s.sub}</p>
              </div>
              {active && (
                <div className="flex gap-0.5">
                  {[0,1,2].map(j => (
                    <motion.div key={j} className="w-1 h-1 rounded-full"
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