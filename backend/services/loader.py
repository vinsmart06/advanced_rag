from langchain_community.document_loaders import (
    PyPDFLoader, Docx2txtLoader, CSVLoader, UnstructuredExcelLoader
)
import requests
from bs4 import BeautifulSoup

def load_file(path):
    if path.endswith(".pdf"):
        return PyPDFLoader(path).load()

    elif path.endswith(".docx"):
        return Docx2txtLoader(path).load()

    elif path.endswith(".csv"):
        return CSVLoader(path).load()

    elif path.endswith(".xlsx"):
        return UnstructuredExcelLoader(path).load()

    return []

def load_web(url):
    html = requests.get(url).text
    soup = BeautifulSoup(html, "html.parser")
    return soup.get_text()