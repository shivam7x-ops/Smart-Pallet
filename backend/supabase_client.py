import os
import re
import math
import json
import logging
import datetime
from typing import Optional, Dict, Any, List
from dotenv import load_dotenv

load_dotenv()

# Logger setup
logger = logging.getLogger("supabase_client")

# Cached client instance
_supabase_client = None
_client_initialized = False

def normalize_supabase_url(url: Optional[str]) -> Optional[str]:
    """
    Ensure the Supabase URL points to the root project endpoint
    and does not contain redundant paths such as /rest/v1 or trailing slashes.
    """
    if not url:
        return None
    cleaned = url.strip()
    if cleaned.endswith("/rest/v1/"):
        cleaned = cleaned[:-len("/rest/v1/")]
    elif cleaned.endswith("/rest/v1"):
        cleaned = cleaned[:-len("/rest/v1")]
    return cleaned.rstrip("/")

def get_supabase_client():
    """
    Returns a cached, reusable Supabase Client instance if credentials are configured.
    Returns None if SUPABASE_URL or SUPABASE_SECRET_KEY is missing or invalid.
    Never exposes or logs secret credentials.
    """
    global _supabase_client, _client_initialized
    if _client_initialized:
        return _supabase_client

    supabase_url = normalize_supabase_url(os.getenv("SUPABASE_URL"))
    supabase_key = os.getenv("SUPABASE_SECRET_KEY") or os.getenv("SUPABASE_KEY")

    if not supabase_url or not supabase_key:
        logger.info("Supabase credentials not configured in environment. Supabase client disabled.")
        _client_initialized = True
        _supabase_client = None
        return None

    try:
        from supabase import create_client, Client
        _supabase_client = create_client(supabase_url, supabase_key)
        _client_initialized = True
        logger.info(f"Supabase client initialized successfully for project at {supabase_url}")
        return _supabase_client
    except Exception as e:
        _client_initialized = True
        _supabase_client = None
        logger.error(f"Failed to initialize Supabase client: {type(e).__name__}")
        return None

def reset_supabase_client():
    """Reset cached client to allow re-initialization if environment changes."""
    global _supabase_client, _client_initialized
    _supabase_client = None
    _client_initialized = False

def sanitize_error_message(err: Exception) -> str:
    """Removes any potential secret keys or authorization tokens from error strings."""
    msg = str(err)
    msg = re.sub(r'Bearer\s+[A-Za-z0-9_\-\.]+', 'Bearer [REDACTED]', msg)
    msg = re.sub(r'sb_secret_[A-Za-z0-9_\-]+', 'sb_secret_[REDACTED]', msg)
    msg = re.sub(r'eyJ[A-Za-z0-9_\-\.]+', '[JWT_REDACTED]', msg)
    return msg

