import subprocess
import time
import os
import sys

def start_system():
    print("="*60)
    print(" 🚀 Dodi-Store-16 — AI Sales System Starting...")
    print("="*60)

    # 1. Start Server in background
    print("[*] Starting OpenClaw Isolated Server on port 5050...")
    # Using 'waitress' inside server.py
    server_process = subprocess.Popen([sys.executable, "server.py"], stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    
    # 2. Optional: Activate ngrok
    print("[?] Do you want to activate ngrok for global access? (y/n)")
    # Note: Using a non-blocking check or default for now
    # If the user has ngrok installed, they can run it.
    
    print("[+] Server is ONLINE at http://localhost:5050")
    print("[!] Monitoring 'dashboard.md' for incoming sales data...")
    print("[!] Press Ctrl+C to stop the system.")

    try:
        if server_process.stdout:
            while True:
                # Poll server output
                line = server_process.stdout.readline()
                if line:
                    print(f"📡 SERVE: {line.strip()}")
                time.sleep(0.1)
        else:
            print("[-] Error: Could not capture server output.")
    except KeyboardInterrupt:
        print("\n[*] Shutting down system...")
        server_process.terminate()
        print("[+] System offline. Goodbye!")

if __name__ == "__main__":
    start_system()
