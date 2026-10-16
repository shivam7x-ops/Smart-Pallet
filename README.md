# Smart Pallet Tracker with Route Optimization 🛰️📦

A college IoT logistics engineering project providing end-to-end telemetry tracking, shock/tilt hazard detection, cold-chain temperature & humidity monitoring, real-time GPS fleet mapping, and Capacitated Vehicle Routing Problem (CVRP) route optimization.

---

## 🏛️ System Architecture

```
+-------------------------------------------------------------------------+
|                          ESP32 Hardware Node                            |
|  - DHT22 (Temp & Humidity)       - MPU6050 (3-Axis Accel & Gyro)        |
|  - NEO-6M (GPS Lat/Lng/Sats)     - SIM800L (GSM SMS & GPRS Cellular)   |
+------------------------------------+------------------------------------+
                                     |
                          Wi-Fi HTTP / GPRS POST
                           (Bearer API Token)
                                     v
+-------------------------------------------------------------------------+
|                       FastAPI Cloud Backend API                         |
|  - Ingestion: POST /api/iot/data   - Health Check: GET /api/health      |
|  - Telemetry: GET /api/iot/latest  - Alerts Engine (Temp, Shock, GPS)   |
|  - VRP Optimizer: OR-Tools CVRP    - Devices: GET /api/iot/devices      |
+-------------------+---------------------------------+-------------------+
                    |                                 |
           SQLite Database                     Firebase RTDB
        (iot_telemetry.db)                (Low-latency WebSocket)
                    |                                 |
                    +----------------+----------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|                  React 19 + Tailwind CSS Web Dashboard                  |
|  - Login Page Authentication        - IoT Telemetry Hub & Diagnostics   |
|  - Live Leaflet OpenStreetMap Map   - Dynamic Chart.js Analytics        |
|  - Device Management & Downlink     - VRP Delivery Route Optimizer      |
+-------------------------------------------------------------------------+
```

---

## 🔌 Hardware Wiring & Pin Reference

All pin assignments directly preserve your verified ESP32 code:

| Module / Sensor | ESP32 Pin | Sensor Pin | Notes |
| :--- | :--- | :--- | :--- |
| **DHT22** (Temp/Humidity) | `GPIO 4` | DATA / OUT | Connect VCC to 3.3V, GND to GND. (Add 10k pull-up if module lacks one). |
| **MPU6050 / MPU6500** | `GPIO 21` (SDA) | SDA | I2C Data line |
| **MPU6050 / MPU6500** | `GPIO 22` (SCL) | SCL | I2C Clock line (VCC to 3.3V, GND to GND, AD0 to GND for `0x68`) |
| **NEO-6M GPS** | `GPIO 16` (RX1) | TX | GPS Serial Transmit -> ESP32 Receive |
| **NEO-6M GPS** | `GPIO 17` (TX1) | RX | GPS Serial Receive <- ESP32 Transmit (Baud: 9600) |
| **SIM800L GSM** | `GPIO 26` (RX2) | TXD | GSM Serial Transmit -> ESP32 Receive |
| **SIM800L GSM** | `GPIO 27` (TX2) | RXD | GSM Serial Receive <- ESP32 Transmit (Baud: 9600) |
| **SIM800L Power** | External 3.7V - 4.2V | VCC & GND | **Crucial:** Needs 2A peak current (use Li-ion battery or step-down buck with 1000µF capacitor). Common GND with ESP32. |

---

## 🌐 Backend REST API Documentation

Base URL: `http://localhost:8000` (or your LAN IP `http://192.168.x.x:8000`)

### 1. Health Check
- **Endpoint**: `GET /api/health`
- **Description**: Returns server status, database health, and depot info.
- **Sample Response**:
  ```json
  {
    "status": "healthy",
    "service": "Smart Pallet Tracker Backend API",
    "version": "2.0.0",
    "database": "sqlite (iot_telemetry.db)",
    "timestamp": "2026-09-17T01:25:00.462573"
  }
  ```