def test_supabase_connection() -> Dict[str, Any]:
    """
    Performs a safe, read-only database connection check against Supabase.
    - Tests connectivity without inserting or mutating any records.
    - Inspects whether public.devices, public.sensor_data, and public.alerts exist.
    - Safely reports missing tables without altering schemas.
    - Never exposes secret keys or tokens.
    """
    supabase_url = normalize_supabase_url(os.getenv("SUPABASE_URL"))
    supabase_key = os.getenv("SUPABASE_SECRET_KEY") or os.getenv("SUPABASE_KEY")

    if not supabase_url or not supabase_key:
        return {
            "status": "not_configured",
            "connected": False,
            "message": "SUPABASE_URL or SUPABASE_SECRET_KEY is missing from environment configuration.",
            "tables": {}
        }

    client = get_supabase_client()
    if not client:
        return {
            "status": "initialization_failed",
            "connected": False,
            "message": "Could not initialize Supabase client with the provided configuration.",
            "tables": {}
        }

    expected_tables = ["devices", "sensor_data", "alerts"]
    tables_status = {}
    missing_tables = []
    connection_ok = True
    overall_error = None

    for table_name in expected_tables:
        try:
            res = client.table(table_name).select("*", count="exact").limit(0).execute()
            tables_status[f"public.{table_name}"] = {
                "exists": True,
                "row_count": res.count if res.count is not None else 0
            }
        except Exception as e:
            sanitized_err = sanitize_error_message(e)
            err_lower = sanitized_err.lower()
            
            if "relation" in err_lower and "does not exist" in err_lower or "pgrst204" in err_lower or "pgrst200" in err_lower:
                tables_status[f"public.{table_name}"] = {
                    "exists": False,
                    "error": "Table not found in public schema."
                }
                missing_tables.append(f"public.{table_name}")
            else:
                tables_status[f"public.{table_name}"] = {
                    "exists": False,
                    "error": sanitized_err
                }
                connection_ok = False
                overall_error = sanitized_err

    if not connection_ok:
        return {
            "status": "error",
            "connected": False,
            "project_url": supabase_url,
            "error": overall_error,
            "tables": tables_status
        }

    return {
        "status": "connected",
        "connected": True,
        "project_url": supabase_url,
        "missing_tables": missing_tables,
        "all_tables_ready": len(missing_tables) == 0,
        "tables": tables_status
    }

def ensure_device_in_supabase(
    device_id: str,
    pallet_id: Optional[str] = None,
    name: Optional[str] = None,
    config: Optional[dict] = None
) -> Dict[str, Any]:
    """
    Ensures that the device exists in public.devices before inserting telemetry.
    Uses real device metadata from SQLite or provided parameters.
    Never invents fictitious IDs or pallet mappings.
    """
    client = get_supabase_client()
    if not client:
        return {"success": False, "error": "Supabase client not configured"}

    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

    try:
        # 1. Check if device already exists in Supabase
        res = client.table("devices").select("*").eq("device_id", device_id).execute()
        if res.data and len(res.data) > 0:
            # Update last_seen and online status
            client.table("devices").update({
                "last_seen": now_iso,
                "status": "online"
            }).eq("device_id", device_id).execute()
            return {"success": True, "device": res.data[0], "created": False}

        # 2. Look up real device mapping from SQLite database
        dev_name = name
        real_pallet_id = pallet_id
        dev_config = config or {}

        try:
            from db import get_device_by_id
            existing_sqlite_dev = get_device_by_id(device_id)
            if existing_sqlite_dev:
                dev_name = dev_name or existing_sqlite_dev.get("name")
                real_pallet_id = real_pallet_id or existing_sqlite_dev.get("pallet_id")
                if not dev_config and existing_sqlite_dev.get("config"):
                    raw_cfg = existing_sqlite_dev["config"]
                    dev_config = json.loads(raw_cfg) if isinstance(raw_cfg, str) else raw_cfg
        except Exception as e:
            logger.warning(f"Could not query SQLite for device {device_id}: {e}")

        # Fallback to consistent real identifiers
        if not real_pallet_id:
            real_pallet_id = device_id
        if not dev_name:
            dev_name = f"ESP32 Node {device_id}"

        new_device = {
            "device_id": device_id,
            "name": dev_name,
            "pallet_id": real_pallet_id,
            "status": "online",
            "registered_at": now_iso,
            "last_seen": now_iso,
            "config": dev_config
        }

        insert_res = client.table("devices").insert(new_device).execute()
        created_dev = insert_res.data[0] if insert_res.data else new_device
        return {"success": True, "device": created_dev, "created": True}

    except Exception as e:
        sanitized_err = sanitize_error_message(e)
        logger.error(f"[Supabase Device Error] Failed to ensure device {device_id}: {sanitized_err}")
        return {"success": False, "error": sanitized_err}

