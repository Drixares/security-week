import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { authMiddleware, requirePermission } from '../middlewares/auth';
import { db } from '../db';
import { users } from '../db/schema';
import { changePasswordSchema } from '../validators/schemas';
import { comparePassword, hashPassword } from '../utils/password';
import { eq } from 'drizzle-orm';
import '../types';

const usersRouter = new Hono();

usersRouter.use('*', authMiddleware);

usersRouter.get('/my-user', requirePermission('canGetMyUser'), async (c) => {
  const user = c.get('user');

  if (!user) {
    return c.json({ error: 'User not found in context' }, 401);
  }

  const { password, ...userWithoutPassword } = user;

  return c.json({
    user: userWithoutPassword
  }, 200);
});

usersRouter.get('/users', requirePermission('canGetUsers'), async (c) => {
  const allUsers = await db.query.users.findMany({
    with: {
      role: true
    }
  });

  const usersWithoutPasswords = allUsers.map(user => {
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  });

  return c.json({
    users: usersWithoutPasswords,
    count: usersWithoutPasswords.length
  }, 200);
});


usersRouter.post('/change-password', zValidator('json', changePasswordSchema), async (c) => {
  const user = c.get('user');

  if (!user) {
    return c.json({ error: 'User not found in context' }, 401);
  }

  const { currentPassword, newPassword } = c.req.valid('json');

  const isCurrentPasswordValid = await comparePassword(currentPassword, user.password);

  if (!isCurrentPasswordValid) {
    return c.json({ error: 'Current password is incorrect' }, 401);
  }

  if (currentPassword === newPassword) {
    return c.json({ error: 'New password must be different from current password' }, 400);
  }

  const hashedNewPassword = await hashPassword(newPassword);

  await db.update(users)
    .set({ 
      password: hashedNewPassword,
      passwordChangedAt: new Date(),
      updatedAt: new Date()
    })
    .where(eq(users.id, user.id));

  return c.json({
    message: 'Password changed successfully. Please login again with your new password.'
  }, 200);
});

export default usersRouter;

