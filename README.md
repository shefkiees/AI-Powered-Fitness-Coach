# AI Fitness Coach

Përditësuar së fundi: 2026-05-06

AI Fitness Coach është një web aplikacion fitness i ndërtuar me Next.js. Aplikacioni i ndihmon përdoruesit të krijojnë profil personal, të gjenerojnë plane stërvitjeje, të nisin workout sessions të udhëzuara, të ndjekin progresin, të logojnë ushqimin/ujin dhe të marrin mbështetje të thjeshtë nga AI Coach.

Ky projekt u shërben fillestarëve, përdoruesve mesatarë dhe personave që duan një flow të strukturuar për fitness pa terma të komplikuar. Aplikacioni jep vetëm udhëzime të përgjithshme fitness dhe nuk jep këshilla mjekësore.

## Qëllimi i Projektit

Qëllimi është që planifikimi i fitness-it të jetë më i lehtë dhe më personal:

- përdoruesi regjistrohet dhe krijon profil fitness
- aplikacioni rekomandon workouts sipas qëllimit, nivelit, pajisjeve dhe historikut
- AI mund të gjenerojë plan javor stërvitjeje
- çdo workout mund të niset si sesion i udhëzuar
- progresi, goals, nutrition dhe hydration ruhen në Supabase
- dashboard-i i jep përdoruesit një pasqyrë të qartë ditore

## Ndryshimet e Fundit

- Dashboard Home është ristrukturuar me UI më të pastër dhe më profesional.
- Seksioni i vjetër mock për progress/calories trend është hequr.
- Small nutrition snapshot tani është funksional: calories, protein dhe water përditësohen nga log-et reale.
- Quick actions në dashboard tani shkruajnë në Supabase për workout, activity, nutrition, water, goals dhe workout days.
- Kartat e workouts tani përdorin media që përshtatet me workout/exercise, jo të njëjtën foto për çdo workout.
- Kur përdoruesi shtyp Start, workout session shfaq video ose fallback video që përputhet me exercise-in aktual, për shembull squat video për squat.
- AI workout generation tani ka fallback më të mirë me ditë të ndryshme dhe exercise data më specifike.
- Nutrition logging mund të përdorë AI/Groq/OpenAI kur keys janë konfiguruar, ose local estimates kur mungojnë keys.

## Flow Kryesor për Demo

1. Përdoruesi hap aplikacionin dhe bën sign up ose login.
2. Përdoruesi plotëson profile setup me goal, level, workout days dhe equipment.
3. Përdoruesi shkon në Dashboard Home.
4. Dashboard shfaq weekly schedule, KPI, goals, recommended workouts, recent activity dhe quick nutrition/water logging.
5. Përdoruesi gjeneron ose hap një workout plan.
6. Përdoruesi zgjedh një workout dhe shtyp Start.
7. Workout session hapet me exercise-specific media/video, timer, sets, rest, skip dhe complete actions.
8. Workout i përfunduar ruhet dhe reflektohet në dashboard/progress.
9. Përdoruesi logon meal/water nga dashboard ose nutrition page.
10. AI Coach mund të përgjigjet në pyetje të thjeshta fitness duke përdorur kontekstin e ruajtur të përdoruesit.

## Funksionalitetet Kryesore

### Authentication dhe Profile

- Supabase Auth për login dhe signup.
- Protected routes për dashboard, workout, profile, nutrition, progress dhe coach pages.
- Profile setup ruan age, weight, height, goal, fitness level, preferred workout days, equipment dhe avatar data.
- Avatar upload/delete përdor Supabase Storage me validim dhe feedback për përdoruesin.

### Dashboard Home

- Weekly schedule nga `user_workout_sessions`.
- KPI cards për streak, workouts, weight/progress dhe goals.
- Real nutrition snapshot nga `nutrition_logs` dhe `water_logs`.
- Quick log për calories, protein dhe water.
- Goal creation dhe goal progress update.
- Recent activity nga completed workouts, nutrition, water, weight dhe goals.
- Recommended workouts bazuar në profilin e përdoruesit dhe workout data.
- Coach insights të krijuara nga progresi dhe zakonet reale të përdoruesit.

### Workout Plan dhe Sessions

- AI-generated weekly plan nga `/api/workout-plan/generate`.
- Fallback plan funksionon edhe kur `OPENAI_API_KEY` mungon.
- Workout library mbështet filtering, recommended view, favorites dhe completed state.
- Workout cards përdorin thumbnails/videos specifike nga workout/exercise data dhe local fallbacks.
- Start session hap `/workout/session`.
- Session runner përfshin timer, sets, rest periods, progress, skip, finish, notes, rating dhe calories estimate.
- Completed workouts ruhen në `completed_workouts`.

### Nutrition dhe Hydration

- Nutrition page krijon daily calorie/macro targets.
- Mbështetet manual meal logging.
- AI meal/water estimation mbështetet përmes Groq ose OpenAI.
- Local food/water estimate përdoret si fallback kur mungojnë AI keys.
- Water quick-add logon hydration ditore.
- Small snapshot në dashboard përditësohet nga nutrition dhe water logs reale.

### AI Coach

- Chat route: `/api/chat`.
- Përdor `OPENAI_API_KEY` dhe `OPENAI_CHAT_MODEL` kur janë të disponueshme.
- Ka local coach fallback për raste të zakonshme kur AI key nuk është konfiguruar.
- Lexon user profile, goals, completed workouts, nutrition logs, weight logs dhe chat history.
- Mban përgjigjet të thjeshta dhe nuk jep këshilla mjekësore.

