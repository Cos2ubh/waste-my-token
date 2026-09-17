import { useEffect, useState, useRef } from 'react'
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from 'framer-motion'
import GravitationalLens from '../components/GravitationalLens'
import TokenCounter from '../components/TokenCounter'
import Leaderboard from '../components/Leaderboard'
import { fetchLeaderboard } from '../lib/api'

// ── easing ────────────────────────────────────────────────────────────────────
const EXPO = [0.16, 1, 0.3, 1]

// ── data ──────────────────────────────────────────────────────────────────────
const STEPS = [
  {
    num: '01',
    title: 'Deploy the proxy',
    body: 'Drop our Node.js reverse proxy in front of your site. One env var, five minutes, no downtime.',
    icon: '⚡',
    accent: '#7c3aed',
    from: { opacity: 0, x: -60, y: 20 },
  },
  {
    num: '02',
    title: 'Bots get bombed',
    body: 'Every AI crawler gets flooded with ~368K tokens of pure void. Their context window fills. They leave empty.',
    icon: '💀',
    accent: '#dc2626',
    from: { opacity: 0, x: 0, y: 60 },
  },
  {
    num: '03',
    title: 'Watch your rank climb',
    body: 'Every token wasted earns you a spot on the public leaderboard. More waste = higher rank. Top wasters make the news.',
    icon: '🏆',
    accent: '#2563eb',
    from: { opacity: 0, x: 60, y: 20 },
  },
]

const MODES = [
  { name: 'Black Hole',  desc: 'Floods context with 368K tokens of filler. Instant overwhelm, immediate context death.', dot: '#7c3aed', bg: 'rgba(124,58,237,0.08)', border: 'rgba(124,58,237,0.25)', glow: 'rgba(124,58,237,0.45)' },
  { name: 'Tarpit',      desc: 'Slow-drips a response that never completes. Wastes their compute, their time, their tokens.', dot: '#ea580c', bg: 'rgba(234,88,12,0.08)', border: 'rgba(234,88,12,0.25)', glow: 'rgba(234,88,12,0.45)' },
  { name: 'White Hole',  desc: 'Clean structured feed for authorized agents. Whitelist the bots you actually want in.', dot: '#2563eb', bg: 'rgba(37,99,235,0.08)', border: 'rgba(37,99,235,0.25)', glow: 'rgba(37,99,235,0.45)' },
]

// ── shared layout ─────────────────────────────────────────────────────────────
const S = {
  section: {
    width: '100%',
    padding: 'clamp(64px, 7vh, 100px) clamp(28px, 7vw, 96px)',
  },
  inner: (maxW = 1080) => ({
    maxWidth: maxW, margin: '0 auto', width: '100%',
  }),
  grid3: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
    gap: 'clamp(16px, 2.5vw, 28px)',
  },
  heading: {
    fontWeight: 900, color: '#fff',
    fontSize: 'clamp(2rem, 3.8vw, 3rem)',
    letterSpacing: '-0.025em', lineHeight: 1.12, margin: 0,
  },
}

// ── animation primitives ──────────────────────────────────────────────────────

// Reliable scroll reveal — no display:contents, no variant inheritance bugs
function Reveal({ children, from = { opacity: 0, y: 32 }, delay = 0, style = {} }) {
  return (
    <motion.div
      style={{ width: '100%', ...style }}
      initial={from}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: '-48px' }}
      transition={{ duration: 0.75, delay, ease: EXPO }}
    >
      {children}
    </motion.div>
  )
}

// Text sweep — heading text reveals with a clipping mask sweeping left→right
function SweepText({ children, delay = 0, tag = 'h2', style = {} }) {
  const Tag = tag
  return (
    <div style={{ overflow: 'hidden', ...style }}>
      <motion.div
        initial={{ y: '108%' }}
        whileInView={{ y: '0%' }}
        viewport={{ once: true, margin: '-48px' }}
        transition={{ duration: 0.85, delay, ease: EXPO }}
      >
        <Tag style={S.heading}>{children}</Tag>
      </motion.div>
    </div>
  )
}

