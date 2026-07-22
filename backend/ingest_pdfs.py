import os
import sys
import django
import PyPDF2

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from langchain_huggingface import HuggingFaceEmbeddings
from chatbot.models import DocumentEmbedding

# 1. Setup PDF Directory
PDF_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "documents")

# 2. Setup SentenceTransformers Embeddings Client
# all-MiniLM-L6-v2 is a highly efficient 384-dimension local model.
print("Initializing sentence-transformers embedding model (all-MiniLM-L6-v2)...")
embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

def split_text_manually(text, chunk_size=750, overlap=100):
    """
    Splits text into chunks of chunk_size with overlap characters using a sliding window.
    """
    chunks = []
    if not text:
        return chunks
        
    start = 0
    text_len = len(text)
    while start < text_len:
        end = start + chunk_size
        chunk = text[start:end]
        chunks.append(chunk)
        start += (chunk_size - overlap)
        # Prevent infinite loops in case configuration is broken
        if chunk_size <= overlap:
            break
    return chunks

def ingest():
    if not os.path.exists(PDF_DIR):
        print(f"Creating directory: {PDF_DIR}")
        os.makedirs(PDF_DIR)
        print("Please place your PDF files inside the 'documents' folder and run this script again.")
        return

    pdf_files = [f for f in os.listdir(PDF_DIR) if f.endswith(".pdf")]
    if not pdf_files:
        print(f"No PDF files found in: {PDF_DIR}")
        return

    for file_name in pdf_files:
        file_path = os.path.join(PDF_DIR, file_name)
        print(f"Processing document: {file_name}...")

        try:
            # 1. Read PDF text directly using PyPDF2
            text_content = ""
            with open(file_path, "rb") as f:
                reader = PyPDF2.PdfReader(f)
                for page in reader.pages:
                    text_content += page.extract_text() or ""

            # 2. Split pages into semantic chunks manually
            chunks = split_text_manually(text_content, chunk_size=750, overlap=100)
            print(f"Extracted {len(chunks)} text chunks. Generating local embeddings...")

            for i, chunk_text in enumerate(chunks):
                chunk_text = chunk_text.strip()
                if not chunk_text:
                    continue

                # Generate 384-dimension semantic vector locally
                try:
                    vector = embeddings.embed_query(chunk_text)
                except Exception as e:
                    print(f"Embedding Generation failed: {e}")
                    return

                # Save directly to Neon (vector_db database)
                entry = DocumentEmbedding(
                    title=file_name,
                    chunk_index=i,
                    content=chunk_text,
                    embedding=vector
                )
                entry.save(using='vector_db')

            print(f"SUCCESS: Split and loaded {len(chunks)} vectors for '{file_name}' to Neon database!")
        except Exception as e:
            print(f"Failed to process '{file_name}': {e}")

if __name__ == "__main__":
    ingest()
