"""Vision extractor — stands in for the DETR+TrOCR pipeline.

Sends an invoice image to a vision model and asks for the table as structured
JSON with a confidence per field. Extraction quality is NOT the point of the
demo; the reasoner is. If the model misreads a cell, that's fine — it's exactly
what the trust layer exists to catch.

Provider chain (tried in order, first success wins):
  1. Gemini   (GEMINI_API_KEY)
  2. Groq     (GROQ_API_KEY)   — automatic failover if Gemini errors/rate-limits

The returned table carries "_provider" naming which one answered.
"""

from __future__ import annotations

import base64
import json
import os

GEMINI_MODEL = "gemini-3.8-flash"
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

Report the numbers EXACTLY as printed in the image, even if the arithmetic looks
wrong — do not silently correct them. confidence is your own certainty per field.
"""


def _parse_json(text: str) -> dict:
    text = text.strip()
    if text.startswith("```"):
        text = text.split("```")[1].removeprefix("json").strip()
    return json.loads(text)


def _gemini(image_bytes: bytes, mime_type: str) -> dict:
    key = os.environ.get("GEMINI_API_KEY")
    if not key:
        raise RuntimeError("GEMINI_API_KEY not set")
    import google.generativeai as genai

    genai.configure(api_key=key)
    model = genai.GenerativeModel(GEMINI_MODEL)
    resp = model.generate_content([_PROMPT, {"mime_type": mime_type, "data": image_bytes}])
    return _parse_json(resp.text)


def _groq(image_bytes: bytes, mime_type: str) -> dict:
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
    return _parse_json(resp.choices[0].message.content)


_PROVIDERS = [("gemini", _gemini), ("groq", _groq)]


def extract(image_bytes: bytes, mime_type: str = "image/png") -> dict:
    """Image bytes -> extracted table dict (with "_provider").

    Tries each provider in order; returns the first success. Raises with every
    provider's error if all fail, so the caller can fall back to fixture mode.
    """
    errors = []
    for name, fn in _PROVIDERS:
        try:
            table = fn(image_bytes, mime_type)
            table["_provider"] = name
            return table
        except Exception as e:  # rate limit, missing key, bad JSON — try the next
            errors.append(f"{name}: {e}")
    raise RuntimeError("all extractors failed → " + " | ".join(errors))
