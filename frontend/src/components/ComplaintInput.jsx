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
    <div className="panel" style={{ borderColor: 'rgba(79,70,229,0.3)', background: 'rgba(79,70,229,0.05)' }}>
      {/* Header bar */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#1E1E20]">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-[#818CF8]" />
          <span className="text-[11px] font-medium uppercase tracking-wider text-flint">Input</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-slate font-mono">{text.length}/5000</span>
          <div className="relative">
            <button onClick={() => setShowEx(s => !s)}
              className="btn text-[11px] flex items-center gap-1.5 py-1.5 px-2.5">
              Examples <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showEx ? 'rotate-180' : ''}`} />
            </button>
            {showEx && (
              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className="absolute right-0 top-full mt-2 w-72 z-50 border border-[#1E1E20] rounded-lg shadow-xl"
                style={{ background: '#0A0A0B' }}>
                {EXAMPLES.map((ex, i) => (
                  <button key={i} onClick={() => { setText(ex.text); setShowEx(false); setTimeout(() => ref.current?.focus(), 50) }}
                    className="w-full text-left px-4 py-3 text-[12px] font-medium text-slate hover:text-quartz hover:bg-[#121214] border-b border-[#1E1E20] last:border-0 transition-colors">
                    <span className="text-[#818CF8] font-mono mr-2">[{String(i+1).padStart(2,'0')}]</span> {ex.label}
                  </button>
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Textarea */}
      <form onSubmit={submit} className="p-5 space-y-4">
        <textarea ref={ref} value={text} onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit() }}
          placeholder="// paste or type customer complaint..."
          className="input h-48 w-full text-[14px] font-medium text-quartz leading-relaxed resize-none" />

        <div className="flex items-center justify-between">
          <button type="button" onClick={() => setText('')} disabled={!text}
            className="btn py-2 px-4 text-xs disabled:opacity-30">
            <RotateCcw className="w-3.5 h-3.5" /> Clear
          </button>
          <span className="text-[11px] font-mono text-slate">⌘+Enter</span>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            disabled={loading || text.length < 5} className="btn btn-acid py-2 px-5 text-xs font-medium">
            {loading
              ? <><Spinner size="sm" /> Analysing...</>
              : <><Send className="w-3.5 h-3.5" /> Classify</>}
          </motion.button>
        </div>
      </form>
    </div>
  )
}