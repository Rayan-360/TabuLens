"use client";

import { useRef, useState } from "react";
import type { Table, Validation } from "@/lib/types";

/* ---------- icons (inline SVG, no emoji) ---------- */

function IconCheck(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none"
      stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"
      strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function IconAlert(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none"
      stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"
      strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
    </svg>
  );
}

function IconUpload(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="28" height="28" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
      strokeLinejoin="round" aria-hidden="true" {...props}>
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

export function ConfidenceDot({ score }: { score?: number }) {
  const pct = score == null ? "n/a" : `${Math.round(score * 100)}%`;
  return (
    <span
      title={`confidence ${pct}`}
      aria-label={`confidence ${pct}`}
      style={{
        display: "inline-block", width: 8, height: 8, borderRadius: "50%",
        marginLeft: 8, background: confColor(score), verticalAlign: "middle",
        flexShrink: 0,
      }}
    />
  );
}

/* ---------- money cell with optional error flag + confidence ---------- */

function Num({ value, score, flagged }: { value: number | string | undefined; score?: number; flagged?: boolean }) {
  return (
    <span className="mono" style={{
      display: "inline-flex", alignItems: "center", justifyContent: "flex-end",
      gap: 2, width: "100%",
      color: flagged ? "var(--error)" : "inherit",
      fontWeight: flagged ? 600 : 400,
    }}>
      {typeof value === "number" ? value.toFixed(2) : value}
      <ConfidenceDot score={score} />
    </span>
  );
}

/* ---------- results table ---------- */

export function ResultsTable({ table, validation }: { table: Table; validation: Validation }) {
  const flagged = new Set((validation.issues || []).map((i) => i.location));
  const items = table.line_items || [];

  const th: React.CSSProperties = { textAlign: "left", padding: "10px 14px", fontSize: 13,
    color: "var(--text-faint)", fontWeight: 600, textTransform: "uppercase",
    letterSpacing: "0.04em", borderBottom: "1px solid var(--border)" };
  const thR: React.CSSProperties = { ...th, textAlign: "right" };
  const td: React.CSSProperties = { padding: "12px 14px", borderBottom: "1px solid var(--border)" };
  const tdR: React.CSSProperties = { ...td, textAlign: "right" };

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)",
      borderRadius: "var(--radius)", boxShadow: "var(--shadow)", overflow: "hidden" }}>
      <div style={{ padding: "16px 18px", borderBottom: "1px solid var(--border)",
        display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <div style={{ fontWeight: 600 }}>{table.vendor || "Invoice"}</div>
        <div className="mono" style={{ color: "var(--text-muted)" }}>{table.invoice_no}</div>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 560 }}>
          <thead>
            <tr>
              <th style={th}>Description</th>
              <th style={thR}>Qty</th>
              <th style={thR}>Unit Price</th>
              <th style={thR}>Line Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((r, i) => {
              const bad = flagged.has(`line_items[${i}]`);
              const c = r.confidence || {};
              return (
                <tr key={i} style={bad ? { background: "var(--error-bg)" } : undefined}>
                  <td style={td}>{r.description}</td>
                  <td style={tdR}><Num value={r.qty} score={c.qty} /></td>
                  <td style={tdR}><Num value={r.unit_price} score={c.unit_price} /></td>
                  <td style={tdR}><Num value={r.line_total} score={c.line_total} flagged={bad} /></td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td style={{ ...tdR, borderBottom: "none" }} colSpan={3}>Subtotal</td>
              <td style={{ ...tdR, borderBottom: "none" }}>
                <Num value={table.subtotal} flagged={flagged.has("subtotal")} />
              </td>
            </tr>
            <tr>
              <td style={{ ...tdR, borderBottom: "none", color: "var(--text-muted)" }} colSpan={3}>Tax</td>
              <td style={{ ...tdR, borderBottom: "none", color: "var(--text-muted)" }}>
                <span className="mono">{Number(table.tax ?? 0).toFixed(2)}</span>
              </td>
            </tr>
            <tr>
              <td style={{ ...tdR, borderBottom: "none", fontWeight: 700, fontSize: 17 }} colSpan={3}>Grand Total</td>
              <td style={{ ...tdR, borderBottom: "none", fontWeight: 700, fontSize: 17 }}>
                <Num value={table.grand_total} flagged={flagged.has("grand_total")} />
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

/* ---------- validation summary banner (the money moment) ---------- */

export function ValidationSummary({ validation }: { validation: Validation }) {
  const ok = validation.status === "ok";
  return (
    <div role="status" style={{
      display: "flex", gap: 14, alignItems: "flex-start",
      background: ok ? "var(--ok-bg)" : "var(--error-bg)",
      border: `1px solid ${ok ? "var(--ok)" : "var(--error)"}`,
      color: ok ? "var(--ok)" : "var(--error)",
      borderRadius: "var(--radius)", padding: "16px 18px",
    }}>
      <div style={{ marginTop: 1 }}>{ok ? <IconCheck /> : <IconAlert />}</div>
      <div style={{ color: "var(--text)" }}>
        <div style={{ fontWeight: 600, color: ok ? "var(--ok)" : "var(--error)" }}>
          {ok ? "All arithmetic checks passed" : `${validation.issues.length} issue${validation.issues.length > 1 ? "s" : ""} detected`}
        </div>
        {ok ? (
          <div style={{ color: "var(--text-muted)", fontSize: 15 }}>
            Line totals, subtotal, and grand total are internally consistent.
          </div>
        ) : (
          <ul style={{ margin: "6px 0 0", paddingLeft: 18, color: "var(--text)" }}>
            {validation.issues.map((i, k) => <li key={k} style={{ marginBottom: 2 }}>{i.message}</li>)}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ---------- demo mode toggle (Live vs offline Fixture) ---------- */

export type Mode = "live" | "fixture";

export function DemoModeToggle({ mode, onChange }: { mode: Mode; onChange: (m: Mode) => void }) {
  const opt = (val: Mode, label: string) => {
    const active = mode === val;
    return (
      <button onClick={() => onChange(val)} aria-pressed={active}
        style={{
          padding: "7px 16px", border: "none", borderRadius: 8, fontSize: 14,
          fontWeight: 500, transition: "background 180ms, color 180ms",
          background: active ? "var(--surface)" : "transparent",
          color: active ? "var(--text)" : "var(--text-faint)",
          boxShadow: active ? "var(--shadow)" : "none",
        }}>
        {label}
      </button>
    );
  };
  return (
    <div style={{ display: "inline-flex", gap: 4, padding: 4,
      background: "#eef2f7", borderRadius: 10, border: "1px solid var(--border)" }}>
      {opt("live", "Live (AI)")}
      {opt("fixture", "Fixture (offline)")}
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
      onClick={() => !busy && inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); pick(e.dataTransfer.files?.[0]); }}
      style={{
        cursor: busy ? "default" : "pointer",
        border: `2px dashed ${over ? "var(--accent)" : "var(--border-strong)"}`,
        background: over ? "#eff4ff" : "var(--surface)",
        borderRadius: "var(--radius)", padding: "44px 24px", textAlign: "center",
        transition: "border-color 180ms, background 180ms", color: "var(--text-muted)",
      }}>
      <div style={{ color: "var(--accent)", display: "flex", justifyContent: "center", marginBottom: 10 }}>
        <IconUpload />
      </div>
      <div style={{ fontWeight: 600, color: "var(--text)" }}>
        {busy ? "Processing…" : "Drop an invoice image, or click to browse"}
      </div>
      <div style={{ fontSize: 14, marginTop: 4 }}>PNG or JPG · the table is extracted, then validated</div>
      <input ref={inputRef} type="file" accept="image/*" hidden
        onChange={(e) => pick(e.target.files?.[0])} />
    </div>
  );
}
