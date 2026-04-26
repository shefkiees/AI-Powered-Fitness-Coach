# Final Demo Plan (5-7 min)

## 1) What the Project Is and Who It Serves
AI Powered Fitness Coach is a web app that helps users build better workout habits with AI guidance.
Target users:
- beginners who need simple guidance
- intermediate users who want structure and progress tracking
- people who want a guided, personalized fitness flow

## 2) Main Demo Flow (What We Will Show)
1. Login / Sign up with Supabase Auth.
2. Quick onboarding/profile setup (goal, basic info).
3. Dashboard overview:
   - daily goals
   - workout timer
   - AI coach chat
4. Start a workout session and show the guided flow.
5. Show progress tracking/stat cards in dashboard.
6. Optional: quick pose estimation preview (if camera permissions are available).

## 3) Technical Parts to Explain Briefly
- Frontend: Next.js + React component structure for auth, dashboard, and workout flow.
- Backend/API: Next.js API routes used for AI coach interactions.
- Data/Auth: Supabase Auth + profile and stats data handling with protected access.
- Personalization: user profile + activity data driving tailored workout suggestions.
- Reliability: validation and feedback improvements to prevent silent failures.

## 4) Pre-Demo Checks Completed
- App starts successfully with `npm run dev`.
- Core navigation works: auth -> onboarding -> dashboard -> workout.
- Basic auth flow tested (login/register pages accessible).
- API and environment variables available locally.
- No blocking UI errors in main user flow during smoke test.
- Backup data/account prepared for fast demo login.

## 5) Live URL / Verified Runtime
- Verified runtime URL: `https://ai-powered-fitness-coach-delta.vercel.app`
- Verification date: 2026-04-26
- Verification method: direct HTTP check to the deployed Vercel URL (status 200).

## 6) Plan B if Live Demo Fails
1. Use prepared local environment (`localhost`) instead of hosted environment.
2. Use a pre-created demo account to skip setup delays.
3. Switch to a short recorded walkthrough (2-3 min) of the main flow.
4. Continue presentation with architecture + technical explanation while replaying screenshots/recording.

## 7) Presenter Script (Timing)
- 0:00-0:45: Problem + target users.
- 0:45-3:30: Main product flow live.
- 3:30-5:00: Technical stack and implementation highlights.
- 5:00-6:00: Reliability/testing checks before demo.
- 6:00-7:00: Value summary + next steps.
