import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { askForJSON } from "@/lib/anthropic";

// Claude calls can take longer than the platform's default function timeout,
// especially on the first request of a cold start. Give this route real room
// so a slow-but-successful call doesn't get killed mid-flight.
export const maxDuration = 60;

// Drives the conversational goal-builder. Each call sends the running
// transcript; Claude decides whether it has enough to build a structured
// goal, or needs one more focused follow-up question. Only asks what's
// necessary — never a fixed questionnaire.
const SYSTEM = `You are the onboarding agent for a study-planning app. Your job is to turn a
student's loose description of what they want to achieve into a structured goal:
{ title, description, deadline (ISO date or null), dailyStudyMinutes, currentLevel }.

Ask at most one short, necessary follow-up question at a time — only for
information you don't already have and truly need (deadline, daily time
available, current level). Do not ask more than 4 questions total. As soon as
you have enough to proceed, mark the goal complete.

Always respond with ONLY this JSON shape:
{
  "done": boolean,
  "reply": string,               // what to say to the student next
  "goal": {                      // your current best understanding, even if incomplete
    "title": string,
    "description": string,
    "deadline": string | null,
    "dailyStudyMinutes": number | null,
    "currentLevel": string | null
  }
}`;

export async function POST(req: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  // Everything below can fail (bad request body, Anthropic error/timeout,
  // rate limit, invalid JSON back from the model, a DB error). Every one of
  // those must still return a JSON response — if this route throws instead,
  // the client's res.json() call throws too, and the chat UI is left stuck
  // on "Thinking…" forever with nothing telling the user what happened.
  try {
    const { messages } = await req.json(); // [{role: 'agent'|'student', content: string}]

    const transcript = messages
      .map((m: any) => `${m.role === "agent" ? "Agent" : "Student"}: ${m.content}`)
      .join("\n");

    const result = await askForJSON<{
      done: boolean;
      reply: string;
      goal: { title: string; description: string; deadline: string | null; dailyStudyMinutes: number | null; currentLevel: string | null };
    }>({
      system: SYSTEM,
      prompt: `Conversation so far:\n${transcript}\n\nRespond with the JSON described.`,
      maxTokens: 1000,
    });

    let createdGoalId: string | null = null;

    if (result.done) {
      const { data: goal, error } = await supabase
        .from("goals")
        .insert({
          user_id: user.id,
          title: result.goal.title,
          description: result.goal.description,
          deadline: result.goal.deadline,
          daily_study_minutes: result.goal.dailyStudyMinutes || 60,
          current_level: result.goal.currentLevel,
          status: "active",
        })
        .select()
        .single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      createdGoalId = goal.id;

      await supabase.from("agent_actions").insert({
        user_id: user.id,
        goal_id: goal.id,
        action_type: "goal_created",
        summary: `Created goal "${goal.title}".`,
      });
    }

    return NextResponse.json({ ...result, goalId: createdGoalId });
  } catch (err: any) {
    console.error("goal route error:", err);
    return NextResponse.json(
      { error: err?.message || "The agent had trouble responding. Please try again." },
      { status: 500 }
    );
  }
}
