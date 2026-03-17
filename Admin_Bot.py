import requests
import os
import time
from dotenv import load_dotenv

load_dotenv()

BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
CHAT_ID = os.getenv("TELEGRAM_CHAT_ID")
SERVER_URL = f"http://localhost:{os.getenv('OPENCLAW_PORT', 5050)}"
API_KEY = os.getenv("OPENCLAW_API_KEY", "secure_bridge_key_2026")

def send_to_owner(text):
    if not BOT_TOKEN or not CHAT_ID:
        print(f"DEBUG_BOT: {text}")
        return
    url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
    requests.post(url, json={"chat_id": CHAT_ID, "text": text, "parse_mode": "Markdown"})

def get_stats():
    headers = {"X-Bridge-Key": API_KEY}
    try:
        r = requests.get(f"{SERVER_URL}/logs/summary", headers=headers)
        if r.status_code == 200:
            data = r.json()
            msg = (
                f"📊 *Dodi-Store-16 Daily Stats:*\n"
                f"--------------------------\n"
                f"📈 Total Revenue: ${data['total_revenue']}\n"
                f"💰 Net Profit (70%): ${data['total_profit']:.2f}\n"
                f"♻️ Reinvestment (30%): ${data['total_reinvestment']:.2f}\n"
                f"🛒 Total Operations: {data['total_operations']}"
            )
            return msg
        return "❌ Failed to fetch stats."
    except Exception as e:
        return f"❌ Error connecting to server: {e}"

def poll_commands():
    if not BOT_TOKEN:
        print("Telegram Token not configured. Admin Bot in passive mode.")
        return
    
    last_update_id = 0
    print("🚀 Admin Bot is polling for commands...")
    
    while True:
        try:
            url = f"https://api.telegram.org/bot{BOT_TOKEN}/getUpdates?offset={last_update_id + 1}"
            r = requests.get(url).json()
            
            if r.get("ok"):
                for update in r.get("result", []):
                    last_update_id = update["update_id"]
                    msg = update.get("message", {})
                    text = msg.get("text", "")
                    from_id = str(msg.get("from", {}).get("id", ""))
                    
                    if from_id != CHAT_ID:
                        continue # Only respond to the owner
                        
                    if text == "/stats":
                        send_to_owner(get_stats())
                    elif text == "/ping":
                        send_to_owner("🏓 Pong! Dodi-Store-16 is running.")
                    elif text == "/help":
                        send_to_owner("🤖 *Admin Bot Commands:*\n/stats - Get financial summary\n/ping - Check status")
            
            time.sleep(3)
        except Exception as e:
            print(f"Error in bot polling: {e}")
            time.sleep(10)

if __name__ == "__main__":
    # If standard run, just show stats then start polling
    print(get_stats())
    poll_commands()