### Pose Estimation

- Pose page përdor TensorFlow/MediaPipe dependencies për feedback me webcam.
- Mund të përdoret si demo opsionale nëse browser-i lejon camera permissions.

## Routes Kryesore

| Route | Qëllimi |
| --- | --- |
| `/` | Landing page |
| `/login` | Login |
| `/signup` | Register |
| `/profile-setup` | Initial profile/onboarding setup |
| `/dashboard` | Dashboard/Home kryesor |
| `/dashboard/chat` | AI Coach chat |
| `/workout-plan` | Workout plan dhe workout library |
| `/workout/session` | Guided workout session |
| `/exercise-library` | Exercise library |
| `/nutrition-plan` | Nutrition dhe hydration tracker |
| `/progress-tracker` | Progress tracking |
| `/goals` | Goals |
| `/pose-estimation` | Pose/form feedback |
| `/profile` | User profile |
| `/settings` | Settings |

## Tech Stack

- Framework: Next.js 16, React 19, App Router
- Styling: Tailwind CSS 4
- Backend: Next.js API routes
- Auth: Supabase Auth
- Database: Supabase Postgres me RLS
- Storage: Supabase Storage për avatars
- AI: OpenAI SDK, optional Groq-compatible nutrition estimation
- Motion/UI: Framer Motion, Lucide React, Heroicons
- Pose: TensorFlow.js dhe MediaPipe Pose
- Language: TypeScript dhe JavaScript mixed codebase

## Database

Schema është në `supabase-schema.sql`.

Tabelat kryesore:

- `profiles`
- `fitness_profiles`
- `goals`
- `workouts`
- `exercises`
- `workout_exercises`
- `user_workout_plans`
- `user_workout_sessions`
- `completed_workouts`
- `favorite_workouts`
- `nutrition_logs`
- `meals`
- `water_logs`
- `weight_logs`
- `ai_coach_messages`
- `progress_snapshots`
- `pose_sessions`
- `pose_feedback`

RLS është aktivizuar që përdoruesit të kenë qasje vetëm në të dhënat e tyre private. Public workouts/exercises mund të lexohen nga authenticated users.

## Setup Lokal

Instalo dependencies:

```bash
npm install
```

Krijo `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional aliases used by older client code
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional AI keys/models
OPENAI_API_KEY=your_openai_key
OPENAI_CHAT_MODEL=gpt-4o-mini
OPENAI_WORKOUT_MODEL=gpt-4o-mini
OPENAI_NUTRITION_MODEL=gpt-4o-mini

# Optional nutrition provider
GROQ_API_KEY=your_groq_key
GROQ_MODEL=llama-3.3-70b-versatile
GROQ_NUTRITION_MODEL=llama-3.3-70b-versatile
```

Vendos Supabase:

1. Krijo një Supabase project.
2. Ekzekuto `supabase-schema.sql` në Supabase SQL editor.
3. Kontrollo që `avatars` storage bucket dhe policies ekzistojnë.
4. Nëse duhet, përdor `docs/avatar-storage-policies.sql` si referencë për avatar policies.

Nise projektin lokalisht:

```bash
npm run dev
```

Hape në browser:

```bash
http://localhost:3000
```

## Scripts

```bash
npm run dev      # start development server
npm run build    # production build
npm run start    # run built app
npm run lint     # run ESLint
```

## AI dhe Fallback Behavior

- Workout plan generation përdor OpenAI kur `OPENAI_API_KEY` është konfiguruar.
- Nëse OpenAI mungon ose dështon, aplikacioni krijon built-in fallback workout plan.
- Coach chat përdor OpenAI kur është e mundur dhe local fallback responses për raste të mbështetura.
- Nutrition estimation përdor Groq fillimisht kur `GROQ_API_KEY` ekziston, pastaj OpenAI, pastaj local estimates.
- App mund të demohet edhe pa paid AI keys sepse flow-t kryesore kanë fallback.

## Checklist Para Demos

Para prezantimit:

- ekzekuto `npm run lint`
- ekzekuto `npm run build`
- kontrollo që `.env.local` ka Supabase variables
- kontrollo që Supabase schema është aplikuar
- përgatit një demo user account
- testo login/signup
- testo profile setup
- hape `/dashboard`
- gjenero workout plan
- starto workout session dhe verifiko që video e exercise-it shfaqet
- përfundo një workout dhe kontrollo dashboard update
- logo calories/protein/water nga dashboard
- testo AI coach me OpenAI key ose fallback behavior
- mbaje local `localhost:3000` gati si Plan B

Plani i plotë i demos:

- `docs/demo-plan.md`

Previously verified deployed URL:

- `https://ai-powered-fitness-coach-delta.vercel.app`
- Last recorded verification date: 2026-04-26
- Last recorded result: HTTP 200

## Security dhe Data Handling

- Mos e commit-o `.env.local`.
- Mbaji API keys vetëm në environment variables.
- Supabase RLS mbron user-owned tables.
- Valido user inputs para ruajtjes.
- Mbaji udhëzimet fitness të thjeshta dhe jo mjekësore.
- Mos ekspozo sensitive user data në logs ose UI.

## Shënime për Projektin

Ky projekt fokusohet në personalizim, udhëzim të thjeshtë dhe user experience të pastër. Vlera kryesore për demo është flow end-to-end: profile -> dashboard -> AI workout plan -> guided workout session -> saved progress -> nutrition/water tracking -> AI coach context.
