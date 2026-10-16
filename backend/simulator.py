import time
import requests
import random
import math

API_URL = "http://127.0.0.1:8000/api/telemetry"

# Waypoints simulating delivery route around Chandigarh Tri-City (Chandigarh, Mohali, Panchkula)
WAYPOINTS = [
    {"lat": 30.7046, "lng": 76.8016, "name": "Central Depot, Ind Area Phase 1"},
    {"lat": 30.7180, "lng": 76.7920, "name": "Sector 28 Transit"},
    {"lat": 30.7415, "lng": 76.7850, "name": "Sector 17 Plaza Hub"},
    {"lat": 30.7380, "lng": 76.8150, "name": "Madhya Marg Corridor"},
    {"lat": 30.7245, "lng": 76.8375, "name": "Rajiv Gandhi IT Park"},
    {"lat": 30.7022, "lng": 76.8203, "name": "Chandigarh Railway Logistics"},
    {"lat": 30.6942, "lng": 76.8606, "name": "Panchkula Sector 5 Hub"},
    {"lat": 30.6850, "lng": 76.8100, "name": "Zirakpur Bypass"},
    {"lat": 30.7046, "lng": 76.7179, "name": "Mohali Phase 7 Industrial Hub"},
    {"lat": 30.7228, "lng": 76.7681, "name": "Sector 35 Market Area"}
]

def run_simulation():
    print("[IoT Simulator - Chandigarh] Starting continuous telemetry loop for Pallets P001 and P003...")
    idx_p1 = 0
    idx_p3 = 4
    battery_p1 = 88.0
    battery_p3 = 68.0

    while True:
        wp1 = WAYPOINTS[idx_p1 % len(WAYPOINTS)]
        wp3 = WAYPOINTS[idx_p3 % len(WAYPOINTS)]

        # Add slight noise to simulate smooth GPS movement
        lat1 = wp1["lat"] + random.uniform(-0.0008, 0.0008)
        lng1 = wp1["lng"] + random.uniform(-0.0008, 0.0008)
        
        lat3 = wp3["lat"] + random.uniform(-0.0008, 0.0008)
        lng3 = wp3["lng"] + random.uniform(-0.0008, 0.0008)

        battery_p1 = max(10.0, battery_p1 - 0.05)
        battery_p3 = max(10.0, battery_p3 - 0.08)

        payload1 = {
            "pallet_id": "P001",
            "lat": round(lat1, 5),
            "lng": round(lng1, 5),
            "battery": round(battery_p1, 1),
            "temp_celsius": round(random.uniform(21.5, 23.5), 1),
            "speed_kmh": round(random.uniform(32.0, 48.0), 1),
            "address": f"{wp1['name']}, Chandigarh Corridor"
        }

        payload3 = {
            "pallet_id": "P003",
            "lat": round(lat3, 5),
            "lng": round(lng3, 5),
            "battery": round(battery_p3, 1),
            "temp_celsius": round(random.uniform(3.8, 4.8), 1),
            "speed_kmh": round(random.uniform(35.0, 50.0), 1),
            "address": f"{wp3['name']}, Chandigarh Corridor"
        }

        try:
            r1 = requests.post(API_URL, json=payload1, timeout=3)
            r3 = requests.post(API_URL, json=payload3, timeout=3)
            if r1.status_code == 200 and r3.status_code == 200:
                print(f"[IoT Simulator] Telemetry sent: P001 -> ({lat1:.4f}, {lng1:.4f}) | P003 -> ({lat3:.4f}, {lng3:.4f})")
            else:
                print("[IoT Simulator] Server error sending telemetry:", r1.text)
        except Exception as e:
            print("[IoT Simulator] Waiting for backend API...", e)

        idx_p1 += 1
        idx_p3 += 1
        time.sleep(3)

if __name__ == "__main__":
    run_simulation()
