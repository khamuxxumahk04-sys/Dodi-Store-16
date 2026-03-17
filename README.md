# Sales_Agent_System

> A hybrid agent bridge between **Antigravity** (IDE coordinator) and **OpenClaw** (isolated sales processor), with signal refining and strict data privacy.

## Architecture

```
┌─────────────────────┐          ┌─────────────────────────┐
│   Antigravity IDE   │          │   OpenClaw Container    │
│                     │  HTTP    │                         │
│  main.py            ├─────────►│  server.py              │
│  (Sales_Bridge)     │  JSON    │  (Flask API)            │
│                     │◄─────────┤                         │
│  monitor.py         │ result   │  [private ledger]       │
│  dashboard.md       │          │  [customer data — safe] │
└─────────────────────┘          └─────────────────────────┘
```

## Quick Start

### 1. Install dependencies

```bash
pip install -r requirements.txt
```

### 2. Start OpenClaw server

```bash
python server.py
# → Listening on http://127.0.0.1:5000
```

### 3. Run the bridge (in a new terminal)

```bash
python main.py
# → Executes a sample sale, prints the result, updates dashboard.md
```

### 4. View the dashboard

Open `dashboard.md` in your editor's preview mode to see sale entries.

## Files

| File | Role |
|------|------|
| `main.py` | Bridge client with SignalRefiner + async support |
| `server.py` | Isolated Flask API (OpenClaw) |
| `monitor.py` | Dashboard generator (audit trail) |
| `dashboard.md` | Live sales log (Markdown table) |
| `skill.md` | Agent skill documentation |
| `.env` | Environment variables (secrets) |
| `requirements.txt` | Python dependencies |

## Privacy Model

- **Least Privilege:** Antigravity receives only `result_id` + `status` — never raw customer data.
- **Signal Refining:** All metrics pass through Min-Max → Sigmoid before transmission.
- **Token Auth:** `X-Bridge-Key` header required for all write endpoints.
- **Audit Trail:** Every sale logged with unique ID + timestamp.

## License

Internal project — Antigravity / Hermes Agent.
