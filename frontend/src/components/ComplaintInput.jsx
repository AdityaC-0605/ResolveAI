import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, RotateCcw, ChevronDown } from 'lucide-react'
import { Spinner } from './ui'

const SPRING = { type: 'spring', stiffness: 300, damping: 30 }

const EXAMPLES = [
  { label: 'Double charge', text: 'I was charged twice. $49.99 appears twice on my March statement. Unacceptable. I need an immediate refund.' },
  { label: 'App crash', text: 'The app crashes every time I upload a photo. Reinstalled 3 times on iPhone 14 Pro iOS 17.4. Week-long issue.' },
  { label: 'Account takeover', text: "Someone changed my account email. I can't log in and see purchases I never made. This is a security breach!" },
  { label: 'Damaged package', text: 'Package arrived crushed. Glass items shattered. Clear mishandling during shipping. Need full compensation.' },
  { label: 'Refund delay', text: "Refund promised within 5-7 days. It's been 3 weeks. Reference: REF-99123. Where is my money?" },
]

export default function ComplaintInput({ onSubmit, loading }) {
  const [text, setText] = useState('')
  const [showEx, setShowEx] = useState(false)
  const ref = useRef(null)

  const submit = e => { e?.preventDefault(); if (text.trim().length >= 5 && !loading) onSubmit(text.trim()) }

  return (
    <div className="instrument overflow-visible">
      <div className="flex items-center justify-between border-b px-4 py-4" style={{ borderColor: 'var(--edge-soft)' }}>
        <div className="flex items-center gap-3">
          <span className="h-2 w-2 rounded-full" style={{ background: 'var(--accent)' }} />
          <span className="label">Input</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="type-caption numeric text-flint">{text.length}/5000</span>
          <div className="relative">
            <motion.button whileTap={{ scale: 0.97 }} transition={SPRING} onClick={() => setShowEx(s => !s)} className="btn h-8">
              Examples <ChevronDown className="h-4 w-4" style={{ transform: showEx ? 'rotate(180deg)' : 'rotate(0deg)' }} />
            </motion.button>
            <AnimatePresence>
              {showEx && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={SPRING} className="absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-md border shadow-instrument" style={{ borderColor: 'var(--edge-soft)', background: 'var(--bg-canvas)' }}>
                  {EXAMPLES.map((ex, i) => (
                    <button key={i} onClick={() => { setText(ex.text); setShowEx(false); setTimeout(() => ref.current?.focus(), 50) }} className="type-caption w-full border-b px-4 py-3 text-left text-slate last:border-0 hover:bg-surface hover:text-ink" style={{ borderColor: 'var(--edge-soft)' }}>
                      <span className="numeric mr-2" style={{ color: 'var(--accent)' }}>{String(i + 1).padStart(2, '0')}</span>{ex.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-4 p-4">
        <textarea
          ref={ref}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit() }}
          placeholder="Paste or type a customer complaint..."
          className="input h-48"
        />

        <div className="flex items-center justify-between gap-4">
          <button type="button" onClick={() => setText('')} disabled={!text} className="btn">
            <RotateCcw className="h-4 w-4" /> Clear
          </button>
          <span className="type-micro text-flint">Command + Enter</span>
          <motion.button whileTap={{ scale: 0.97 }} transition={SPRING} disabled={loading || text.length < 5} className="btn btn-acid px-4">
            {loading ? <><Spinner size="sm" /> Analysing</> : <><Send className="h-4 w-4" /> Classify</>}
          </motion.button>
        </div>
      </form>
    </div>
  )
}
