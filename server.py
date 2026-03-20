from flask import Flask, request, jsonify, render_template
from waitress import serve
from dotenv import load_dotenv
import secrets
import os
import logging
from datetime import datetime, timezone
from Sales_Logic_Engine import SalesLogicEngine
from Revenue_Tracker import Revenue_Tracker
from Profit_Cycle import ProfitCycle
from Alert_System import CashNotifier

# ── Load environment ────────────────────────────────────────────────
load_dotenv()

INTERNAL_SECRET = os.getenv("OPENCLAW_API_KEY", "secure_bridge_key_2026")
PORT = int(os.getenv("OPENCLAW_PORT", 5050))
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
BASE_URL = os.getenv("BASE_URL", f"http://localhost:{PORT}")
# Support for Render's automatic external URL
if os.getenv("RENDER_EXTERNAL_URL"):
    BASE_URL = os.getenv("RENDER_EXTERNAL_URL")

# ── App setup ───────────────────────────────────────────────────────
app = Flask(__name__)
logging.basicConfig(level=LOG_LEVEL, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("Dodi-Store-16")

# In-memory ledger (stays inside the container — never exposed)
_private_ledger: list[dict] = []
_chat_history: list[dict] = []
_pending_sales: dict[str, dict] = {} # Track sessions that initiated a sale

engine = SalesLogicEngine(base_url=BASE_URL)
revenue_tracker = Revenue_Tracker()
profit_cycle = ProfitCycle()
notifier = CashNotifier()

# ── Auth helper ─────────────────────────────────────────────────────
def _is_authorized(headers) -> bool:
    """Validate the internal bridge key sent by Antigravity."""
    return headers.get("X-Bridge-Key") == INTERNAL_SECRET


# ── Endpoints ───────────────────────────────────────────────────────
@app.route('/')
def home():
    """Main Landing Page for Dodi-Store-16."""
    return render_template('index.html')

@app.route('/genius-room')
def genius_room():
    """The multi-agent Genius Room interface."""
    return render_template('genius-room.html')

from flask import send_file

@app.route('/hero.png')
def serve_hero_image():
    """Serves the generated hero image from the artifacts directory."""
    image_path = r"C:\Users\Antigravity\.gemini\antigravity\brain\2ce16d97-d5f7-47a5-8cbd-bab5ddfb54be\dodi_store_hero_1773651135900.png"
    return send_file(image_path, mimetype='image/png')

@app.route('/success')
def success():
    item_key = request.args.get('item', '').lower().replace(' ', '_')
    
    # Delivery logic: Map item to its asset from .env
    asset = "LICENSE_KEY_OR_URL_PENDING"
    if "neural" in item_key:
        asset = os.getenv("NEURAL_SENSOR_LICENSE", "NS-DEFAULT-DATA")
    elif "quantum" in item_key:
        asset = os.getenv("QUANTUM_CHIP_ACCESS_KEY", "QC-DEFAULT-DATA")
    elif "biosync" in item_key:
        asset = os.getenv("BIOSYNC_MODULE_DOWNLOAD_URL", "BS-DEFAULT-DATA")

    # Mark sale as completed (remove from pending)
    session_id = request.args.get('session_id', 'default')
    _pending_sales.pop(session_id, None)

    return f"""
    <div style="font-family: 'Tajawal', sans-serif; text-align: center; padding: 50px; background: #0a0e14; color: white; min-height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center;">
        <div style="background: rgba(255,255,255,0.05); padding: 40px; border-radius: 20px; border: 1px solid #00f2fe; max-width: 600px; backdrop-filter: blur(10px);">
            <h1 style="color: #00f2fe; font-size: 2.5rem; margin-bottom: 20px;">🎉 مبروك يا بطل! تم بنجاح</h1>
            <p style="font-size: 1.2rem; margin-bottom: 30px;">تمت عملية شراء <strong>{item_key.replace('_', ' ').title()}</strong>.</p>
            
            <div style="background: #1e293b; padding: 20px; border-radius: 10px; margin-bottom: 30px; border: 1px dashed #4facfe;">
                <p style="color: #4facfe; margin-bottom: 10px;">إليك "الأصل الرقمي" الخاص بك:</p>
                <code style="font-size: 1.5rem; color: #ff007a; word-break: break-all;">{asset}</code>
            </div>

            <p style="font-size: 0.9rem; color: #94a3b8; margin-bottom: 30px;">يرجى حفظ الكود أعلاه، كما تم إرسال نسخة لبريدك المسجل.</p>
            
            <a href="/" style="background: linear-gradient(to right, #00f2fe, #4facfe); color: #000; text-decoration: none; padding: 12px 30px; border-radius: 50px; font-weight: bold; transition: box-shadow 0.3s;">العودة للمتجر</a>
        </div>
    </div>
    """

@app.route("/process", methods=["POST"])
def process_sale():
    """
    POST /process
    Accepts a sale payload, processes it, and returns a sanitized result.
    """
    if not _is_authorized(request.headers):
        logger.warning("Unauthorized access attempt blocked.")
        return jsonify({"status": "error", "message": "Unauthorized"}), 403

    data = request.json
    if not data:
        return jsonify({"status": "error", "message": "Empty payload"}), 400

    product = data.get("product", "unknown")
    signal = data.get("signal_integrity", 0.0)
    command = data.get("command", "PROCESS_SALE")

    # ── Private processing ──
    result_id = secrets.token_hex(8)
    timestamp = datetime.now(timezone.utc).isoformat()

    _private_ledger.append({
        "result_id": result_id,
        "product": product,
        "signal": signal,
        "command": command,
        "timestamp": timestamp,
    })

    logger.info("Sale processed — result_id=%s product=%s signal=%.4f", result_id, product, signal)

    return jsonify({
        "status": "success",
        "result_id": result_id,
        "message": f"Sale processed for {product} with signal weight {signal:.4f}",
        "timestamp": timestamp,
    })


@app.route("/chat", methods=["POST"])
def handle_chat():
    """
    POST /chat
    Intelligent chat endpoint for customer interaction.
    """
    # Public endpoint — no auth required for customers

    data = request.json
    if not data or "query" not in data:
        return jsonify({"status": "error", "message": "Missing 'query' field"}), 400

    raw_query = data.get("query")
    session_id = data.get("session_id", "default")

    # Start/Update session for nudge logic
    engine.start_session(session_id)

    # 1. Sanitize
    sanitized = engine.sanitize_input(raw_query)
    
    if sanitized == "BLOCKED_THREAT":
        intent = "BLOCKED_THREAT"
        pkey = None
        decision = engine.execute_decision(intent, pkey, raw_query=raw_query)
    else:
        # 2. Parse Intent
        intent, pkey = engine.parse_intent(sanitized)
        # 3. Execute Decision
        decision = engine.execute_decision(intent, pkey, raw_query=raw_query)

    # 4. Process Sale if needed
    result_id = None
    payment_url = None
    if decision["action"] == "SALE_INITIATED":
        result_id = secrets.token_hex(8)
        payment_url = decision.get("payment_url")
        _private_ledger.append({
            "result_id": result_id,
            "product": decision.get("product"),
            "revenue": decision.get("revenue", 0),
            "source": "chat_agent",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "payment_url": payment_url # Add payment URL to ledger
        })
        
        # Log to Revenue Tracker
        revenue_tracker.log_sale(decision.get("product"), decision.get("revenue", 0))

        # Track for abandonment recovery
        _pending_sales[session_id] = {
            "product": decision.get("product"),
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "nudge_sent": False
        }

        # 5. Profit Cycle & Alerts
        stats = profit_cycle.process_sale(decision.get("revenue", 0))
        notifier.send_alert(
            f"💰 *SALE INITIATED!*\n"
            f"Product: {decision.get('product')}\n"
            f"Amount: ${stats['amount']}\n"
            f"Profit (70%): ${stats['profit']:.2f}\n"
            f"Reinvest (30%): ${stats['reinvest']:.2f}\n"
            f"Link: {payment_url}"
        )

    # Log chat
    _chat_history.append({
        "session": session_id,
        "intent": intent,
        "action": decision["action"],
        "timestamp": datetime.now(timezone.utc).isoformat()
    })

    return jsonify({
        "status": decision["status"],
        "intent": intent,
        "action": decision["action"],
        "response": decision["response"],
        "result_id": result_id,
        "pay_link": payment_url
    })


@app.route("/check_nudge", methods=["POST"])
def check_nudge():
    """Checks if a nudge is needed for the current session."""
    session_id = request.json.get("session_id", "agent_session") if request.is_json else "agent_session"
    nudge_msg = engine.check_nudge_needed(session_id)
    return jsonify({"nudge": nudge_msg})


@app.route("/status", methods=["GET"])
def get_status():
    """Container health check."""
    if not _is_authorized(request.headers):
        return jsonify({"status": "error", "message": "Unauthorized"}), 403

    return jsonify({
        "container_status": "local",
        "active_tasks": len(_private_ledger),
        "uptime": "nominal",
    })


@app.route("/logs/summary", methods=["GET"])
def logs_summary():
    """Summary of operations."""
    if not _is_authorized(request.headers):
        return jsonify({"status": "error", "message": "Unauthorized"}), 403

    ledger_size = len(_private_ledger)
    recent = _private_ledger[-10:] if ledger_size > 0 else []
    summary = [{"result_id": r["result_id"], "timestamp": r["timestamp"]} for r in recent]

    stats = profit_cycle.get_stats()

    return jsonify({
        "total_operations": len(_private_ledger),
        "total_revenue": revenue_tracker.total_sales,
        "total_profit": stats["total_profit"],
        "total_reinvestment": stats["accumulated_reinvestment"],
        "recent": summary,
    })


# ── Run with Waitress ───────────────────────────────────────────────
if __name__ == "__main__":
    print("="*60)
    print(f"  🚀 Dodi-Store-16 is running on http://localhost:{PORT}")
    print("="*60)
    serve(app, host='0.0.0.0', port=PORT)
