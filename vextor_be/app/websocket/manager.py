"""
WebSocket Connection Manager
Gestiona conexiones activas para broadcast de mensajes
"""
from typing import List
from fastapi import WebSocket


class ConnectionManager:
    """Gestor de conexiones WebSocket"""

    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        """Acepta una nueva conexión"""
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        """Desconecta un cliente"""
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        """Envía un mensaje a todos los clientes conectados"""
        for connection in list(self.active_connections):
            try:
                await connection.send_json(message)
            except Exception:
                self.disconnect(connection)

    async def send_personal(self, websocket: WebSocket, message: dict):
        """Envía un mensaje a un cliente específico"""
        try:
            await websocket.send_json(message)
        except Exception:
            self.disconnect(websocket)
