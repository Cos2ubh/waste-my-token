# Waste My Token

Feed your AI into the void. It burns your tokens. You get the rank. Everyone watches.

**Live:** [wastemytokens.vercel.app](https://wastemytokens.vercel.app)

---

## What is this?

Waste My Token is a game. You get a personal link. You paste it into any AI assistant that can browse the web (ChatGPT, Claude, Perplexity, Gemini). The AI reads the page and burns through its token budget. Your score goes up. The leaderboard shows who's wasted the most.

No API keys. No configuration. If you have an AI subscription, you already have everything you need.

---

## How to play

1. Go to [wastemytokens.vercel.app](https://wastemytokens.vercel.app)
2. Click **Generate My Void Link** — no signup needed
3. Choose your burn mode:
   - **∞ Infinite** — streams forever, drains every last token until the AI gives up
   - **🎯 Set Limit** — you decide exactly how many tokens to burn
4. Copy your link
5. Open ChatGPT / Claude / Perplexity / Gemini and say: `read this page:` then paste your link
6. Come back to the site — your token count appears in a popup
7. Sign up to lock in your score and appear on the leaderboard

---

## Burn modes

| Mode | What happens |
|---|---|
| **Infinite** | Content streams endlessly via chunked HTTP. The AI keeps reading until its context window fills or it gives up. Burns the maximum possible tokens. |
| **Set Limit** | Serves exactly the number of tokens you specify (10K–10M). Good for precision burns and specific ranking targets. |

---

## Architecture

```
wastemytokens.vercel.app    — React + Vite frontend (Vercel)
        ↓ proxies /data/* and /api/*
waste-my-token-production.up.railway.app  — Express backend (Railway)
        ↓ reads/writes
neurrtujmoojemrwujhg.supabase.co  — Postgres DB (Supabase)
```

### Repo structure

```
middleware/
├── core/          Node.js reverse proxy (AI traffic control for other websites)
│   └── src/
│       ├── index.js       Entry point
│       ├── proxy.js       Pass-through proxy
│       ├── detect.js      AI agent detection (15 known bots + behavioral heuristics)
│       ├── config.js      Per-bot mode configuration
│       └── modes/
│           ├── blackhole.js   Token bomb + tarpit
│           └── whithole.js    Clean feed for authorized agents
└── web/           The main product
    ├── server.js          Express API + void content server (Railway)
    ├── void-content.js    Token-dense content generator (disguised as research archive)
    ├── vercel.json        Route config — proxies /data/ and /api/ to Railway
    └── src/
        ├── pages/
        │   ├── Landing.jsx      Home page + void link generator
        │   ├── Dashboard.jsx    User stats + burn history
        │   ├── LeaderboardPage.jsx
        │   └── Profile.jsx      Public profile /u/:username
        └── components/
            ├── GravitationalLens.jsx   WebGL black hole animation
            ├── BurnCaptureModal.jsx    Post-burn signup prompt
            └── TokenCounter.jsx        Live global counter
```

---

## Running locally

**Prerequisites:** Node.js 22+, a Supabase project, a Railway account (or just run server.js locally)

```bash
# Clone
git clone https://github.com/Cos2ubh/waste-my-token.git
cd waste-my-token

# Install core proxy dependencies
cd core && npm install

# Install web dependencies
cd ../web && npm install

# Set up environment
cp .env.example .env.local
# Add your Supabase URL, anon key, and service key to .env.local
```

**Run the backend:**
```bash
cd web
npm run dev:api    # Express server on :3001
```

**Run the frontend:**
```bash
cd web
npm run dev        # Vite on :5173
```

Open `http://localhost:5173`

---

## Database setup

Run this SQL in your Supabase SQL Editor:

```sql
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  created_at timestamptz default now()
);

create table public.void_sessions (
  id text primary key,
  user_id uuid references public.users(id) on delete set null,
  created_at timestamptz default now()
);

create table public.burns (
  id uuid primary key default gen_random_uuid(),
  void_id text references public.void_sessions(id) on delete cascade,
  agent_name text not null,
  tokens_burned bigint not null,
  recorded_at timestamptz default now()
);

alter table public.users enable row level security;
alter table public.void_sessions enable row level security;
alter table public.burns enable row level security;

create policy "public user read" on public.users for select using (true);
create policy "own user row" on public.users for all using (auth.uid() = id);
create policy "void sessions public" on public.void_sessions for all using (true);
create policy "burns public" on public.burns for all using (true);
```

---

## Deploying

**Frontend → Vercel**
- Import the repo, set root directory to `web`
- Add env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

**Backend → Railway**
- Import the repo, set root directory to `web`
- Start command: `node server.js`
- Add env vars: `SUPABASE_SERVICE_KEY`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `FRONTEND_URL`, `PORT=3001`

---

## The core proxy (`core/`)

A separate product — a reverse proxy that protects any website from AI scraping. Drop it in front of your site and configure per-bot responses:

| Mode | Effect |
|---|---|
| **BLACKHOLE** | Floods AI context window with ~400K tokens of dense content |
| **TARPIT** | Slow-drips a response that never completes |
| **WHITEHOLE** | Serves clean structured content (for authorized/paying bots) |
| **NORMAL** | Pass-through to origin |

```bash
cd core
cp .env.example .env
# Set ORIGIN_URL to your website
npm start
```

---

## License

MIT
