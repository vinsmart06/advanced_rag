import os


BASE_PATH = os.path.join(os.getcwd(), "db")

def get_session_path(session_id: str):
   
    path = os.path.join(BASE_PATH, session_id)
    os.makedirs(path, exist_ok=True)
    return path