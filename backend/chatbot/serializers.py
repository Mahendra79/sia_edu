from rest_framework import serializers


class ChatHistoryItemSerializer(serializers.Serializer):
    role = serializers.ChoiceField(choices=("user", "assistant"))
    content = serializers.CharField(max_length=2400, trim_whitespace=True)


class ChatRequestSerializer(serializers.Serializer):
    message = serializers.CharField(max_length=1500, trim_whitespace=True)
    course_id = serializers.IntegerField(required=False, allow_null=True, min_value=1)
    history = ChatHistoryItemSerializer(many=True, required=False)

    def validate_message(self, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise serializers.ValidationError("Message cannot be empty.")
        return cleaned


class ChatEvaluationRequestSerializer(serializers.Serializer):
    use_model = serializers.BooleanField(required=False, default=False)
    max_cases = serializers.IntegerField(required=False, min_value=1, max_value=12, default=6)
