---
name: Self-Logic & Neural Integration
description: Skill module for Sales_Agent_System — defines the self-logic, integration architecture, and operational guardrails for the Antigravity ↔ OpenClaw agent bridge.
---

# Skill Module: Self-Logic & Neural Integration

**Project:** Antigravity / Hermes Agent  
**Version:** 1.0.0  
**Status:** Operational / Experimental

---

## 1. Core Logic: Self_Logic_Module

This component is the agent's "procedural memory", responsible for making decisions based on processed data and history.

### Signal Refining Protocol

The `SignalRefiner` class ensures signal purity before central processing, using:

- **Min-Max Scaling:** `x_norm = (x - x_min) / (x_max - x_min)`
- **Sigmoid Transformation:** `σ(x) = 1 / (1 + e^{-x_norm})`

Implementation: see `main.py → SignalRefiner.refine()`.

---

## 2. Integration Architecture

Agents are integrated via the **OpenClaw** framework to ensure full isolation of sensitive data:

- **Coordinator:** Antigravity (Agent Manager) — plans, sends, and logs.
- **Isolated Worker:** OpenClaw (Secure Sales Processor) — processes sales privately.
- **Bridge:** Localhost API Gateway using JSON serialization + `X-Bridge-Key` auth.

### Data Flow

```
Antigravity (main.py)
    │
    ├─ refine(signal) ──► SignalRefiner
    │
    ├─ POST /process ───► OpenClaw (server.py)
    │                         │
    │                         └─ [private ledger — never exposed]
    │
    ├─ receive result ◄── { status, result_id }
    │
    └─ update_dashboard() → monitor.py → dashboard.md
```

---

## 3. Advanced Neural Intent (Experimental)

Future capability for biometric feedback translation to executive commands:

- **VBVR Benchmarking:** Validation standards for logic correctness.
- **Hardware Layer:** Linux Kernel integration for biometric sensor binding.

> This module is experimental and not yet implemented.

---

## 4. Operational Rules (Guardrails)

1. All customer data **must** remain inside the OpenClaw isolated container.
2. Antigravity is **prohibited** from accessing raw databases (Private Container).
3. All inter-agent communication uses **sanitized JSON** outputs only.
4. API access is gated by `X-Bridge-Key` — no anonymous requests.
5. Every operation is logged with a unique `result_id` + timestamp for audit.

---

## 5. Startup & Monitoring

### Starting the System

```bash
# Terminal 1 — Start OpenClaw (isolated processor)
python server.py

# Terminal 2 — Run a sale via the bridge
python main.py
```

### Monitoring

- Open `dashboard.md` in Preview mode to see live sale entries.
- Use `GET /status` to check OpenClaw container health.
- Use `GET /logs/summary` (with auth) for recent operation IDs.
