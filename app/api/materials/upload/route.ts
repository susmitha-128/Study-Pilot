import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Accepts PDFs, Word docs, and photos of notes/whiteboards — the same kind of
// "attach anything" flow students expect from an LLM chat (NotebookLM-style).
const ALLOWED_MIME = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "image/png",
  "image/jpeg",
  "image/webp",
];
const MAX_BYTES = 25 * 1024 * 1024; // 25MB

export async function POST(req: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file") as File | null;
  const goalId = form.get("goalId") as string | null;

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (!goalId) return NextResponse.json({ error: "Missing goalId" }, { status: 400 });
  if (!ALLOWED_MIME.includes(file.type)) {
    return NextResponse.json(
      { error: `Unsupported file type: ${file.type || "unknown"}. Try PDF, DOCX, TXT, PNG or JPG.` },
      { status: 415 }
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File is larger than the 25MB limit." }, { status: 413 });
  }

  // Verify the goal belongs to this user before writing anything under it.
  const { data: goal } = await supabase.from("goals").select("id").eq("id", goalId).eq("user_id", user.id).single();
  if (!goal) return NextResponse.json({ error: "Goal not found" }, { status: 404 });

  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const storagePath = `${user.id}/${goalId}/${Date.now()}_${safeName}`;

  const bytes = new Uint8Array(await file.arrayBuffer());
  const { error: uploadError } = await supabase.storage.from("materials").upload(storagePath, bytes, {
    contentType: file.type,
    upsert: false,
  });
  if (uploadError) {
    return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 });
  }

  const { data: material, error: insertError } = await supabase
    .from("materials")
    .insert({
      user_id: user.id,
      goal_id: goalId,
      file_name: file.name,
      storage_path: storagePath,
      mime_type: file.type,
      status: "uploaded",
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: `Could not save material record: ${insertError.message}` }, { status: 500 });
  }

  return NextResponse.json({ material });
}
