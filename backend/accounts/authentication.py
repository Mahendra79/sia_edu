from django.core.exceptions import MultipleObjectsReturned
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import AuthenticationFailed


class SafeJWTAuthentication(JWTAuthentication):
    def get_user(self, validated_token):
        try:
            return super().get_user(validated_token)
        except MultipleObjectsReturned:
            raise AuthenticationFailed(
                "User data is inconsistent. Please contact support.",
                code="user_inconsistent",
            )
