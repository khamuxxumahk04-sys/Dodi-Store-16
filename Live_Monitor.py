import requests
import time
import os

def monitor():
    os.system('cls' if os.name == 'nt' else 'clear')
    print("="*60)
    print(" 📊 Dodi-Store-16 Master Dashboard — LIVE MONITOR")
    print("="*60)
    
    # Internal secret for auth
    headers = {"X-Bridge-Key": "secure_bridge_key_2026"}
    
    try:
        while True:
            response = requests.get("http://localhost:5050/logs/summary", headers=headers)
            if response.status_code == 200:
                data = response.json()
                total_ops = data.get("total_operations", 0)
                total_rev = data.get("total_revenue", 0)
                
                # Move cursor to top or just clear and reprint
                os.system('cls' if os.name == 'nt' else 'clear')
                print("="*60)
                print(" 📊 Dodi-Store-16 Master Dashboard — LIVE MONITOR")
                print("="*60)
                print(f" [+] Total Sales Operations: {total_ops}")
                print(f" [+] Total Revenue (Gross):  ${total_rev:,.2f}")
                print(f" [+] Profit (70%):          ${(total_rev * 0.7):,.2f}")
                print(f" [+] Reinvestment (30%):    ${(total_rev * 0.3):,.2f}")
                print("-" * 60)
                print(" [ Recent Activity ]")
                for record in data.get("recent", []):
                    # We could fetch more details if we had an endpoint for it
                    print(f" - {record['timestamp']} | ID: {record['result_id']}")
                
                print("-" * 60)
                print(" [!] Refreshing every 5 seconds... Press Ctrl+C to stop.")
            else:
                print(f"[-] Error fetching data: {response.status_code}")
                
            time.sleep(5)
    except KeyboardInterrupt:
        print("\n[*] Stopping Live Monitor. Goodbye!")

if __name__ == "__main__":
    monitor()