// ── step card ─────────────────────────────────────────────────────────────────
function StepCard({ step, delay }) {
  return (
    <Reveal from={step.from} delay={delay}>
      <motion.div
        whileHover={{ y: -6, transition: { duration: 0.3, ease: EXPO } }}
        style={{
          height: '100%',
          padding: 'clamp(28px, 3vw, 44px)',
          borderRadius: 20,
          background: `radial-gradient(ellipse at 10% 10%, ${step.accent}22 0%, transparent 60%)`,
          border: `1px solid ${step.accent}45`,
          display: 'flex', flexDirection: 'column', gap: 16,
          cursor: 'default',
        }}
      >
        <span style={{ fontSize: 42 }}>{step.icon}</span>
        <span style={{ fontSize: 11, fontWeight: 800, color: step.accent, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
          {step.num}
        </span>
        <h3 style={{ fontWeight: 800, color: '#fff', fontSize: '1.15rem', margin: 0 }}>{step.title}</h3>
        <p style={{ color: '#94a3b8', lineHeight: 1.75, margin: 0, fontSize: '0.9rem' }}>{step.body}</p>
      </motion.div>
    </Reveal>
  )
}

// ── mode card — magnetic hover ─────────────────────────────────────────────────
function ModeCard({ mode, delay }) {
  const ref = useRef(null)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [hovered, setHovered] = useState(false)

  const handleMouseMove = (e) => {
    const rect = ref.current.getBoundingClientRect()
    setPos({
      x: ((e.clientX - rect.left) / rect.width - 0.5) * 10,
      y: ((e.clientY - rect.top) / rect.height - 0.5) * 10,
    })
  }

  return (
    <Reveal from={{ opacity: 0, y: 40 }} delay={delay}>
      <motion.div
        ref={ref}
        onMouseMove={handleMouseMove}
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => { setHovered(false); setPos({ x: 0, y: 0 }) }}
        animate={{
          rotateX: hovered ? -pos.y * 0.6 : 0,
          rotateY: hovered ? pos.x * 0.6 : 0,
          scale: hovered ? 1.03 : 1,
          boxShadow: hovered ? `0 20px 60px ${mode.glow}, 0 0 0 1px ${mode.border}` : `0 0 0 1px ${mode.border}`,
        }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        style={{
          padding: 'clamp(24px, 2.5vw, 36px)',
          borderRadius: 18,
          background: mode.bg,
          display: 'flex', flexDirection: 'column', gap: 14,
          height: '100%', cursor: 'default',
          transformStyle: 'preserve-3d',
          willChange: 'transform',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <motion.span
            animate={{ boxShadow: hovered ? `0 0 16px ${mode.dot}` : `0 0 6px ${mode.dot}88` }}
            style={{ width: 10, height: 10, borderRadius: '50%', background: mode.dot, flexShrink: 0 }}
          />
          <span style={{ fontWeight: 800, color: '#fff', fontSize: '1.05rem' }}>{mode.name}</span>
        </div>
        <p style={{ color: '#cbd5e1', fontSize: '0.9rem', lineHeight: 1.75, margin: 0 }}>{mode.desc}</p>
      </motion.div>
    </Reveal>
  )
}

// ── divider ───────────────────────────────────────────────────────────────────
function GradientDivider() {
  return (
    <Reveal from={{ opacity: 0 }}>
      <div style={{
        margin: '0 clamp(28px, 8vw, 120px)',
        height: 1,
        background: 'linear-gradient(90deg, transparent, rgba(124,58,237,0.5), transparent)',
      }} />
    </Reveal>
  )
}

// ── leaderboard row with stagger ──────────────────────────────────────────────
function AnimatedLeaderboard({ rows, loading }) {
  return (
    <div>
      <Leaderboard rows={rows} loading={loading} preview />
    </div>
  )
}

// ── main component ─────────────────────────────────────────────────────────────
export default function Landing({ onAuthClick }) {
  const [leaderboard, setLeaderboard] = useState([])
  const [lbLoading, setLbLoading] = useState(true)
  const heroRef = useRef(null)

  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const lensScale   = useSpring(useTransform(scrollYProgress, [0, 1], [1, 1.22]), { stiffness: 70, damping: 22 })
  const lensOpacity = useSpring(useTransform(scrollYProgress, [0, 0.7], [1, 0]),  { stiffness: 70, damping: 22 })
  const lensY       = useSpring(useTransform(scrollYProgress, [0, 1], ['0%', '25%']), { stiffness: 70, damping: 22 })
  const textOpacity = useTransform(scrollYProgress, [0, 0.35], [1, 0])
  const textY       = useTransform(scrollYProgress, [0, 0.4],  ['0px', '-36px'])

  useEffect(() => {
    fetchLeaderboard('alltime', 5)
      .then(setLeaderboard).catch(() => {})
      .finally(() => setLbLoading(false))
  }, [])

  return (
    <div style={{ width: '100%', background: '#050508', overflowX: 'hidden' }}>

      {/* ── nav ─────────────────────────────────────────────────────────── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 clamp(20px, 5vw, 60px)',
        background: 'rgba(5,5,8,0.8)',
        backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <span style={{ fontWeight: 900, fontSize: '1.15rem', color: '#fff', letterSpacing: '-0.02em' }}>
          waste<span style={{ color: '#8b5cf6' }}>my</span>tokens
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <a href="/leaderboard" style={{ fontSize: '0.875rem', color: '#64748b', textDecoration: 'none', padding: '6px 14px', borderRadius: 8 }}
            onMouseEnter={e => e.target.style.color = '#fff'} onMouseLeave={e => e.target.style.color = '#64748b'}>
            Leaderboard
          </a>
          <button onClick={() => onAuthClick('login')} style={{ fontSize: '0.875rem', color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 14px', borderRadius: 8 }}
            onMouseEnter={e => e.target.style.color = '#fff'} onMouseLeave={e => e.target.style.color = '#64748b'}>
            Log in
          </button>
          <button onClick={() => onAuthClick('signup')} style={{ fontSize: '0.875rem', fontWeight: 700, color: '#fff', cursor: 'pointer', padding: '9px 20px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
            Get started
          </button>
        </div>
      </nav>

      {/* ── hero ────────────────────────────────────────────────────────── */}
      <section ref={heroRef} style={{ position: 'relative', height: '100vh', minHeight: 640, overflow: 'hidden' }}>

        {/* gravitational lens — scroll parallax */}
        <motion.div style={{ position: 'absolute', inset: 0, zIndex: 0, scale: lensScale, opacity: lensOpacity, y: lensY }}>
          <GravitationalLens />
        </motion.div>

        {/* bottom fade */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 240, zIndex: 1, pointerEvents: 'none', background: 'linear-gradient(to bottom, transparent, #050508)' }} />

        {/* hero copy */}
        <motion.div style={{
          position: 'absolute', inset: 0, zIndex: 2,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          textAlign: 'center', padding: '0 clamp(24px, 7vw, 100px)',
          opacity: textOpacity, y: textY,
        }}>
          <motion.h1
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, delay: 0.2, ease: EXPO }}
            style={{ fontWeight: 900, color: '#fff', fontSize: 'clamp(2.2rem, 5.5vw, 5rem)', letterSpacing: '-0.03em', lineHeight: 1.06, maxWidth: 860, margin: '0 auto' }}
          >
            Every AI bot that hits your site{' '}
            <span style={{ color: '#a78bfa', textShadow: '0 0 50px rgba(167,139,250,0.6)' }}>
              leaves empty-handed.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5, ease: EXPO }}
            style={{ color: '#94a3b8', marginTop: 20, fontSize: 'clamp(0.95rem, 1.8vw, 1.15rem)', lineHeight: 1.75, maxWidth: 500 }}
          >
            A reverse proxy that detects AI crawlers and drowns them in tokens.
            The more you waste, the higher you rank.
          </motion.p>

          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.9, delay: 0.75, ease: EXPO }} style={{ marginTop: 44 }}>
            <TokenCounter />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1, ease: EXPO }}
            style={{ marginTop: 32, display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}
          >
            <motion.button
              whileHover={{ scale: 1.04, filter: 'brightness(1.12)' }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onAuthClick('signup')}
              style={{ fontWeight: 700, color: '#fff', fontSize: '1rem', cursor: 'pointer', padding: '14px 36px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', boxShadow: '0 0 50px rgba(124,58,237,0.6), 0 4px 24px rgba(0,0,0,0.5)' }}
            >
              Start Wasting Tokens
            </motion.button>
            <motion.a
              whileHover={{ scale: 1.03, borderColor: 'rgba(124,58,237,0.5)', color: '#fff' }}
              href="#how-it-works"
              style={{ fontWeight: 600, color: '#94a3b8', fontSize: '1rem', textDecoration: 'none', padding: '14px 36px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)' }}
            >
              How it works
            </motion.a>
          </motion.div>
        </motion.div>

        {/* scroll cue */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }}
          style={{ position: 'absolute', bottom: 28, left: '50%', x: '-50%', zIndex: 3 }}
        >
          <motion.svg
            width="22" height="22" viewBox="0 0 24 24" fill="none"
            animate={{ y: [0, 7, 0] }} transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          >
            <path d="M6 9L12 15L18 9" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </motion.svg>
        </motion.div>
      </section>

      {/* ── how it works ─────────────────────────────────────────────────── */}
      <section id="how-it-works" style={S.section}>
        <div style={S.inner()}>
          {/* section label */}
          <Reveal from={{ opacity: 0, y: 12 }}>
            <p style={{ textAlign: 'center', fontSize: 11, fontWeight: 800, color: '#7c3aed', letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: 16 }}>
              How it works
            </p>
          </Reveal>
          <SweepText delay={0.05} style={{ textAlign: 'center', marginBottom: 'clamp(40px, 5vw, 64px)' }}>
            Three steps from zero<br />to bot-slayer.
          </SweepText>

          {/* 3 cards — each from a different direction */}
          <div style={S.grid3}>
            {STEPS.map((step, i) => (
              <StepCard key={step.num} step={step} delay={i * 0.1} />
            ))}
          </div>
        </div>
      </section>

      <GradientDivider />

      {/* ── three modes ──────────────────────────────────────────────────── */}
      <section style={S.section}>
        <div style={S.inner()}>
          <Reveal from={{ opacity: 0, y: 12 }}>
            <p style={{ textAlign: 'center', fontSize: 11, fontWeight: 800, color: '#7c3aed', letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: 16 }}>
              Response modes
            </p>
          </Reveal>
          <SweepText delay={0.05} style={{ textAlign: 'center', marginBottom: 'clamp(40px, 5vw, 64px)' }}>
            Three modes.<br />Your choice.
          </SweepText>

          <Reveal from={{ opacity: 0, y: 10 }} delay={0.1} style={{ marginBottom: 'clamp(20px, 3vw, 32px)' }}>
            <p style={{ textAlign: 'center', color: '#475569', fontSize: '0.95rem' }}>
              Configure per-agent. Mix and match. Escalate anytime.
            </p>
          </Reveal>

          <div style={S.grid3}>
            {MODES.map((mode, i) => (
              <ModeCard key={mode.name} mode={mode} delay={i * 0.1} />
            ))}
          </div>
        </div>
      </section>

      <GradientDivider />

      {/* ── leaderboard preview ──────────────────────────────────────────── */}
      <section style={S.section}>
        <div style={{ ...S.inner(860) }}>
          <Reveal from={{ opacity: 0, y: 12 }}>
            <p style={{ textAlign: 'center', fontSize: 11, fontWeight: 800, color: '#7c3aed', letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: 16 }}>
              Leaderboard
            </p>
          </Reveal>
          <SweepText delay={0.05} style={{ textAlign: 'center', marginBottom: 8 }}>
            Top token wasters
          </SweepText>
          <Reveal from={{ opacity: 0 }} delay={0.1} style={{ marginBottom: 'clamp(32px, 4vw, 48px)' }}>
            <p style={{ textAlign: 'center', color: '#475569', fontSize: '0.95rem' }}>
              The void keeps score. Are you on the board?
            </p>
          </Reveal>

          <Reveal from={{ opacity: 0, y: 24 }} delay={0.15}>
            <div style={{ borderRadius: 20, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.025)' }}>
              <div style={{ padding: '12px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(124,58,237,0.07)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <motion.span
                  animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 2, repeat: Infinity }}
                  style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px #22c55e', display: 'inline-block' }}
                />
                <span style={{ fontSize: 11, color: '#475569', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                  Live — updated every 30s
                </span>
              </div>
              <div style={{ padding: 24 }}>
                <AnimatedLeaderboard rows={leaderboard} loading={lbLoading} />
              </div>
            </div>
          </Reveal>

          <Reveal from={{ opacity: 0 }} delay={0.25} style={{ textAlign: 'center', marginTop: 20 }}>
            <a href="/leaderboard" style={{ color: '#7c3aed', fontSize: '0.875rem', fontWeight: 700, textDecoration: 'none' }}>
              View full leaderboard →
            </a>
          </Reveal>
        </div>
      </section>

      {/* ── final CTA ────────────────────────────────────────────────────── */}
      <section style={{ ...S.section, paddingBottom: 'clamp(80px, 10vh, 140px)' }}>
        <div style={{ maxWidth: 680, margin: '0 auto', width: '100%' }}>
          <Reveal from={{ opacity: 0, y: 40 }}>
            <div style={{
              position: 'relative', overflow: 'hidden', borderRadius: 28,
              padding: 'clamp(48px, 7vw, 80px) clamp(32px, 5vw, 64px)',
              textAlign: 'center',
              background: 'radial-gradient(ellipse at 50% -10%, rgba(109,40,217,0.35) 0%, rgba(5,5,8,0) 70%)',
              border: '1px solid rgba(124,58,237,0.25)',
            }}>
              {/* pulsing glow */}
              <motion.div
                style={{ position: 'absolute', inset: 0, borderRadius: 28, pointerEvents: 'none', boxShadow: '0 0 80px rgba(109,40,217,0.2) inset' }}
                animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              />
              <h2 style={{ ...S.heading, position: 'relative', zIndex: 1, fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)' }}>
                The internet is full of bots.<br />
                <span style={{ color: '#a78bfa' }}>Make them pay for it.</span>
              </h2>
              <p style={{ color: '#64748b', marginTop: 16, fontSize: '1rem', position: 'relative', zIndex: 1 }}>
                Free to deploy. Open source proxy. Public ranking. Start wasting.
              </p>
              <div style={{ position: 'relative', zIndex: 1, marginTop: 32 }}>
                <motion.button
                  whileHover={{ scale: 1.04, filter: 'brightness(1.12)' }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => onAuthClick('signup')}
                  style={{ fontWeight: 700, color: '#fff', fontSize: '1.05rem', cursor: 'pointer', padding: '16px 44px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', boxShadow: '0 0 50px rgba(124,58,237,0.55)' }}
                >
                  Start Wasting Tokens
                </motion.button>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── footer ────────────────────────────────────────────────────────── */}
      <footer style={{ textAlign: 'center', padding: '24px 24px 36px', borderTop: '1px solid rgba(255,255,255,0.05)', color: '#334155', fontSize: '0.8rem' }}>
        wastemy<span style={{ color: '#6d28d9' }}>tokens</span> · built for the leaderboard · not responsible for angry AI companies
      </footer>

    </div>
  )
}
