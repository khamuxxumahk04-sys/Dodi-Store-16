"""
test_bridge.py — End-to-End Verification Pilot
================================================
Comprehensive test suite for the Sales_Agent_System bridge:

  1. End-to-End Sale Simulation (latency + response format)
  2. Isolation Verification (unauthorized access must fail)
  3. Batch Dashboard Population (3 consecutive sales)
  4. Failure Scenarios (bad data, wrong key, server down)

Run:
    python server.py          # Terminal 1
    python test_bridge.py     # Terminal 2
"""

import json
import os
import sys
import time
import requests

# ── Config ──────────────────────────────────────────────────────────
from dotenv import load_dotenv
load_dotenv()

BASE_URL = f"http://127.0.0.1:{os.getenv('OPENCLAW_PORT', '5050')}"
VALID_KEY = os.getenv("OPENCLAW_API_KEY", "secure_bridge_key_2026")
HEADERS = {"X-Bridge-Key": VALID_KEY, "Content-Type": "application/json"}

# Counters
_passed = 0
_failed = 0


def _result(name: str, ok: bool, detail: str = ""):
    global _passed, _failed
    icon = "✅" if ok else "❌"
    if ok:
        _passed += 1
    else:
        _failed += 1
    print(f"  {icon}  {name}")
    if detail:
        print(f"       → {detail}")


# ════════════════════════════════════════════════════════════════════
#  1. END-TO-END SALE SIMULATION
# ════════════════════════════════════════════════════════════════════
def test_end_to_end():
    print("\n" + "═" * 60)
    print("  1️⃣  End-to-End Sale Simulation")
    print("═" * 60)

    payload = {
        "product": "Quantum_Chip_v1",
        "signal_integrity": 0.85,
        "command": "PROCESS_SALE",
    }

    start = time.perf_counter()
    try:
        resp = requests.post(f"{BASE_URL}/process", json=payload,
                             headers=HEADERS, timeout=10)
        latency = time.perf_counter() - start
    except requests.ConnectionError:
        _result("Connection to OpenClaw", False, "Server not reachable — is server.py running?")
        return False

    # ── Check status code
    _result("HTTP 200 response", resp.status_code == 200,
            f"Got {resp.status_code}")

    # ── Check latency
    _result(f"Latency < 2s", latency < 2.0,
            f"{latency:.4f}s")

    # ── Check response format (must contain ONLY safe fields)
    data = resp.json()
    required_keys = {"status", "result_id", "message", "timestamp"}
    has_keys = required_keys.issubset(data.keys())
    _result("Response contains required keys", has_keys,
            f"Keys: {list(data.keys())}")

    # ── Check NO sensitive data leaked
    forbidden_strings = ["customer", "email", "address", "phone", "ssn", "password"]
    raw = json.dumps(data).lower()
    no_leak = not any(s in raw for s in forbidden_strings)
    _result("No PII in response", no_leak)

    # ── Check result_id is a hex string
    rid = data.get("result_id", "")
    _result("result_id is valid hex", len(rid) == 16 and all(c in "0123456789abcdef" for c in rid),
            f"result_id={rid}")

    return True


# ════════════════════════════════════════════════════════════════════
#  2. ISOLATION VERIFICATION (Simulated Breach Attempts)
# ════════════════════════════════════════════════════════════════════
def test_isolation():
    print("\n" + "═" * 60)
    print("  2️⃣  Isolation Verification — Simulated Breach Attempts")
    print("═" * 60)

    # ── 2a. Request WITHOUT auth key → must return 403
    resp = requests.post(f"{BASE_URL}/process",
                         json={"product": "Hack_Attempt", "signal_integrity": 0.5},
                         headers={"Content-Type": "application/json"},
                         timeout=5)
    _result("Reject request without key (403)", resp.status_code == 403,
            f"Got {resp.status_code}")

    # ── 2b. Request with WRONG auth key → must return 403
    resp = requests.post(f"{BASE_URL}/process",
                         json={"product": "Hack_Attempt_2", "signal_integrity": 0.5},
                         headers={"X-Bridge-Key": "wrong_key_12345", "Content-Type": "application/json"},
                         timeout=5)
    _result("Reject wrong key (403)", resp.status_code == 403,
            f"Got {resp.status_code}")

    # ── 2c. Try accessing /logs/summary without key → must return 403
    resp = requests.get(f"{BASE_URL}/logs/summary", timeout=5)
    _result("Reject /logs/summary without key (403)", resp.status_code == 403,
            f"Got {resp.status_code}")

    # ── 2d. /status should be read-only (no auth needed)
    resp = requests.get(f"{BASE_URL}/status", timeout=5)
    _result("/status accessible without key (200)", resp.status_code == 200,
            f"Got {resp.status_code}")

    # ── 2e. /status must NOT reveal private data
    data = resp.json()
    raw = json.dumps(data).lower()
    forbidden = ["result_id", "product", "customer", "email"]
    no_leak = not any(s in raw for s in forbidden)
    _result("/status leaks no private fields", no_leak,
            f"Keys: {list(data.keys())}")


