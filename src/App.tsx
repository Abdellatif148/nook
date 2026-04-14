// @ts-nocheck
import * as React from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { DashboardPage } from './pages/DashboardPage'
import { WizardPage } from './pages/WizardPage'
import { NewSessionPage } from './pages/NewSessionPage'
import { SessionDetailPage } from './pages/SessionDetailPage'
import { SessionHistoryPage } from './pages/SessionHistoryPage'
import { ClientsPage } from './pages/ClientsPage'
import { ClientDetailPage } from './pages/ClientDetailPage'
import { ReportsPage } from './pages/ReportsPage'
import { SettingsPage } from './pages/SettingsPage'
import { StaffManagementPage } from './pages/StaffManagementPage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { useAuthStore } from './stores/authStore'
import { supabase } from './lib/supabase'
import { ToastContainer } from './components/ui/Toast'
import { TopBar } from './components/layout/TopBar'
import { BottomNav } from './components/layout/BottomNav'
import { OfflineBanner } from './components/layout/OfflineBanner'

const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { type, isLoading } = useAuthStore()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!type) return <Navigate to="/login" />
  return <>{children}</>
}

const PageWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation()
  return (
    <motion.main
      key={location.pathname}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="flex-1"
    >
      {children}
    </motion.main>
  )
}

export default function App() {
  const { setAuth, logout } = useAuthStore()

  React.useEffect(() => {
    // 1. Check owner session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        supabase.from('cafes').select('*').eq('owner_id', session.user.id).single()
          .then(({ data: cafeData }) => {
            setAuth('owner', session.user, null, cafeData as any)
          })
      } else {
        // 2. Check staff session
        const staffSessionStr = localStorage.getItem('nook_staff_session')
        if (staffSessionStr) {
          const s = JSON.parse(staffSessionStr)
          if (new Date(s.expires_at) > new Date()) {
            Promise.all([
              supabase.from('staff').select('*').eq('id', s.staff_id).single(),
              supabase.from('cafes').select('*').eq('id', s.cafe_id).single()
            ]).then((results: any[]) => {
              const staffRes = results[0]
              const cafeRes = results[1]
              if (staffRes.data && cafeRes.data) {
                setAuth('staff', null, staffRes.data as any, cafeRes.data as any)
              } else {
                logout()
              }
            })
          } else {
            logout()
          }
        } else {
          setAuth(null, null, null, null)
        }
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        const staffSessionStr = localStorage.getItem('nook_staff_session')
        if (!staffSessionStr) logout()
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <BrowserRouter>
      <div className="bg-bg text-text min-h-screen font-inter overflow-x-hidden">
        <OfflineBanner />
        <ToastContainer />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route path="/*" element={
            <AuthGuard>
              <div className="flex flex-col min-h-screen">
                <TopBar />
                <div className="flex-1 overflow-x-hidden">
                  <AnimatePresence mode="wait">
                    <Routes>
                      <Route path="/dashboard" element={<PageWrapper><DashboardPage /></PageWrapper>} />
                      <Route path="/wizard" element={<PageWrapper><WizardPage /></PageWrapper>} />
                      <Route path="/sessions" element={<PageWrapper><SessionHistoryPage /></PageWrapper>} />
                      <Route path="/sessions/new" element={<PageWrapper><NewSessionPage /></PageWrapper>} />
                      <Route path="/sessions/:id" element={<PageWrapper><SessionDetailPage /></PageWrapper>} />
                      <Route path="/clients" element={<PageWrapper><ClientsPage /></PageWrapper>} />
                      <Route path="/clients/:id" element={<PageWrapper><ClientDetailPage /></PageWrapper>} />
                      <Route path="/reports" element={<PageWrapper><ReportsPage /></PageWrapper>} />
                      <Route path="/settings" element={<PageWrapper><SettingsPage /></PageWrapper>} />
                      <Route path="/settings/staff" element={<PageWrapper><StaffManagementPage /></PageWrapper>} />
                      <Route path="/" element={<Navigate to="/dashboard" />} />
                    </Routes>
                  </AnimatePresence>
                </div>
                <BottomNav />
              </div>
            </AuthGuard>
          } />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
