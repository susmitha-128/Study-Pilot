import { createClient } from "@/lib/supabase/server";
import { SettingsForm } from "@/components/settings-form";

export default async function SettingsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user!.id).single();

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="font-display text-2xl font-semibold">Settings</h1>
      <p className="mt-1 text-sm text-mist">These preferences shape the agent's recommendations.</p>
      <div className="mt-6">
        <SettingsForm profile={profile} email={user!.email!} />
      </div>
    </div>
  );
}