# ════════════════════════════════════════════════════════════════════
#  3. BATCH DASHBOARD POPULATION (3 consecutive sales)
# ════════════════════════════════════════════════════════════════════
def test_batch_dashboard():
    print("\n" + "═" * 60)
    print("  3️⃣  Batch Dashboard Population — 3 Consecutive Sales")
    print("═" * 60)

    products = [
        ("Neural_Sensor_Alpha", 30),
        ("Quantum_Chip_Beta", 65),
        ("BioSync_Module_Gamma", 90),
    ]

    result_ids = []
    for name, metric in products:
        # Use the full bridge (main.py) for realistic test
        from main import SalesBridge
        bridge = SalesBridge()
        result = bridge.execute_sale(name, metric)
        rid = result.get("result_id", "")
        ok = result.get("status") == "success" and len(rid) > 0
        _result(f"Sale: {name} (metric={metric})", ok,
                f"result_id={rid}")
        result_ids.append(rid)

    # ── Verify all IDs are unique
    unique = len(set(result_ids)) == len(result_ids)
    _result("All result_ids are unique", unique,
            f"IDs: {result_ids}")

    # ── Verify dashboard.md was updated
    dashboard_path = os.path.join(os.path.dirname(__file__), "dashboard.md")
    if os.path.exists(dashboard_path):
        with open(dashboard_path, "r", encoding="utf-8") as f:
            content = f.read()
        entries_found = sum(1 for rid in result_ids if rid in content)
        _result(f"Dashboard contains all {len(result_ids)} new entries", entries_found == len(result_ids),
                f"Found {entries_found}/{len(result_ids)} in dashboard.md")
    else:
        _result("Dashboard file exists", False, "dashboard.md not found")


# ════════════════════════════════════════════════════════════════════
#  4. FAILURE SCENARIOS
# ════════════════════════════════════════════════════════════════════
def test_failure_scenarios():
    print("\n" + "═" * 60)
    print("  4️⃣  Failure Scenarios — Resilience Testing")
    print("═" * 60)

    # ── 4a. Empty payload
    resp = requests.post(f"{BASE_URL}/process",
                         data="",
                         headers={"X-Bridge-Key": VALID_KEY, "Content-Type": "application/json"},
                         timeout=5)
    _result("Empty payload handled gracefully", resp.status_code in (400, 415),
            f"Got {resp.status_code}")

    # ── 4b. Missing product field (partial payload)
    resp = requests.post(f"{BASE_URL}/process",
                         json={"signal_integrity": 0.5},
                         headers=HEADERS, timeout=5)
    data = resp.json()
    _result("Missing product → defaults to 'unknown'",
            data.get("status") == "success" and "unknown" in data.get("message", ""),
            f"message={data.get('message', '')}")

    # ── 4c. Signal out of normal range (negative)
    resp = requests.post(f"{BASE_URL}/process",
                         json={"product": "Edge_Case", "signal_integrity": -999.0},
                         headers=HEADERS, timeout=5)
    _result("Negative signal handled", resp.status_code == 200,
            f"Got {resp.status_code}, status={resp.json().get('status')}")

    # ── 4d. Extremely large signal
    resp = requests.post(f"{BASE_URL}/process",
                         json={"product": "Edge_Case_2", "signal_integrity": 999999.0},
                         headers=HEADERS, timeout=5)
    _result("Extreme signal handled", resp.status_code == 200,
            f"Got {resp.status_code}")

    # ── 4e. Bridge handles server-down gracefully
    from main import SalesBridge
    dead_bridge = SalesBridge(openclaw_url="http://127.0.0.1:19999")  # non-existent port
    result = dead_bridge.execute_sale("Offline_Product", 50)
    _result("Server-down returns error (no crash)",
            result.get("status") == "error" and "message" in result,
            f"status={result.get('status')}, message present={bool(result.get('message'))}")


# ════════════════════════════════════════════════════════════════════
#  5. AUTHENTICATED LOGS SUMMARY
# ════════════════════════════════════════════════════════════════════
def test_logs_summary():
    print("\n" + "═" * 60)
    print("  5️⃣  Authenticated Logs Summary")
    print("═" * 60)

    resp = requests.get(f"{BASE_URL}/logs/summary", headers=HEADERS, timeout=5)
    _result("/logs/summary returns 200 with valid key", resp.status_code == 200,
            f"Got {resp.status_code}")

    data = resp.json()
    _result("Contains total_operations count",
            isinstance(data.get("total_operations"), int),
            f"total_operations={data.get('total_operations')}")

    recent = data.get("recent", [])
    _result("Recent entries are sanitized (only result_id + timestamp)",
            all(set(r.keys()) == {"result_id", "timestamp"} for r in recent) if recent else True,
            f"Sample keys: {list(recent[0].keys()) if recent else '(none)'}")


# ════════════════════════════════════════════════════════════════════
#  MAIN — Run all tests
# ════════════════════════════════════════════════════════════════════
if __name__ == "__main__":
    print("=" * 60)
    print("  🧪  Sales_Agent_System — Verification Pilot")
    print(f"  📍  Target: {BASE_URL}")
    print("=" * 60)

    # Pre-check: is server reachable?
    try:
        requests.get(f"{BASE_URL}/status", timeout=3)
    except requests.ConnectionError:
        print(f"\n❌  OpenClaw server not reachable at {BASE_URL}")
        print("    Start it first:  python server.py")
        sys.exit(1)

    test_end_to_end()
    test_isolation()
    test_batch_dashboard()
    test_failure_scenarios()
    test_logs_summary()

    # ── Summary
    total = _passed + _failed
    print("\n" + "=" * 60)
    print(f"  📊  Results: {_passed}/{total} passed, {_failed} failed")
    print("=" * 60)

    if _failed > 0:
        print("  ⚠️  Some tests failed — review the output above.")
        sys.exit(1)
    else:
        print("  🎉  All tests passed — system is verified!")
        sys.exit(0)
