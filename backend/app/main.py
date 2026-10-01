"""TabuLens demo API.

POST /extract  — upload an invoice image -> vision extract -> validate.
Returns {"table": <extracted>, "validation": <reasoner result>}.
"""

from __future__ import annotations

from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from app.core import extractor, reasoner

load_dotenv()  # reads backend/.env so GROQ_API_KEY is available

app = FastAPI(title="TabuLens")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/extract")
async def extract(file: UploadFile = File(...)):
    data = await file.read()
    try:
        table = extractor.extract(data, file.content_type or "image/png")
    except Exception as e:
        raise HTTPException(502, f"Extraction failed: {e}")
    return {"table": table, "validation": reasoner.validate(table)}
