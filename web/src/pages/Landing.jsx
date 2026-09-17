import { useEffect, useState, useRef } from 'react'
import { motion, useScroll, useTransform, useSpring } from 'framer-motion'
import BlackHole from '../components/BlackHole'
import TokenCounter from '../components/TokenCounter'
import Leaderboard from '../components/Leaderboard'
import { fetchLeaderboard } from '../lib/api'

// ── data ──────────────────────────────────────────────────────────────────────

const STEPS = [
  {
    num: '01',
    title: 'Deploy the proxy',
    body: 'Drop our Node.js reverse proxy in front of your site. One env var, five minutes, no downtime.',
    icon: '⚡',
    accent: '#7c3aed',
  },
  {
    num: '02',
    title: 'Bots get bombed',
    body: 'Every AI crawler gets flooded with ~368K tokens of pure void. Their context window fills. They leave empty.',
    icon: '💀',
    accent: '#dc2626',
  },
  {
    num: '03',
    title: 'Watch your rank climb',
    body: 'Every token wasted earns you a spot on the public leaderboard. More waste = higher rank. Top wasters make the news.',
    icon: '🏆',
    accent: '#2563eb',
  },
]

const MODES = [
  {
    name: 'Black Hole',
    desc: 'Floods context with 368K tokens of filler. Instant overwhelm, immediate context death.',
    dot: '#7c3aed',
    bg: 'rgba(124,58,237,0.08)',
    border: 'rgba(124,58,237,0.25)',
    glow: '0 0 24px rgba(124,58,237,0.35)',
  },
  {
    name: 'Tarpit',
    desc: 'Slow-drips a response that never completes. Wastes their compute, their time, their tokens.',
    dot: '#ea580c',
    bg: 'rgba(234,88,12,0.08)',
    border: 'rgba(234,88,12,0.25)',
    glow: '0 0 24px rgba(234,88,12,0.35)',
  },
  {
    name: 'White Hole',
    desc: 'Clean structured feed for authorized agents. Whitelist the bots you actually want in.',
    dot: '#2563eb',
    bg: 'rgba(37,99,235,0.08)',
    border: 'rgba(37,99,235,0.25)',
    glow: '0 0 24px rgba(37,99,235,0.35)',
  },
]

// ── layout helpers ─────────────────────────────────────────────────────────────

// Section wrapper — consistent padding + centered max-width container
function Section({ children, id, style = {}, innerStyle = {} }) {
  return (
    <section
      id={id}
      style={{
        width: '100%',
        padding: 'clamp(80px, 10vw, 140px) clamp(32px, 7vw, 100px)',
        ...style,
      }}
    >
      <div style={{ maxWidth: 1080, margin: '0 auto', width: '100%', ...innerStyle }}>
        {children}
      </div>
    </section>
  )
}

