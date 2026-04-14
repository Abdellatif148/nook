import * as React from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { DashboardPage } from './pages/DashboardPage'
import { NewSessionPage } from './pages/NewSessionPage'
import { SessionDetailPage } from './pages/SessionDetailPage'
import { SessionHistoryPage } from './pages/SessionHistoryPage'
import { ClientsPage } from './pages/ClientsPage'
import { ClientDetailPage } from './pages/ClientDetailPage'
import { ReportsPage } from './pages/ReportsPage'
import { SettingsPage } from './pages/SettingsPage'
import { LoginPage } from './pages/LoginPage'
import { useAuthStore } from './stores/authStore'
import { useSync } from './hooks/useSync'
import { useAlerts } from './hooks/useAlerts'
import { ToastContainer } from './components/ui/Toast'
import { TopBar } from './components/layout/TopBar'
import { BottomNav } from './components/layout/BottomNav'
import { OfflineBanner } from './components/layout/OfflineBanner'

const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, isLoading } = useAuthStore()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!token) return <Navigate to="/login" />
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
      className="flex-1 pb-[80px]"
    >
      {children}
    </motion.main>
  )
}

const GlobalServices: React.FC = () => {
  useSync();
  useAlerts();
  return null;
}

export default function App() {
  const { init } = useAuthStore()

  React.useEffect(() => {
    init()
  }, [init])

  return (
    <BrowserRouter>
      <div className="bg-bg text-text min-h-screen font-plus overflow-x-hidden flex flex-col">
        <OfflineBanner />
        <ToastContainer />
        <GlobalServices />
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route path="/*" element={
            <AuthGuard>
              <div className="flex flex-col min-h-screen">
                <TopBar />
                <AnimatePresence mode="wait">
                  <Routes>
                    <Route path="/dashboard" element={<PageWrapper><DashboardPage /></PageWrapper>} />
                    <Route path="/sessions/new" element={<PageWrapper><NewSessionPage /></PageWrapper>} />
                    <Route path="/sessions/history" element={<PageWrapper><SessionHistoryPage /></PageWrapper>} />
                    <Route path="/sessions/:id" element={<PageWrapper><SessionDetailPage /></PageWrapper>} />
                    <Route path="/clients" element={<PageWrapper><ClientsPage /></PageWrapper>} />
                    <Route path="/clients/:id" element={<PageWrapper><ClientDetailPage /></PageWrapper>} />
                    <Route path="/reports" element={<PageWrapper><ReportsPage /></PageWrapper>} />
                    <Route path="/settings" element={<PageWrapper><SettingsPage /></PageWrapper>} />
                    <Route path="/" element={<Navigate to="/dashboard" />} />
                  </Routes>
                </AnimatePresence>
                <BottomNav />
              </div>
            </AuthGuard>
          } />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
