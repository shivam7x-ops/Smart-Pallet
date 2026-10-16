from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List

class AccelData(BaseModel):
    x: Optional[float] = None
    y: Optional[float] = None
    z: Optional[float] = None

class GyroData(BaseModel):
    x: Optional[float] = None
    y: Optional[float] = None
    z: Optional[float] = None

class GPSData(BaseModel):
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    satellites: Optional[int] = 0
    valid: Optional[bool] = False

class IoTDataPayload(BaseModel):
    deviceId: Optional[str] = Field(None, alias="device_id")
    temperature: Optional[float] = None
    humidity: Optional[float] = None
    accel: Optional[AccelData] = None
    gyro: Optional[GyroData] = None
    gps: Optional[GPSData] = None
    movementDetected: Optional[bool] = Field(False, alias="movement_detected")
    shockDetected: Optional[bool] = Field(False, alias="shock_detected")
    gsmStatus: Optional[str] = Field("connected", alias="gsm_status")
    timestamp: Optional[str] = None

    class Config:
        populate_by_name = True

class DeviceRegisterRequest(BaseModel):
    device_id: str
    name: str
    pallet_id: str
    token: Optional[str] = None
    config: Optional[Dict[str, Any]] = None

class DeviceCommandRequest(BaseModel):
    command: str
    parameters: Optional[Dict[str, Any]] = None
