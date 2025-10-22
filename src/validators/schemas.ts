import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2).max(255),
  email: z.email(),
  password: z.string().min(8)
    .regex(/[A-Z]/, 'Must contain uppercase')
    .regex(/[a-z]/, 'Must contain lowercase')
    .regex(/[0-9]/, 'Must contain number')
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});