"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function SettingsForm({ profile, email }: { profile: any; email: string }) {
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [educationLevel, setEducationLevel] = useState(profile?.education_level || "undergraduate");
  const [dailyMinutes, setDailyMinutes] = useState(profile?.daily_available_minutes || 60);
  const [preferredTime, setPreferredTime] = useState(profile?.preferred_study_time || "evening");
  const [saved, setSaved] = useState(false);
  const supabase = createClient();

  async function save(e: React.FormEvent) {
    e.preventDefault();
    await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        education_level: educationLevel,
        daily_available_minutes: Number(dailyMinutes),
        preferred_study_time: preferredTime,
      })
      .eq("id", (await supabase.auth.getUser()).data.user?.id);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <form onSubmit={save} className="card space-y-4">
      <div>
        <label className="mb-1.5 block text-xs font-medium text-mist">Email</label>
        <input disabled value={email} className="input opacity-60" />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium text-mist">Full name</label>
        <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="input" />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium text-mist">Education level</label>
        <select value={educationLevel} onChange={(e) => setEducationLevel(e.target.value)} className="input">
          <option value="undergraduate">Undergraduate</option>
          <option value="postgraduate">Postgraduate</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium text-mist">Daily available study time (minutes)</label>
        <input type="number" min={15} step={15} value={dailyMinutes} onChange={(e) => setDailyMinutes(e.target.value)} className="input" />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium text-mist">Preferred study time</label>
        <select value={preferredTime} onChange={(e) => setPreferredTime(e.target.value)} className="input">
          <option value="morning">Morning</option>
          <option value="afternoon">Afternoon</option>
          <option value="evening">Evening</option>
          <option value="night">Night</option>
        </select>
      </div>
      <button type="submit" className="btn-primary w-full">
        Save
      </button>
      {saved && <p className="text-center text-xs text-mint">Saved.</p>}
    </form>
  );
}
