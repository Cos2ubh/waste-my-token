import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import BlackHole from '../components/BlackHole'
import TokenCounter from '../components/TokenCounter'
import Leaderboard from '../components/Leaderboard'
import { fetchLeaderboard } from '../lib/api'

const STEPS = [
  {
    num: '01',
    title: 'Deploy the proxy',
    body: 'Drop our Node.js reverse proxy in front of your site. One env var, five minutes.',
    icon: '⚡',
  },
  {
    num: '02',
    title: 'Bots get bombed',
    body: 'Every AI crawler that hits your domain gets flooded with ~368K tokens of pure void. Their context window fills. They leave empty.',
    icon: '💀',
  },
  {
    num: '03',
    title: 'Watch your rank climb',
    body: 'Every token wasted earns you a spot on the public leaderboard. More waste = higher rank. Top wasters make the news.',
    icon: '🏆',
  },
]

const MODES = [
  { name: 'Black Hole', desc: 'Floods context with 368K tokens of filler. Instant overwhelm.', color: 'from-violet-900/40 to-violet-800/20', dot: 'bg-violet-500' },
  { name: 'Tarpit', desc: 'Slow drip response that never completes. Wastes their time and tokens.', color: 'from-orange-900/40 to-orange-800/20', dot: 'bg-orange-500' },
  { name: 'White Hole', desc: 'Clean feed for authorized agents. Whitelist the bots you trust.', color: 'from-blue-900/40 to-blue-800/20', dot: 'bg-blue-500' },
]

