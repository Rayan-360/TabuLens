"use client";

import { useState } from "react";
import { submitDocument } from "@/lib/api";
import type { ExtractResult } from "@/lib/types";
import {
  UploadDropzone, ResultsTable, ValidationSummary, StatusLine, ConfidenceLegend, IconMark,
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

  return (
    <>
      <header className="topbar">
        <div className="wrap topbar-in">
          <span className="word"><span className="mk"><IconMark /></span>TabuLens</span>
          <span className="tag">Financial table verification</span>
        </div>
      </header>

      <main className="wrap" style={{ paddingBottom: 96 }}>
        {!result ? (
          <>
            {!busy && (
              <section className="intro">
                <h1>Trust the numbers, not just the text.</h1>
                <p>
                  TabuLens reads a financial table from a document and checks that its
                  arithmetic holds — surfacing the errors extraction alone leaves behind.
                </p>
              </section>
            )}
            <div style={{ maxWidth: 560, margin: "0 auto", paddingTop: busy ? 72 : 0 }}>
              <UploadDropzone onFile={handleFile} busy={busy} />
              {error && (
                <div className="note bad" role="alert" style={{ marginTop: 16 }}>
                  <div><div className="nt">Couldn’t read that document</div>
                    <div style={{ color: "var(--ink-2)", fontSize: 14 }}>{error}</div></div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="rise" style={{ paddingTop: 36 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
              gap: 16, flexWrap: "wrap", paddingBottom: 28, borderBottom: "1px solid var(--hair)" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 14, flexWrap: "wrap" }}>
                <StatusLine validation={result.validation} />
                <span className="meta">Read in {(result._ms / 1000).toFixed(1)}s</span>
              </div>
              <button className="btn quiet" onClick={reset}>Check another</button>
            </div>

            <div className="results" style={{ paddingTop: 32 }}>
              <aside className="source-sticky">
                <div className="label">Source</div>
                {preview && (
                  <div className="source-frame">
                    <img src={preview} alt="Uploaded invoice" />
                  </div>
                )}
              </aside>

              <section>
                <ValidationSummary validation={result.validation} />
                <div style={{ height: 28 }} />
                <ResultsTable table={result.table} validation={result.validation} />
                <div style={{ height: 22 }} />
                <ConfidenceLegend />
                <p className="foot" style={{ marginTop: 16 }}>
                  A red figure is flagged by the checker — the arithmetic itself is wrong,
                  regardless of how confident the reader was in that field.
                </p>
              </section>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