### 2. Ingest Sensor Telemetry (ESP32 Gateway)
- **Endpoint**: `POST /api/iot/data`
- **Headers**:
  - `Content-Type: application/json`
  - `X-API-Key: SMART_PALLET_SECRET_KEY_2026`
- **Payload Format**:
  ```json
  {
    "deviceId": "P001",
    "temperature": 29.2,
    "humidity": 61.8,
    "accel": { "x": 0.10, "y": 0.02, "z": 9.80 },
    "gyro": { "x": 0.15, "y": 0.12, "z": 0.05 },
    "gps": {
      "latitude": 30.741500,
      "longitude": 76.785000,
      "satellites": 7,
      "valid": true
    },
    "movementDetected": true,
    "shockDetected": false,
    "gsmStatus": "connected"
  }
  ```

### 3. Get Latest Telemetry Across Fleet
- **Endpoint**: `GET /api/iot/latest`
- **Description**: Returns all registered devices, latest reading snapshots, and active alert counters.

### 4. List All Registered IoT Devices
- **Endpoint**: `GET /api/iot/devices`
- **Description**: Returns list of devices with online/offline badges (offline threshold: 60s without ping).

### 5. Get Detailed Device Telemetry & History
- **Endpoint**: `GET /api/iot/device/:deviceId`
- **Example**: `GET /api/iot/device/P001`
- **Description**: Returns complete hardware metadata and recent 50 sensor readings for graphing.

### 6. Register New IoT Device
- **Endpoint**: `POST /api/iot/device/register`
- **Body**:
  ```json
  {
    "device_id": "ESP32-PALLET-004",
    "name": "Heavy Duty Pallet Sensor",
    "pallet_id": "P004",
    "token": "DEV_TOKEN_P004"
  }
  ```

### 7. Send Downlink Command to Device
- **Endpoint**: `POST /api/iot/device/:deviceId/command`
- **Body**:
  ```json
  {
    "command": "CALIBRATE_MPU",
    "parameters": { "samples": 100 }
  }
  ```

### 8. List Sensor Alerts & Hazards
- **Endpoint**: `GET /api/iot/alerts`
- **Query Params**: `limit=50&resolved=false`
- **Resolve Alert**: `POST /api/iot/alerts/:alertId/resolve`

---

## 💻 ESP32 Arduino IDE Setup Instructions

1. Open **Arduino IDE** (v1.8.x or v2.x).
2. Go to **File -> Preferences**, and add ESP32 Board URL:
   ```
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
3. Install **ESP32 by Espressif Systems** from **Boards Manager**.
4. Install Required Libraries from **Library Manager**:
   - `DHT sensor library` by Adafruit
   - `Adafruit Unified Sensor`
   - `TinyGPSPlus` by Mikal Hart
   - `Wire`, `WiFi`, and `HTTPClient` (built into ESP32 core)
5. Open `esp32/final_integrated_code.ino`.
6. Configure Wi-Fi & Backend Address in the code:
   ```cpp
   const char* WIFI_SSID = "YOUR_WIFI_SSID";
   const char* WIFI_PASS = "YOUR_WIFI_PASSWORD";

   // Put your computer's local IP address (find with 'ipconfig' in command prompt)
   const char* BACKEND_URL = "http://192.168.1.100:8000/api/iot/data";
   const char* API_KEY = "SMART_PALLET_SECRET_KEY_2026";
   ```
7. Select Board: **ESP32 Dev Module** (or your 30-pin board variant).
8. Connect ESP32 via USB and click **Upload**.
9. Open **Serial Monitor** at **115200 baud** to view real-time diagnostics:
   - `WiFi connected`
   - `Backend connected`
   - `HTTP response code: 200`
   - `Sensor data sent`

---

## 🚀 Running the Project Locally

### 1. Start the Backend API (FastAPI)
```bash
cd backend
python -m pip install -r requirements.txt
python -m uvicorn main:app --port 8000 --reload
```
The backend will launch at `http://127.0.0.1:8000`.