// Fade-up on scroll — ALWAYS block + full width so children can use margin:auto
function FadeUp({ children, delay = 0, className = '', style = {} }) {
  return (
    <motion.div
      className={className}
      style={{ display: 'block', width: '100%', ...style }}
      initial={{ opacity: 0, y: 36 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}

// Stagger children on scroll
function FadeStagger({ children, stagger = 0.1 }) {
  return (
    <motion.div
      style={{ display: 'contents' }}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-60px' }}
      variants={{ visible: { transition: { staggerChildren: stagger } } }}
    >
      {children}
    </motion.div>
  )
}

function FadeItem({ children, style = {}, className = '' }) {
  return (
    <motion.div
      className={className}
      style={style}
      variants={{
        hidden: { opacity: 0, y: 32 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } },
      }}
    >
      {children}
    </motion.div>
  )
}

// Section heading block
function SectionHead({ title, sub }) {
  return (
    <FadeUp>
      <div style={{ textAlign: 'center', marginBottom: 'clamp(48px, 6vw, 80px)' }}>
        <h2
          style={{
            fontWeight: 900,
            color: '#fff',
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            letterSpacing: '-0.02em',
            lineHeight: 1.15,
            margin: 0,
          }}
        >
          {title}
        </h2>
        {sub && (
          <p style={{ color: '#64748b', marginTop: 12, fontSize: '1.05rem' }}>{sub}</p>
        )}
      </div>
    </FadeUp>
  )
}

// ── cards ──────────────────────────────────────────────────────────────────────

function StepCard({ step }) {
  return (
    <FadeItem>
      <div
        style={{
          height: '100%',
          padding: 'clamp(28px, 3vw, 44px)',
          borderRadius: 20,
          background: `radial-gradient(ellipse at 0% 0%, ${step.accent}18 0%, transparent 65%)`,
          border: `1px solid ${step.accent}40`,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <span style={{ fontSize: 44 }}>{step.icon}</span>
        <span
          style={{
            fontSize: 11,
            fontWeight: 800,
            color: step.accent,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
          }}
        >
          {step.num}
        </span>
        <h3 style={{ fontWeight: 800, color: '#fff', fontSize: '1.2rem', margin: 0 }}>
          {step.title}
        </h3>
        <p style={{ color: '#94a3b8', lineHeight: 1.75, margin: 0, fontSize: '0.95rem' }}>
          {step.body}
        </p>
      </div>
    </FadeItem>
  )
}

function ModeCard({ mode }) {
  const [hovered, setHovered] = useState(false)
  return (
    <FadeItem>
      <motion.div
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
        animate={{ boxShadow: hovered ? mode.glow : '0 0 0px transparent' }}
        transition={{ duration: 0.3 }}
        style={{
          padding: 'clamp(24px, 2.5vw, 36px)',
          borderRadius: 16,
          background: mode.bg,
          border: `1px solid ${mode.border}`,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          height: '100%',
          cursor: 'default',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: mode.dot,
              boxShadow: `0 0 8px ${mode.dot}`,
              flexShrink: 0,
            }}
          />
          <span style={{ fontWeight: 800, color: '#fff', fontSize: '1.05rem' }}>{mode.name}</span>
        </div>
        <p style={{ color: '#cbd5e1', fontSize: '0.9rem', lineHeight: 1.75, margin: 0 }}>
          {mode.desc}
        </p>
      </motion.div>
    </FadeItem>
  )
}

// ── main ───────────────────────────────────────────────────────────────────────

export default function Landing({ onAuthClick }) {
  const [leaderboard, setLeaderboard] = useState([])
  const [lbLoading, setLbLoading] = useState(true)
  const heroRef = useRef(null)

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  })

  const rawScale = useTransform(scrollYProgress, [0, 1], [1, 1.18])
  const rawOpacity = useTransform(scrollYProgress, [0, 0.65], [1, 0])
  const rawY = useTransform(scrollYProgress, [0, 1], ['0%', '22%'])
  const scale = useSpring(rawScale, { stiffness: 70, damping: 20 })
  const opacity = useSpring(rawOpacity, { stiffness: 70, damping: 20 })
  const y = useSpring(rawY, { stiffness: 70, damping: 20 })
  const textOpacity = useTransform(scrollYProgress, [0, 0.38], [1, 0])
  const textY = useTransform(scrollYProgress, [0, 0.45], ['0px', '-40px'])

  useEffect(() => {
    fetchLeaderboard('alltime', 5)
      .then(setLeaderboard)
      .catch(() => {})
      .finally(() => setLbLoading(false))
  }, [])

  return (
    <div style={{ width: '100%', background: '#050508', overflowX: 'hidden' }}>

      {/* ── nav ──────────────────────────────────────────────────────────── */}
      <nav
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 clamp(20px, 5vw, 60px)',
          background: 'rgba(5,5,8,0.8)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <span style={{ fontWeight: 900, fontSize: '1.15rem', color: '#fff', letterSpacing: '-0.02em' }}>
          waste<span style={{ color: '#8b5cf6' }}>my</span>tokens
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <a
            href="/leaderboard"
            style={{
              fontSize: '0.875rem', color: '#94a3b8', textDecoration: 'none',
              padding: '6px 12px', borderRadius: 8, transition: 'color 0.2s',
            }}
            onMouseEnter={e => e.target.style.color = '#fff'}
            onMouseLeave={e => e.target.style.color = '#94a3b8'}
          >
            Leaderboard
          </a>
          <button
            onClick={() => onAuthClick('login')}
            style={{
              fontSize: '0.875rem', color: '#94a3b8', background: 'none',
              border: 'none', cursor: 'pointer', padding: '6px 12px', borderRadius: 8,
            }}
          >
            Log in
          </button>
          <button
            onClick={() => onAuthClick('signup')}
            style={{
              fontSize: '0.875rem', fontWeight: 700, color: '#fff', cursor: 'pointer',
              padding: '8px 18px', borderRadius: 10, border: 'none',
              background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
            }}
          >
            Get started
          </button>
        </div>
      </nav>

      {/* ── hero ──────────────────────────────────────────────────────────── */}
      <section
        ref={heroRef}
        style={{ position: 'relative', height: '100vh', minHeight: 640, overflow: 'hidden' }}
      >
        {/* black hole — scroll parallax */}
        <motion.div style={{ position: 'absolute', inset: 0, zIndex: 0, scale, opacity, y }}>
          <BlackHole />
        </motion.div>

        {/* bottom fade */}
        <div
          style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            height: 220, zIndex: 1, pointerEvents: 'none',
            background: 'linear-gradient(to bottom, transparent, #050508)',
          }}
        />

        {/* hero text */}
        <motion.div
          style={{
            position: 'absolute', inset: 0, zIndex: 2,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            textAlign: 'center',
            padding: '0 clamp(24px, 6vw, 80px)',
            opacity: textOpacity,
            y: textY,
          }}
        >
          <motion.h1
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            style={{
              fontWeight: 900,
              color: '#fff',
              fontSize: 'clamp(2.2rem, 5.5vw, 4.8rem)',
              letterSpacing: '-0.03em',
              lineHeight: 1.1,
              maxWidth: 820,
              margin: '0 auto',
            }}
          >
            Every AI bot that hits your site{' '}
            <span style={{ color: '#a78bfa', textShadow: '0 0 40px rgba(167,139,250,0.5)' }}>
              leaves empty-handed.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
            style={{
              color: '#94a3b8', marginTop: 24,
              fontSize: 'clamp(1rem, 2vw, 1.2rem)',
              lineHeight: 1.7, maxWidth: 520,
            }}
          >
            A reverse proxy that detects AI crawlers and drowns them in tokens.
            The more you waste, the higher you rank.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            style={{ marginTop: 48 }}
          >
            <TokenCounter />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.95 }}
            style={{ marginTop: 36, display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}
          >
            <button
              onClick={() => onAuthClick('signup')}
              style={{
                fontWeight: 700, color: '#fff', fontSize: '1rem', cursor: 'pointer',
                padding: '14px 36px', borderRadius: 14, border: 'none',
                background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                boxShadow: '0 0 50px rgba(124,58,237,0.55), 0 4px 20px rgba(0,0,0,0.5)',
                transition: 'transform 0.15s, filter 0.15s',
              }}
              onMouseEnter={e => { e.target.style.filter = 'brightness(1.1)'; e.target.style.transform = 'scale(1.03)' }}
              onMouseLeave={e => { e.target.style.filter = ''; e.target.style.transform = '' }}
            >
              Start Wasting Tokens
            </button>
            <a
              href="#how-it-works"
              style={{
                fontWeight: 600, color: '#cbd5e1', fontSize: '1rem', textDecoration: 'none',
                padding: '14px 36px', borderRadius: 14,
                border: '1px solid rgba(255,255,255,0.12)',
                background: 'rgba(255,255,255,0.04)',
                transition: 'color 0.2s, border-color 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(124,58,237,0.5)' }}
              onMouseLeave={e => { e.currentTarget.style.color = '#cbd5e1'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)' }}
            >
              How it works
            </a>
          </motion.div>
        </motion.div>

        {/* scroll cue */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8 }}
          style={{
            position: 'absolute', bottom: 32, left: '50%',
            transform: 'translateX(-50%)', zIndex: 3,
          }}
        >
          <motion.svg
            width="24" height="24" viewBox="0 0 24 24" fill="none"
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          >
            <path d="M6 9L12 15L18 9" stroke="rgba(255,255,255,0.22)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </motion.svg>
        </motion.div>
      </section>

      {/* ── how it works ─────────────────────────────────────────────────── */}
      <Section id="how-it-works">
        <SectionHead title="How it works" sub="Three steps from zero to bot-slayer." />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 'clamp(16px, 2.5vw, 32px)',
          }}
        >
          <FadeStagger>
            {STEPS.map((step) => <StepCard key={step.num} step={step} />)}
          </FadeStagger>
        </div>
      </Section>

      {/* divider */}
      <div
        style={{
          height: 1,
          margin: '0 clamp(32px, 8vw, 120px)',
          background: 'linear-gradient(90deg, transparent, rgba(124,58,237,0.4), transparent)',
        }}
      />

      {/* ── three modes ──────────────────────────────────────────────────── */}
      <Section>
        <SectionHead
          title="Three modes. Your choice."
          sub="Configure per-agent. Mix and match. Escalate anytime."
        />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 'clamp(14px, 2vw, 24px)',
          }}
        >
          <FadeStagger>
            {MODES.map((mode) => <ModeCard key={mode.name} mode={mode} />)}
          </FadeStagger>
        </div>
      </Section>

      {/* ── leaderboard preview ──────────────────────────────────────────── */}
      <Section innerStyle={{ maxWidth: 860 }}>
        <SectionHead
          title="Top token wasters"
          sub="The void keeps score. Are you on the board?"
        />
        <FadeUp>
          <div
            style={{
              borderRadius: 20,
              overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(255,255,255,0.025)',
            }}
          >
            <div
              style={{
                padding: '14px 24px',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                background: 'rgba(124,58,237,0.08)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span
                style={{
                  width: 7, height: 7, borderRadius: '50%',
                  background: '#22c55e', boxShadow: '0 0 8px #22c55e', flexShrink: 0,
                }}
              />
              <span style={{ fontSize: 11, color: '#64748b', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                Live — updated every 30s
              </span>
            </div>
            <div style={{ padding: 24 }}>
              <Leaderboard rows={leaderboard} loading={lbLoading} preview />
            </div>
          </div>
        </FadeUp>
        <FadeUp delay={0.15} style={{ textAlign: 'center', marginTop: 24 }}>
          <a
            href="/leaderboard"
            style={{ color: '#a78bfa', fontSize: '0.9rem', fontWeight: 700, textDecoration: 'none' }}
          >
            View full leaderboard →
          </a>
        </FadeUp>
      </Section>

      {/* ── final CTA ────────────────────────────────────────────────────── */}
      <Section style={{ paddingBottom: 'clamp(80px, 12vw, 160px)' }}>
        <FadeUp>
          {/* mx:auto centering — FadeUp is always 100% wide, inner div constrains + centers */}
          <div style={{ maxWidth: 700, margin: '0 auto' }}>
            <div
              style={{
                position: 'relative',
                overflow: 'hidden',
                borderRadius: 28,
                padding: 'clamp(48px, 7vw, 80px) clamp(32px, 5vw, 64px)',
                textAlign: 'center',
                background: 'radial-gradient(ellipse at 50% -10%, rgba(109,40,217,0.35) 0%, rgba(5,5,8,0) 70%)',
                border: '1px solid rgba(124,58,237,0.28)',
              }}
            >
              {/* pulsing inner glow */}
              <motion.div
                style={{
                  position: 'absolute', inset: 0, borderRadius: 28, pointerEvents: 'none',
                  boxShadow: '0 0 80px rgba(109,40,217,0.18) inset',
                }}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
              />

              <h2
                style={{
                  fontWeight: 900, color: '#fff', position: 'relative', zIndex: 1,
                  fontSize: 'clamp(1.8rem, 4vw, 3rem)', letterSpacing: '-0.02em',
                  lineHeight: 1.2, margin: 0,
                }}
              >
                The internet is full of bots.<br />
                <span style={{ color: '#a78bfa' }}>Make them pay for it.</span>
              </h2>
              <p
                style={{
                  color: '#94a3b8', marginTop: 16, fontSize: '1.05rem',
                  position: 'relative', zIndex: 1,
                }}
              >
                Free to deploy. Open source proxy. Public ranking. Start wasting.
              </p>
              <div style={{ position: 'relative', zIndex: 1, marginTop: 36 }}>
                <button
                  onClick={() => onAuthClick('signup')}
                  style={{
                    fontWeight: 700, color: '#fff', fontSize: '1.05rem', cursor: 'pointer',
                    padding: '16px 44px', borderRadius: 14, border: 'none',
                    background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                    boxShadow: '0 0 50px rgba(124,58,237,0.55)',
                    transition: 'transform 0.15s, filter 0.15s',
                  }}
                  onMouseEnter={e => { e.target.style.filter = 'brightness(1.12)'; e.target.style.transform = 'scale(1.03)' }}
                  onMouseLeave={e => { e.target.style.filter = ''; e.target.style.transform = '' }}
                >
                  Start Wasting Tokens
                </button>
              </div>
            </div>
          </div>
        </FadeUp>
      </Section>

      {/* ── footer ────────────────────────────────────────────────────────── */}
      <footer
        style={{
          textAlign: 'center',
          padding: '28px 24px 40px',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          color: '#334155',
          fontSize: '0.85rem',
        }}
      >
        wastemy<span style={{ color: '#6d28d9' }}>tokens</span> · built for the leaderboard · not responsible for angry AI companies
      </footer>

    </div>
  )
}
