import { useEffect, useState, useRef } from 'react'
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from 'framer-motion'
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
    color: 'rgba(109,40,217,0.15)',
    border: 'rgba(109,40,217,0.3)',
  },
  {
    num: '02',
    title: 'Bots get bombed',
    body: 'Every AI crawler that hits your domain gets flooded with ~368K tokens of pure void. Their context window fills. They leave empty.',
    icon: '💀',
    color: 'rgba(239,68,68,0.1)',
    border: 'rgba(239,68,68,0.25)',
  },
  {
    num: '03',
    title: 'Watch your rank climb',
    body: 'Every token wasted earns you a spot on the public leaderboard. More waste = higher rank. Top wasters make the news.',
    icon: '🏆',
    color: 'rgba(59,130,246,0.12)',
    border: 'rgba(59,130,246,0.25)',
  },
]

const MODES = [
  {
    name: 'Black Hole',
    desc: 'Floods context with 368K tokens of filler. Instant overwhelm, immediate context death.',
    color: 'rgba(109,40,217,0.12)',
    border: 'rgba(109,40,217,0.3)',
    dot: '#7c3aed',
    glow: '0 0 20px rgba(109,40,217,0.3)',
  },
  {
    name: 'Tarpit',
    desc: 'Slow-drips a response that never completes. Wastes their compute, their time, their tokens.',
    color: 'rgba(234,88,12,0.12)',
    border: 'rgba(234,88,12,0.3)',
    dot: '#ea580c',
    glow: '0 0 20px rgba(234,88,12,0.3)',
  },
  {
    name: 'White Hole',
    desc: 'Clean structured feed for authorized agents. Whitelist the bots you actually want.',
    color: 'rgba(59,130,246,0.12)',
    border: 'rgba(59,130,246,0.3)',
    dot: '#3b82f6',
    glow: '0 0 20px rgba(59,130,246,0.3)',
  },
]

// ── scroll-animated section wrapper ──────────────────────────────────────────

function FadeUp({ children, delay = 0, className = '' }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}

// ── step card ─────────────────────────────────────────────────────────────────

function StepCard({ step, index }) {
  return (
    <FadeUp delay={index * 0.12}>
      <div
        className="relative h-full p-8 rounded-2xl flex flex-col gap-4"
        style={{
          background: step.color,
          border: `1px solid ${step.border}`,
        }}
      >
        <span className="text-5xl">{step.icon}</span>
        <span className="text-xs font-black text-violet-500 tracking-[0.2em] uppercase">{step.num}</span>
        <h3 className="text-xl font-black text-white">{step.title}</h3>
        <p className="text-slate-400 leading-relaxed text-sm">{step.body}</p>
      </div>
    </FadeUp>
  )
}

// ── mode card ─────────────────────────────────────────────────────────────────

function ModeCard({ mode, index }) {
  const [hovered, setHovered] = useState(false)
  return (
    <FadeUp delay={index * 0.1}>
      <motion.div
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
        animate={{ boxShadow: hovered ? mode.glow : 'none' }}
        transition={{ duration: 0.3 }}
        className="p-7 rounded-2xl h-full flex flex-col gap-4"
        style={{ background: mode.color, border: `1px solid ${mode.border}`, cursor: 'default' }}
      >
        <div className="flex items-center gap-3">
          <span
            className="w-3 h-3 rounded-full shrink-0"
            style={{ background: mode.dot, boxShadow: `0 0 8px ${mode.dot}` }}
          />
          <span className="font-black text-white text-lg">{mode.name}</span>
        </div>
        <p className="text-slate-300 text-sm leading-relaxed">{mode.desc}</p>
      </motion.div>
    </FadeUp>
  )
}

// ── main component ────────────────────────────────────────────────────────────

