"""
Monitor Agent — Sales Dashboard Generator
==========================================
Reads sale results from the Antigravity bridge and appends them to
dashboard.md as timestamped audit-trail entries. No raw customer data
is ever written — only result_id, status, and signal metrics.
"""

import os
from datetime import datetime, timezone

DASHBOARD_PATH = os.path.join(os.path.dirname(__file__), "dashboard.md")

# ── Dashboard header (written once if file is empty) ────────────────
_HEADER = """\
# 📊 Sales Dashboard — Sales_Agent_System

> **Auto-generated** by Monitor Agent.  
> Only sanitized data appears here — customer PII stays inside the OpenClaw container.

| # | Result ID | Product | Signal | Revenue | Status | Timestamp |
|---|-----------|---------|--------|---------|--------|-----------|

## 💬 Live Chat Events
| Time | Intent | Action | Outcome |
|------|--------|--------|---------|
"""


def _ensure_header():
    """Create dashboard.md with header if it doesn't exist or is empty."""
    if not os.path.exists(DASHBOARD_PATH) or os.path.getsize(DASHBOARD_PATH) == 0:
        with open(DASHBOARD_PATH, "w", encoding="utf-8") as f:
            f.write(_HEADER)


def update_dashboard(sale_data: dict, product_name: str = "—", signal: float = 0.0):
    """
    Append a single sale entry to the dashboard table.

    Parameters
    ----------
    sale_data : dict
        The JSON response from OpenClaw (must contain result_id, status).
    product_name : str
        Product that was sold.
    signal : float
        Refined signal integrity value.
    """
    _ensure_header()

    result_id = sale_data.get("result_id", "n/a")
    status = sale_data.get("status", "unknown")
    timestamp = sale_data.get("timestamp", datetime.now(timezone.utc).isoformat())

    # Count existing rows to set row number
    row_num = 1
    if os.path.exists(DASHBOARD_PATH):
        with open(DASHBOARD_PATH, "r", encoding="utf-8") as f:
            row_num = sum(1 for line in f if line.startswith("|") and not line.startswith("| #") and not line.startswith("|--")) + 1

    revenue = sale_data.get("revenue", 0)
    entry = f"| {row_num} | `{result_id}` | {product_name} | {signal:.4f} | ${revenue} | ✅ {status} | {timestamp} |\n"

    with open(DASHBOARD_PATH, "a", encoding="utf-8") as f:
        f.write(entry)
    
    _update_revenue_summary()


def update_chat_dashboard(chat_response: dict):
    """
    Log a chat event to the dashboard.
    """
    _ensure_header()
    
    # Ensure chat section header exists
    chat_section_header = "## 💬 Live Chat Events"
    with open(DASHBOARD_PATH, "r", encoding="utf-8") as f:
        content = f.read()
    
    if chat_section_header not in content:
        with open(DASHBOARD_PATH, "a", encoding="utf-8") as f:
            f.write(f"\n{chat_section_header}\n")
            f.write("| Time | Intent | Action | Outcome |\n")
            f.write("|------|--------|--------|---------|\n")

    intent = chat_response.get("intent", "UNKNOWN")
    action = chat_response.get("action", "FALLBACK")
    status = chat_response.get("status", "active")
    timestamp = datetime.now(timezone.utc).strftime("%H:%M:%S")

    # Map status to emoji
    icon = "✅" if status == "success" else "🤖"
    if status == "security_alert": icon = "🛡️"
    if status == "escalated": icon = "⚠️"

    entry = f"| {timestamp} | {intent} | {action} | {icon} {status} |\n"

    with open(DASHBOARD_PATH, "a", encoding="utf-8") as f:
        f.write(entry)


    with open(DASHBOARD_PATH, "a", encoding="utf-8") as f:
        f.write(entry)


def _update_revenue_summary():
    """
    Calculate total revenue from the table and update the summary section.
    """
    total = 0
    if os.path.exists(DASHBOARD_PATH):
        with open(DASHBOARD_PATH, "r", encoding="utf-8") as f:
            for line in f:
                if line.startswith("|") and not line.startswith("| #") and not line.startswith("|--"):
                    parts = line.split("|")
                    if len(parts) > 5:
                        rev_str = parts[5].strip().replace("$", "")
                        try:
                            total += float(rev_str)
                        except ValueError:
                            pass
    
    summary_marker = "## 💰 Financial Summary"
    summary_text = f"\n{summary_marker}\n- **Total Revenue:** ${total:.2f}\n"
    
    with open(DASHBOARD_PATH, "r", encoding="utf-8") as f:
        content = f.read()
    
    if summary_marker in content:
        # Replace existing summary
        import re
        content = re.sub(rf"{summary_marker}.*", summary_text.strip(), content, flags=re.DOTALL)
        with open(DASHBOARD_PATH, "w", encoding="utf-8") as f:
            f.write(content)
    else:
        # Append new summary
        with open(DASHBOARD_PATH, "a", encoding="utf-8") as f:
            f.write(summary_text)


def generate_report() -> str:
    """
    Read the current dashboard and return its full Markdown contents.
    Useful for embedding into Antigravity Artifacts.
    """
    _ensure_header()
    with open(DASHBOARD_PATH, "r", encoding="utf-8") as f:
        return f.read()


# ── Quick test ──────────────────────────────────────────────────────
if __name__ == "__main__":
    # Simulate a dashboard update
    sample = {"result_id": "abc123ff", "status": "success", "timestamp": datetime.now(timezone.utc).isoformat()}
    update_dashboard(sample, product_name="Test_Product", signal=0.7311)
    print(generate_report())
