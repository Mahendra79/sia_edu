from django.core.management.base import BaseCommand
from chatbot.rag_service import rag_pipeline

class Command(BaseCommand):
    help = "Scan the codebase repository, chunk files, generate embeddings, and build the local RAG vector store."

    def handle(self, *args, **options):
        self.stdout.write("Starting repository indexing...")
        stats = rag_pipeline.index_repository()
        self.stdout.write(self.style.SUCCESS(
            f"Successfully indexed repository!\n"
            f"Total Chunks: {stats['total_chunks']}\n"
            f"Dense Vector Embeddings: {stats['dense_indexed']}\n"
            f"Vocabulary Size: {stats['vocabulary_size']}"
        ))
