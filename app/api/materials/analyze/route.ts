import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { askForJSON } from "@/lib/anthropic";

// Turns an uploaded material into a topic tree the rest of the agent loop
// (plan generation, notes, quizzes, flashcards) is grounded in.
//
// PDFs and plain text: extracted server-side with pdf-parse, then sent to
// Claude as text. Images (photos of notes/whiteboards) are sent to Claude
// directly as an image block so it can read handwriting/diagrams natively.
export async function POST(req: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { materialId } = await req.json();
  const { data: material } = await supabase
    .from("materials")
    .select("*")
    .eq("id", materialId)
    .eq("user_id", user.id)
    .single();
  if (!material) return NextResponse.json({ error: "Material not found" }, { status: 404 });

  await supabase.from("materials").update({ status: "analyzing" }).eq("id", material.id);

  try {
    const { data: fileBlob } = await supabase.storage.from("materials").download(material.storage_path);
    if (!fileBlob) throw new Error("Could not download stored file");
    const arrayBuffer = await fileBlob.arrayBuffer();

    let extractedText = "";
    const isImage = material.mime_type?.startsWith("image/");

    if (material.mime_type === "application/pdf") {
      const pdfParse = (await import("pdf-parse")).default;
      const parsed = await pdfParse(Buffer.from(arrayBuffer));
      extractedText = parsed.text.slice(0, 60_000); // guard against huge documents
    } else if (material.mime_type === "text/plain") {
      extractedText = Buffer.from(arrayBuffer).toString("utf-8").slice(0, 60_000);
    }
    // DOCX and images are handled below without pre-extraction: DOCX text
    // extraction can be added with a docx-parsing library; images are passed
    // straight to Claude as visual input.

    const system = `You are an expert curriculum analyst. Given raw study material, identify the
units/chapters, topics, and subtopics a student needs to master. Do not invent
content that isn't supported by the material. Estimate study time per topic
in minutes and a difficulty (easy|medium|hard).`;

    const jsonShape = `{"topics": [{"title": string, "summary": string, "difficulty": "easy"|"medium"|"hard", "estimatedMinutes": number, "subtopics": [{"title": string, "summary": string}] }]}`;

    let topics;
    if (isImage) {
      const base64 = Buffer.from(arrayBuffer).toString("base64");
      const { anthropic, AGENT_MODEL } = await import("@/lib/anthropic");
      const res = await anthropic.messages.create({
        model: AGENT_MODEL,
        max_tokens: 2000,
        system: system + `\n\nRespond with ONLY valid JSON matching: ${jsonShape}`,
        messages: [
          {
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: material.mime_type as any, data: base64 } },
              { type: "text", text: "Analyze this photo of study material and extract the topic structure." },
            ],
          },
        ],
      });
      const text = res.content.filter((b: any) => b.type === "text").map((b: any) => b.text).join("\n");
      topics = JSON.parse(text.replace(/^```json\s*|\s*```$/g, "").trim()).topics;
    } else {
      const result = await askForJSON<{ topics: any[] }>({
        system,
        prompt: `Material (may be truncated):\n\n${extractedText || "[No extractable text — DOCX support pending; ask the student to export as PDF or paste text.]"}\n\nReturn JSON matching: ${jsonShape}`,
        maxTokens: 3000,
      });
      topics = result.topics;
    }

    // Persist the topic tree (flattening subtopics as child rows).
    let orderIndex = 0;
    for (const t of topics || []) {
      const { data: parent } = await supabase
        .from("topics")
        .insert({
          user_id: user.id,
          goal_id: material.goal_id,
          material_id: material.id,
          title: t.title,
          summary: t.summary,
          difficulty: t.difficulty || "medium",
          estimated_minutes: t.estimatedMinutes || 30,
          order_index: orderIndex++,
        })
        .select()
        .single();

      for (const sub of t.subtopics || []) {
        await supabase.from("topics").insert({
          user_id: user.id,
          goal_id: material.goal_id,
          material_id: material.id,
          parent_topic_id: parent?.id,
          title: sub.title,
          summary: sub.summary,
          order_index: orderIndex++,
        });
      }
    }

    await supabase
      .from("materials")
      .update({ status: "analyzed", extracted_text: extractedText || null })
      .eq("id", material.id);

    await supabase.from("agent_actions").insert({
      user_id: user.id,
      goal_id: material.goal_id,
      action_type: "analyzed_material",
      summary: `Analyzed "${material.file_name}" and identified ${topics?.length || 0} topics.`,
    });

    return NextResponse.json({ topicsCreated: topics?.length || 0 });
  } catch (err: any) {
    await supabase.from("materials").update({ status: "failed" }).eq("id", material.id);
    return NextResponse.json({ error: err.message || "Analysis failed" }, { status: 500 });
  }
}
