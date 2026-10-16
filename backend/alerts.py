import math
import os
from db import create_alert

TEMP_HIGH = float(os.getenv("TEMP_HIGH_THRESHOLD", "35.0"))
TEMP_LOW = float(os.getenv("TEMP_LOW_THRESHOLD", "5.0"))
HUMIDITY_HIGH = float(os.getenv("HUMIDITY_HIGH_THRESHOLD", "80.0"))
SHOCK_THRESHOLD = float(os.getenv("SHOCK_THRESHOLD_G", "2.2"))

def evaluate_telemetry_alerts(device_id: str, payload: dict):
    alerts_triggered = []
    
    # 1. Temperature
    temp = payload.get("temperature")
    if temp is not None:
        if temp > TEMP_HIGH:
            msg = f"High Temperature Warning: Pallet sensor recorded {temp:.1f}°C (Threshold: >{TEMP_HIGH}°C)."
            create_alert(device_id, "HIGH_TEMPERATURE", "CRITICAL", msg)
            alerts_triggered.append(msg)
        elif temp < TEMP_LOW:
            msg = f"Low Temperature Alert: Pallet sensor dropped to {temp:.1f}°C (Threshold: <{TEMP_LOW}°C)."
            create_alert(device_id, "LOW_TEMPERATURE", "WARNING", msg)
            alerts_triggered.append(msg)

    # 2. Humidity
    hum = payload.get("humidity")
    if hum is not None and hum > HUMIDITY_HIGH:
        msg = f"High Humidity Alert: Moisture level reached {hum:.1f}% (Threshold: >{HUMIDITY_HIGH}%)."
        create_alert(device_id, "HIGH_HUMIDITY", "WARNING", msg)
        alerts_triggered.append(msg)

    # 3. Shock / Impact
    shock = payload.get("shockDetected")
    accel = payload.get("accel") or {}
    ax = accel.get("x") or 0.0
    ay = accel.get("y") or 0.0
    az = accel.get("z") or 0.0
    g_mag = math.sqrt(ax*ax + ay*ay + az*az)

    if shock or g_mag > SHOCK_THRESHOLD:
        msg = f"Severe Shock / Impact Event Detected: {g_mag:.2f}g impact on pallet {device_id}!"
        create_alert(device_id, "SHOCK_DETECTED", "CRITICAL", msg)
        alerts_triggered.append(msg)

    # 4. Movement
    movement = payload.get("movementDetected")
    if movement:
        msg = f"Pallet Motion Triggered: Vibration and displacement detected on {device_id}."
        create_alert(device_id, "MOVEMENT_DETECTED", "INFO", msg)
        alerts_triggered.append(msg)

    # 5. GPS Fix Status
    gps = payload.get("gps") or {}
    if gps and gps.get("valid") is False:
        msg = f"GPS Signal Lost: NEO-6M module on {device_id} is searching for satellite fix."
        create_alert(device_id, "GPS_UNAVAILABLE", "WARNING", msg)
        alerts_triggered.append(msg)

    # 6. GSM / Network
    gsm = payload.get("gsmStatus")
    if gsm and gsm.lower() not in ["connected", "ok", "ready"]:
        msg = f"Cellular Signal Degraded: SIM800L module reports network status: '{gsm}'."
        create_alert(device_id, "GSM_DISCONNECTED", "WARNING", msg)
        alerts_triggered.append(msg)

    return alerts_triggered
