from langchain_community.vectorstores import FAISS
from langchain_openai import OpenAIEmbeddings
import os
from dotenv import load_dotenv
load_dotenv()
embedding = OpenAIEmbeddings(
    openai_api_key = os.getenv("OPENAI_API_KEY")
)

def create_or_update_db(chunks, db_path):
    print("Creating DB at:", db_path)
    index_path = os.path.join(db_path, "index.faiss")
    if os.path.exists(index_path):
        print("Loading existing DB...")
        db = FAISS.load_local(db_path, embedding,allow_dangerous_deserialization=True)
        print(f"➕ Adding {len(chunks)} new chunks...")
        db.add_documents(chunks)
    else:
        print("Creating new DB...")
        db = FAISS.from_documents(chunks, embedding)

    db.save_local(db_path)
    print("DB saved successfully!")
    print("📊 Total docs in DB:", len(db.docstore._dict))
def load_db(db_path):
        return FAISS.load_local(
        db_path,
        embedding,
        allow_dangerous_deserialization=True
    )
