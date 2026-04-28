import React, { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Send, RotateCcw, FileText, ChevronDown } from 'lucide-react'

const EXAMPLES = [
  { label: 'Double charge',    text: "I was charged twice for my monthly subscription — $49.99 appears twice on my credit card statement dated March 15th. This is unacceptable, I need an immediate refund!" },
  { label: 'App crash',        text: "The app crashes every time I try to upload a photo. I've reinstalled it three times on my iPhone 14 Pro with iOS 17.4. This has been happening for a week now." },
  { label: 'Account takeover', text: "Someone accessed my account and changed the email address. I can no longer log in and I see purchases I didn't authorise. This is a security breach — help!" },
  { label: 'Damaged package',  text: "My package arrived completely crushed. The glass items inside are shattered. The box was clearly mishandled during shipping. I need full compensation immediately." },
  { label: 'Refund delay',     text: "My refund was promised within 5-7 business days but it's been 3 weeks. Reference: REF-99123. Where is my money?" },
]

export default function ComplaintInput({ onSubmit, loading }) {
  const [text, setText]           = useState('')
  const [showExamples, setShow]   = useState(false)
  const textareaRef               = useRef(null)

  const submit = (e) => {
    e?.preventDefault()
    if (text.trim().length >= 5 && !loading) onSubmit(text.trim())
  }

  const loadExample = (ex) => {
    setText(ex.text)
    setShow(false)
    setTimeout(() => textareaRef.current?.focus(), 50)
  }

  const pct = Math.min(100, Math.round((text.length / 5000) * 100))

  return (
    <div className="glass border-glow-mint p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-semibold text-slate-200 flex items-center gap-2">
          <FileText className="w-4 h-4 text-mint" />
          Customer Complaint
        </h2>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setShow(s => !s)}
              className="btn-ghost text-xs flex items-center gap-1.5"
            >
              Examples <ChevronDown className={`w-3 h-3 transition-transform ${showExamples ? 'rotate-180' : ''}`} />
            </button>
            {showExamples && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6 }}
                className="absolute right-0 top-full mt-1 w-64 rounded-xl overflow-hidden z-50"
                style={{ background: 'rgba(8,13,30,0.98)', border: '1px solid rgba(255,255,255,0.07)', boxShadow: '0 20px 40px rgba(0,0,0,0.6)' }}
              >
                {EXAMPLES.map((ex, i) => (
                  <button
                    key={i}
                    onClick={() => loadExample(ex)}
                    className="w-full text-left px-4 py-2.5 text-sm text-slate-400 hover:text-slate-200 hover:bg-white/[0.03] transition-colors border-b border-white/[0.03] last:border-0"
                  >
                    <span className="font-medium text-slate-300">{ex.label}</span>
                    <p className="text-xs text-slate-600 mt-0.5 line-clamp-1">{ex.text.slice(0, 60)}…</p>
                  </button>
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </div>

      <form onSubmit={submit}>
        <div className="group relative rounded-xl bg-slate-900/30 border border-white/5 p-1 transition-all duration-300 focus-within:ring-2 focus-within:ring-indigo-500/50 focus-within:border-indigo-500/30">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit() }}
            placeholder="Paste or type the customer complaint here…"
            className="w-full h-32 bg-transparent resize-none leading-relaxed text-slate-200 placeholder:text-slate-600 focus:outline-none"
          />
          {/* Character ring */}
          <div className="absolute bottom-2 right-2 flex items-center gap-2">
            <span className="text-[10px] font-mono text-slate-600">{text.length}/5000</span>
            <svg className="w-6 h-6 -rotate-90" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="9" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2" />
              <circle cx="12" cy="12" r="9" fill="none" stroke={pct > 90 ? '#ff2d6b' : '#00f0b5'}
                strokeWidth="2" strokeDasharray={`${2*Math.PI*9}`}
                strokeDashoffset={`${2*Math.PI*9 * (1 - pct/100)}`}
                style={{ transition: 'stroke-dashoffset 0.3s' }} />
            </svg>
          </div>
        </div>

        <div className="flex items-center justify-between mt-3">
          <button type="button" onClick={() => setText('')} disabled={!text}
            className="btn-ghost text-xs disabled:opacity-30">
            <RotateCcw className="w-3 h-3" /> Clear
          </button>
          <p className="text-[10px] text-slate-700 font-mono">⌘+Enter to submit</p>
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            disabled={loading || text.length < 5}
            className="btn-primary"
          >
            {loading ? (
              <><div className="w-4 h-4 rounded-full border-2 border-black/20 border-t-black/60 animate-spin" /> Analysing…</>
            ) : (
              <><Send className="w-4 h-4" /> Classify</>
            )}
          </motion.button>
        </div>
      </form>
    </div>
  )
}