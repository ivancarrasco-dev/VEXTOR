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
        self.admin_connections: List[WebSocket] = []

    def register(self, websocket: WebSocket, role: str = ""):
        """Registra un socket que ya completó el handshake."""
        if websocket not in self.active_connections:
            self.active_connections.append(websocket)
        if role.strip().lower() == "administrador" and websocket not in self.admin_connections:
            self.admin_connections.append(websocket)

    async def connect(self, websocket: WebSocket, role: str = ""):
        """Acepta el handshake y registra la conexión."""
        await websocket.accept()
        self.register(websocket, role)

    def disconnect(self, websocket: WebSocket):
        """Desconecta un cliente"""
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        if websocket in self.admin_connections:
            self.admin_connections.remove(websocket)

    async def broadcast(self, message: dict):
        """Envía un mensaje a todos los clientes conectados"""
        # La telemetría contiene ubicaciones sensibles: solo se retransmite al panel admin.
        for connection in list(self.admin_connections):
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
