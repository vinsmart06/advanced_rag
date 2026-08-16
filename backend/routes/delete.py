from fastapi import APIRouter
import shutil
import os
from backend.services.session_manager import get_session_path
from backend.services.embeddings import load_db
from langchain_community.vectorstores import FAISS

router = APIRouter()

@router.delete("/delete_session")
def delete_session(session_id: str):
    db_path = os.path.join(os.getcwd(), "db", session_id)

    if os.path.exists(db_path):
        shutil.rmtree(db_path)   # 🔥 delete DB folder

         # 🔥 Delete temp files for this session
    temp_dir = "temp"

    if os.path.exists(temp_dir):
        for f in os.listdir(temp_dir):
            if f.startswith(session_id):
                os.remove(os.path.join(temp_dir, f))   
                
    else:
        return {"status": "not_found"}
    
    return {"status": "deleted"}

@router.post("/delete_file")
async def delete_file(data: dict):
    session_id = data.get("session_id")
    file_name = data.get("file_name")

    db_path = get_session_path(session_id)
    file_path = f"temp/{session_id}_{file_name}"

    print("🗑️ Deleting file:", file_name)
    print("Session:", session_id)

    # ✅ STEP 1: delete file from temp
    if os.path.exists(file_path):
        os.remove(file_path)
        print("✅ File removed from temp")

    # ✅ STEP 2: check DB exists
    index_path = os.path.join(db_path, "index.faiss")
    if not os.path.exists(index_path):
        return {"status": "no db found"}

    # ✅ STEP 3: load existing DB
    db = load_db(db_path)

    # ✅ STEP 4: get all documents
    all_docs = list(db.docstore._dict.values())
    print("📄 ALL DOC SOURCES:")
    for d in all_docs[:10]:
        print(d.metadata)
    print("📄 Total docs before delete:", len(all_docs))

    # ✅ STEP 5: filter out deleted file docs
    remaining_docs = [
        doc for doc in all_docs
        if doc.metadata.get("source") != file_name
    ]

    print("📄 Remaining docs after delete:", len(remaining_docs))

    # ✅ STEP 6: if no docs left → delete DB
    if not remaining_docs:
        import shutil
        shutil.rmtree(db_path)
        print("🧹 All docs deleted → DB removed")
        return {"status": "all documents deleted"}

    # ✅ STEP 7: rebuild FAISS
    new_db = FAISS.from_documents(remaining_docs, db.embeddings)
    print("🔁 Rebuilding FAISS with:", len(remaining_docs), "docs")
    # ✅ STEP 8: overwrite DB
    new_db.save_local(db_path)

    print("✅ FAISS rebuilt successfully")

    return {"status": "file deleted + DB updated"}