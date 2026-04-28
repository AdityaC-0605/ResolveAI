import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import DashboardPage   from './pages/DashboardPage'
import ClassifyPage    from './pages/ClassifyPage'
import BatchPage       from './pages/BatchPage'
import KnowledgePage   from './pages/KnowledgePage'
import AnalyticsPage   from './pages/AnalyticsPage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index             element={<DashboardPage />} />
        <Route path="classify"   element={<ClassifyPage />} />
        <Route path="batch"      element={<BatchPage />} />
        <Route path="knowledge"  element={<KnowledgePage />} />
        <Route path="analytics"  element={<AnalyticsPage />} />
        <Route path="*"          element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}