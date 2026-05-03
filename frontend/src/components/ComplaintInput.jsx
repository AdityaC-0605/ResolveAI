import React, { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Send, RotateCcw, ChevronDown } from 'lucide-react'
import { Spinner } from './ui'

const EXAMPLES = [
  { label: 'Double charge',    text: "I was charged twice — $49.99 appears twice on my March statement. Unacceptable. I need an immediate refund." },
  { label: 'App crash',        text: "The app crashes every time I upload a photo. Reinstalled 3 times on iPhone 14 Pro iOS 17.4. Week-long issue." },
  { label: 'Account takeover', text: "Someone changed my account email. I can't log in and see purchases I never made. This is a security breach!" },
  { label: 'Damaged package',  text: "Package arrived crushed. Glass items shattered. Clear mishandling during shipping. Need full compensation." },
  { label: 'Refund delay',     text: "Refund promised within 5-7 days — it's been 3 weeks. Reference: REF-99123. Where is my money?" },
]

export default function ComplaintInput({ onSubmit, loading }) {
  const [text, setText]         = useState('')
  const [showEx, setShowEx]     = useState(false)
  const ref                     = useRef(null)

  const submit = e => { e?.preventDefault(); if (text.trim().length >= 5 && !loading) onSubmit(text.trim()) }

  return (
    <div className="panel-accent panel">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-acid" />
          <span className="text-[10px] font-mono uppercase tracking-widest text-ghost">Input</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-dim">{text.length}/5000</span>
          <div className="relative">
            <button onClick={() => setShowEx(s => !s)}
              className="btn text-[9px] flex items-center gap-1 py-1 px-2">
              Examples <ChevronDown className={`w-3 h-3 transition-transform ${showEx ? 'rotate-180' : ''}`} />
            </button>
            {showEx && (
              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                className="absolute right-0 top-full mt-1 w-64 z-50 border border-border"
                style={{ background: '#0a0c14' }}>
                {EXAMPLES.map((ex, i) => (
                  <button key={i} onClick={() => { setText(ex.text); setShowEx(false); setTimeout(() => ref.current?.focus(), 50) }}
                    className="w-full text-left px-3 py-2.5 text-[11px] font-mono text-ghost hover:text-silver hover:bg-edge border-b border-border last:border-0 transition-colors">
                    <span className="text-acid">[{String(i+1).padStart(2,'0')}]</span> {ex.label}
                  </button>
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Textarea */}
      <form onSubmit={submit} className="p-4 space-y-3">
        <textarea ref={ref} value={text} onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit() }}
          placeholder="// paste or type customer complaint..."
          className="input h-40 w-full text-[13px] leading-relaxed" />

        <div className="flex items-center justify-between">
          <button type="button" onClick={() => setText('')} disabled={!text}
            className="btn py-1.5 px-3 text-[10px] disabled:opacity-20">
            <RotateCcw className="w-3 h-3" /> Clear
          </button>
          <span className="text-[9px] font-mono text-dim">⌘+Enter</span>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            disabled={loading || text.length < 5} className="btn btn-acid py-1.5 px-4 text-[10px]">
            {loading
              ? <><Spinner size="sm" /> Analysing...</>
              : <><Send className="w-3 h-3" /> Classify</>}
          </motion.button>
        </div>
      </form>
    </div>
  )
}