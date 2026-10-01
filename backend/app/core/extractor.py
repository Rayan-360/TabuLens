"""Vision extractor — stands in for the DETR+TrOCR pipeline.

Sends an invoice image to Groq (a vision model) and asks for the table as
structured JSON with a confidence per field. Extraction quality is NOT the point
of the demo; the reasoner is. If the model misreads a cell, that's fine — it's
exactly what the trust layer exists to catch.

Needs GROQ_API_KEY in the environment. ~2s per image.
"""

from __future__ import annotations

import base64
import json
import os

GROQ_MODEL = "qwen/qwen3.8-27b"

_PROMPT = """You are extracting a financial table (invoice) from an image.
Return ONLY valid JSON, no markdown fence, with this exact shape:

{
  "vendor": string,
  "invoice_no": string,
  "line_items": [
    {"description": string, "qty": number, "unit_price": number, "line_total": number,
     "confidence": {"description": 0-1, "qty": 0-1, "unit_price": 0-1, "line_total": 0-1}}
  ],
  "subtotal": number,
  "tax": number,
  "grand_total": number
}

For "tax", extract the tax AMOUNT of money shown (e.g. a line like
"Sales Tax 6.25%  9.06" means tax = 9.06), NOT the percentage rate.

Report the numbers EXACTLY as printed in the image, even if the arithmetic looks
wrong — do not silently correct them. confidence is your own certainty per field.
"""


def _parse_json(text: str) -> dict:
    text = text.strip()
    if text.startswith("```"):
        text = text.split("```")[1].removeprefix("json").strip()
    return json.loads(text)


def extract(image_bytes: bytes, mime_type: str = "image/png") -> dict:
    """Image bytes -> extracted table dict (with "_provider").

    Raises on missing key / API error / bad JSON so the caller can fall back to
    fixture mode.
    """
    key = os.environ.get("GROQ_API_KEY")
    if not key:
        raise RuntimeError("GROQ_API_KEY not set")
    from groq import Groq

    b64 = base64.b64encode(image_bytes).decode()
    client = Groq(api_key=key)
    resp = client.chat.completions.create(
        model=GROQ_MODEL,
        temperature=0,
        messages=[{"role": "user", "content": [
            {"type": "text", "text": _PROMPT},
            {"type": "image_url", "image_url": {"url": f"data:{mime_type};base64,{b64}"}},
        ]}],
    )
    table = _parse_json(resp.choices[0].message.content)
    table["_provider"] = "groq"
    return table
