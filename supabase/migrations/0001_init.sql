-- StudyGoal AI — core schema
-- Run with: supabase db push  (or paste into the Supabase SQL editor)

create extension if not exists "uuid-ossp";

-- =========================================================
-- PROFILES (extends auth.users)
-- =========================================================
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  education_level text,              -- 'undergraduate' | 'postgraduate' | 'other'
  subjects text[],
  preferred_study_time text,         -- 'morning' | 'afternoon' | 'evening' | 'night'
  daily_available_minutes int default 60,
  learning_preferences text[],       -- e.g. {'visual','examples','practice'}
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =========================================================
-- GOALS
-- =========================================================
create table if not exists goals (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  deadline date,
  daily_study_minutes int default 60,
  current_level text,                -- 'beginner' | 'intermediate' | 'advanced'
  status text default 'active',      -- 'active' | 'achieved' | 'paused' | 'abandoned'
  progress_pct numeric default 0,
  mastery_pct numeric default 0,
  readiness_status text default 'not_started', -- 'not_started'|'behind'|'on_track'|'ahead'|'ready'
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Raw back-and-forth used while the goal is being built conversationally
create table if not exists goal_conversations (
  id uuid primary key default uuid_generate_v4(),
  goal_id uuid references goals(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null,                -- 'agent' | 'student'
  content text not null,
  created_at timestamptz default now()
);

-- =========================================================
-- MATERIALS (uploaded PDFs / notes)
-- =========================================================
create table if not exists materials (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_id uuid references goals(id) on delete cascade,
  file_name text not null,
  storage_path text not null,        -- path in the 'materials' storage bucket
  mime_type text,
  page_count int,
  status text default 'uploaded',    -- 'uploaded' | 'analyzing' | 'analyzed' | 'failed'
  extracted_text text,               -- raw extracted text, used to ground AI generation
  created_at timestamptz default now()
);

-- =========================================================
-- TOPIC TREE (units / topics / subtopics identified from materials)
-- =========================================================
create table if not exists topics (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_id uuid not null references goals(id) on delete cascade,
  material_id uuid references materials(id) on delete set null,
  parent_topic_id uuid references topics(id) on delete cascade,
  title text not null,
  summary text,
  order_index int default 0,
  difficulty text default 'medium',  -- 'easy' | 'medium' | 'hard'
  estimated_minutes int default 30,
  created_at timestamptz default now()
);

-- =========================================================
-- STUDY PLANS (versioned — each replan creates a new row so history is kept)
-- =========================================================
create table if not exists study_plans (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_id uuid not null references goals(id) on delete cascade,
  version int not null default 1,
  is_active boolean default true,
  reason text,                       -- why this version was generated ('initial' | replan reason)
  created_at timestamptz default now()
);

create table if not exists plan_tasks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid not null references study_plans(id) on delete cascade,
  topic_id uuid references topics(id) on delete set null,
  scheduled_date date not null,
  title text not null,
  duration_minutes int default 30,
  status text default 'pending',     -- 'pending' | 'completed' | 'missed' | 'skipped'
  order_index int default 0,
  created_at timestamptz default now()
);

-- =========================================================
-- STUDY SESSIONS
-- =========================================================
create table if not exists study_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_id uuid not null references goals(id) on delete cascade,
  plan_task_id uuid references plan_tasks(id) on delete set null,
  topic_id uuid references topics(id) on delete set null,
  status text default 'in_progress', -- 'in_progress' | 'completed' | 'abandoned'
  content jsonb,                     -- generated session sections (intro/explanation/example/diagram/check)
  duration_seconds int default 0,
  started_at timestamptz default now(),
  completed_at timestamptz
);

-- =========================================================
-- NOTES
-- =========================================================
create table if not exists notes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  topic_id uuid not null references topics(id) on delete cascade,
  summary text,
  key_concepts jsonb,
  detailed_explanation text,
  definitions jsonb,
  examples jsonb,
  exam_points jsonb,
  common_confusions jsonb,
  diagram_svg text,
  created_at timestamptz default now()
);

-- =========================================================
-- QUIZZES / QUESTIONS / ATTEMPTS
-- =========================================================
create table if not exists quizzes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_id uuid not null references goals(id) on delete cascade,
  topic_id uuid references topics(id) on delete cascade,
  title text not null,
  created_at timestamptz default now()
);

create table if not exists quiz_questions (
  id uuid primary key default uuid_generate_v4(),
  quiz_id uuid not null references quizzes(id) on delete cascade,
  type text not null,                -- 'mcq'|'true_false'|'fill_blank'|'short_answer'|'scenario'
  question text not null,
  options jsonb,                     -- for mcq/true_false
  correct_answer text not null,
  explanation text,
  difficulty text default 'medium',
  order_index int default 0
);

create table if not exists quiz_attempts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  quiz_id uuid not null references quizzes(id) on delete cascade,
  score_pct numeric,
  started_at timestamptz default now(),
  completed_at timestamptz
);

create table if not exists quiz_answers (
  id uuid primary key default uuid_generate_v4(),
  attempt_id uuid not null references quiz_attempts(id) on delete cascade,
  question_id uuid not null references quiz_questions(id) on delete cascade,
  student_answer text,
  is_correct boolean,
  created_at timestamptz default now()
);

