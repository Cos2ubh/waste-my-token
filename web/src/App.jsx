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

// When a Google OAuth user lands back, ensure they have a users table record.
// Generates a username from their email (letters+numbers, max 20 chars) + 4-digit suffix.
async function ensureUserRecord(authUser) {
  const { data: existing } = await supabase
    .from('users').select('id').eq('id', authUser.id).maybeSingle()
  if (existing) return

  const base = (authUser.email ?? 'user')
    .split('@')[0]
    .replace(/[^a-z0-9]/gi, '')
    .toLowerCase()
    .slice(0, 16)

  // retry up to 10 times — each attempt picks a fresh 4-digit suffix
  // so even if the base collides, a unique slot will be found quickly
  for (let i = 0; i < 10; i++) {
    const suffix = Math.floor(1000 + Math.random() * 9000)
    const { error } = await supabase
      .from('users').insert({ id: authUser.id, username: `${base}${suffix}` })
    if (!error) return
    // only retry on unique-constraint violations
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
    window.location.href = '/'
  }

  const openAuth = (mode) => setAuthModal(mode)
  const closeAuth = () => setAuthModal(null)
  const onAuthSuccess = (u) => {
    setUser(u)
    setTimeout(() => { closeAuth(); window.location.href = '/dashboard' }, 300)
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
        <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Landing onAuthClick={openAuth} />} />
        <Route path="/dashboard" element={<ProtectedRoute user={user}><Dashboard user={user} onLogout={handleLogout} /></ProtectedRoute>} />
        <Route path="/leaderboard" element={<LeaderboardPage onAuthClick={openAuth} />} />
        <Route path="/u/:username" element={<Profile />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
