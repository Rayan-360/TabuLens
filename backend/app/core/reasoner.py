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
    clean = {
        "line_items": [
            {"description": "A", "qty": 3, "unit_price": 16.50, "line_total": 49.50},
            {"description": "B", "qty": 2, "unit_price": 10.00, "line_total": 20.00},
        ],
        "subtotal": 69.50, "tax": 6.95, "grand_total": 76.45,
    }
    assert validate(clean)["status"] == "ok", "clean invoice should pass"

    # line 1 total wrong (should be 49.50); downstream subtotal/total stay
    # consistent with the shown wrong value, so only the line is flagged.
    bad = {
        "line_items": [
            {"description": "A", "qty": 3, "unit_price": 16.50, "line_total": 45.50},
            {"description": "B", "qty": 2, "unit_price": 10.00, "line_total": 20.00},
        ],
        "subtotal": 65.50, "tax": 6.55, "grand_total": 72.05,
    }
    res = validate(bad)
    locs = [i["location"] for i in res["issues"]]
    assert res["status"] == "error" and locs == ["line_items[0]"], f"got {res}"

    print("OK — clean passes; error flags:", locs)
    for i in res["issues"]:
        print("  -", i["message"])


if __name__ == "__main__":
    _self_check()
