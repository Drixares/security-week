import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { registerSchema, loginSchema } from '../validators/schemas';
import { db } from '../db';
import { users, roles } from '../db/schema';
import { hashPassword, comparePassword } from '../utils/password';
import { eq } from 'drizzle-orm';
import { rateLimitMiddleware } from '../middlewares/ratelimit';
import { authMiddleware, requirePermission } from '../middlewares/auth';
import { generateToken } from '../utils/jwt';
import { every } from 'hono/combine';

const auth = new Hono();

auth.use('/login', every(rateLimitMiddleware, authMiddleware, requirePermission('canPostLogin')));

auth.post('/register', zValidator('json', registerSchema), async (c) => {
  const { name, email, password } = c.req.valid('json');

  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, email)
  });

  if (existingUser) {
    return c.json({ error: 'Email already exists' }, 409);
  }

  const hashedPassword = await hashPassword(password);

  const userRole = await db.query.roles.findFirst({
    where: eq(roles.name, 'USER')
  });

  const [newUser] = await db.insert(users).values({
    name,
    email,
    password: hashedPassword,
    roleId: userRole?.id || null
  }).returning();

  const token = await generateToken({
    userId: newUser.id,
    roleId: newUser.roleId,
    passwordChangedAt: newUser.passwordChangedAt?.toISOString()
  });

  return c.json({
    message: 'User registered successfully',
    token
  }, 201);
});

auth.post('/login', zValidator('json', loginSchema), async (c) => {
  const { email, password } = c.req.valid('json');

  const user = await db.query.users.findFirst({
    where: eq(users.email, email)
  });

  if (!user) {
    return c.json({ error: 'Invalid credentials' }, 401);
  }

  const isPasswordValid = await comparePassword(password, user.password);

  await db.update(users)
    .set({ lastLoginAttempt: new Date() })
    .where(eq(users.id, user.id));

  if (!isPasswordValid) {
    return c.json({ error: 'Invalid credentials' }, 401);
  }

  const token = await generateToken({
    userId: user.id,
    roleId: user.roleId,
    passwordChangedAt: user.passwordChangedAt?.toISOString()
  });

  return c.json({
    message: 'Login successful',
    token
  }, 200);
});

export default auth;