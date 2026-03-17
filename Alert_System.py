import requests
import os

class CashNotifier:
    def __init__(self):
        # These would ideally be in .env
        self.bot_token = os.getenv("TELEGRAM_BOT_TOKEN", "YOUR_BOT_TOKEN")
        self.chat_id = os.getenv("TELEGRAM_CHAT_ID", "YOUR_CHAT_ID")

    def send_alert(self, message):
        if self.bot_token == "YOUR_BOT_TOKEN":
            print(f"📡 ALERT (Local Only): {message}")
            return
            
        url = f"https://api.telegram.org/bot{self.bot_token}/sendMessage"
        payload = {
            "chat_id": self.chat_id,
            "text": message,
            "parse_mode": "Markdown"
        }
        try:
            requests.post(url, json=payload, timeout=5)
            print(f"✅ Telegram Alert Sent: {message[:50]}...")
        except Exception as e:
            print(f"⚠️ Failed to send Telegram alert: {e}")

if __name__ == "__main__":
    # Test
    notifier = CashNotifier()
    notifier.send_alert("🚀 *Dodi-Store-16* Alert System is ONLINE!")
