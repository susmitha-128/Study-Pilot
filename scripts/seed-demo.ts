// Seeds a demo account with realistic data across every dataset in
// lib/demo-datasets.ts (undergrad through postgraduate subjects), so the
// full agent loop — goal → plan → study → quiz → adapt → progress — can be
// demoed immediately without manual data entry.
//
// Usage:  npm run seed:demo
// Requires .env.local with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { DEMO_DATASETS } from "../lib/demo-datasets";

const DEMO_EMAIL = process.env.DEMO_EMAIL || "demo@studypilot.app";
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || "StudyPilotDemo123!";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in your environment.");
  }
  const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

  console.log(`Looking for existing demo user ${DEMO_EMAIL}...`);
  const { data: existingUsers } = await admin.auth.admin.listUsers();
  let userId = existingUsers.users.find((u) => u.email === DEMO_EMAIL)?.id;

  if (!userId) {
    console.log("Creating demo user...");
    const { data, error } = await admin.auth.admin.createUser({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: "Demo Student" },
    });
    if (error) throw error;
    userId = data.user.id;
  }
  console.log(`Using user_id=${userId}`);

  await admin.from("profiles").upsert({
    id: userId,
    full_name: "Demo Student",
    education_level: "postgraduate",
    subjects: DEMO_DATASETS.map((d) => d.subject),
    preferred_study_time: "evening",
    daily_available_minutes: 90,
    learning_preferences: ["visual", "examples", "practice"],
  });

  for (const dataset of DEMO_DATASETS) {
    console.log(`\nSeeding dataset: ${dataset.subject} (${dataset.level})`);

    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 10);

    const { data: goal, error: goalError } = await admin
      .from("goals")
      .insert({
        user_id: userId,
        title: `Master ${dataset.subject}`,
        description: dataset.description,
        deadline: deadline.toISOString().slice(0, 10),
        daily_study_minutes: 90,
        current_level: dataset.level === "postgraduate" ? "intermediate" : "beginner",
        status: "active",
      })
      .select()
      .single();
    if (goalError || !goal) {
      console.error("  Failed to create goal:", goalError?.message);
      continue;
    }

    const { data: plan } = await admin
      .from("study_plans")
      .insert({ user_id: userId, goal_id: goal.id, version: 1, is_active: true, reason: "initial" })
      .select()
      .single();

    let dayOffset = 0;
    let topicIndex = 0;
    for (const topic of dataset.topics) {
      const { data: topicRow } = await admin
        .from("topics")
        .insert({
          user_id: userId,
          goal_id: goal.id,
          title: topic.title,
          summary: topic.summary,
          difficulty: topic.difficulty,
          estimated_minutes: topic.estimatedMinutes,
          order_index: topicIndex,
        })
        .select()
        .single();

      const scheduledDate = new Date();
      scheduledDate.setDate(scheduledDate.getDate() + dayOffset);

      await admin.from("plan_tasks").insert({
        user_id: userId,
        plan_id: plan!.id,
        topic_id: topicRow!.id,
        scheduled_date: scheduledDate.toISOString().slice(0, 10),
        title: topic.title,
        duration_minutes: topic.estimatedMinutes,
        // Make earlier topics look completed so the demo shows real progress.
        status: topicIndex < dataset.topics.length - 2 ? "completed" : "pending",
        order_index: topicIndex,
      });

      // Quiz + questions
      const { data: quiz } = await admin
        .from("quizzes")
        .insert({ user_id: userId, goal_id: goal.id, topic_id: topicRow!.id, title: `Quiz: ${topic.title}` })
        .select()
        .single();

      await admin.from("quiz_questions").insert(
        topic.questions.map((q, i) => ({
          quiz_id: quiz!.id,
          type: q.type,
          question: q.question,
          options: q.options || null,
          correct_answer: q.correctAnswer,
          explanation: q.explanation,
          difficulty: q.difficulty,
          order_index: i,
        }))
      );

      // A realistic-looking attempt: earlier topics score well, the
      // second-to-last topic scores low so a weakness is visible on demo.
      const isWeakDemoTopic = topicIndex === dataset.topics.length - 2;
      const scorePct = isWeakDemoTopic ? 42 : 78 + Math.round(Math.random() * 18);

      if (topicIndex < dataset.topics.length - 1) {
        const { data: attempt } = await admin
          .from("quiz_attempts")
          .insert({ user_id: userId, quiz_id: quiz!.id, score_pct: scorePct, completed_at: new Date().toISOString() })
          .select()
          .single();

        await admin.from("quiz_answers").insert(
          (await admin.from("quiz_questions").select("id").eq("quiz_id", quiz!.id)).data!.map((q) => ({
            attempt_id: attempt!.id,
            question_id: q.id,
            student_answer: "(demo)",
            is_correct: Math.random() < scorePct / 100,
          }))
        );

        await admin.from("topic_mastery").upsert(
          {
            user_id: userId,
            topic_id: topicRow!.id,
            goal_id: goal.id,
            mastery_pct: scorePct,
            classification: scorePct >= 75 ? "strong" : scorePct >= 50 ? "needs_practice" : "weak",
            quiz_avg_pct: scorePct,
            last_reviewed_at: new Date().toISOString(),
          },
          { onConflict: "user_id,topic_id" }
        );
      }

      // Flashcards
      await admin.from("flashcards").insert(
        topic.flashcards.map((c) => ({
          user_id: userId,
          topic_id: topicRow!.id,
          front: c.front,
          back: c.back,
          status: isWeakDemoTopic ? "learning" : "review",
        }))
      );

      dayOffset += 1;
      topicIndex += 1;
    }

    // Agent activity log telling the adaptation story for this goal.
    const weakTopic = dataset.topics[dataset.topics.length - 2];
    await admin.from("agent_actions").insert([
      { user_id: userId, goal_id: goal.id, action_type: "analyzed_material", summary: `Analyzed material and identified ${dataset.topics.length} topics.` },
      { user_id: userId, goal_id: goal.id, action_type: "generated_plan", summary: `Created a ${dataset.topics.length}-day study plan.` },
      { user_id: userId, goal_id: goal.id, action_type: "evaluated_quiz", summary: `Scored 42% on "${weakTopic.title}" — classified weak.` },
      {
        user_id: userId,
        goal_id: goal.id,
        action_type: "adapted_plan",
        summary: `You scored 42% on ${weakTopic.title}, so extra targeted practice was moved ahead of lower-priority review.`,
        requires_approval: true,
        approved: true,
      },
      { user_id: userId, goal_id: goal.id, action_type: "generated_flashcards", summary: `Created ${weakTopic.flashcards.length} targeted flashcards for ${weakTopic.title}.` },
    ]);

    // Goal-level rollup.
    const { data: masteryRows } = await admin.from("topic_mastery").select("mastery_pct").eq("goal_id", goal.id);
    const avgMastery = masteryRows && masteryRows.length ? masteryRows.reduce((s, m) => s + (m.mastery_pct || 0), 0) / masteryRows.length : 0;
    const progressPct = Math.round(((dataset.topics.length - 2) / dataset.topics.length) * 100);

    await admin
      .from("goals")
      .update({ progress_pct: progressPct, mastery_pct: avgMastery, readiness_status: avgMastery >= 70 ? "on_track" : "behind" })
      .eq("id", goal.id);

    console.log(`  ✓ ${dataset.topics.length} topics, quizzes, flashcards, and mastery seeded. Progress ${progressPct}%, mastery ${Math.round(avgMastery)}%.`);
  }

  console.log(`\nDone. Log in with:\n  email:    ${DEMO_EMAIL}\n  password: ${DEMO_PASSWORD}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
