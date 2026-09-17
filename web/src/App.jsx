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

async function ensureUserRecord(authUser) {
  const { data: existing } = await supabase
    .from('users').select('id').eq('id', authUser.id).maybeSingle()
  if (existing) return

  const base = (authUser.email ?? 'user')
    .split('@')[0]
    .replace(/[^a-z0-9]/gi, '')
    .toLowerCase()
    .slice(0, 16)

  for (let i = 0; i < 10; i++) {
    const suffix = Math.floor(1000 + Math.random() * 9000)
    const { error } = await supabase
      .from('users').insert({ id: authUser.id, username: `${base}${suffix}` })
    if (!error) return
    if (!error.message?.includes('unique') && !error.code?.includes('23505')) throw error
  }
}

export default function App() {
  const [user, setUser] = useState(undefined)
  const [authModal, setAuthModal] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user ?? null
      setUser(u)
      if (u) ensureUserRecord(u).catch(() => {})
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_ev, session) => {
      const u = session?.user ?? null
      setUser(u)
      if (u) ensureUserRecord(u).catch(() => {})
    })

    return () => subscription.unsubscribe()
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    setUser(null)
  }

  const openAuth = (mode) => setAuthModal(mode)
  const closeAuth = () => setAuthModal(null)
  const onAuthSuccess = () => {
    closeAuth()
    window.location.href = '/dashboard'
  }

  if (user === undefined) {
    return (
      <div style={{ width: '100%', minHeight: '100vh', background: '#050508', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid #7c3aed', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
      </div>
    )
  }

  return (
    <BrowserRouter>
      {authModal && (
        <AuthModal mode={authModal} onClose={closeAuth} onSuccess={onAuthSuccess} />
      )}

      <Routes>
        {/* Landing is always accessible — logged-in users see it with a different nav */}
        <Route path="/" element={<Landing user={user} onAuthClick={openAuth} onLogout={handleLogout} />} />
        <Route path="/dashboard" element={<ProtectedRoute user={user}><Dashboard user={user} onLogout={handleLogout} /></ProtectedRoute>} />
        <Route path="/leaderboard" element={<LeaderboardPage user={user} onAuthClick={openAuth} onLogout={handleLogout} />} />
        <Route path="/u/:username" element={<Profile />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
