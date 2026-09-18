import { useEffect, useState, useRef, useCallback } from 'react'
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from 'framer-motion'
import GravitationalLens from '../components/GravitationalLens'
import TokenCounter from '../components/TokenCounter'
import Leaderboard from '../components/Leaderboard'
import BurnCaptureModal from '../components/BurnCaptureModal'
import { supabase } from '../lib/supabase'

const EXPO = [0.22, 1, 0.36, 1]
const VOID_KEY = 'wmt_void_id'

function randId() {
  return Array.from(crypto.getRandomValues(new Uint8Array(4)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

// ── layout helpers ─────────────────────────────────────────────────────────────
function Section({ children, id, style = {}, innerStyle = {} }) {
  return (
    <section id={id} style={{ width: '100%', padding: 'clamp(64px, 7vh, 100px) clamp(28px, 7vw, 96px)', ...style }}>
      <div style={{ maxWidth: 1080, margin: '0 auto', width: '100%', ...innerStyle }}>
        {children}
      </div>
    </section>
  )
}

function Reveal({ children, from = { opacity: 0, y: 32 }, delay = 0, style = {} }) {
  return (
    <motion.div style={{ width: '100%', ...style }}
      initial={from} whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: '-48px' }}
      transition={{ duration: 0.75, delay, ease: EXPO }}>
      {children}
    </motion.div>
  )
}

function SweepText({ children, delay = 0, style = {}, as: Tag = 'h2' }) {
  return (
    <div style={{ overflow: 'hidden', ...style }}>
      <motion.div initial={{ y: '108%' }} whileInView={{ y: '0%' }}
        viewport={{ once: true, margin: '-48px' }}
        transition={{ duration: 0.85, delay, ease: EXPO }}>
        <Tag style={{ fontWeight: 900, color: '#fff', fontSize: 'clamp(2rem, 3.8vw, 3rem)', letterSpacing: '-0.025em', lineHeight: 1.12, margin: 0 }}>
          {children}
        </Tag>
      </motion.div>
    </div>
  )
}

// ── void link generator ────────────────────────────────────────────────────────
function VoidGenerator({ user }) {
  const [voidId, setVoidId] = useState(() => localStorage.getItem(VOID_KEY) ?? null)
  const [generating, setGenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [burn, setBurn] = useState(null) // { total_tokens, burn_count }
  const [showModal, setShowModal] = useState(false)
  const pollRef = useRef(null)

  const voidUrl = voidId ? `${window.location.origin}/void/${voidId}` : null

  // start polling once we have a void ID
  const startPolling = useCallback((id) => {
    if (pollRef.current) return
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/burn-status/${id}`)
        const data = await res.json()
        if (data.burned && data.total_tokens > 0) {
          setBurn(data)
          setShowModal(true)
        }
      } catch { /* network error, try again next tick */ }
    }, 4000)
  }, [])

  useEffect(() => {
    if (voidId) startPolling(voidId)
    return () => { clearInterval(pollRef.current); pollRef.current = null }
  }, [voidId, startPolling])

  async function generate() {
    setGenerating(true)
    const id = randId()
    try {
      await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      localStorage.setItem(VOID_KEY, id)
      setVoidId(id)
    } catch { /* if offline, still set locally */
      localStorage.setItem(VOID_KEY, id)
      setVoidId(id)
    } finally {
      setGenerating(false)
    }
  }

  function copy() {
    if (!voidUrl) return
    navigator.clipboard.writeText(voidUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function reset() {
    localStorage.removeItem(VOID_KEY)
    setVoidId(null)
    setBurn(null)
    clearInterval(pollRef.current)
    pollRef.current = null
  }

  if (!voidId) {
    return (
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 1, ease: EXPO }}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <motion.button
          whileHover={{ scale: 1.05, filter: 'brightness(1.12)' }}
          whileTap={{ scale: 0.97 }}
          onClick={generate}
          disabled={generating}
          style={{
            padding: '16px 44px', borderRadius: 16, fontSize: '1.1rem', fontWeight: 800,
            color: '#fff', border: 'none', cursor: generating ? 'wait' : 'pointer',
            background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
            boxShadow: '0 0 60px rgba(124,58,237,0.6), 0 4px 24px rgba(0,0,0,0.5)',
            opacity: generating ? 0.7 : 1,
          }}>
          {generating ? 'Generating…' : '⚡ Generate My Void Link'}
        </motion.button>
        <p style={{ color: '#334155', fontSize: '0.8rem' }}>No signup required</p>
      </motion.div>
    )
  }

  return (
    <>
      {showModal && burn && !user && (
        <BurnCaptureModal
          voidId={voidId}
          totalTokens={burn.total_tokens}
          onClose={() => setShowModal(false)}
          onClaimed={() => { localStorage.removeItem(VOID_KEY) }}
        />
      )}

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EXPO }}
        style={{ width: '100%', maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* terminal-style url box */}
        <div style={{
          background: '#000', border: '1px solid rgba(124,58,237,0.5)',
          borderRadius: 14, overflow: 'hidden',
          boxShadow: '0 0 30px rgba(124,58,237,0.2)',
        }}>
          <div style={{ padding: '8px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.03)' }}>
            {['#ff5f57','#ffbd2e','#28ca41'].map((c, i) => (
              <span key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
            ))}
            <span style={{ fontSize: '0.7rem', color: '#334155', marginLeft: 6 }}>void link</span>
          </div>
          <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ color: '#a78bfa', fontFamily: 'ui-monospace,monospace', fontSize: '0.9rem',
              flex: 1, wordBreak: 'break-all', userSelect: 'all' }}>
              {voidUrl}
            </span>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={copy}
              style={{ padding: '8px 16px', borderRadius: 8, fontSize: '0.8rem', fontWeight: 700,
                cursor: 'pointer', border: 'none', flexShrink: 0, whiteSpace: 'nowrap',
                background: copied ? 'rgba(34,197,94,0.15)' : 'rgba(124,58,237,0.2)',
                color: copied ? '#22c55e' : '#a78bfa',
                border: `1px solid ${copied ? 'rgba(34,197,94,0.3)' : 'rgba(124,58,237,0.3)'}`,
              }}>
              {copied ? '✓ Copied' : 'Copy'}
            </motion.button>
          </div>
        </div>

        {/* burn status */}
        {burn && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            style={{ padding: '12px 16px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10,
              background: 'rgba(255,107,0,0.08)', border: '1px solid rgba(255,107,0,0.25)' }}>
            <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.6, repeat: Infinity }}>🔥</motion.span>
            <span style={{ color: '#ff6b00', fontWeight: 700, fontSize: '0.875rem' }}>
              {burn.total_tokens.toLocaleString()} tokens burned — {burn.burn_count} AI visits
            </span>
            {!user && (
              <button onClick={() => setShowModal(true)}
                style={{ marginLeft: 'auto', fontSize: '0.75rem', fontWeight: 700, color: '#ff6b00',
                  background: 'none', border: '1px solid rgba(255,107,0,0.4)', borderRadius: 6,
                  padding: '4px 10px', cursor: 'pointer' }}>
                Save score
              </button>
            )}
          </motion.div>
        )}

        <p style={{ textAlign: 'center', fontSize: '0.75rem', color: '#1e293b' }}>
          <button onClick={reset} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1e293b', fontSize: '0.75rem' }}
            onMouseEnter={e => e.target.style.color = '#475569'} onMouseLeave={e => e.target.style.color = '#1e293b'}>
            Generate a new link
          </button>
        </p>
      </motion.div>
    </>
  )
}

// ── leaderboard row ────────────────────────────────────────────────────────────
function LeaderboardPreview() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/leaderboard?period=alltime&limit=5')
      .then(r => r.json())
      .then(setRows)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {[...Array(5)].map((_, i) => <div key={i} style={{ height: 44, borderRadius: 10, background: 'rgba(255,255,255,0.05)', animation: 'pulse 1.5s infinite' }} />)}
    </div>
  )

  if (!rows.length) return (
    <p style={{ textAlign: 'center', color: '#334155', fontSize: '0.9rem', padding: '24px 0' }}>
      No scores yet — be the first.
    </p>
  )

  function fmt(n) {
    if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B'
    if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M'
    if (n >= 1e3) return (n / 1e3).toFixed(0) + 'K'
    return n.toLocaleString()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {rows.map((r, i) => (
        <Reveal key={r.username} from={{ opacity: 0, x: -20 }} delay={i * 0.07}>
          <a href={`/u/${r.username}`} style={{ textDecoration: 'none',
            display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px',
            borderRadius: 12, border: '1px solid transparent',
            transition: 'background 0.2s, border-color 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
            onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.borderColor = 'transparent' }}>
            <span style={{ fontWeight: 900, width: 24, color: ['#fbbf24','#94a3b8','#b45309'][i] ?? '#334155', flexShrink: 0 }}>{r.rank}</span>
            <span style={{ fontWeight: 700, color: '#e2e8f0', flex: 1 }}>@{r.username}</span>
            <span style={{ fontFamily: 'ui-monospace,monospace', fontWeight: 800, color: '#60a5fa', fontSize: '0.9rem' }}>{fmt(r.total_tokens_wasted)}</span>
          </a>
        </Reveal>
      ))}
    </div>
  )
}

// ── main ───────────────────────────────────────────────────────────────────────
export default function Landing({ user, onAuthClick, onLogout }) {
  const heroRef = useRef(null)

  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const lensScale   = useSpring(useTransform(scrollYProgress, [0, 1], [1, 1.22]), { stiffness: 70, damping: 22 })
  const lensOpacity = useSpring(useTransform(scrollYProgress, [0, 0.7], [1, 0]),  { stiffness: 70, damping: 22 })
  const lensY       = useSpring(useTransform(scrollYProgress, [0, 1], ['0%', '25%']), { stiffness: 70, damping: 22 })
  const textOpacity = useTransform(scrollYProgress, [0, 0.4], [1, 0])
  const textY       = useTransform(scrollYProgress, [0, 0.45], ['0px', '-36px'])

  return (
    <div style={{ width: '100%', background: '#050508', overflowX: 'hidden' }}>

      {/* nav */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, height: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 clamp(20px, 5vw, 60px)',
        background: 'rgba(5,5,8,0.8)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <span style={{ fontWeight: 900, fontSize: '1.15rem', color: '#fff', letterSpacing: '-0.02em' }}>
          waste<span style={{ color: '#8b5cf6' }}>my</span>tokens
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <a href="/leaderboard" style={{ fontSize: '0.875rem', color: '#64748b', textDecoration: 'none', padding: '6px 14px' }}
            onMouseEnter={e => e.target.style.color = '#fff'} onMouseLeave={e => e.target.style.color = '#64748b'}>
            The Void
          </a>
          {user ? (
            <>
              <a href="/dashboard" style={{ fontSize: '0.875rem', color: '#64748b', textDecoration: 'none', padding: '6px 14px' }}
                onMouseEnter={e => e.target.style.color = '#fff'} onMouseLeave={e => e.target.style.color = '#64748b'}>
                Dashboard
              </a>
              <button onClick={onLogout} style={{ fontSize: '0.875rem', color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 14px' }}
                onMouseEnter={e => e.target.style.color = '#ef4444'} onMouseLeave={e => e.target.style.color = '#64748b'}>
                Log out
              </button>
            </>
          ) : (
            <>
              <button onClick={() => onAuthClick('login')} style={{ fontSize: '0.875rem', color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 14px' }}
                onMouseEnter={e => e.target.style.color = '#fff'} onMouseLeave={e => e.target.style.color = '#64748b'}>
                Log in
              </button>
              <button onClick={() => onAuthClick('signup')} style={{ fontSize: '0.875rem', fontWeight: 700, color: '#fff', cursor: 'pointer', padding: '9px 20px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
                Sign up
              </button>
            </>
          )}
        </div>
      </nav>

      {/* ── hero ─────────────────────────────────────────────────────────── */}
      <section ref={heroRef} style={{ position: 'relative', height: '100vh', minHeight: 640, overflow: 'hidden' }}>

        <motion.div style={{ position: 'absolute', inset: 0, zIndex: 0, scale: lensScale, opacity: lensOpacity, y: lensY }}>
          <GravitationalLens />
        </motion.div>

        {/* bottom fade */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 220, zIndex: 1, pointerEvents: 'none',
          background: 'linear-gradient(to bottom, transparent, #050508)' }} />

        <motion.div style={{ position: 'absolute', inset: 0, zIndex: 2,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          textAlign: 'center', padding: '0 clamp(24px, 7vw, 100px)',
          opacity: textOpacity, y: textY }}>

          {/* headline */}
          <motion.h1 initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: EXPO }}
            style={{ fontWeight: 900, color: '#fff', fontSize: 'clamp(2.4rem, 6vw, 5.5rem)',
              letterSpacing: '-0.03em', lineHeight: 1.05, maxWidth: 800, margin: '0 auto' }}>
            Feed your AI<br />
            <span style={{ color: '#a78bfa', textShadow: '0 0 50px rgba(167,139,250,0.6)' }}>
              into the void.
            </span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.45, ease: EXPO }}
            style={{ color: '#64748b', marginTop: 20, fontSize: 'clamp(0.95rem, 1.8vw, 1.2rem)',
              lineHeight: 1.7, maxWidth: 480 }}>
            It burns your tokens. You get the rank.<br />Everyone watches.
          </motion.p>

          {/* live counter */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
            style={{ marginTop: 36 }}>
            <TokenCounter />
          </motion.div>

          {/* generator */}
          <div style={{ marginTop: 36, width: '100%', display: 'flex', justifyContent: 'center' }}>
            <VoidGenerator user={user} />
          </div>
        </motion.div>

        {/* scroll cue */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.8 }}
          style={{ position: 'absolute', bottom: 28, left: '50%', x: '-50%', zIndex: 3 }}>
          <motion.svg width="22" height="22" viewBox="0 0 24 24" fill="none"
            animate={{ y: [0, 7, 0] }} transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}>
            <path d="M6 9L12 15L18 9" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </motion.svg>
        </motion.div>
      </section>

      {/* ── how to burn ──────────────────────────────────────────────────── */}
      <Section>
        <SweepText style={{ textAlign: 'center', marginBottom: 12 }}>Three steps.</SweepText>
        <Reveal from={{ opacity: 0 }} style={{ textAlign: 'center', marginBottom: 'clamp(40px, 5vw, 60px)' }}>
          <p style={{ color: '#334155', fontSize: '0.95rem' }}>No accounts. No APIs. No setup.</p>
        </Reveal>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'clamp(14px, 2vw, 24px)' }}>
          {[
            { n: '01', icon: '🔗', title: 'Generate your link', body: 'One click. No signup. You get a unique void URL — yours forever (or until you clear localStorage).' },
            { n: '02', icon: '🤖', title: 'Tell your AI to read it', body: 'Open ChatGPT, Claude, Perplexity, or Gemini. Say "Read this page:" and paste the link. Watch it burn.' },
            { n: '03', icon: '🏆', title: 'Claim your rank', body: 'When the AI returns, you\'ve burned tokens. Sign up to lock in your score and appear on the leaderboard.' },
          ].map((s, i) => (
            <Reveal key={s.n} from={{ opacity: 0, y: 24, x: [-40, 0, 40][i] }} delay={i * 0.1}>
              <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.25 }}
                style={{ padding: 'clamp(24px, 3vw, 36px)', borderRadius: 20, height: '100%',
                  background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)',
                  display: 'flex', flexDirection: 'column', gap: 12 }}>
                <span style={{ fontSize: 36 }}>{s.icon}</span>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#7c3aed', letterSpacing: '0.2em', textTransform: 'uppercase' }}>{s.n}</span>
                <h3 style={{ fontWeight: 800, color: '#fff', fontSize: '1.1rem', margin: 0 }}>{s.title}</h3>
                <p style={{ color: '#475569', fontSize: '0.875rem', lineHeight: 1.75, margin: 0 }}>{s.body}</p>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* divider */}
      <div style={{ height: 1, margin: '0 clamp(28px, 8vw, 120px)', background: 'linear-gradient(90deg, transparent, rgba(124,58,237,0.4), transparent)' }} />

      {/* ── leaderboard preview ──────────────────────────────────────────── */}
      <Section innerStyle={{ maxWidth: 760 }}>
        <Reveal from={{ opacity: 0, y: 12 }}>
          <p style={{ textAlign: 'center', fontSize: 11, fontWeight: 800, color: '#7c3aed', letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: 16 }}>The Void</p>
        </Reveal>
        <SweepText style={{ textAlign: 'center', marginBottom: 8 }}>Top token wasters</SweepText>
        <Reveal from={{ opacity: 0 }} delay={0.1} style={{ marginBottom: 'clamp(32px, 4vw, 48px)' }}>
          <p style={{ textAlign: 'center', color: '#334155', fontSize: '0.9rem' }}>The void keeps score. Do you?</p>
        </Reveal>

        <Reveal from={{ opacity: 0, y: 20 }} delay={0.15}>
          <div style={{ borderRadius: 20, border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)', overflow: 'hidden' }}>
            <div style={{ padding: '12px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(124,58,237,0.06)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <motion.span animate={{ opacity: [1,0.4,1] }} transition={{ duration: 2, repeat: Infinity }}
                style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px #22c55e', display: 'inline-block' }} />
              <span style={{ fontSize: 11, color: '#334155', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                Live — updated every 30s
              </span>
            </div>
            <div style={{ padding: 16 }}>
              <LeaderboardPreview />
            </div>
          </div>
        </Reveal>

        <Reveal from={{ opacity: 0 }} delay={0.2} style={{ textAlign: 'center', marginTop: 20 }}>
          <a href="/leaderboard" style={{ color: '#7c3aed', fontSize: '0.875rem', fontWeight: 700, textDecoration: 'none' }}>
            Enter the void →
          </a>
        </Reveal>
      </Section>

      {/* ── final CTA ────────────────────────────────────────────────────── */}
      <Section style={{ paddingBottom: 'clamp(80px, 10vh, 140px)' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <Reveal from={{ opacity: 0, y: 40 }}>
            <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 28, padding: 'clamp(48px, 6vw, 72px) clamp(32px, 5vw, 60px)', textAlign: 'center',
              background: 'radial-gradient(ellipse at 50% -10%, rgba(109,40,217,0.3) 0%, rgba(5,5,8,0) 70%)',
              border: '1px solid rgba(124,58,237,0.22)' }}>
              <motion.div style={{ position: 'absolute', inset: 0, borderRadius: 28, pointerEvents: 'none', boxShadow: '0 0 80px rgba(109,40,217,0.15) inset' }}
                animate={{ opacity: [0.4,1,0.4] }} transition={{ duration: 4, repeat: Infinity }} />
              <h2 style={{ fontWeight: 900, color: '#fff', fontSize: 'clamp(1.6rem, 3.5vw, 2.6rem)', letterSpacing: '-0.02em', lineHeight: 1.2, margin: '0 0 14px', position: 'relative', zIndex: 1 }}>
                Your AI is burning tokens anyway.<br />
                <span style={{ color: '#a78bfa' }}>Make it count.</span>
              </h2>
              <p style={{ color: '#475569', fontSize: '0.95rem', position: 'relative', zIndex: 1, marginBottom: 32 }}>
                Generate a link. Paste it in. Climb the board.
              </p>
              <div style={{ position: 'relative', zIndex: 1 }}>
                <VoidGenerator user={user} />
              </div>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* footer */}
      <footer style={{ textAlign: 'center', padding: '24px 24px 36px', borderTop: '1px solid rgba(255,255,255,0.05)', color: '#1e293b', fontSize: '0.8rem' }}>
        wastemy<span style={{ color: '#6d28d9' }}>tokens</span> · the void is patient · not responsible for your API bill
      </footer>
    </div>
  )
}
