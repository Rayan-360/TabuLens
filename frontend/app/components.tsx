"use client";

import { useRef, useState } from "react";
import type { Table, Validation } from "@/lib/types";

type S = React.SVGProps<SVGSVGElement>;

/* ---------- icons ---------- */

export function IconMark(p: S) {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor"
      strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="2.5" />
      <path d="M3.5 9h17M9 9v11.5" />
      <circle cx="15.2" cy="14.2" r="2" /><path d="m16.8 15.8 1.9 1.9" />
    </svg>
  );
}
function IconCheck(p: S) {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
function IconAlert(p: S) {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
      <path d="M12 8.5v4.5M12 16.5h.01M10.6 4.3 2.5 18a1.8 1.8 0 0 0 1.5 2.7h16a1.8 1.8 0 0 0 1.5-2.7L13.4 4.3a1.6 1.6 0 0 0-2.8 0Z" />
    </svg>
  );
}
function IconUpload(p: S) {
  return (
    <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor"
      strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
      <path d="M12 15V4m0 0L8 8m4-4 4 4M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
    </svg>
  );
}
export function Spinner() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" style={{ animation: "sp .7s linear infinite" }}>
      <style>{`@keyframes sp{to{transform:rotate(360deg)}}`}</style>
      <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" strokeOpacity="0.18" strokeWidth="2.4" />
      <path d="M20.5 12a8.5 8.5 0 0 0-8.5-8.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

/* ---------- confidence ---------- */

function confColor(score?: number): string {
  if (score == null) return "var(--hair-strong)";
  if (score >= 0.85) return "var(--ok)";
  if (score >= 0.6) return "var(--warn)";
  return "var(--bad)";
}
function Dot({ score }: { score?: number }) {
  const pct = score == null ? "n/a" : `${Math.round(score * 100)}%`;
  return <span className="dot" style={{ background: confColor(score) }} title={`confidence ${pct}`} aria-label={`confidence ${pct}`} />;
}
function Num({ value, score, flag, cls = "" }: { value?: number | string; score?: number; flag?: boolean; cls?: string }) {
  return (
    <span className={`num${flag ? " flag" : ""}${cls ? " " + cls : ""}`}>
      {typeof value === "number" ? value.toFixed(2) : value}
      {score !== undefined && <Dot score={score} />}
    </span>
  );
}

/* ---------- status line ---------- */

export function StatusLine({ validation }: { validation: Validation }) {
  const ok = validation.status === "ok";
  return (
    <span className={`status ${ok ? "ok" : "bad"}`}>
      {ok ? <IconCheck /> : <IconAlert />}
      {ok ? "Checks passed" : `${validation.issues.length} issue${validation.issues.length > 1 ? "s" : ""} found`}
    </span>
  );
}

/* ---------- validation note ---------- */

export function ValidationSummary({ validation }: { validation: Validation }) {
  const ok = validation.status === "ok";
  return (
    <div className={`note ${ok ? "ok" : "bad"}`} role="status">
      <span className="ni">{ok ? <IconCheck /> : <IconAlert />}</span>
      <div>
        <div className="nt">{ok ? "All arithmetic reconciles" : "Arithmetic error detected"}</div>
        {ok ? (
          <div style={{ color: "var(--ink-2)", fontSize: 14 }}>
            Line totals, subtotal and grand total are mutually consistent.
          </div>
        ) : (
          <ul style={{ margin: "5px 0 0", paddingLeft: 17, color: "var(--ink)" }}>
            {validation.issues.map((i, k) => <li key={k} style={{ marginBottom: 2 }}>{i.message}</li>)}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ---------- data panel: header + table ---------- */

export function ResultsTable({ table, validation }: { table: Table; validation: Validation }) {
  const flagged = new Set((validation.issues || []).map((i) => i.location));
  const items = table.line_items || [];

  return (
    <div className="data">
      <div className="data-h">
        <span className="v">{table.vendor || "Invoice"}</span>
        <span className="n tnum">{table.invoice_no}</span>
      </div>
      <div className="data-b">
        <table className="inv">
          <thead>
            <tr>
              <th>Description</th>
              <th className="r">Qty</th>
              <th className="r">Unit Price</th>
              <th className="r">Line Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((r, i) => {
              const bad = flagged.has(`line_items[${i}]`);
              const c = r.confidence || {};
              return (
                <tr key={i} className={bad ? "bad" : undefined}>
                  <td className="desc">{r.description}</td>
                  <td className="r"><Num value={r.qty} score={c.qty} /></td>
                  <td className="r"><Num value={r.unit_price} score={c.unit_price} /></td>
                  <td className="r"><Num value={r.line_total} score={c.line_total} flag={bad} /></td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="totals">
            <tr>
              <td className="r lbl" colSpan={3}>Subtotal</td>
              <td className="r"><Num value={table.subtotal} flag={flagged.has("subtotal")} /></td>
            </tr>
            <tr>
              <td className="r lbl" colSpan={3}>Tax</td>
              <td className="r"><span className="num">{Number(table.tax ?? 0).toFixed(2)}</span></td>
            </tr>
            <tr className="grand">
              <td className="r lbl" colSpan={3}>Grand Total</td>
              <td className="r"><Num value={table.grand_total} flag={flagged.has("grand_total")} cls="g" /></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

/* ---------- confidence legend ---------- */

export function ConfidenceLegend() {
  return (
    <div className="legend">
      <span style={{ color: "var(--ink-3)" }}>Field confidence</span>
      <span><i style={{ background: "var(--ok)" }} />high</span>
      <span><i style={{ background: "var(--warn)" }} />medium</span>
      <span><i style={{ background: "var(--bad)" }} />low</span>
    </div>
  );
}

/* ---------- upload ---------- */

export function UploadDropzone({ onFile, busy }: { onFile: (f: File) => void; busy: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const pick = (f?: File | null) => { if (f) onFile(f); };
  return (
    <div
      className={`drop${over ? " over" : ""}${busy ? " busy" : ""}`}
      onClick={() => !busy && inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); if (!busy) setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); if (!busy) pick(e.dataTransfer.files?.[0]); }}
    >
      <div className="ic">{busy ? <Spinner /> : <IconUpload />}</div>
      <div className="t">{busy ? "Reading the document…" : "Drop an invoice, or click to choose a file"}</div>
      <div className="s">PNG or JPG · the table is read, then its arithmetic is checked</div>
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={(e) => pick(e.target.files?.[0])} />
    </div>
  );
}

/* ---------- sample picker ---------- */

const SAMPLES = [
  { file: "clean.png", name: "Office supplies", kind: "4 line items" },
  { file: "techparts.png", name: "Electronics", kind: "4 line items" },
  { file: "error.png", name: "Furnishings", kind: "4 line items" },
];

export function SamplePicker({ onPick, busy }: { onPick: (f: File) => void; busy: boolean }) {
  async function choose(file: string) {
    if (busy) return;
    const blob = await fetch(`/samples/${file}`).then((r) => r.blob());
    onPick(new File([blob], file, { type: "image/png" }));
  }
  return (
    <div className="samples">
      <div className="samples-h">or start with a sample</div>
      <div className="sample-row">
        {SAMPLES.map((s) => (
          <button key={s.file} className="sample" onClick={() => choose(s.file)} disabled={busy}>
            <span className="thumb" style={{ backgroundImage: `url(/samples/${s.file})` }} />
            <span className="cap"><b>{s.name}</b><span>{s.kind}</span></span>
          </button>
        ))}
      </div>
    </div>
  );
}
