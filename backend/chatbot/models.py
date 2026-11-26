from django.db import models
from pgvector.django import VectorField

class DocumentEmbedding(models.Model):
    title = models.CharField(max_length=255, help_text="Source document or reference name (e.g. filename.pdf)")
    chunk_index = models.IntegerField(help_text="Sequence index of the split chunk")
    content = models.TextField(help_text="Grounded text content representing the chunk")
    # dimensions=384 matches the standard HuggingFace all-MiniLM-L6-v2 model
    embedding = VectorField(dimensions=384, help_text="Vector embedding values representing semantic meaning")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'chatbot_document_embedding'
        constraints = [
            models.UniqueConstraint(
                fields=('title', 'chunk_index'),
                name='unique_document_embedding_chunk',
            ),
        ]

    def __str__(self):
        return f"{self.title} [Chunk {self.chunk_index}]"
