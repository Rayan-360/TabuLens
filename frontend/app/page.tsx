"use client";

import { useState } from "react";
import { submitDocument, submitFixture } from "@/lib/api";
import type { ExtractResult } from "@/lib/types";
import {
  UploadDropzone, ResultsTable, ValidationSummary, DemoModeToggle, type Mode,
} from "./components";

export default function Home() {
  const [mode, setMode] = useState<Mode>("live");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ExtractResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setBusy(true); setError(null); setResult(null);
    try {
      setResult(await submitDocument(file));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally { setBusy(false); }
  }

  async function runFixture() {
    setBusy(true); setError(null); setResult(null);
    try {
      setResult(await submitFixture("error_invoice"));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally { setBusy(false); }
  }

  function reset() { setResult(null); setError(null); }

  const provider = result?.table?._provider;

  return (
    <main className="container" style={{ paddingTop: 48, paddingBottom: 80 }}>
      {/* header */}
      <header style={{ display: "flex", justifyContent: "space-between",
        alignItems: "center", flexWrap: "wrap", gap: 16, marginBottom: 8 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 22, letterSpacing: "-0.02em" }}>
            Tabu<span style={{ color: "var(--accent)" }}>Lens</span>
          </div>
          <div style={{ color: "var(--text-muted)", fontSize: 15 }}>
            Extracts financial tables — then proves the numbers add up.
          </div>
        </div>
        <DemoModeToggle mode={mode} onChange={(m) => { setMode(m); reset(); }} />
      </header>

      <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: "24px 0 28px" }} />

      {/* input */}
      {mode === "live" ? (
        <UploadDropzone onFile={handleFile} busy={busy} />
      ) : (
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: "var(--radius)", padding: "28px 24px", textAlign: "center",
          boxShadow: "var(--shadow)" }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Offline demo invoice</div>
          <div style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 18 }}>
            A pre-extracted invoice with a planted error. Runs without the network — the trust layer still catches it.
          </div>
          <button onClick={runFixture} disabled={busy}
            style={{ background: "var(--primary)", color: "#fff", border: "none",
              borderRadius: 10, padding: "11px 22px", fontWeight: 600, fontSize: 15,
              cursor: busy ? "default" : "pointer", opacity: busy ? 0.6 : 1 }}>
            {busy ? "Validating…" : "Run validation"}
          </button>
        </div>
      )}

      {error && (
        <div role="alert" style={{ marginTop: 20, background: "var(--error-bg)",
          border: "1px solid var(--error)", color: "var(--error)",
          borderRadius: "var(--radius)", padding: "14px 16px" }}>
          {error}
          <div style={{ color: "var(--text-muted)", fontSize: 14, marginTop: 4 }}>
            Switch to Fixture (offline) mode to run the demo without the API.
          </div>
        </div>
      )}

      {/* output */}
      {result && (
        <div style={{ marginTop: 28, display: "grid", gap: 20 }}>
          <ValidationSummary validation={result.validation} />
          <ResultsTable table={result.table} validation={result.validation} />
          <p style={{ color: "var(--text-faint)", fontSize: 13, margin: 0 }}>
            Coloured dots show the extractor&rsquo;s per-field confidence. Red cells are
            flagged by the reasoner, not by low confidence — the arithmetic itself is wrong.
            {provider && <> Extracted via <strong style={{ textTransform: "capitalize" }}>{provider}</strong>.</>}
          </p>
        </div>
      )}
    </main>
  );
}
