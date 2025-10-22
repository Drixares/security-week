import { Context, Next } from 'hono';
import { verifyToken } from '../utils/jwt';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

export const authMiddleware = async (c: Context, next: Next) => {
  try {
    const authHeader = c.req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Unauthorized - No token provided' }, 401);
    }

    const token = authHeader.substring(7);

    if (!token) {
      return c.json({ error: 'Unauthorized - Invalid token format' }, 401);
    }

    let decoded;
    try {
      decoded = await verifyToken(token);
    } catch (error) {
      return c.json({error: 'Unauthorized - Invalid or expired token' }, 401);
    }

    const { userId, iat } = decoded

    if (!userId) {
      return c.json({ error: 'Unauthorized - Invalid token payload' }, 401);
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId as string),
      with: {
        role: true
      }
    });

    if (!user) {
      return c.json({ error: 'Unauthorized - User not found' }, 401);
    }

    // Check if user.passwordChangedAt is newer than token.iat
    // If password was changed after token was issued, token is invalid
    if (user.passwordChangedAt && iat) {
      const passwordChangedAtTimestamp = Math.floor(user.passwordChangedAt.getTime() / 1000);
      
      if (passwordChangedAtTimestamp > iat) {
        return c.json({ 
          error: 'Unauthorized - Token invalid due to password change. Please login again.' 
        }, 401);
      }
    }

    // Attach user object (with role) to Hono context
    c.set('user', user);

    await next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return c.json({ error: 'Unauthorized - Authentication failed' }, 401);
  }
};