export default function Landing({ onAuthClick }) {
  const [leaderboard, setLeaderboard] = useState([])
  const [lbLoading, setLbLoading] = useState(true)

  useEffect(() => {
    fetchLeaderboard('alltime', 5)
      .then(setLeaderboard)
      .catch(() => {})
      .finally(() => setLbLoading(false))
  }, [])

  return (
    <div className="min-h-screen" style={{ background: '#050508' }}>

      {/* ── nav ──────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between"
        style={{ background: 'rgba(5,5,8,0.8)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <span className="font-black text-lg tracking-tight text-white">
          waste<span className="text-violet-500">my</span>token
        </span>
        <div className="flex items-center gap-4">
          <a href="/leaderboard" className="text-sm text-slate-400 hover:text-white transition-colors">Leaderboard</a>
          <button
            onClick={() => onAuthClick('login')}
            className="text-sm text-slate-400 hover:text-white transition-colors"
          >
            Log in
          </button>
          <button
            onClick={() => onAuthClick('signup')}
            className="text-sm font-semibold px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white transition-colors"
          >
            Get started
          </button>
        </div>
      </nav>

      {/* ── hero ─────────────────────────────────────────────────────── */}
      <section className="relative flex flex-col items-center justify-center pt-20" style={{ minHeight: '100vh' }}>

        {/* black hole canvas */}
        <div className="relative w-full flex justify-center" style={{ height: '60vh', minHeight: 360 }}>
          <div className="absolute inset-0">
            <BlackHole className="opacity-100" />
          </div>

          {/* tagline over the hole */}
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 px-6 text-center pointer-events-none">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tight text-white max-w-3xl leading-tight"
            >
              Every AI bot that hits your site{' '}
              <span className="glow-purple" style={{ color: '#a78bfa' }}>
                leaves empty-handed.
              </span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.55 }}
              className="mt-4 text-slate-400 text-lg max-w-xl"
            >
              A reverse proxy that detects AI crawlers and drowns them in tokens.
              The more you waste, the higher you rank.
            </motion.p>
          </div>
        </div>

        {/* live counter */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.9 }}
          className="mt-2 mb-8 px-6"
        >
          <TokenCounter />
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.1 }}
          className="flex gap-4 flex-wrap justify-center px-6"
        >
          <button
            onClick={() => onAuthClick('signup')}
            className="px-8 py-4 rounded-xl font-bold text-lg text-white transition-all duration-200 hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #6d28d9, #4f46e5)', boxShadow: '0 0 40px rgba(109,40,217,0.5)' }}
          >
            Start Wasting Tokens
          </button>
          <a
            href="#how-it-works"
            className="px-8 py-4 rounded-xl font-bold text-lg text-slate-300 border border-white/10 hover:border-violet-500/50 hover:text-white transition-all duration-200"
          >
            How it works
          </a>
        </motion.div>

        {/* scroll hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8 }}
          className="absolute bottom-8 flex flex-col items-center gap-1.5"
        >
          <span className="text-xs text-slate-600 uppercase tracking-widest">scroll</span>
          <div className="w-px h-8 bg-gradient-to-b from-slate-600 to-transparent" />
        </motion.div>
      </section>

      {/* ── how it works ─────────────────────────────────────────────── */}
      <section id="how-it-works" className="px-6 py-24 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">
            How it works
          </h2>
          <p className="text-slate-400 mt-3">Three steps from zero to bot-slayer.</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="relative p-6 rounded-2xl border border-white/10 hover:border-violet-500/40 transition-colors"
              style={{ background: 'rgba(255,255,255,0.03)' }}
            >
              <span className="text-4xl">{step.icon}</span>
              <div className="mt-4 text-xs font-black text-violet-500 tracking-widest uppercase">{step.num}</div>
              <h3 className="mt-1 text-lg font-bold text-white">{step.title}</h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">{step.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── response modes ───────────────────────────────────────────── */}
      <section className="px-6 py-16 max-w-5xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl font-black text-white text-center mb-10"
        >
          Three modes. Your choice.
        </motion.h2>
        <div className="grid md:grid-cols-3 gap-4">
          {MODES.map((m, i) => (
            <motion.div
              key={m.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`p-5 rounded-2xl bg-gradient-to-br ${m.color} border border-white/10`}
            >
              <div className="flex items-center gap-2 mb-3">
                <span className={`w-2.5 h-2.5 rounded-full ${m.dot}`} />
                <span className="font-bold text-white">{m.name}</span>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">{m.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── leaderboard preview ──────────────────────────────────────── */}
      <section className="px-6 py-20 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h2 className="text-3xl font-black text-white">Top token wasters</h2>
          <p className="text-slate-400 mt-2">The void rewards the committed.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-white/10 p-6"
          style={{ background: 'rgba(255,255,255,0.03)' }}
        >
          <Leaderboard rows={leaderboard} loading={lbLoading} preview />
        </motion.div>

        <div className="text-center mt-6">
          <a
            href="/leaderboard"
            className="text-sm text-violet-400 hover:text-violet-300 font-semibold transition-colors"
          >
            View full leaderboard →
          </a>
        </div>
      </section>

      {/* ── final CTA ────────────────────────────────────────────────── */}
      <section className="px-6 py-24 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto p-10 rounded-3xl border border-violet-500/30"
          style={{ background: 'radial-gradient(circle at 50% 0%, rgba(109,40,217,0.2) 0%, rgba(5,5,8,0) 70%)' }}
        >
          <h2 className="text-3xl md:text-4xl font-black text-white leading-tight">
            The internet is full of bots.<br />
            <span style={{ color: '#a78bfa' }}>Make them pay for it.</span>
          </h2>
          <p className="mt-4 text-slate-400">
            Free to deploy. Open source proxy. Public ranking. Start wasting.
          </p>
          <button
            onClick={() => onAuthClick('signup')}
            className="mt-8 px-10 py-4 rounded-xl font-bold text-lg text-white transition-all duration-200 hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #6d28d9, #4f46e5)', boxShadow: '0 0 40px rgba(109,40,217,0.4)' }}
          >
            Start Wasting Tokens
          </button>
        </motion.div>
      </section>

      {/* ── footer ───────────────────────────────────────────────────── */}
      <footer className="px-6 py-8 text-center text-slate-600 text-sm border-t border-white/5">
        <p>wastemy<span className="text-violet-700">token</span> · built for the leaderboard · not responsible for angry AI companies</p>
      </footer>

    </div>
  )
}