-- =========================================================
-- FLASHCARDS
-- =========================================================
create table if not exists flashcards (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  topic_id uuid references topics(id) on delete cascade,
  front text not null,
  back text not null,
  status text default 'new',         -- 'new' | 'learning' | 'review' | 'mastered'
  ease_factor numeric default 2.5,
  interval_days int default 0,
  due_at timestamptz default now(),
  created_at timestamptz default now()
);

create table if not exists flashcard_reviews (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  flashcard_id uuid not null references flashcards(id) on delete cascade,
  rating text not null,              -- 'again'|'hard'|'good'|'easy'
  reviewed_at timestamptz default now()
);

-- =========================================================
-- MASTERY / PROGRESS
-- =========================================================
create table if not exists topic_mastery (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  topic_id uuid not null references topics(id) on delete cascade,
  goal_id uuid not null references goals(id) on delete cascade,
  mastery_pct numeric default 0,
  classification text default 'weak', -- 'weak' | 'needs_practice' | 'strong'
  quiz_avg_pct numeric,
  last_reviewed_at timestamptz,
  updated_at timestamptz default now(),
  unique (user_id, topic_id)
);

create table if not exists progress_snapshots (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_id uuid not null references goals(id) on delete cascade,
  progress_pct numeric,
  mastery_pct numeric,
  study_minutes_total int,
  streak_days int,
  taken_at timestamptz default now()
);

-- =========================================================
-- AGENT ACTIONS (transparency log) + NOTIFICATIONS
-- =========================================================
create table if not exists agent_actions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_id uuid references goals(id) on delete cascade,
  action_type text not null,         -- 'analyzed_material'|'generated_plan'|'adapted_plan'|'evaluated_quiz'|'generated_flashcards'|...
  summary text not null,
  detail jsonb,
  requires_approval boolean default false,
  approved boolean,
  created_at timestamptz default now()
);

create table if not exists notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text,
  read boolean default false,
  created_at timestamptz default now()
);

-- =========================================================
-- INDEXES
-- =========================================================
create index if not exists idx_goals_user on goals(user_id);
create index if not exists idx_materials_goal on materials(goal_id);
create index if not exists idx_topics_goal on topics(goal_id);
create index if not exists idx_plan_tasks_plan on plan_tasks(plan_id);
create index if not exists idx_plan_tasks_date on plan_tasks(user_id, scheduled_date);
create index if not exists idx_quiz_questions_quiz on quiz_questions(quiz_id);
create index if not exists idx_flashcards_due on flashcards(user_id, due_at);
create index if not exists idx_topic_mastery_goal on topic_mastery(goal_id);
create index if not exists idx_agent_actions_user on agent_actions(user_id, created_at desc);

-- =========================================================
-- ROW LEVEL SECURITY — every table isolated to auth.uid()
-- =========================================================
alter table profiles enable row level security;
alter table goals enable row level security;
alter table goal_conversations enable row level security;
alter table materials enable row level security;
alter table topics enable row level security;
alter table study_plans enable row level security;
alter table plan_tasks enable row level security;
alter table study_sessions enable row level security;
alter table notes enable row level security;
alter table quizzes enable row level security;
alter table quiz_questions enable row level security;
alter table quiz_attempts enable row level security;
alter table quiz_answers enable row level security;
alter table flashcards enable row level security;
alter table flashcard_reviews enable row level security;
alter table topic_mastery enable row level security;
alter table progress_snapshots enable row level security;
alter table agent_actions enable row level security;
alter table notifications enable row level security;

create policy "own profile" on profiles for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "own goals" on goals for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own goal_conversations" on goal_conversations for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own materials" on materials for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own topics" on topics for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own study_plans" on study_plans for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own plan_tasks" on plan_tasks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own study_sessions" on study_sessions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own notes" on notes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own quizzes" on quizzes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own quiz_questions" on quiz_questions for all using (
  auth.uid() = (select user_id from quizzes where quizzes.id = quiz_questions.quiz_id)
);
create policy "own quiz_attempts" on quiz_attempts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own quiz_answers" on quiz_answers for all using (
  auth.uid() = (select user_id from quiz_attempts where quiz_attempts.id = quiz_answers.attempt_id)
);
create policy "own flashcards" on flashcards for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own flashcard_reviews" on flashcard_reviews for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own topic_mastery" on topic_mastery for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own progress_snapshots" on progress_snapshots for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own agent_actions" on agent_actions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own notifications" on notifications for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- =========================================================
-- Auto-create profile row when a new auth user signs up
-- =========================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =========================================================
-- Storage bucket for uploaded materials (private, per-user folder)
-- =========================================================
insert into storage.buckets (id, name, public)
values ('materials', 'materials', false)
on conflict (id) do nothing;

create policy "own material files read"
  on storage.objects for select
  using (bucket_id = 'materials' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "own material files write"
  on storage.objects for insert
  with check (bucket_id = 'materials' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "own material files delete"
  on storage.objects for delete
  using (bucket_id = 'materials' and (storage.foldername(name))[1] = auth.uid()::text);
