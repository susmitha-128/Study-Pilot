"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

const ACCEPT = ".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.webp";

export function MaterialsUploader({ goals }: { goals: { id: string; title: string }[] }) {
  const [goalId, setGoalId] = useState(goals[0]?.id ?? "");
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function uploadFiles(files: FileList | File[]) {
    setError(null);
    setUploading(true);
    for (const file of Array.from(files)) {
      const form = new FormData();
      form.append("file", file);
      form.append("goalId", goalId);
      const res = await fetch("/api/materials/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || `Failed to upload ${file.name}`);
        continue;
      }
      // Kick off analysis in the background — user doesn't need to wait here.
      fetch("/api/materials/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ materialId: data.material.id }),
      }).catch(() => {});
    }
    setUploading(false);
    router.refresh();
  }

  return (
    <div>
      <label className="mb-2 block text-xs font-medium text-mist">Attach to goal</label>
      <select value={goalId} onChange={(e) => setGoalId(e.target.value)} className="input mb-4 max-w-xs">
        {goals.map((g) => (
          <option key={g.id} value={g.id}>
            {g.title}
          </option>
        ))}
      </select>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 text-center transition ${
          dragging ? "border-cyan bg-cyan/5" : "border-line hover:border-cyan/40"
        }`}
      >
        <p className="text-2xl">📎</p>
        <p className="mt-2 text-sm text-white">Drop files here, or click to browse</p>
        <p className="mt-1 text-xs text-mist">PDF, Word, TXT, or photos of notes — up to 25MB each</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => e.target.files && uploadFiles(e.target.files)}
        />
      </div>
      {uploading && <p className="mt-2 text-xs text-cyan">Uploading…</p>}
      {error && <p className="mt-2 text-xs text-coral">{error}</p>}
    </div>
  );
}
