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
    <div className="app-shell flex h-screen w-screen overflow-hidden">
      <div className="field-map fixed inset-0 z-0 pointer-events-none" />
      <Sidebar health={health} />
      <main className="relative z-10 flex-1 overflow-y-auto">
        <motion.div
          key="page"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 28 }}
        >
          <Outlet context={{ health }} />
        </motion.div>
      </main>
    </div>
  )
}
