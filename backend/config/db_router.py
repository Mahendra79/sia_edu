class VectorDatabaseRouter:
    """
    Routes chatbot app operations exclusively to 'vector_db' (Neon), 
    and all other app operations to 'default' (Supabase).
    """
    def db_for_read(self, model, **hints):
        if model._meta.app_label == 'chatbot':
            return 'vector_db'
        return 'default'

    def db_for_write(self, model, **hints):
        if model._meta.app_label == 'chatbot':
            return 'vector_db'
        return 'default'

    def allow_relation(self, obj1, obj2, **hints):
        # Disable relations between Supabase and Neon
        return None

    def allow_migrate(self, db, app_label, model_name=None, **hints):
        # Only migrate 'chatbot' app migrations to Neon (vector_db)
        if app_label == 'chatbot':
            return db == 'vector_db'
        # Migrate all other apps only to Supabase (default)
        return db == 'default'
