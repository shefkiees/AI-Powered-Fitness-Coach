const store = new Map();

function consumeRateLimit({ key, limit, windowMs, now = Date.now() }) {
  const bucket = store.get(key);

  if (!bucket || bucket.resetAt <= now) {
    const next = {
      count: 1,
      resetAt: now + windowMs,
      windowStart: now,
    };
    store.set(key, next);
    return {
      ok: true,
      remaining: Math.max(0, limit - next.count),
      retryAfterMs: 0,
      requestCount: next.count,
      windowStart: next.windowStart,
    };
  }

  if (bucket.count >= limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfterMs: Math.max(0, bucket.resetAt - now),
      requestCount: bucket.count,
      windowStart: bucket.windowStart,
    };
  }

  bucket.count += 1;
  store.set(key, bucket);

  return {
    ok: true,
    remaining: Math.max(0, limit - bucket.count),
    retryAfterMs: 0,
    requestCount: bucket.count,
    windowStart: bucket.windowStart,
  };
}

function resetRateLimitStore() {
  store.clear();
}

module.exports = {
  consumeRateLimit,
  resetRateLimitStore,
};
