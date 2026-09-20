import json
from typing import List
from fastapi import WebSocket, WebSocketDisconnect

class ConnectionManager:
    """Manages active WebSocket connections and handles JSON broadcasts."""
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        print(f"[ConnectionManager] Client connected. Total active: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            print(f"[ConnectionManager] Client disconnected. Total active: {len(self.active_connections)}")

    async def broadcast(self, data: dict):
        for connection in list(self.active_connections):
            try:
                await connection.send_json(data)
            except (WebSocketDisconnect, Exception) as e:
                print(f"[ConnectionManager] Dropping dead connection: {e}")
                self.disconnect(connection)

manager = ConnectionManager()
