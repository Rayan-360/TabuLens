"use client";

import { useRef, useState } from "react";
import type { Table, Validation } from "@/lib/types";

/* ---------- icons (inline SVG, no emoji) ---------- */

type S = React.SVGProps<SVGSVGElement>;

export function IconLens(p: S) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
      <rect x="3" y="3" width="18" height="18" rx="3" /><path d="M3 9h18M9 9v12" />
      <circle cx="15.5" cy="14.5" r="2.4" /><path d="m18 17 1.8 1.8" />
    </svg>
  );
}
function IconCheck(p: S) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor"
      strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
function IconAlert(p: S) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor"
      strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
      <path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
    </svg>
  );
}
function IconUpload(p: S) {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor"
      strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
    </svg>
  );
}

/* ---------- confidence dot ---------- */

function confColor(score?: number): string {
  if (score == null) return "var(--border-strong)";
  if (score >= 0.85) return "var(--ok)";
  if (score >= 0.6) return "var(--warn)";
  return "var(--error)";
}

function ConfidenceDot({ score }: { score?: number }) {
  const pct = score == null ? "n/a" : `${Math.round(score * 100)}%`;
  return (
    <span className="cdot" title={`confidence ${pct}`} aria-label={`confidence ${pct}`}
      style={{ background: confColor(score), marginLeft: 8, display: "inline-block" }} />
  );
}

function Num({ value, score, flag }: { value?: number | string; score?: number; flag?: boolean }) {
  return (
    <span className={`num mono${flag ? " flag" : ""}`}>
      {typeof value === "number" ? value.toFixed(2) : value}
      <ConfidenceDot score={score} />
    </span>
  );
}

/* ---------- status pill ---------- */

export function StatusPill({ validation }: { validation: Validation }) {
  const ok = validation.status === "ok";
  return (
    <span className={`pill ${ok ? "ok" : "err"}`}>
      {ok ? <IconCheck width={16} height={16} /> : <IconAlert width={16} height={16} />}
      {ok ? "Validated" : `${validation.issues.length} issue${validation.issues.length > 1 ? "s" : ""}`}
    </span>
  );
}

/* ---------- validation banner (the money moment) ---------- */

export function ValidationSummary({ validation }: { validation: Validation }) {
  const ok = validation.status === "ok";
  return (
    <div className={`banner ${ok ? "ok" : "err"}`} role="status">
      <div className="b-icon">{ok ? <IconCheck /> : <IconAlert />}</div>
      <div>
        <div className="b-title">
          {ok ? "All arithmetic checks passed" : "Arithmetic error detected"}
        </div>
        {ok ? (
          <div style={{ color: "var(--text-muted)", fontSize: 15 }}>
            Every line total, the subtotal, and the grand total reconcile.
          </div>
        ) : (
          <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
            {validation.issues.map((i, k) => <li key={k} style={{ marginBottom: 2 }}>{i.message}</li>)}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ---------- results table ---------- */

export function ResultsTable({ table, validation }: { table: Table; validation: Validation }) {
  const flagged = new Set((validation.issues || []).map((i) => i.location));
  const items = table.line_items || [];
  const R: React.CSSProperties = { textAlign: "right" };

  return (
    <div className="card tbl-wrap">
      <div className="tbl-head">
        <div style={{ fontWeight: 600 }}>{table.vendor || "Invoice"}</div>
        <div className="mono" style={{ color: "var(--text-muted)", fontSize: 14 }}>{table.invoice_no}</div>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table className="inv" style={{ minWidth: 520 }}>
          <thead>
            <tr>
              <th>Description</th>
              <th style={R}>Qty</th>
              <th style={R}>Unit Price</th>
              <th style={R}>Line Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((r, i) => {
              const bad = flagged.has(`line_items[${i}]`);
              const c = r.confidence || {};
              return (
                <tr key={i} className={bad ? "bad" : undefined}>
                  <td>{r.description}</td>
                  <td style={R}><Num value={r.qty} score={c.qty} /></td>
                  <td style={R}><Num value={r.unit_price} score={c.unit_price} /></td>
                  <td style={R}><Num value={r.line_total} score={c.line_total} flag={bad} /></td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3} style={{ ...R, border: "none", paddingTop: 16 }}>Subtotal</td>
              <td style={{ ...R, border: "none", paddingTop: 16 }}><Num value={table.subtotal} flag={flagged.has("subtotal")} /></td>
            </tr>
            <tr>
              <td colSpan={3} style={{ ...R, border: "none", color: "var(--text-muted)", paddingTop: 4 }}>Tax</td>
              <td style={{ ...R, border: "none", color: "var(--text-muted)", paddingTop: 4 }}>
                <span className="mono">{Number(table.tax ?? 0).toFixed(2)}</span>
              </td>
            </tr>
            <tr>
              <td colSpan={3} style={{ ...R, border: "none", fontWeight: 700, fontSize: 17, paddingTop: 6 }}>Grand Total</td>
              <td style={{ ...R, border: "none", fontWeight: 700, fontSize: 17, paddingTop: 6 }}><Num value={table.grand_total} flag={flagged.has("grand_total")} /></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

/* ---------- confidence legend ---------- */

export function ConfidenceLegend() {
  const row = (color: string, label: string) => (
    <span><i className="cdot" style={{ background: color }} />{label}</span>
  );
  return (
    <div className="legend">
      <strong style={{ color: "var(--text-faint)", fontWeight: 600 }}>Extractor confidence:</strong>
      {row("var(--ok)", "high")}
      {row("var(--warn)", "medium")}
      {row("var(--error)", "low")}
    </div>
  );
}

/* ---------- upload dropzone ---------- */

export function UploadDropzone({ onFile, busy }: { onFile: (f: File) => void; busy: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const pick = (f?: File | null) => { if (f) onFile(f); };

  return (
    <div
      className={`dropzone${over ? " over" : ""}${busy ? " busy" : ""}`}
      onClick={() => !busy && inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); if (!busy) setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); if (!busy) pick(e.dataTransfer.files?.[0]); }}
    >
      <div className="u-icon">{busy ? <Spinner /> : <IconUpload />}</div>
      <div className="u-title">{busy ? "Extracting & validating…" : "Drop an invoice image, or click to browse"}</div>
      <div className="u-sub">PNG or JPG · extracted by a vision model, then checked by the reasoner</div>
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={(e) => pick(e.target.files?.[0])} />
    </div>
  );
}

export function Spinner() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"
      style={{ animation: "spin 0.8s linear infinite" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeOpacity="0.2" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
