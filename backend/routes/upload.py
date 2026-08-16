from fastapi import APIRouter, UploadFile, Form
from backend.services.loader import load_file
from backend.services.chunking import split_docs
from backend.services.embeddings import create_or_update_db
from backend.services.session_manager import get_session_path
import os,shutil

os.makedirs("temp", exist_ok=True)
router = APIRouter()

@router.post("/upload")
async def upload(file: UploadFile, session_id: str = Form(...)):
    print("📂 Upload started")
    print("File:", file.filename)
    print("Session:", session_id)
    
    os.makedirs("temp", exist_ok=True)

    path = f"temp/{session_id}_{file.filename}"

    
    
    with open(path, "wb") as f:
        f.write(await file.read())
    print("✅ File saved:", path)
    print("Uploading file:", file.filename)
    print("Session ID:", session_id)
    docs = load_file(path)
    print("📄 Docs loaded:", len(docs))
    for doc in docs:
     doc.metadata = {
            "source": file.filename,
            "type": file.filename.split(".")[-1].lower(),
            "session_id":session_id
        }
    if not docs:
        return {"error": "File not loaded properly"}
    chunks = split_docs(docs)
    for chunk in chunks:
        chunk.metadata = {
            "source": file.filename,
            "type": file.filename.split(".")[-1].lower(),
            "session_id": session_id
        }
    print("✂️ Chunks created:", len(chunks))

    db_path = get_session_path(session_id)
    # 🔥 IMPORTANT: Clear old DB if exists (fresh session)
 #   if os.path.exists(db_path):
#            shutil.rmtree(db_path)

    os.makedirs(db_path, exist_ok=True)
    index_path = os.path.join(db_path, "index.faiss")
    print("📦 DB path:", db_path)

    create_or_update_db(chunks, db_path)

    print("✅ DB created successfully!")

    return {"status": "uploaded", "session_id": session_id}