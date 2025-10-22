import { Context, Next } from 'hono';

// In-memory store to track last login attempt per email
const loginAttempts = new Map<string, number>();

// Rate limit configuration
const RATE_LIMIT_WINDOW = 5000; // 5 seconds in milliseconds

/**
 * Rate limiting middleware for login attempts
 * Prevents the same email from attempting login more than once every 5 seconds
 */
export const rateLimitMiddleware = async (c: Context, next: Next) => {
  // Get email from request body
  const body = await c.req.json();
  const email = body?.email;

  if (!email) {
    return c.json({ error: 'Email is required' }, 400);
  }

  const now = Date.now();
  const lastAttempt = loginAttempts.get(email);

  // Check if last attempt was less than 5 seconds ago
  if (lastAttempt && (now - lastAttempt) < RATE_LIMIT_WINDOW) {
    const remainingTime = Math.ceil((RATE_LIMIT_WINDOW - (now - lastAttempt)) / 1000);
    return c.json(
      { 
        error: 'Too many login attempts. Please try again later.',
        retryAfter: remainingTime
      }, 
      429
    );
  }

  // Update timestamp for this email
  loginAttempts.set(email, now);

  // Cleanup old entries (optional: prevent memory leaks)
  // Remove entries older than the rate limit window
  const cutoffTime = now - RATE_LIMIT_WINDOW;
  for (const [storedEmail, timestamp] of loginAttempts.entries()) {
    if (timestamp < cutoffTime) {
      loginAttempts.delete(storedEmail);
    }
  }

  // Continue to next middleware/handler
  await next();
};

