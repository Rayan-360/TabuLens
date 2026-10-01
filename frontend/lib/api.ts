// Single seam between UI and backend. Today it returns the validated result
// directly. If the backend later goes async (job submit + poll), only this
// function changes — components keep calling submitDocument() unchanged.

import type { ExtractResult } from "./types";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function submitDocument(file: File): Promise<ExtractResult> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${BASE}/extract`, { method: "POST", body: form });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail.detail || `Extraction failed (${res.status})`);
  }
  return res.json();
}

export async function submitFixture(name = "error_invoice"): Promise<ExtractResult> {
  const res = await fetch(`${BASE}/extract/fixture?name=${name}`, { method: "POST" });
  if (!res.ok) throw new Error(`Fixture failed (${res.status})`);
  return res.json();
}
