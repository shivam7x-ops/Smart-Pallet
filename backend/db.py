import sqlite3
import datetime
import os
import json

DB_FILE = os.path.join(os.path.dirname(__file__), "iot_telemetry.db")

def get_connection():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    # Devices table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS devices (
        device_id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        pallet_id TEXT NOT NULL,
        token TEXT,
        status TEXT DEFAULT 'offline',
        battery REAL DEFAULT 100.0,
        registered_at TEXT,
        last_seen TEXT,
        config TEXT DEFAULT '{}'
    )
    """)

    # Telemetry sensor readings
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS sensor_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        device_id TEXT NOT NULL,
        temperature REAL,
        humidity REAL,
        accel_x REAL,
        accel_y REAL,
        accel_z REAL,
        gyro_x REAL,
        gyro_y REAL,
        gyro_z REAL,
        latitude REAL,
        longitude REAL,
        satellites INTEGER,
        gps_valid INTEGER,
        movement_detected INTEGER,
        shock_detected INTEGER,
        gsm_status TEXT,
        timestamp TEXT NOT NULL,
        raw_json TEXT
    )
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_sensor_device ON sensor_data(device_id, timestamp DESC)")

    # Alerts table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        device_id TEXT NOT NULL,
        type TEXT NOT NULL,
        severity TEXT NOT NULL,
        message TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        resolved INTEGER DEFAULT 0
    )
    """)

    # Pre-seed initial default devices if empty
    cursor.execute("SELECT COUNT(*) FROM devices")
    if cursor.fetchone()[0] == 0:
        now = datetime.datetime.now().isoformat()
        default_devices = [
            ("P001", "ESP32 Pallet Tracker P001", "P001", "DEV_TOKEN_P001_CH", "online", 94.0, now, now, json.dumps({"hardware": "ESP32+DHT22+MPU6050+NEO6M+SIM800L"})),
            ("PALLET-001", "ESP32 Tracking Unit Alpha", "P001", "DEV_TOKEN_PALLET001", "online", 92.0, now, now, json.dumps({"hardware": "ESP32 Fleet Node"})),
            ("P003", "Cold-Chain Reefer Node", "P003", "DEV_TOKEN_P003", "online", 68.0, now, now, json.dumps({"hardware": "Refrigerated Sensor Node"}))
        ]
        cursor.executemany("""
        INSERT INTO devices (device_id, name, pallet_id, token, status, battery, registered_at, last_seen, config)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, default_devices)

        # Seed initial telemetry packet
        initial_telemetry = [
            ("P001", 23.4, 58.2, 0.04, -0.02, 0.98, 0.5, 0.2, -0.1, 30.7415, 76.7850, 8, 1, 0, 0, "connected", now, "{}"),
            ("PALLET-001", 24.1, 56.5, 0.08, 0.01, 1.01, 0.8, -0.4, 0.2, 30.7415, 76.7850, 7, 1, 1, 0, "connected", now, "{}"),
            ("P003", 4.1, 84.0, 0.12, 0.05, 0.99, 1.2, 0.3, -0.2, 30.7245, 76.8375, 9, 1, 1, 0, "connected", now, "{}")
        ]
        cursor.executemany("""
        INSERT INTO sensor_data (device_id, temperature, humidity, accel_x, accel_y, accel_z, gyro_x, gyro_y, gyro_z, latitude, longitude, satellites, gps_valid, movement_detected, shock_detected, gsm_status, timestamp, raw_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, initial_telemetry)

        # Seed initial informational alert
        cursor.execute("""
        INSERT INTO alerts (device_id, type, severity, message, timestamp, resolved)
        VALUES (?, ?, ?, ?, ?, ?)
        """, ("P001", "SYSTEM_STARTUP", "INFO", "Smart Pallet IoT telemetry gateway initialized and operational.", now, 0))

    conn.commit()
    conn.close()

def save_sensor_reading(payload: dict):
    conn = get_connection()
    cursor = conn.cursor()
    
    device_id = payload.get("deviceId") or payload.get("device_id") or "UNKNOWN"
    now = datetime.datetime.now().isoformat()
    ts = payload.get("timestamp") or now

    accel = payload.get("accel") or {}
    gyro = payload.get("gyro") or {}
    gps = payload.get("gps") or {}

    temp = payload.get("temperature")
    hum = payload.get("humidity")
    accel_x = accel.get("x")
    accel_y = accel.get("y")
    accel_z = accel.get("z")
    gyro_x = gyro.get("x")
    gyro_y = gyro.get("y")
    gyro_z = gyro.get("z")

    lat = gps.get("latitude")
    lng = gps.get("longitude")
    sats = gps.get("satellites", 0)
    gps_val = 1 if gps.get("valid") else 0

    mv = 1 if payload.get("movementDetected") else 0
    shock = 1 if payload.get("shockDetected") else 0
    gsm = payload.get("gsmStatus", "connected")
    raw = json.dumps(payload)

    # Insert into sensor_data
    cursor.execute("""
    INSERT INTO sensor_data (
        device_id, temperature, humidity,
        accel_x, accel_y, accel_z,
        gyro_x, gyro_y, gyro_z,
        latitude, longitude, satellites, gps_valid,
        movement_detected, shock_detected, gsm_status,
        timestamp, raw_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        device_id, temp, hum,
        accel_x, accel_y, accel_z,
        gyro_x, gyro_y, gyro_z,
        lat, lng, sats, gps_val,
        mv, shock, gsm,
        ts, raw
    ))

    # Update or insert device
    cursor.execute("SELECT device_id FROM devices WHERE device_id = ?", (device_id,))
    existing = cursor.fetchone()
    if existing:
        cursor.execute("""
        UPDATE devices SET status = 'online', last_seen = ? WHERE device_id = ?
        """, (now, device_id))
    else:
        cursor.execute("""
        INSERT INTO devices (device_id, name, pallet_id, status, registered_at, last_seen)
        VALUES (?, ?, ?, 'online', ?, ?)
        """, (device_id, f"ESP32 Node {device_id}", device_id, now, now))

    conn.commit()
    conn.close()

def get_devices(offline_seconds=60):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM devices ORDER BY device_id ASC")
    rows = cursor.fetchall()

    now = datetime.datetime.now()
    results = []
    for r in rows:
        d = dict(r)
        last_seen = d.get("last_seen")
        is_online = False
        if last_seen:
            try:
                dt = datetime.datetime.fromisoformat(last_seen)
                diff = (now - dt).total_seconds()
                is_online = (diff <= offline_seconds)
            except Exception:
                is_online = True
        d["status"] = "online" if is_online else "offline"
        
        # Attach latest reading
        cursor.execute("SELECT * FROM sensor_data WHERE device_id = ? ORDER BY id DESC LIMIT 1", (d["device_id"],))
        latest = cursor.fetchone()
        d["latest"] = dict(latest) if latest else None
        results.append(d)

    conn.close()
    return results

def get_device_by_id(device_id: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM devices WHERE device_id = ?", (device_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return None
    d = dict(row)
    cursor.execute("SELECT * FROM sensor_data WHERE device_id = ? ORDER BY id DESC LIMIT 50", (device_id,))
    history = [dict(r) for r in cursor.fetchall()]
    d["history"] = history
    d["latest"] = history[0] if history else None
    conn.close()
    return d

def get_latest_telemetry_all():
    devices = get_devices()
    return {d["device_id"]: d.get("latest") for d in devices if d.get("latest")}

def register_or_update_device(device_id: str, name: str, pallet_id: str, token: str = None, config: dict = None):
    conn = get_connection()
    cursor = conn.cursor()
    now = datetime.datetime.now().isoformat()
    config_json = json.dumps(config or {})

    cursor.execute("SELECT device_id FROM devices WHERE device_id = ?", (device_id,))
    if cursor.fetchone():
        cursor.execute("""
        UPDATE devices SET name = ?, pallet_id = ?, config = ? WHERE device_id = ?
        """, (name, pallet_id, config_json, device_id))
    else:
        cursor.execute("""
        INSERT INTO devices (device_id, name, pallet_id, token, status, registered_at, last_seen, config)
        VALUES (?, ?, ?, ?, 'offline', ?, ?, ?)
        """, (device_id, name, pallet_id, token, now, now, config_json))

    conn.commit()
    conn.close()
    return {"device_id": device_id, "name": name, "pallet_id": pallet_id, "status": "success"}

def create_alert(device_id: str, alert_type: str, severity: str, message: str):
    conn = get_connection()
    cursor = conn.cursor()
    now = datetime.datetime.now().isoformat()

    # Avoid duplicate alert within last 30 seconds
    cursor.execute("""
    SELECT id FROM alerts 
    WHERE device_id = ? AND type = ? AND resolved = 0 
    ORDER BY id DESC LIMIT 1
    """, (device_id, alert_type))
    existing = cursor.fetchone()
    if not existing:
        cursor.execute("""
        INSERT INTO alerts (device_id, type, severity, message, timestamp, resolved)
        VALUES (?, ?, ?, ?, ?, 0)
        """, (device_id, alert_type, severity, message, now))
        conn.commit()
    conn.close()

def get_alerts(limit=50, resolved=None):
    conn = get_connection()
    cursor = conn.cursor()
    if resolved is None:
        cursor.execute("SELECT * FROM alerts ORDER BY id DESC LIMIT ?", (limit,))
    else:
        cursor.execute("SELECT * FROM alerts WHERE resolved = ? ORDER BY id DESC LIMIT ?", (1 if resolved else 0, limit))
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return rows

def resolve_alert(alert_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE alerts SET resolved = 1 WHERE id = ?", (alert_id,))
    conn.commit()
    conn.close()
    return {"status": "success", "alert_id": alert_id}
