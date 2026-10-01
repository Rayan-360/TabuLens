# TabuLens

Extracts financial tables from documents, then **validates their arithmetic** —
catching errors that raw extraction (and raw LLMs) pass silently.

Extraction is a solved, commoditized input. TabuLens's contribution is the
**trust layer**: a deterministic reasoner that checks the numbers, flags the
root-cause error, and attaches per-field confidence — so the output is
trustworthy enough for finance.

## What this demo shows

Upload an invoice image → a vision model extracts it to structured JSON → the
`FinancialReasoner` runs three arithmetic checks:

1. `qty × unit_price == line_total` (per line)
2. `Σ line_totals == subtotal`
3. `subtotal + tax == grand_total`

Any failure is flagged in the UI with a plain-English explanation of the
*source* error, plus per-field confidence dots.

## Run it

**Backend** (FastAPI):

```bash
cd backend
pip install -r requirements.txt
# optional, for live extraction:
cp .env.example .env   # then put your GEMINI_API_KEY in it
uvicorn app.main:app --reload --port 8000
```

**Frontend** (Next.js):

```bash
cd frontend
npm install
npm run dev        # http://localhost:3000
```

No API key? Use the **Fixture (offline)** toggle in the UI — the trust layer
runs on a bundled invoice and still catches the planted error.

Prove the reasoner alone, no server needed:

```bash
cd backend && python -m app.core.reasoner
```

## Layout

```
backend/app/core/reasoner.py    # the trust layer (pure, stdlib only)
backend/app/core/extractor.py   # Gemini vision -> JSON (stands in for DETR+TrOCR)
backend/app/main.py             # /extract (live) + /extract/fixture (offline)
frontend/app/                   # Next.js UI
```

The `core/` functions are pure and stateless; `main.py` only wires HTTP to
them. That seam is deliberate — see the scaling note below.

## Scaling roadmap (not built here, by design)

This demo is a synchronous monolith on purpose. The architecture extends
*additively*: the write-path becomes job-based (submit → poll), the GPU/model
work splits into a worker that imports the same `core/` unchanged, SQLite →
Postgres + pgvector. Microservices are explicitly out of scope — the pipeline
is one linear flow. Full production design is in the project's design-review
document.
