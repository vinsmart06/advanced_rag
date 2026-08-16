from fastapi import APIRouter
from fastapi.responses import StreamingResponse,JSONResponse
from backend.services.rag import answer_query
from backend.services.session_manager import get_session_path
import os
router = APIRouter()

@router.get("/ask")
def ask(query: str, session_id: str):
    db_path = get_session_path(session_id)
    index_file = os.path.join(db_path, "index.faiss")

    if not os.path.exists(index_file):
       return StreamingResponse(
        answer_query(query, db_path),   # fallback handled inside
        media_type="text/event-stream"
    )
    return StreamingResponse(
        answer_query(query, db_path),
        media_type="text/event-stream"  # 🔥 important
    )