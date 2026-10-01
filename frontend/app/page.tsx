"use client";

import { useState } from "react";
import { submitDocument } from "@/lib/api";
import type { ExtractResult } from "@/lib/types";
import {
  UploadDropzone, ResultsTable, ValidationSummary, StatusPill, ConfidenceLegend, IconLens,
} from "./components";

type Result = ExtractResult & { _ms: number };

export default function Home() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setBusy(true); setError(null); setResult(null);
    setPreview((p) => { if (p) URL.revokeObjectURL(p); return URL.createObjectURL(file); });
    try {
      setResult(await submitDocument(file));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally { setBusy(false); }
  }

  function reset() {
    setResult(null); setError(null);
    setPreview((p) => { if (p) URL.revokeObjectURL(p); return null; });
  }

  const provider = result?.table?._provider;

  return (
    <>
      <div className="appbar">
        <div className="container appbar-inner">
          <div className="brand">
            <span className="brand-mark"><IconLens /></span>
            Tabu<span style={{ color: "var(--accent)" }}>Lens</span>
          </div>
          <span className="chip"><span className="dot" /> Groq vision · live</span>
        </div>
      </div>

      <main className="container" style={{ paddingBottom: 80 }}>
        {!result && !busy && (
          <section className="hero">
            <h1>Trust the numbers,<br /><span className="grad">not just the text.</span></h1>
            <p>
              TabuLens extracts a financial table from a document, then verifies its
              arithmetic — catching the errors that raw extraction, and raw LLMs, pass
              silently.
            </p>
          </section>
        )}

        {!result ? (
          <div style={{ maxWidth: 680, margin: "0 auto", paddingTop: busy ? 48 : 0 }}>
            <UploadDropzone onFile={handleFile} busy={busy} />
            {error && (
              <div className="banner err" role="alert" style={{ marginTop: 20 }}>
                <div style={{ fontWeight: 600 }}>{error}</div>
              </div>
            )}
          </div>
        ) : (
          <div className="fade-in" style={{ paddingTop: 28 }}>
            {/* summary bar */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
              flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <StatusPill validation={result.validation} />
                <span style={{ color: "var(--text-faint)", fontSize: 14 }}>
                  Extracted in {(result._ms / 1000).toFixed(1)}s
                  {provider && <> · via <span style={{ textTransform: "capitalize" }}>{provider}</span></>}
                </span>
              </div>
              <button className="btn ghost" onClick={reset}>Analyze another</button>
            </div>

            <div className="results">
              {/* left: source document */}
              <aside className="source-sticky">
                <div className="card card-pad">
                  <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: ".05em",
                    textTransform: "uppercase", color: "var(--text-faint)", marginBottom: 12 }}>
                    Source document
                  </div>
                  {preview && <img className="source-img" src={preview} alt="Uploaded invoice" />}
                </div>
              </aside>

              {/* right: validation + table */}
              <div style={{ display: "grid", gap: 18 }}>
                <ValidationSummary validation={result.validation} />
                <ResultsTable table={result.table} validation={result.validation} />
                <ConfidenceLegend />
                <p style={{ color: "var(--text-faint)", fontSize: 13, margin: 0 }}>
                  Red cells are flagged by the reasoner — the arithmetic itself is wrong,
                  independent of how confident the extractor was.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