### 2. Start the Frontend Web Dashboard (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` (or `http://localhost:5174`) in your browser.

### 3. Login to Dashboard
- **Admin**: `admin@smartpallet.io` / `password123`
- **Warehouse Manager**: `manager@smartpallet.io` / `password123`
- **Delivery Agent**: `driver@smartpallet.io` / `password123`

---

## 🧪 Testing Without Physical Hardware

You can test the complete IoT pipeline immediately without the ESP32 connected:

### Option A: Using the Built-In Dashboard Simulator
1. In the website dashboard, click on the **IoT Telemetry Hub** tab.
2. Click the **"Test Packet Injector"** button.
3. Click **"Inject Sensor Packet"** (or load a preset like **"Load Shock Test"**).
4. Watch the live temperature gauges, accelerometer dials, and alerts update instantaneously!

### Option B: Using cURL Command
```bash
curl -X POST http://127.0.0.1:8000/api/iot/data \
  -H "Content-Type: application/json" \
  -H "X-API-Key: SMART_PALLET_SECRET_KEY_2026" \
  -d '{
    "deviceId": "PALLET-001",
    "temperature": 29.2,
    "humidity": 61.8,
    "accel": { "x": 0.10, "y": 0.02, "z": 9.80 },
    "gyro": { "x": 0.15, "y": 0.12, "z": 0.05 },
    "gps": { "latitude": 30.741500, "longitude": 76.785000, "satellites": 8, "valid": true },
    "movementDetected": true,
    "shockDetected": false,
    "gsmStatus": "connected"
  }'
```

---

## 🗺️ Live GPS Fleet Map Features

- Integrated with **Leaflet** and **OpenStreetMap**.
- Centered on the logistics dispatch depot in Chandigarh (`30.7046, 76.8016`).
- Directly tracks pallet markers updating in real time as the ESP32 transmits GPS fixes.
- **Accurate Coordinates**: Displays precise 6-decimal latitude & longitude and locked satellite count.
- **Zero Fake Locations**: If GPS is searching or indoors (`valid: false`), the map cleanly flags **"GPS location unavailable"** without plotting fake coordinates.

---

## ⚠️ Troubleshooting Guide

| Issue | Cause | Solution |
| :--- | :--- | :--- |
| **ESP32 Serial shows "Backend connection failed: -1"** | ESP32 cannot reach the backend server IP. | 1. Ensure ESP32 and computer are on the **same Wi-Fi network**. <br> 2. Use your PC's LAN IP (`192.168.x.x`), **not** `localhost`. <br> 3. Check Windows Firewall: allow port 8000 inbound. |
| **SIM800L LED blinks rapidly (every 800ms) or resets** | Insufficient current supply to GSM module. | SIM800L draws up to 2A during network registration. Power SIM800L with an external 3.7V-4.2V source and place a 1000µF capacitor across VCC/GND. Connect common GND to ESP32. |
| **GPS shows "Waiting for GPS fix..."** | NEO-6M antenna is indoors or obstructed. | Place GPS antenna near an open window or outdoors. The blue LED on NEO-6M will start blinking once a 3D satellite lock is acquired. |
| **MPU6050 shows "[ERROR] MPU6050 not detected"** | Loose I2C jumper wires or wrong address. | Verify SDA -> GPIO 21, SCL -> GPIO 22. If your sensor uses address `0x69`, change `MPU6050_ADDR` from `0x68` to `0x69`. |
| **DHT22 shows "DHT22 reading failed"** | Pin mismatch or missing pull-up resistor. | Verify DHT22 data pin is connected to `GPIO 4`. Ensure a 4.7kΩ to 10kΩ resistor is connected between DATA and 3.3V. |
