from rest_framework import generics

from accounts.permissions import IsAdminUserRole
from deleted_records.models import DeletedRecord
from deleted_records.serializers import DeletedRecordSerializer


class DeletedRecordsListView(generics.ListAPIView):
    permission_classes = [IsAdminUserRole]
    serializer_class = DeletedRecordSerializer
    queryset = DeletedRecord.objects.select_related("deleted_by").all()

