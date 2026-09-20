import time
import random
from typing import List, Dict, Any

INITIAL_NODES: List[Dict[str, Any]] = [
    {
        "id": "node-01",
        "name": "Ridge Lookout",
        "lat": 37.7780,
        "lon": -122.4220,
        "battery": 82.0,
        "rssi": -68.0,
        "snr": 9.5,
        "online": True,
        "last_seen": time.strftime("%H:%M:%S UTC", time.gmtime())
    },
    {
        "id": "node-02",
        "name": "North Canyon",
        "lat": 37.7810,
        "lon": -122.4150,
        "battery": 94.0,
        "rssi": -74.0,
        "snr": 8.2,
        "online": True,
        "last_seen": time.strftime("%H:%M:%S UTC", time.gmtime())
    },
    {
        "id": "node-03",
        "name": "Pine Valley",
        "lat": 37.7710,
        "lon": -122.4280,
        "battery": 78.0,
        "rssi": -82.0,
        "snr": 6.8,
        "online": True,
        "last_seen": time.strftime("%H:%M:%S UTC", time.gmtime())
    },
    {
        "id": "node-04",
        "name": "Lake Reserve",
        "lat": 37.7680,
        "lon": -122.4110,
        "battery": 91.0,
        "rssi": -55.0,
        "snr": 11.4,
        "online": True,
        "last_seen": time.strftime("%H:%M:%S UTC", time.gmtime())
    },
    {
        "id": "node-05",
        "name": "Timber Pass",
        "lat": 37.7840,
        "lon": -122.4260,
        "battery": 18.0,
        "rssi": -114.0,
        "snr": 1.2,
        "online": False,
        "last_seen": time.strftime("%H:%M:%S UTC", time.gmtime(time.time() - 3600))
    },
    {
        "id": "node-06",
        "name": "East Summit",
        "lat": 37.7760,
        "lon": -122.4040,
        "battery": 86.0,
        "rssi": -64.0,
        "snr": 10.1,
        "online": True,
        "last_seen": time.strftime("%H:%M:%S UTC", time.gmtime())
    },
    {
        "id": "node-07",
        "name": "South Creek",
        "lat": 37.7630,
        "lon": -122.4190,
        "battery": 69.0,
        "rssi": -88.0,
        "snr": 5.4,
        "online": True,
        "last_seen": time.strftime("%H:%M:%S UTC", time.gmtime())
    },
    {
        "id": "node-08",
        "name": "Watchtower Bravo",
        "lat": 37.7790,
        "lon": -122.4330,
        "battery": 89.0,
        "rssi": -71.0,
        "snr": 8.9,
        "online": True,
        "last_seen": time.strftime("%H:%M:%S UTC", time.gmtime())
    }
]

class LoRaService:
    def __init__(self):
        self.nodes = {n["id"]: dict(n) for n in INITIAL_NODES}
        self.messages: List[Dict[str, Any]] = [
            {
                "id": "msg-001",
                "payload": "SYSTEM_INIT: 868 MHz LoRa Gateway Listening...",
                "timestamp": time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime(time.time() - 600)),
                "delivered": True,
                "hops": 1,
                "airtime_ms": 48
            }
        ]

    def get_nodes(self) -> List[Dict[str, Any]]:
        now_str = time.strftime("%H:%M:%S UTC", time.gmtime())
        res = []

        for node_id, data in self.nodes.items():
            if data["online"]:
                data["battery"] = round(max(0.0, data["battery"] - 0.005), 2)
                data["rssi"] = round(max(-120.0, min(-40.0, data["rssi"] + random.uniform(-1.5, 1.5))), 1)
                data["snr"] = round(max(-5.0, min(15.0, data["snr"] + random.uniform(-0.3, 0.3))), 1)
                data["last_seen"] = now_str
                
                # 5% chance node drops offline temporarily
                if random.random() < 0.05 and node_id == "node-05":
                    data["online"] = False
            else:
                # 20% chance offline node reconnects
                if random.random() < 0.20:
                    data["online"] = True
                    data["rssi"] = -90.0
                    data["snr"] = 5.0
                    data["last_seen"] = now_str

            res.append(dict(data))

        return res

    def send_alert(self, message: str) -> Dict[str, Any]:
        msg_id = f"msg-{int(time.time() * 1000) % 100000:05d}"
        now_str = time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime())
        hops = random.randint(1, 3)
        airtime_ms = random.randint(45, 180)

        alert_packet = {
            "id": msg_id,
            "payload": message,
            "timestamp": now_str,
            "delivered": True,
            "hops": hops,
            "airtime_ms": airtime_ms
        }

        self.messages.insert(0, alert_packet)
        # Keep last 20 messages
        if len(self.messages) > 20:
            self.messages = self.messages[:20]

        return alert_packet

    def get_messages(self) -> List[Dict[str, Any]]:
        return self.messages

lora_service = LoRaService()
