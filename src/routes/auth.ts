import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { registerSchema } from '../validators/schemas';
import { db } from '../db';
import { users, roles } from '../db/schema';
import { hashPassword } from '../utils/password';
import { eq } from 'drizzle-orm';

const auth = new Hono();

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
  }).returning({
    id: users.id,
    name: users.name,
    email: users.email,
    roleId: users.roleId,
    createdAt: users.createdAt,
    updatedAt: users.updatedAt
  });

  return c.json({
    message: 'User registered successfully',
    user: newUser
  }, 201);
});

export default auth;