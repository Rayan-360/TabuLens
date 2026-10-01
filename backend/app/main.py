"""TabuLens demo API.

Two endpoints:
  POST /extract          upload an invoice image -> Gemini extract -> validate
  POST /extract/fixture  run the reasoner on a bundled fixture (offline safety net)

Both return the same shape: {"table": <extracted>, "validation": <reasoner result>}.
"""

from __future__ import annotations

import json
import pathlib

from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from app.core import extractor, reasoner

load_dotenv()  # reads backend/.env so GEMINI_API_KEY is available

app = FastAPI(title="TabuLens")

# Next.js dev server.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

FIXTURES = pathlib.Path(__file__).resolve().parent / "fixtures"


@app.post("/extract")
async def extract(file: UploadFile = File(...)):
    data = await file.read()
    try:
        table = extractor.extract(data, file.content_type or "image/png")
    except Exception as e:  # key missing, network, bad JSON — surface it clearly
        raise HTTPException(502, f"Extraction failed: {e}. Use fixture mode for the demo.")
    return {"table": table, "validation": reasoner.validate(table)}


@app.post("/extract/fixture")
def extract_fixture(name: str = "error_invoice"):
    path = FIXTURES / f"{name}.json"
    if not path.exists():
        raise HTTPException(404, f"No fixture {name!r}")
    table = json.loads(path.read_text())
    return {"table": table, "validation": reasoner.validate(table)}
