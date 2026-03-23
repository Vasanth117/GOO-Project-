from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from typing import List, Dict
from app.controllers import chat_controller
from app.middleware.auth_middleware import get_current_user
from app.models.user import User
from app.utils.response_utils import success_response, error_response
from app.middleware.ws_manager import manager
import json

router = APIRouter(prefix="/messages", tags=["Chat / Messaging"])

@router.get("/inbox", summary="Get conversational inbox for user")
async def get_inbox(current_user: User = Depends(get_current_user)):
    try:
        result = await chat_controller.get_inbox(current_user)
        return success_response(result)
    except Exception as e:
        return error_response(str(e))

@router.get("/chat/{receiver_id}", summary="Get message history with a specific user")
async def get_history(receiver_id: str, current_user: User = Depends(get_current_user)):
    try:
        result = await chat_controller.get_history(current_user, receiver_id)
        return success_response(result)
    except Exception as e:
        return error_response(str(e))

@router.post("/send", summary="Send a direct message")
async def send_message(receiver_id: str, content: str, current_user: User = Depends(get_current_user)):
    try:
        result = await chat_controller.send_message(current_user, receiver_id, content)
        return success_response(result)
    except Exception as e:
        return error_response(str(e))

# ── WEB SOCKET ENDPOINT ──
@router.websocket("/ws/{user_id}")
async def websocket_chat(websocket: WebSocket, user_id: str):
    await manager.connect(user_id, websocket)
    try:
        while True:
            # We don't necessarily need to receive text via WS yet
            # Most real-time logic will be push-based from the server
            data = await websocket.receive_text()
            # Handle heartbeat if needed
    except WebSocketDisconnect:
        manager.disconnect(user_id)
