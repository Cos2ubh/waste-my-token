import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import LeaderboardPage from './pages/LeaderboardPage'
import Profile from './pages/Profile'
import AuthModal from './components/AuthModal'

function ProtectedRoute({ user, children }) {
  if (!user) return <Navigate to="/" replace />
  return children
}

export default function App() {
  const [user, setUser] = useState(undefined) // undefined = loading
  const [authModal, setAuthModal] = useState(null) // null | 'login' | 'signup'

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_ev, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    setUser(null)
    window.location.href = '/'
  }

  const openAuth = (mode) => setAuthModal(mode)
  const closeAuth = () => setAuthModal(null)
  const onAuthSuccess = (u) => {
    setUser(u)
    setTimeout(() => {
      closeAuth()
      window.location.href = '/dashboard'
    }, 300)
  }

  if (user === undefined) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: '#050508' }}
      >
        <div className="w-6 h-6 rounded-full border-2 border-violet-600 border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <BrowserRouter>
      {authModal && (
        <AuthModal mode={authModal} onClose={closeAuth} onSuccess={onAuthSuccess} />
      )}

      <Routes>
        <Route
          path="/"
          element={
            user
              ? <Navigate to="/dashboard" replace />
              : <Landing onAuthClick={openAuth} />
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute user={user}>
              <Dashboard user={user} onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/leaderboard"
          element={<LeaderboardPage onAuthClick={openAuth} />}
        />
        <Route path="/u/:username" element={<Profile />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
