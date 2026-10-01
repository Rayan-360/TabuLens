// Single seam between UI and backend. Today it returns the validated result
// directly. If the backend later goes async (job submit + poll), only this
// function changes — components keep calling submitDocument() unchanged.

import type { ExtractResult } from "./types";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function submitDocument(file: File): Promise<ExtractResult & { _ms: number }> {
  const form = new FormData();
  form.append("file", file);
  const t0 = performance.now();
  const res = await fetch(`${BASE}/extract`, { method: "POST", body: form });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail.detail || `Extraction failed (${res.status})`);
  }
  const data = await res.json();
  return { ...data, _ms: Math.round(performance.now() - t0) };
}
