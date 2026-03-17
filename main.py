"""
Sales_Bridge — Antigravity ↔ OpenClaw Bridge Client
====================================================
Coordinator module that sends refined sale signals to the isolated
OpenClaw server and logs results via the Monitor Agent.

Supports both synchronous (requests) and asynchronous (aiohttp)
execution for parallel sale processing.
"""

import asyncio
import json
import os
import sys
import logging
from datetime import datetime, timezone
from dotenv import load_dotenv

import numpy as np
import requests

# Local modules
from monitor import update_dashboard, update_chat_dashboard, generate_report

# ── Config ──────────────────────────────────────────────────────────
load_dotenv()

OPENCLAW_URL = f"http://127.0.0.1:{os.getenv('OPENCLAW_PORT', '5000')}"
API_KEY = os.getenv("OPENCLAW_API_KEY", "secure_bridge_key_2026")

# Set up detailed logging to file
log_file = "shift_activities.log"
file_handler = logging.FileHandler(log_file, mode='a')
file_formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
file_handler.setFormatter(file_formatter)

# Configure basic logging for console and add file handler
logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"),
                    format="%(asctime)s [%(levelname)s] %(message)s")
root_logger = logging.getLogger()
root_logger.addHandler(file_handler)

logger = logging.getLogger("Sales_Bridge")


# ── Signal Refining (Self_Logic_Module) ─────────────────────────────
class SignalRefiner:
    """
    Applies Min-Max normalisation followed by Sigmoid transformation
    to guarantee clean, bounded signals before transmission.

        x_norm  = (x - x_min) / (x_max - x_min)
        σ(x)    = 1 / (1 + e^{-x_norm})
    """

    def __init__(self, signal_min: float = 0, signal_max: float = 100):
        self.s_min = signal_min
        self.s_max = signal_max

    def refine(self, raw_value: float) -> float:
        arr = np.array([float(raw_value)])
        norm = (arr - self.s_min) / (self.s_max - self.s_min + 1e-9)
        refined = 1 / (1 + np.exp(-norm))
        return float(refined[0])


# ── Bridge Client ───────────────────────────────────────────────────
class SalesBridge:
    """
    Sends sale requests to the OpenClaw isolated server and records
    results via the Monitor Agent.
    """

    def __init__(self, openclaw_url: str = OPENCLAW_URL, api_key: str = API_KEY):
        self.url = openclaw_url
        self.headers = {"X-Bridge-Key": api_key, "Content-Type": "application/json"}
        self.refiner = SignalRefiner()

    # ── Synchronous execution ───────────────────────────────────────
    def execute_sale(self, product_name: str, metric_value: float) -> dict:
        """
        Send a single sale request (blocking).

        Returns the sanitized JSON response from OpenClaw.
        """
        refined = self.refiner.refine(metric_value)
        payload = {
            "product": product_name,
            "signal_integrity": refined,
            "command": "PROCESS_SALE",
        }

        logger.info("Sending sale — product=%s raw_metric=%.2f refined=%.4f",
                     product_name, metric_value, refined)

        try:
            resp = requests.post(f"{self.url}/process", json=payload,
                                 headers=self.headers, timeout=10)
            resp.raise_for_status()
            result = resp.json()
        except requests.RequestException as exc:
            logger.error("Bridge connection failed: %s", exc)
            result = {"status": "error", "message": str(exc)}

        # Log to dashboard regardless of outcome
        update_dashboard(result, product_name=product_name, signal=refined)
        return result

    # ── Async execution (parallel sales) ────────────────────────────
    async def execute_sale_async(self, product_name: str, metric_value: float) -> dict:
        """
        Send a single sale request (non-blocking).
        Requires an active asyncio event loop.
        """
        try:
            import aiohttp
        except ImportError:
            logger.warning("aiohttp not installed — falling back to sync.")
            return self.execute_sale(product_name, metric_value)

        refined = self.refiner.refine(metric_value)
        payload = {
            "product": product_name,
            "signal_integrity": refined,
            "command": "PROCESS_SALE",
        }

        logger.info("[async] Sending sale — product=%s refined=%.4f",
                     product_name, refined)

        try:
            async with aiohttp.ClientSession(headers=self.headers) as session:
                async with session.post(f"{self.url}/process", json=payload,
                                        timeout=aiohttp.ClientTimeout(total=10)) as resp:
                    result = await resp.json()
        except Exception as exc:
            logger.error("[async] Bridge connection failed: %s", exc)
            result = {"status": "error", "message": str(exc)}

        update_dashboard(result, product_name=product_name, signal=refined)
        return result

    async def execute_batch_async(self, sales: list[tuple[str, float]]) -> list[dict]:
        """
        Execute multiple sales in parallel.

        Parameters
        ----------
        sales : list of (product_name, metric_value) tuples
        """
        tasks = [self.execute_sale_async(name, val) for name, val in sales]
        return await asyncio.gather(*tasks)

    def send_chat(self, user_query: str, session_id: str = "agent_session") -> dict:
        """
        Send a customer query to the intelligent chat agent.
        """
        payload = {"query": user_query, "session_id": session_id}
        logger.info("Sending chat query: '%s'", user_query)

        try:
            resp = requests.post(f"{self.url}/chat", json=payload, 
                                 headers=self.headers, timeout=10)
            resp.raise_for_status()
            result = resp.json()
        except requests.RequestException as exc:
            logger.error("Chat bridge failed: %s", exc)
            result = {"status": "error", "message": str(exc)}

        update_chat_dashboard(result)
        return result

    # ── Status check ────────────────────────────────────────────────
    def check_status(self) -> dict:
        """Poll the OpenClaw /status endpoint."""
        try:
            resp = requests.get(f"{self.url}/status", timeout=5)
            return resp.json()
        except requests.RequestException as exc:
            return {"status": "error", "message": str(exc)}


# ── CLI entry point ─────────────────────────────────────────────────
def main():
    bridge = SalesBridge()

    print("=" * 60)
    print("  Sales_Agent_System — Antigravity ↔ OpenClaw Bridge")
    print("=" * 60)

    # Check server status first
    status = bridge.check_status()
    print(f"\n🔍 OpenClaw status: {json.dumps(status, indent=2)}")

    if status.get("status") == "error":
        print("\n⚠️  OpenClaw server is not reachable. Start it first:")
        print("    python server.py")
        sys.exit(1)

    # Execute a sample sale
    print("\n🚀 Executing sample sale…")
    result = bridge.execute_sale("Neural_Sensor_Unit", 50)
    print(f"\n📦 Result: {json.dumps(result, indent=2)}")

    # Show dashboard
    print("\n" + "=" * 60)
    print("  📊 Dashboard")
    print("=" * 60)
    print(generate_report())


if __name__ == "__main__":
    main()
