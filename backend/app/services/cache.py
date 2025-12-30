"""
Redis Cache Service для кэширования данных и оптимизации производительности
"""
import redis
import json
import logging
from typing import Optional, Any, Dict, List
from functools import wraps
from app.core.config import settings

logger = logging.getLogger(__name__)

# Инициализация Redis клиента
try:
    redis_password = getattr(settings, 'redis_password', '') or None
    redis_client = redis.Redis(
        host=getattr(settings, 'redis_host', 'localhost'),
        port=getattr(settings, 'redis_port', 6379),
        db=getattr(settings, 'redis_db', 0),
        password=redis_password,
        decode_responses=True,
        socket_connect_timeout=5,
        socket_timeout=5,
        retry_on_timeout=True,
        health_check_interval=30
    )
    # Проверка подключения
    redis_client.ping()
    redis_available = True
    logger.info("Redis подключен успешно")
except Exception as e:
    logger.warning(f"Redis недоступен: {e}. Приложение будет работать без кэширования.")
    redis_client = None
    redis_available = False


class CacheService:
    """Сервис для работы с Redis кэшем"""
    
    @staticmethod
    def is_available() -> bool:
        """Проверка доступности Redis"""
        return redis_available and redis_client is not None
    
    @staticmethod
    def get(key: str) -> Optional[Any]:
        """Получить значение из кэша"""
        if not CacheService.is_available():
            return None
        
        try:
            data = redis_client.get(key)
            if data:
                return json.loads(data)
        except Exception as e:
            logger.error(f"Ошибка получения из кэша {key}: {e}")
        return None
    
    @staticmethod
    def set(key: str, value: Any, expire: int = 3600) -> bool:
        """Сохранить значение в кэш"""
        if not CacheService.is_available():
            return False
        
        try:
            redis_client.setex(
                key,
                expire,
                json.dumps(value, default=str)
            )
            return True
        except Exception as e:
            logger.error(f"Ошибка сохранения в кэш {key}: {e}")
            return False
    
    @staticmethod
    def delete(key: str) -> bool:
        """Удалить ключ из кэша"""
        if not CacheService.is_available():
            return False
        
        try:
            redis_client.delete(key)
            return True
        except Exception as e:
            logger.error(f"Ошибка удаления из кэша {key}: {e}")
            return False
    
    @staticmethod
    def delete_pattern(pattern: str) -> int:
        """Удалить все ключи по паттерну"""
        if not CacheService.is_available():
            return 0
        
        try:
            keys = redis_client.keys(pattern)
            if keys:
                return redis_client.delete(*keys)
            return 0
        except Exception as e:
            logger.error(f"Ошибка удаления по паттерну {pattern}: {e}")
            return 0
    
    @staticmethod
    def increment(key: str, amount: int = 1) -> Optional[int]:
        """Увеличить значение на amount"""
        if not CacheService.is_available():
            return None
        
        try:
            return redis_client.incrby(key, amount)
        except Exception as e:
            logger.error(f"Ошибка инкремента {key}: {e}")
            return None
    
    @staticmethod
    def expire(key: str, seconds: int) -> bool:
        """Установить время жизни ключа"""
        if not CacheService.is_available():
            return False
        
        try:
            return redis_client.expire(key, seconds)
        except Exception as e:
            logger.error(f"Ошибка установки TTL для {key}: {e}")
            return False


def cache_result(expire: int = 3600, key_prefix: str = "cache"):
    """
    Декоратор для кэширования результатов функций
    
    Использование:
    @cache_result(expire=1800, key_prefix="daily_meals")
    async def get_daily_meals(user_id: int):
        ...
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Генерация ключа кэша
            cache_key = f"{key_prefix}:{func.__name__}:{hash(str(args) + str(kwargs))}"
            
            # Попытка получить из кэша
            cached = CacheService.get(cache_key)
            if cached is not None:
                return cached
            
            # Выполнение функции
            result = await func(*args, **kwargs)
            
            # Сохранение в кэш
            if result is not None:
                CacheService.set(cache_key, result, expire=expire)
            
            return result
        return wrapper
    return decorator


def invalidate_cache_pattern(pattern: str):
    """
    Декоратор для инвалидации кэша после изменений
    
    Использование:
    @invalidate_cache_pattern("daily_meals:*")
    async def create_meal(...):
        ...
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            result = await func(*args, **kwargs)
            CacheService.delete_pattern(pattern)
            return result
        return wrapper
    return decorator

