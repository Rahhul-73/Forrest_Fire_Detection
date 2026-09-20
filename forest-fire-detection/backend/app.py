import asyncio
import time
import math
import random
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, UploadFile, File, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from detector import detector
from spread_model import spread_model
from risk_zones import risk_generator
from lora_service import lora_service
from websocket_manager import manager

app = FastAPI(
    title="FireSense Command Center API",
    description="Backend API providing YOLOv8 fire detection, Rothermel fire spread simulation, spatial risk heatmap, and LoRa mesh telemetry.",
    version="2.4.0"
)

# CORS allow all
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AlertRequest(BaseModel):
    message: str

SAMPLE_ALERTS = [
    {
        "id": "ALT-9081",
        "timestamp": "2m ago",
        "severity": "EXTREME",
        "zone": "Ridge Sector Alpha",
        "message": "Confirmed fire outbreak verified via 3/5 temporal frame filter (Confidence 92%).",
        "acknowledged": False
    },
    {
        "id": "ALT-9078",
        "timestamp": "8m ago",
        "severity": "HIGH",
        "zone": "North Canyon Sector",
        "message": "Thermal spike 44.5°C & high smoke concentration.",
        "acknowledged": True
    },
    {
        "id": "ALT-9075",
        "timestamp": "18m ago",
        "severity": "HIGH",
        "zone": "Timber Pass Sector",
        "message": "LoRa node 05 lost connection (Low battery 18%).",
        "acknowledged": False
    }
]

@app.get("/")
def read_root():
    return {
        "system": "FireSense Command Center API",
        "status": "OPERATIONAL",
        "yolo_detector_active": True,
        "timestamp": time.time()
    }

@app.get("/api/health")
def health_check():
    return {"status": "ok", "timestamp": time.time()}

@app.get("/api/lora/nodes")
def get_lora_nodes():
    return lora_service.get_nodes()

@app.get("/api/lora/messages")
def get_lora_messages():
    return lora_service.get_messages()

@app.post("/api/lora/alert")
def send_lora_alert(req: AlertRequest):
    if not req.message:
        raise HTTPException(status_code=400, detail="Alert message string required.")
    return lora_service.send_alert(req.message)

@app.get("/api/risk/zones")
def get_risk_zones(
    lat: float = Query(12.97, description="Center Latitude"),
    lon: float = Query(77.59, description="Center Longitude")
):
    gen = risk_generator
    gen.grid_size = 7
    return gen.generate(center_lat=lat, center_lon=lon)

@app.get("/api/spread/simulate")
def simulate_spread(
    lat: float = Query(12.97, description="Ignition Latitude"),
    lon: float = Query(77.59, description="Ignition Longitude"),
    wind: float = Query(25.0, description="Wind speed in km/h"),
    dir: float = Query(45.0, description="Wind direction in degrees"),
    slope: float = Query(15.0, description="Slope angle in degrees"),
    fuel: float = Query(1.2, description="Fuel factor multiplier")
):
    return spread_model.simulate(
        ignition_lat=lat,
        ignition_lon=lon,
        wind_speed_kmh=wind,
        wind_dir_deg=dir,
        slope_deg=slope,
        fuel_factor=fuel,
        hours=[0.5, 1.0, 3.0, 6.0]
    )

@app.get("/api/alerts")
def get_alerts():
    """GET /api/alerts -> 3 sample alerts with severity, zone, message, timestamp, confidence."""
    now = time.time()
    return {
        "alerts": [
            {
                "id": 1,
                "severity": "EXTREME",
                "zone": "Ridge Sector Alpha",
                "message": "Confirmed fire outbreak verified via 3/5 temporal frame filter (Confidence 92%).",
                "timestamp": now - 120,
                "confidence": 0.92
            },
            {
                "id": 2,
                "severity": "HIGH",
                "zone": "North Canyon Sector",
                "message": "Thermal spike 44.5°C & high smoke concentration.",
                "timestamp": now - 480,
                "confidence": 0.85
            },
            {
                "id": 3,
                "severity": "HIGH",
                "zone": "Timber Pass Sector",
                "message": "LoRa node 05 lost connection (Low battery 18%).",
                "timestamp": now - 1080,
                "confidence": 0.78
            }
        ]
    }

@app.websocket("/ws/live")
async def websocket_live_stream(websocket: WebSocket):
    await manager.connect(websocket)
    frame_count = 0

    try:
        while True:
            frame_count += 1
            detection_payload = detector.detect(image_bytes=None)
            nodes_payload = lora_service.get_nodes()

            packet = {
                "type": "LIVE_DETECTION_UPDATE",
                "frame_count": frame_count,
                "timestamp": time.time(),
                "camera_id": "TOWER-ALPHA",
                "detection": detection_payload,
                "nodes": nodes_payload
            }

            await websocket.send_json(packet)
            await asyncio.sleep(2.0)

    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        print(f"[WebSocket] Disconnected: {e}")
        manager.disconnect(websocket)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
