from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
import uuid

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

clients = {}
players = {}

@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()
    client_id = str(uuid.uuid4())
    clients[client_id] = ws

    try:
        while True:
            data = await ws.receive_json()

            # Initialize player if new
            if client_id not in players:
                players[client_id] = {
                    "x": data.get("x", 0),
                    "y": data.get("y", 0),
                    "z": data.get("z", 0),
                    "color": data.get("color", 0x000000)
                }
            else:
                # Update only position
                players[client_id]["x"] = data["x"]
                players[client_id]["y"] = data["y"]
                players[client_id]["z"] = data["z"]

            # Broadcast to all clients
            payload = {"players": players}
            for client in clients.values():
                await client.send_json(payload)

    except:
        pass
    finally:
        clients.pop(client_id, None)
        players.pop(client_id, None)