export default function Landing({ onAuthClick }) {
  const [leaderboard, setLeaderboard] = useState([])
  const [lbLoading, setLbLoading] = useState(true)
  const heroRef = useRef(null)

  // scroll-driven parallax on the black hole
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  })
  const rawScale = useTransform(scrollYProgress, [0, 1], [1, 1.15])
  const rawOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0])
  const rawY = useTransform(scrollYProgress, [0, 1], ['0%', '20%'])
  const scale = useSpring(rawScale, { stiffness: 80, damping: 20 })
  const opacity = useSpring(rawOpacity, { stiffness: 80, damping: 20 })
  const y = useSpring(rawY, { stiffness: 80, damping: 20 })

  // hero text fades out faster
  const textOpacity = useTransform(scrollYProgress, [0, 0.4], [1, 0])
  const textY = useTransform(scrollYProgress, [0, 0.5], ['0px', '-48px'])

  useEffect(() => {
    fetchLeaderboard('alltime', 5)
      .then(setLeaderboard)
      .catch(() => {})
      .finally(() => setLbLoading(false))
  }, [])

  return (
    <div className="w-full" style={{ background: '#050508' }}>

      {/* ── fixed nav ─────────────────────────────────────────────────── */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-10"
        style={{
          height: 64,
          background: 'rgba(5,5,8,0.75)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <span className="font-black text-xl tracking-tight text-white select-none">
          waste<span style={{ color: '#8b5cf6' }}>my</span>tokens
        </span>
        <div className="flex items-center gap-2 md:gap-4">
          <a href="/leaderboard" className="hidden sm:block text-sm text-slate-400 hover:text-white transition-colors px-2 py-1">
            Leaderboard
          </a>
          <button
            onClick={() => onAuthClick('login')}
            className="text-sm text-slate-400 hover:text-white transition-colors px-3 py-1.5"
          >
            Log in
          </button>
          <button
            onClick={() => onAuthClick('signup')}
            className="text-sm font-semibold px-4 py-2 rounded-lg text-white transition-all hover:brightness-110"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
          >
            Get started
          </button>
        </div>
      </nav>

      {/* ── hero ──────────────────────────────────────────────────────── */}
      <section
        ref={heroRef}
        className="relative overflow-hidden"
        style={{ height: '100vh', minHeight: 640 }}
      >
        {/* black hole — scroll-parallax container */}
        <motion.div
          className="absolute inset-0 z-0"
          style={{ scale, opacity, y }}
        >
          <BlackHole />
        </motion.div>

        {/* bottom fade into page background */}
        <div
          className="absolute bottom-0 left-0 right-0 z-10 pointer-events-none"
          style={{
            height: 200,
            background: 'linear-gradient(to bottom, transparent, #050508)',
          }}
        />

        {/* hero content */}
        <motion.div
          className="absolute inset-0 z-20 flex flex-col items-center justify-center px-6 text-center"
          style={{ opacity: textOpacity, y: textY }}
        >
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <h1
              className="font-black leading-tight tracking-tight text-white"
              style={{ fontSize: 'clamp(2rem, 5.5vw, 4.5rem)', maxWidth: 800 }}
            >
              Every AI bot that hits your site{' '}
              <span style={{ color: '#a78bfa', textShadow: '0 0 30px rgba(167,139,250,0.5)' }}>
                leaves empty-handed.
              </span>
            </h1>
          </motion.div>

          <motion.p
            className="mt-5 text-slate-400 max-w-lg"
            style={{ fontSize: 'clamp(1rem, 2vw, 1.2rem)', lineHeight: 1.7 }}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.45 }}
          >
            A reverse proxy that detects AI crawlers and drowns them in tokens.
            The more you waste, the higher you rank.
          </motion.p>

          {/* live counter */}
          <motion.div
            className="mt-10"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.7 }}
          >
            <TokenCounter />
          </motion.div>

          {/* CTAs */}
          <motion.div
            className="mt-8 flex flex-wrap gap-3 justify-center"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.9 }}
          >
            <button
              onClick={() => onAuthClick('signup')}
              className="font-bold text-white rounded-xl transition-all hover:scale-105 active:scale-95"
              style={{
                padding: '14px 32px',
                fontSize: '1rem',
                background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                boxShadow: '0 0 40px rgba(124,58,237,0.5), 0 4px 24px rgba(0,0,0,0.4)',
              }}
            >
              Start Wasting Tokens
            </button>
            <a
              href="#how-it-works"
              className="font-semibold text-slate-300 rounded-xl transition-all hover:text-white hover:border-violet-500/50"
              style={{
                padding: '14px 32px',
                fontSize: '1rem',
                border: '1px solid rgba(255,255,255,0.12)',
                background: 'rgba(255,255,255,0.04)',
              }}
            >
              How it works
            </a>
          </motion.div>
        </motion.div>

        {/* scroll cue */}
        <motion.div
          className="absolute bottom-10 left-1/2 z-20 flex flex-col items-center gap-2"
          style={{ x: '-50%' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6 }}
        >
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M5 7.5L10 12.5L15 7.5" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </motion.div>
        </motion.div>
      </section>

      {/* ── how it works ────────────────────────────────────────────── */}
      <section id="how-it-works" className="w-full" style={{ padding: '96px 24px' }}>
        <div style={{ maxWidth: 1024, margin: '0 auto' }}>
          <FadeUp className="text-center mb-16">
            <h2 className="font-black text-white" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)' }}>
              How it works
            </h2>
            <p className="text-slate-500 mt-3">Three steps from zero to bot-slayer.</p>
          </FadeUp>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            {STEPS.map((step, i) => (
              <StepCard key={step.num} step={step} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ── divider ─────────────────────────────────────────────────── */}
      <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(124,58,237,0.4), transparent)', margin: '0 24px' }} />

      {/* ── response modes ──────────────────────────────────────────── */}
      <section className="w-full" style={{ padding: '96px 24px' }}>
        <div style={{ maxWidth: 1024, margin: '0 auto' }}>
          <FadeUp className="text-center mb-16">
            <h2 className="font-black text-white" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)' }}>
              Three modes. Your choice.
            </h2>
            <p className="text-slate-500 mt-3">Configure per-agent. Mix and match. Escalate anytime.</p>
          </FadeUp>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
            {MODES.map((mode, i) => (
              <ModeCard key={mode.name} mode={mode} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ── leaderboard preview ─────────────────────────────────────── */}
      <section className="w-full" style={{ padding: '48px 24px 96px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <FadeUp className="text-center mb-12">
            <h2 className="font-black text-white" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)' }}>
              Top token wasters
            </h2>
            <p className="text-slate-500 mt-3">The void keeps score. Are you on the board?</p>
          </FadeUp>

          <FadeUp delay={0.1}>
            <div
              className="rounded-2xl overflow-hidden"
              style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}
            >
              <div
                className="px-6 py-4"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(124,58,237,0.08)' }}
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500" style={{ boxShadow: '0 0 8px #22c55e' }} />
                  <span className="text-xs text-slate-400 font-semibold uppercase tracking-widest">Live — updated every 30s</span>
                </div>
              </div>
              <div className="px-6 py-4">
                <Leaderboard rows={leaderboard} loading={lbLoading} preview />
              </div>
            </div>
          </FadeUp>

          <FadeUp delay={0.2} className="text-center mt-6">
            <a
              href="/leaderboard"
              className="text-sm font-semibold transition-colors"
              style={{ color: '#a78bfa' }}
            >
              View full leaderboard →
            </a>
          </FadeUp>
        </div>
      </section>

      {/* ── final CTA ────────────────────────────────────────────────── */}
      <section className="w-full" style={{ padding: '48px 24px 120px' }}>
        <FadeUp>
          <div
            className="relative overflow-hidden rounded-3xl text-center mx-auto"
            style={{
              maxWidth: 720,
              padding: '72px 48px',
              background: 'radial-gradient(ellipse at 50% 0%, rgba(109,40,217,0.3) 0%, rgba(5,5,8,0) 70%)',
              border: '1px solid rgba(124,58,237,0.25)',
            }}
          >
            {/* subtle animated border glow */}
            <motion.div
              className="absolute inset-0 rounded-3xl pointer-events-none"
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              style={{ boxShadow: '0 0 60px rgba(109,40,217,0.2) inset' }}
            />

            <h2 className="font-black text-white relative z-10" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)', lineHeight: 1.2 }}>
              The internet is full of bots.<br />
              <span style={{ color: '#a78bfa' }}>Make them pay for it.</span>
            </h2>
            <p className="text-slate-400 mt-4 relative z-10" style={{ fontSize: '1.05rem' }}>
              Free to deploy. Open source proxy. Public ranking. Start wasting.
            </p>
            <button
              onClick={() => onAuthClick('signup')}
              className="relative z-10 font-bold text-white rounded-xl transition-all hover:scale-105 active:scale-95 mt-10"
              style={{
                padding: '16px 40px',
                fontSize: '1.05rem',
                background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                boxShadow: '0 0 50px rgba(124,58,237,0.5)',
              }}
            >
              Start Wasting Tokens
            </button>
          </div>
        </FadeUp>
      </section>

      {/* ── footer ────────────────────────────────────────────────────── */}
      <footer
        className="text-center text-slate-600 text-sm"
        style={{ padding: '28px 24px 36px', borderTop: '1px solid rgba(255,255,255,0.05)' }}
      >
        <p>
          wastemy<span style={{ color: '#6d28d9' }}>tokens</span> · built for the leaderboard · not responsible for angry AI companies
        </p>
      </footer>

    </div>
  )
}
