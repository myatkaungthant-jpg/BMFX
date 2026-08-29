# BMFX — Trading Education LMS

BMFX (`bmfx-lms`) is a production learning-management platform for Forex traders. It
combines video courses with a set of live trading tools: a real-time economic
calendar, a trading journal, an interactive chart with a position-size calculator,
a community feed, and an AI trading mentor.

This repository is a **monorepo** holding both the frontend and the backend:

- **Frontend** — `src/`, a React + Vite single-page app.
- **Backend** — `supabase/`, the Supabase project: Postgres schema and RLS policies
  (`migrations/`) plus edge functions (`functions/`). Auth, storage, and the nightly
  credit-reset cron are configured in the Supabase project itself.

## Features

| Area | Description |
| --- | --- |
| **Courses & Lessons** | Video-based curriculum organised into modules (e.g. Alpha, Sighma) with per-lesson progress tracking and a "resume learning" dashboard. |
| **Economic Calendar** | Live market events via an embedded TradingView events widget. |
| **Trading Journal** | Log trades (symbol, side, entry / SL / TP, exit, PnL %, mood, rule checklist) stored in the `trading_logs` table. |
| **Trading Chart** | Embedded TradingView advanced chart plus a built-in position-size calculator. |
| **Community Feed** | Posts with image grids, likes, and comments. |
| **AI Trading Mentor** | Chat mentor (`TradingCopilot`) that answers trading questions and, on request, analyses your 20 most recent journal trades and an optional chart screenshot. Backed by the `bmfx-ai-mentor` Supabase edge function. |
| **Credits** | Per-user daily AI credit balance (`user_credits`), reset nightly at 00:00 Asia/Bangkok by a `pg_cron` job. |
| **Admin** | Admin-only area for managing courses, lessons, and announcements. |
| **PWA** | Installable, offline-capable app with runtime caching of course thumbnails and curriculum data. |

## Tech Stack

- **Frontend:** React 19, Vite 6, React Router 7, TypeScript, Tailwind CSS 4
- **Data / state:** TanStack Query
- **UI:** Framer Motion (`motion`), `lucide-react`, `video.js` / `react-player`
- **Backend:** Supabase — Postgres + Row Level Security, Auth (email/password + Google OAuth), Edge Functions (Deno), `pg_cron`
- **AI:** `bmfx-ai-mentor` edge function (calls the Manus AI task API)
- **Hosting:** Vercel for the frontend (SPA rewrites in `vercel.json`); Supabase hosts the backend

## Repository Layout

```text
.
├── src/                      # Frontend (React + Vite SPA)
│   ├── pages/                # Route-level screens (Dashboard, Courses, Lesson,
│   │                         #   Feed, EconomicCalendar, TradingJournal,
│   │                         #   TradingChart, Admin, ...)
│   ├── components/           # Shared UI (Layout, LessonPlayer, TradingCopilot,
│   │                         #   AdvancedChart, PositionSizeCalculator, ...)
│   ├── contexts/             # AuthContext
│   ├── hooks/                # useAuth, useTradingMentor
│   ├── lib/                  # supabaseClient
│   └── constants.ts          # Static course / lesson metadata
├── supabase/                 # Backend (Supabase project)
│   ├── migrations/           # SQL schema, RLS policies, cron jobs
│   └── functions/
│       └── bmfx-ai-mentor/   # Edge function powering the AI mentor
├── public/                   # Static assets (logos, PWA icons)
├── index.html                # Vite entry point
├── vite.config.ts            # Vite + Tailwind + PWA config
└── vercel.json               # Frontend hosting (SPA rewrites)
```

## Prerequisites

- Node.js >= 18
- A Supabase project
- Supabase CLI (only if you deploy migrations / edge functions)

## Frontend — Run Locally

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env` file (see `.env.example`):

   ```bash
   VITE_SUPABASE_URL=https://<your-project>.supabase.co
   VITE_SUPABASE_ANON_KEY=<your-anon-key>
   APP_URL=http://localhost:5173
   ```

   > `GEMINI_API_KEY` in `.env.example` is a leftover from the original scaffold and
   > is not used by the app.

3. Start the dev server:

   ```bash
   npm run dev
   ```

### Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server. |
| `npm run build` | Production build to `dist/`. |
| `npm run preview` | Serve the production build locally. |
| `npm run lint` | Type-check with `tsc --noEmit`. |

## Backend — Supabase

Database schema lives in `supabase/migrations/`. Key tables: `profiles`, `courses`,
`lessons`, `user_progress`, `posts` / `likes` / `comments`, `user_credits`, and
`trading_logs`.

Link the CLI to your project and apply migrations:

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

Deploy the AI mentor function and set its secret:

```bash
supabase functions deploy bmfx-ai-mentor
supabase secrets set MANUS_API_KEY=<your-manus-api-key>
```

Auth providers (email/password, Google OAuth) and storage buckets (post images,
course thumbnails) are configured in the Supabase dashboard.
