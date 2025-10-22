import { z } from 'zod';

const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 128;

const passwordValidation = z
  .string()
  .min(1, 'Password is required')
  .trim()
  .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
  .max(PASSWORD_MAX_LENGTH, `Password must not exceed ${PASSWORD_MAX_LENGTH} characters`)
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, 'Password must contain at least one special character');

const emailValidation = z.email('Invalid email format')

const nameValidation = z
  .string()
  .min(1, 'Name is required')
  .trim()
  .min(2, 'Name must be at least 2 characters')
  .max(255, 'Name must not exceed 255 characters')
  .regex(/^[a-zA-Z\s\-'.]+$/, 'Name can only contain letters, spaces, hyphens, apostrophes, and periods');

export const registerSchema = z.object({
  name: nameValidation,
  email: emailValidation,
  password: passwordValidation
});

export const loginSchema = z.object({
  email: emailValidation,
  password: z.string().min(1, 'Password is required').trim()
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required').trim(),
  newPassword: passwordValidation
});