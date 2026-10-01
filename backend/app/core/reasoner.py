"""FinancialReasoner — the trust layer.

Pure, stdlib-only. Takes an extracted invoice table (plain dict parsed from
JSON) and validates its arithmetic. This is TabuLens's actual contribution:
extraction can be done by anything (a vision LLM, DETR+TrOCR); this is what
makes the output *trustworthy*.

Three checks:
  1. line:     qty * unit_price == line_total      (per row)
  2. subtotal: sum(line_total)  == subtotal
  3. total:    subtotal + tax   == grand_total

Root cause: a wrong line total is reported as the root cause. The subtotal and
total checks compare against the *extracted* numbers as shown, so a line error
is not double-reported as a downstream subtotal/total error.

Run standalone to self-check:  python -m app.core.reasoner
"""

from __future__ import annotations

# Money comparison tolerance. Half a cent: anything larger is a real discrepancy,
# not float noise.
EPS = 0.005


def _money_eq(a: float, b: float) -> bool:
    return abs(a - b) < EPS


def validate(table: dict) -> dict:
    """Validate an extracted invoice table. Returns a plain dict:

    {
      "status": "ok" | "error",
      "issues": [ {location, kind, expected, actual, message}, ... ]
    }

    `table` shape:
      { "line_items": [ {description, qty, unit_price, line_total}, ... ],
        "subtotal": float, "tax": float, "grand_total": float }
    """
    issues: list[dict] = []
    items = table.get("line_items", [])

    # 1. per-line arithmetic
    for i, row in enumerate(items):
        expected = round(row["qty"] * row["unit_price"], 2)
        actual = row["line_total"]
        if not _money_eq(expected, actual):
            issues.append({
                "location": f"line_items[{i}]",
                "kind": "line",
                "expected": expected,
                "actual": actual,
                "message": (
                    f"Line {i + 1} ({row.get('description', '?')}): "
                    f"{row['qty']} × {row['unit_price']} = {expected}, "
                    f"but extracted {actual}."
                ),
            })

    # 2. subtotal == sum of extracted line totals
    sum_lines = round(sum(r["line_total"] for r in items), 2)
    subtotal = table.get("subtotal")
    if subtotal is not None and not _money_eq(sum_lines, subtotal):
        issues.append({
            "location": "subtotal",
            "kind": "subtotal",
            "expected": sum_lines,
            "actual": subtotal,
            "message": (
                f"Subtotal should equal the sum of line totals ({sum_lines}), "
                f"but extracted {subtotal}."
            ),
        })

    # 3. grand_total == subtotal + tax
    tax = table.get("tax", 0) or 0
    grand = table.get("grand_total")
    if subtotal is not None and grand is not None:
        expected_grand = round(subtotal + tax, 2)
        if not _money_eq(expected_grand, grand):
            issues.append({
                "location": "grand_total",
                "kind": "total",
                "expected": expected_grand,
                "actual": grand,
                "message": (
                    f"Grand total should equal subtotal + tax "
                    f"({subtotal} + {tax} = {expected_grand}), "
                    f"but extracted {grand}."
                ),
            })

    return {"status": "error" if issues else "ok", "issues": issues}


def _self_check() -> None:
    import json
    import pathlib

    fixtures = pathlib.Path(__file__).resolve().parents[1] / "fixtures"

    clean = json.loads((fixtures / "clean_invoice.json").read_text())
    res = validate(clean)
    assert res["status"] == "ok", f"clean invoice should pass, got {res}"

    bad = json.loads((fixtures / "error_invoice.json").read_text())
    res = validate(bad)
    assert res["status"] == "error", "error invoice should fail"
    # the planted error is a line error on line 3 (index 2)
    locs = [i["location"] for i in res["issues"]]
    assert "line_items[2]" in locs, f"expected line 3 flagged, got {locs}"

    print("OK — clean invoice passes; error invoice flags:", locs)
    for i in res["issues"]:
        print("  -", i["message"])


if __name__ == "__main__":
    _self_check()
