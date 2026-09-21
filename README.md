# Study Pilot

"Give AI your goal. Let it help you achieve it."

An AI study agent for college and postgraduate students. It runs a continuous
loop — **Goal → Understand → Plan → Teach → Test → Evaluate → Track → Adapt →
Achieve** — grounded in material the student attaches (PDFs, docs, or photos
of notes), with real persistent state per user.

## Stack

- **Frontend:** Next.js 14 (App Router) + React + TypeScript + Tailwind CSS
- **Backend:** Next.js Route Handlers (`app/api/**`)
- **Database & Auth:** Supabase (Postgres + Row-Level Security + Supabase Auth)
- **File storage:** Supabase Storage (private `materials` bucket, per-user folders)
- **AI:** Google Gemini (`@google/generative-ai`), server-side only — free tier, no billing required

## What's real vs. what to extend

Fully wired, real (not mocked) functionality:

- Sign up / log in / log out / forgot password / reset password (Supabase Auth)
- Conversational goal builder → creates a real `goals` row
- Multi-file upload (PDF, DOCX/DOC, TXT, PNG/JPG/WEBP) → Supabase Storage
- PDF/text extraction (`pdf-parse`) and image reading (Gemini vision) → topic tree
- Deterministic day-by-day plan generation respecting daily available time
- Notes generation grounded in the uploaded material, cached per topic
- Quiz generation, grading (objective + Gemini-judged free text), per-topic mastery
- **Adaptive replanning**: a weak quiz result inserts targeted practice ahead of
  lower-priority tasks and logs *why*, visible on Agent Activity and the quiz result screen
- Flashcards with a simplified spaced-repetition review flow
- Per-goal Track Progress page, dashboard, agent transparency log
- Full Postgres schema with RLS so every table is isolated per user

Deliberately left as a clear extension point (documented in code comments):

- DOCX text extraction (currently images go through Gemini vision; DOCX needs a
  parsing library such as `mammoth` — the upload/analyze routes already branch
  for it, just add the extraction call)
- Human-in-the-loop **approve/reject** buttons for plan changes (currently
  auto-applied and logged transparently — the `agent_actions.requires_approval`
  / `approved` columns are already there to build the UI against)
- Diagrams (SVG/Mermaid) alongside notes
- Rate limiting on the AI routes

## Local development

```bash
npm install
cp .env.example .env.local   # then fill in the values below
npm run dev
```

### 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → New Project.
2. In **Project Settings → API**, copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (keep secret — server only)

### 2. Run the database migration

In the Supabase dashboard, open **SQL Editor**, paste the contents of
`supabase/migrations/0001_init.sql`, and run it. This creates every table,
index, RLS policy, the `materials` storage bucket, and the trigger that
auto-creates a `profiles` row on signup.

(If you use the Supabase CLI instead: `supabase link` then `supabase db push`.)

### 3. Configure auth email settings (optional but recommended)

In **Authentication → Providers → Email**, confirm "Confirm email" matches
what you want for the demo (off = instant login after signup, on = the app's
"check your inbox" flow is used).

### 4. Add your Gemini API key

Get a free key from [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
(no billing setup required for the free tier) and set `GEMINI_API_KEY` in
`.env.local`. This key is only ever read server-side (`lib/gemini.ts`) — it
is never sent to the browser.

### 5. Seed demo data (optional, recommended for a seminar demo)

```bash
npm run seed:demo
```

This populates one demo account with **8 full datasets spanning undergraduate
through postgraduate CS courses** (Network Security, DBMS, Operating Systems,
Data Structures & Algorithms, Machine Learning, Distributed Systems, Cloud
Computing, Compiler Design — see `lib/demo-datasets.ts`), each with topics,
quizzes, flashcards, mastery scores, a visible weak-topic → adaptive-replan
story, and a populated Agent Activity log. Prints the demo login at the end.

### 6. Run it

```bash
npm run dev
```

Visit `http://localhost:3000`.

## Deploying

1. Push this repository to GitHub.
2. Import it into [Vercel](https://vercel.com/new).
3. Add the same environment variables from `.env.example` in the Vercel
   project's **Settings → Environment Variables** (set `NEXT_PUBLIC_SITE_URL`
   to your production URL once you have it).
4. Deploy. Vercel builds and gives you a public URL automatically.
5. In Supabase → **Authentication → URL Configuration**, add your Vercel URL
   to the allowed redirect URLs (needed for the email-confirmation and
   password-reset links to work in production).

## Project structure

```
app/
  page.tsx                  Landing page
  (auth)/                   Login, signup, forgot/reset password, email callback
  (app)/                    Authenticated app shell (sidebar, dashboard, goal
                             builder, materials, study session, quiz, flashcards,
                             progress, agent activity, settings)
  api/                      Route handlers: goal, materials/upload+analyze,
                             plan/generate+adapt (inline in quiz/submit),
                             notes/generate, quiz/generate+submit,
                             flashcards/generate+review
lib/
  supabase/                 Browser / server / admin / middleware Supabase clients
  gemini.ts                  Server-only Gemini client + strict-JSON helper
  demo-datasets.ts          UG→PG subject library used for demo seeding
  types.ts                  Shared TypeScript types mirroring the schema
components/                 Shared UI (header, sidebar, uploader, quiz runner, …)
supabase/migrations/        Full SQL schema + RLS policies
scripts/seed-demo.ts        Demo data seeder
```

## Security notes

- Every table has Row-Level Security scoped to `auth.uid()` — one user can
  never read or write another user's rows, enforced at the database level,
  not just in application code.
- The Supabase Storage `materials` bucket is private; objects are keyed under
  `{user_id}/{goal_id}/...` and RLS policies on `storage.objects` restrict
  access to the owning user's folder.
- `SUPABASE_SERVICE_ROLE_KEY` and `GEMINI_API_KEY` are read only in
  server-side code (`lib/supabase/server.ts`, `lib/gemini.ts`,
  `app/api/**`, `scripts/seed-demo.ts`) — never imported into a Client
  Component or exposed with a `NEXT_PUBLIC_` prefix.
