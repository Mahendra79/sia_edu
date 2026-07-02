import logging
import hashlib
from django.conf import settings
from django.core.cache import cache

logger = logging.getLogger(__name__)

class GeminiKeyRotationManager:
    """
    Manages a pool of Gemini API keys, rotating them when rate-limiting/quota errors occur.
    Utilizes Django cache to share the active key index and track rate-limited keys
    across worker threads/processes.
    """
    CACHE_KEY_INDEX = "gemini_active_key_index"
    CACHE_KEY_COOLDOWN_PREFIX = "gemini_key_cooldown_"
    COOLDOWN_DURATION = 120  # Cooldown duration in seconds when rate-limited

    @classmethod
    def get_keys(cls) -> list[str]:
        return getattr(settings, "GEMINI_API_KEYS", [])

    @classmethod
    def get_active_key_index(cls) -> int:
        try:
            return int(cache.get(cls.CACHE_KEY_INDEX, 0))
        except (ValueError, TypeError):
            return 0

    @classmethod
    def set_active_key_index(cls, index: int):
        try:
            cache.set(cls.CACHE_KEY_INDEX, index, timeout=None)
        except Exception as exc:
            logger.warning(f"Failed to set active Gemini key index in cache: {exc}")

    @classmethod
    def _get_key_hash(cls, key: str) -> str:
        return hashlib.md5(key.encode("utf-8")).hexdigest()

    @classmethod
    def mark_key_rate_limited(cls, key: str):
        key_hash = cls._get_key_hash(key)
        cache_key = f"{cls.CACHE_KEY_COOLDOWN_PREFIX}{key_hash}"
        logger.warning(
            f"Gemini API Key (hash: {key_hash[:8]}...) has been marked as rate limited/cooling down for {cls.COOLDOWN_DURATION}s."
        )
        try:
            cache.set(cache_key, True, timeout=cls.COOLDOWN_DURATION)
        except Exception as exc:
            logger.warning(f"Failed to set Gemini key cooldown in cache: {exc}")

    @classmethod
    def is_key_rate_limited(cls, key: str) -> bool:
        key_hash = cls._get_key_hash(key)
        cache_key = f"{cls.CACHE_KEY_COOLDOWN_PREFIX}{key_hash}"
        try:
            return bool(cache.get(cache_key, False))
        except Exception as exc:
            logger.warning(f"Failed to check Gemini key cooldown in cache: {exc}")
            return False

    @classmethod
    def get_next_available_key(cls) -> tuple[str, int]:
        """
        Returns the next available API key and its index from the key pool.
        Skips keys that are currently cooling down.
        """
        keys = cls.get_keys()
        if not keys:
            raise ValueError("No Gemini API keys configured.")

        num_keys = len(keys)
        start_index = cls.get_active_key_index() % num_keys

        # Try to find a key starting from the last active index
        for i in range(num_keys):
            idx = (start_index + i) % num_keys
            candidate_key = keys[idx]
            if not cls.is_key_rate_limited(candidate_key):
                # Update active index if we changed it
                if idx != start_index:
                    cls.set_active_key_index(idx)
                return candidate_key, idx

        # If all keys are rate limited, fall back to the last active key anyway
        logger.error("All Gemini API keys are currently rate-limited/cooling down. Falling back to default active key.")
        return keys[start_index], start_index
