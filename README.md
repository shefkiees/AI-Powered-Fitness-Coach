# AI FITNESS COACH

A modern AI fitness web app: **timed workout sessions**, **AI coach chat**, **live pose / form check** (MoveNet + heuristics), and **Supabase** for auth and profiles. Built with **Next.js 16**, **React 19**, **Tailwind CSS 4**, and **TypeScript**.

## Live URL

Deploy this app (for example to [Vercel](https://vercel.com)) and set your production URL here:

**Live:** `ai-powered-fitness-coach-delta.vercel.app` (replace after deploy)

## Features

- **Auth** — Email/password sign up and sign in (Supabase Auth).
- **Onboarding & profile** — Fitness goals and stats stored in `fitness_profiles` (RLS-protected).
- **Dashboard** — AI Fitness Control Center: daily stats, emphasized AI coach, quick workout start, timeline, plans, and library.
- **Guided workouts** — `/workout` and `/workout/session` with sets, work/rest timers, and progress.
- **AI form check** — `/pose-estimation`: webcam, skeleton overlay, and live posture cues (not medical advice).
- **AI coach** — `/api/chat` (OpenAI) with profile-aware coaching.



## Database

Use Supabase with tables such as `fitness_profiles` (and optionally `workouts`) and RLS aligned to `auth.uid()`.

## Scripts

```bash
npm install
npm run dev
npm run build
npm run lint
```

## Disclaimer

General fitness information only—not medical advice. Stop if you feel pain or dizziness and seek professional help when needed.
