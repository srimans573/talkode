import os
import redis.asyncio as redis

_client: redis.Redis | None = None


def get_redis() -> redis.Redis:
    global _client
    if _client is None:
        _client = redis.from_url(os.environ["REDIS_URL"], decode_responses=True)
    return _client


async def ping() -> bool:
    return await get_redis().ping()
