import requests
import time
import random

def start_marketing_campaign():
    potential_customers = [
        {"query": "أريد شراء Neural Sensor لمشروعي الجديد", "product": "Neural_Sensor_Unit"},
        {"query": "كم سعر الـ Quantum Chip؟", "product": "Quantum_Chip_v1"},
        {"query": "طلب شراء BioSync Module الآن", "product": "BioSync_Module"}
    ]
    
    # We need the API Key to talk to the server if auth is enabled
    # Our server.py uses X-Bridge-Key: INTERNAL_SECRET
    headers = {
        "X-Bridge-Key": "secure_bridge_key_2026"  # Matching INTERNAL_SECRET in server.py
    }
    
    print("🚀 بدء حملة التسويق الآلي لـ Dodi-Store-16...")
    
    for customer in potential_customers:
        print(f"📡 استهداف عميل جديد: {customer['query']}")
        try:
            # Note: server.py /chat expects X-Bridge-Key
            response = requests.post("http://localhost:5050/chat", json=customer, headers=headers)
            if response.status_code == 200:
                data = response.json()
                print(f"✅ تم الإغلاق بنجاح! الرابط المرسل: {data.get('pay_link')}")
                print(f"🤖 رد الوكيل: {data.get('response')}")
            else:
                print(f"⚠️ فشل الطلب: {response.status_code} - {response.text}")
            time.sleep(2) # انتظار بين كل عميل والآخر
        except Exception as e:
            print(f"❌ خطأ في الاتصال بالسيرفر: {e}")

if __name__ == "__main__":
    start_marketing_campaign()