def save_telemetry_to_supabase(payload: dict) -> Dict[str, Any]:
    """
    Persists incoming IoT telemetry into public.sensor_data on Supabase.
    Ensures device exists in public.devices first.
    Handles invalid GPS, missing fields, and null/NaN values safely.
    Never exposes credentials or secrets.
    """
    client = get_supabase_client()
    if not client:
        return {"success": False, "saved": False, "reason": "not_configured"}

    device_id = payload.get("deviceId") or payload.get("device_id") or "UNKNOWN"

    # 1. Ensure device exists in public.devices
    dev_ensure = ensure_device_in_supabase(device_id)
    if not dev_ensure.get("success"):
        return {
            "success": False,
            "saved": False,
            "error": f"Device validation failed: {dev_ensure.get('error')}"
        }

    # 2. Extract and sanitize fields safely
    def safe_float(val):
        if val is None:
            return None
        try:
            f = float(val)
            return None if math.isnan(f) else f
        except (ValueError, TypeError):
            return None

    temp = safe_float(payload.get("temperature"))
    hum = safe_float(payload.get("humidity"))

    accel = payload.get("accel") or {}
    accel_x = safe_float(accel.get("x"))
    accel_y = safe_float(accel.get("y"))
    accel_z = safe_float(accel.get("z"))

    gyro = payload.get("gyro") or {}
    gyro_x = safe_float(gyro.get("x"))
    gyro_y = safe_float(gyro.get("y"))
    gyro_z = safe_float(gyro.get("z"))

    gps = payload.get("gps") or {}
    lat = safe_float(gps.get("latitude"))
    lng = safe_float(gps.get("longitude"))
    raw_valid = bool(gps.get("valid"))

    # Validate GPS coordinates:
    # 1. Must have raw_valid == True
    # 2. Coordinates must not be None
    # 3. Exclude Null Island (0,0) indicating no satellite fix
    # 4. Latitude between -90 and 90, Longitude between -180 and 180
    is_gps_valid = (
        raw_valid and
        lat is not None and
        lng is not None and
        not (lat == 0.0 and lng == 0.0) and
        (-90.0 <= lat <= 90.0) and
        (-180.0 <= lng <= 180.0)
    )

    final_lat = lat if is_gps_valid else None
    final_lng = lng if is_gps_valid else None
    
    sats_raw = gps.get("satellites")
    try:
        sats = int(sats_raw) if sats_raw is not None else 0
    except (ValueError, TypeError):
        sats = 0

    mv = bool(payload.get("movementDetected") or payload.get("movement_detected", False))
    shock = bool(payload.get("shockDetected") or payload.get("shock_detected", False))
    gsm = str(payload.get("gsmStatus") or payload.get("gsm_status") or "connected")

    ts = payload.get("timestamp")
    if not ts:
        ts = datetime.datetime.now(datetime.timezone.utc).isoformat()
    elif isinstance(ts, str) and not ts.endswith("Z") and "+" not in ts and "-" not in ts[-6:]:
        ts = ts + "Z"

    record = {
        "device_id": device_id,
        "temperature": temp,
        "humidity": hum,
        "accel_x": accel_x,
        "accel_y": accel_y,
        "accel_z": accel_z,
        "gyro_x": gyro_x,
        "gyro_y": gyro_y,
        "gyro_z": gyro_z,
        "latitude": final_lat,
        "longitude": final_lng,
        "satellites": sats,
        "gps_valid": is_gps_valid,
        "movement_detected": mv,
        "shock_detected": shock,
        "gsm_status": gsm,
        "timestamp": ts,
        "raw_json": payload
    }

    try:
        res = client.table("sensor_data").insert(record).execute()
        inserted_row = res.data[0] if res.data else record
        record_id = inserted_row.get("id")
        return {
            "success": True,
            "saved": True,
            "record_id": record_id,
            "device_id": device_id,
            "timestamp": ts
        }
    except Exception as e:
        sanitized_err = sanitize_error_message(e)
        logger.error(f"[Supabase Ingest Error] Failed to insert telemetry for {device_id}: {sanitized_err}")
        return {
            "success": False,
            "saved": False,
            "error": sanitized_err
        }
