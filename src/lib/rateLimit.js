/**
 * Simple in-memory sliding-window rate limiter for public API routes.
 * 
 * NOTE: For serverless / multi-instance deployments, in-memory rate limiting
 * provides best-effort protection per instance. For global enterprise guarantees,
 * an external store like Redis (e.g. Upstash) would be used.
 */

// Map of routeKey:clientIp -> array of timestamps
const hitMap = new Map();

// Periodic cleanup every 5 minutes to prevent memory leaks
let lastCleanup = Date.now();
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

function cleanupExpiredHits(windowMs) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  for (const [key, timestamps] of hitMap.entries()) {
    const validTimestamps = timestamps.filter((t) => now - t < windowMs);
    if (validTimestamps.length === 0) {
      hitMap.delete(key);
    } else {
      hitMap.set(key, validTimestamps);
    }
  }
}

/**
 * Extracts the best client IP address from standard request headers.
 */
export function getClientIp(request) {
  try {
    const forwarded = request.headers.get("x-forwarded-for");
    if (forwarded) {
      return forwarded.split(",")[0].trim();
    }
    const realIp = request.headers.get("x-real-ip");
    if (realIp) {
      return realIp.trim();
    }
    const cfConnectingIp = request.headers.get("cf-connecting-ip");
    if (cfConnectingIp) {
      return cfConnectingIp.trim();
    }
  } catch {}
  return "127.0.0.1";
}

/**
 * Checks if a request exceeds the specified rate limit.
 * 
 * @param {Request} request Next.js request
 * @param {string} routeName Identifier for the route (e.g. "analyze", "ocr")
 * @param {number} maxRequests Maximum allowed requests in the time window (default: 20)
 * @param {number} windowMs Time window in milliseconds (default: 60,000 = 1 min)
 * 
 * @returns {{ allowed: boolean, remaining: number, retryAfterSec: number }}
 */
export function checkRateLimit(request, routeName = "default", maxRequests = 20, windowMs = 60000) {
  cleanupExpiredHits(windowMs);

  const ip = getClientIp(request);
  const key = `${routeName}:${ip}`;
  const now = Date.now();

  const timestamps = hitMap.get(key) || [];
  // Keep only timestamps within current sliding window
  const windowStart = now - windowMs;
  const activeTimestamps = timestamps.filter((t) => t > windowStart);

  if (activeTimestamps.length >= maxRequests) {
    // Oldest hit in the current window determines retry-after
    const oldest = activeTimestamps[0];
    const retryAfterMs = Math.max(1000, oldest + windowMs - now);
    const retryAfterSec = Math.ceil(retryAfterMs / 1000);

    return {
      allowed: false,
      remaining: 0,
      retryAfterSec,
    };
  }

  activeTimestamps.push(now);
  hitMap.set(key, activeTimestamps);

  return {
    allowed: true,
    remaining: maxRequests - activeTimestamps.length,
    retryAfterSec: 0,
  };
}

/**
 * Generates a standard HTTP 429 Too Many Requests response.
 */
export function createRateLimitResponse(retryAfterSec = 60) {
  return new Response(
    JSON.stringify({
      error: `Rate limit exceeded. Please slow down and try again in ${retryAfterSec} seconds.`,
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(retryAfterSec),
      },
    }
  );
}
