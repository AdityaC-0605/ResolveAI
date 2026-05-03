import React, { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { motion } from 'framer-motion'
import Sidebar from './Sidebar'
import { getHealth } from '../api'

export default function Layout() {
  const [health, setHealth] = useState(null)
  useEffect(() => {
    const poll = async () => { try { setHealth(await getHealth()) } catch {} }
    poll()
    const id = setInterval(poll, 30_000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="flex h-screen w-screen overflow-hidden" style={{ background: '#07080d' }}>
      {/* Subtle grid background */}
      <div className="fixed inset-0 pointer-events-none z-0 grid-bg opacity-60" />

      <Sidebar health={health} />

      <main className="relative z-10 flex-1 overflow-y-auto">
        <motion.div key="page" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
          <Outlet context={{ health }} />
        </motion.div>
      </main>
    </div>
  )
}