import requests
import os
import json
import time
from Alert_System import CashNotifier

class LeadHunter:
    def __init__(self):
        self.notifier = CashNotifier()
        self.user_agent = "DodiBot/1.0 (Advanced Social Hunter)"
        self.keywords = [
            "أتمتة الذكاء الاصطناعي",
            "كيف أجني المال من AI",
            "AI business automation",
            "cybernetic gear",
            "best AI course 2026",
            "ربح من الانترنت ذكاء اصطناعي"
        ]
        self.processed_leads_file = "processed_leads.json"
        self.processed_ids = self._load_processed_ids()

    def _load_processed_ids(self):
        if os.path.exists(self.processed_leads_file):
            try:
                with open(self.processed_leads_file, "r") as f:
                    return set(json.load(f))
            except:
                return set()
        return set()

    def _save_processed_ids(self):
        with open(self.processed_leads_file, "w") as f:
            json.dump(list(self.processed_ids), f)

    def hunt_reddit(self):
        """Scans Reddit for potential hot leads based on keywords."""
        print("🦅 Lead Hunter: Scanning social frequencies...")
        all_leads = []
        
        for q in self.keywords:
            url = f"https://www.reddit.com/search.json?q={q}&sort=new&limit=5"
            try:
                headers = {"User-Agent": self.user_agent}
                response = requests.get(url, headers=headers, timeout=10)
                if response.status_code == 200:
                    data = response.json()
                    posts = data.get("data", {}).get("children", [])
                    for post in posts:
                        pdata = post.get("data", {})
                        pid = pdata.get("id")
                        if pid not in self.processed_ids:
                            lead = {
                                "id": pid,
                                "title": pdata.get("title"),
                                "url": f"https://reddit.com{pdata.get('permalink')}",
                                "subreddit": pdata.get("subreddit"),
                                "author": pdata.get("author")
                            }
                            all_leads.append(lead)
                            self.processed_ids.add(pid)
            except Exception as e:
                print(f"⚠️ Error hunting Reddit for '{q}': {e}")
            time.sleep(1) # Rate limit friendly

        if all_leads:
            print(f"🔥 Found {len(all_leads)} NEW hot leads!")
            self._save_processed_ids()
            self._notify_leads(all_leads)
        else:
            print("🌑 No new leads found in this cycle.")

    def _notify_leads(self, leads):
        for lead in leads:
            msg = (
                f"🎯 *HOT LEAD DETECTED!*\n\n"
                f"📝 *Title:* {lead['title']}\n"
                f"👤 *Author:* `{lead['author']}`\n"
                f"🌐 *Source:* r/{lead['subreddit']}\n\n"
                f"🔗 [View Post]({lead['url']})"
            )
            self.notifier.send_alert(msg)
            time.sleep(0.5)

if __name__ == "__main__":
    hunter = LeadHunter()
    hunter.hunt_reddit()
