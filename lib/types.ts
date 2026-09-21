// Shared TypeScript types mirroring the Supabase schema (supabase/migrations/0001_init.sql).

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  deadline: string | null;
  daily_study_minutes: number;
  current_level: string | null;
  status: "active" | "achieved" | "paused" | "abandoned";
  progress_pct: number;
  mastery_pct: number;
  readiness_status: "not_started" | "behind" | "on_track" | "ahead" | "ready";
  created_at: string;
}

export interface Topic {
  id: string;
  goal_id: string;
  material_id: string | null;
  parent_topic_id: string | null;
  title: string;
  summary: string | null;
  order_index: number;
  difficulty: "easy" | "medium" | "hard";
  estimated_minutes: number;
}

export interface PlanTask {
  id: string;
  plan_id: string;
  topic_id: string | null;
  scheduled_date: string;
  title: string;
  duration_minutes: number;
  status: "pending" | "completed" | "missed" | "skipped";
  order_index: number;
}

export interface TopicMastery {
  id: string;
  topic_id: string;
  goal_id: string;
  mastery_pct: number;
  classification: "weak" | "needs_practice" | "strong";
  quiz_avg_pct: number | null;
  last_reviewed_at: string | null;
}

export interface AgentAction {
  id: string;
  goal_id: string | null;
  action_type: string;
  summary: string;
  detail: Record<string, unknown> | null;
  requires_approval: boolean;
  approved: boolean | null;
  created_at: string;
}

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  type: "mcq" | "true_false" | "fill_blank" | "short_answer" | "scenario";
  question: string;
  options: string[] | null;
  correct_answer: string;
  explanation: string | null;
  difficulty: "easy" | "medium" | "hard";
}

export interface Flashcard {
  id: string;
  topic_id: string | null;
  front: string;
  back: string;
  status: "new" | "learning" | "review" | "mastered";
  due_at: string;
}
