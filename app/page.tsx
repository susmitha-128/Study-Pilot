import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { APP_NAME } from "@/lib/brand";

const LOOP_STEPS = ["GOAL", "PLAN", "LEARN", "TEST", "ADAPT", "ACHIEVE"];

const FEATURES = [
  { icon: "📎", title: "Attach anything", desc: "PDFs, lecture slides, scanned notes, even photos of a whiteboard — drop them in like you would in an LLM chat." },
  { icon: "🧠", title: "Personalized study plans", desc: "The agent breaks your material into a day-by-day roadmap built around your deadline and available time." },
  { icon: "🎯", title: "Goal tracking", desc: "Every goal gets its own progress and mastery score, so you always know where you stand." },
  { icon: "📝", title: "Adaptive quizzes", desc: "Quizzes are graded by topic, not just overall — so weak spots surface immediately." },
  { icon: "🔄", title: "Automatic replanning", desc: "When a topic is weak, the plan shifts practice toward it — and tells you why, before it happens." },
  { icon: "📊", title: "Progress & mastery", desc: "A dashboard built to answer one question at a glance: am I on track?" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-ink bg-grid-fade text-white">
      <SiteHeader />

      {/* HERO */}
      <section className="mx-auto max-w-4xl px-6 pb-16 pt-20 text-center sm:pt-28">
        <p className="mb-4 inline-block rounded-full border border-cyan/30 bg-cyan/10 px-3 py-1 text-xs font-medium tracking-wide text-cyan">
          YOUR PERSONAL AI STUDY AGENT
        </p>
        <h1 className="font-display text-4xl font-semibold leading-tight sm:text-6xl">
          Don&apos;t just study.
          <br />
          <span className="bg-gradient-to-r from-cyan to-signal bg-clip-text text-transparent">
            Achieve your goal.
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-balance text-base text-mist sm:text-lg">
          {APP_NAME} turns your syllabus and study material into a personalized learning
          journey — and adapts as you learn.
        </p>
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/signup"
            className="w-full rounded-xl bg-cyan px-6 py-3.5 text-center text-sm font-semibold text-ink shadow-glow transition hover:brightness-110 sm:w-auto"
          >
            Build My Study Goal
          </Link>
          <a
            href="#how-it-works"
            className="w-full rounded-xl border border-line px-6 py-3.5 text-center text-sm font-semibold text-white transition hover:border-cyan/50 sm:w-auto"
          >
            See How It Works
          </a>
        </div>
      </section>

      {/* ATTACH-ANYTHING TEASER (NotebookLM-style) */}
      <section className="mx-auto max-w-3xl px-6 pb-16">
        <div className="rounded-2xl border border-line bg-panel p-6 shadow-glow sm:p-8">
          <div className="flex flex-wrap items-center justify-center gap-3 text-center">
            {["📄 PDF", "📝 Lecture notes", "🖼️ Photo of notes", "📊 Slides"].map((chip) => (
              <span key={chip} className="rounded-full border border-line bg-panel2 px-3.5 py-1.5 text-xs text-mist">
                {chip}
              </span>
            ))}
          </div>
          <p className="mt-5 text-center text-sm text-mist">
            Attach your own material the way you would in any AI chat — the agent reads it,
            builds notes, diagrams, quizzes and flashcards grounded in exactly what you gave it.
          </p>
        </div>
      </section>

      {/* AGENT LOOP */}
      <section id="how-it-works" className="mx-auto max-w-5xl px-6 pb-20">
        <h2 className="mb-10 text-center font-display text-2xl font-semibold sm:text-3xl">
          One continuous loop, until you&apos;re ready
        </h2>
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          {LOOP_STEPS.map((step, i) => (
            <div key={step} className="flex items-center gap-2 sm:gap-3">
              <div className="rounded-xl border border-cyan/30 bg-panel px-4 py-3 text-sm font-semibold tracking-wide text-cyan">
                {step}
              </div>
              {i < LOOP_STEPS.length - 1 && <span className="text-mist">→</span>}
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-2xl border border-line bg-panel p-6 transition hover:border-cyan/40">
              <div className="mb-3 text-2xl">{f.icon}</div>
              <h3 className="mb-1.5 font-display text-base font-semibold text-white">{f.title}</h3>
              <p className="text-sm leading-relaxed text-mist">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-line/60 px-6 py-8 text-center text-xs text-mist">
        {APP_NAME} — built for students working toward a real deadline.
      </footer>
    </div>
  );
}
