import React, { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { motion } from 'framer-motion'
import Sidebar from './Sidebar'
import { getHealth } from '../api'

export default function Layout() {
  const [health, setHealth] = useState(null)

  useEffect(() => {
    const poll = async () => {
      try { setHealth(await getHealth()) } catch {}
    }
    poll()
    const id = setInterval(poll, 30_000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="flex h-screen w-screen overflow-hidden" style={{ background: '#04060f' }}>
      {/* ── Ambient blobs ─────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(0,240,181,0.06) 0%, transparent 70%)' }} />
        <div className="absolute -bottom-60 -right-40 w-[700px] h-[700px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.06) 0%, transparent 70%)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(255,45,107,0.03) 0%, transparent 70%)' }} />
        {/* Grid overlay */}
        <div className="absolute inset-0 bg-grid-void bg-grid opacity-40" />
      </div>

      <Sidebar health={health} />

      <main className="relative z-10 flex-1 overflow-y-auto overflow-x-hidden">
        <motion.div
          key="page"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="min-h-full"
        >
          <Outlet context={{ health }} />
        </motion.div>
      </main>
    </div>
  )
}