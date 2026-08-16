from langchain_openai import ChatOpenAI
from backend.services.embeddings import load_db
import os
from langchain_community.vectorstores import FAISS

llm = ChatOpenAI(  
     model="gpt-4o-mini",   # fast + cheap
    temperature=0,
    streaming=True)

def extract_file_filter(query):
    query_lower = query.lower()

    if "csv" in query_lower:
        return "csv"
    if "docx" in query_lower:
        return "docx"
    if "pdf" in query_lower:
        return "pdf"

    return None

def answer_query(query, db_path):
    # ✅ FIX: check if DB exists
    if not os.path.exists(f"{db_path}/index.faiss"):
        # fallback → no documents yet
        
        def stream():
            yield "⚠️ NO_DOCS\n" 

            for chunk in llm.stream(f"Answer this: {query}"):
                yield chunk.content
        return stream()
    db = FAISS.load_local(
    db_path,
    load_db(db_path).embeddings,
    allow_dangerous_deserialization=True
    )
    file_filter = extract_file_filter(query)
    if file_filter:
        docs = db.similarity_search(query, k=15, filter={"type": file_filter}  )
    else:
        docs = db.similarity_search(query, k=15)
            

    context = "\n".join([d.page_content for d in docs]) if docs else ""
  #  sources = "\n".join([
  #  f"- {doc.page_content[:100]}..."
  #  for doc in docs     ])
    sources = list(set([
    doc.metadata.get("source", "Unknown file").split("/")[-1]
    for doc in docs
    ]))
    prompt = f"""
    You are a smart assistant.

    If answer is in context → use it.
    If NOT → use your own knowledge.
    Answer clearly with formatting:
    - Do NOT use ### or markdown headings
    - Use bullet points
    - Use short paragraphs
    - Add headings if needed
    Context:
    {context}

    Question:
    {query}
    """

    def stream():
        if file_filter:
            yield f"\n🔎 Filter applied: {file_filter}\n\n"
        for chunk in llm.stream(prompt):
            if chunk.content:
                yield chunk.content
                # ✅ Add sources at end
        yield "\n\n📌 Sources:\n" + "\n".join([f"- {s}" for s in sources])
    return stream()