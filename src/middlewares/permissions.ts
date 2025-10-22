import { Context, Next } from 'hono';
import { Role, User } from '../db/schema';

/**
 * Middleware factory that creates a middleware to check if a user has a specific permission
 * @param permissionName - The name of the permission to check (e.g., 'canGetUsers', 'canGetMyUser')
 * @returns Middleware function that checks the permission
 */
export const requirePermission = (permissionName: keyof Role) => {
  return async (c: Context, next: Next) => {
    try {
      // Get user from context (should be set by authMiddleware)
      const user = c.get('user') as (User & { role: Role | null }) | undefined;

      // Check if user exists in context
      if (!user) {
        return c.json({ error: 'Unauthorized - User not found in context' }, 401);
      }

      // Check if user has a role assigned
      if (!user.role) {
        return c.json({ 
          error: 'Forbidden - No role assigned to user' 
        }, 403);
      }

      // Check if the role has the required permission
      const hasPermission = user.role[permissionName];

      if (!hasPermission) {
        return c.json({ 
          error: `Forbidden - Insufficient permissions (requires ${permissionName})` 
        }, 403);
      }

      // Permission granted, proceed to next middleware/handler
      await next();
    } catch (error) {
      console.error('Permission middleware error:', error);
      return c.json({ error: 'Internal server error during permission check' }, 500);
    }
  };
};

