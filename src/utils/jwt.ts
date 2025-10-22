import { sign, verify } from 'hono/jwt';
import { JWTPayload } from 'hono/utils/jwt/types';
import { env } from '../../env';

export const generateToken = (payload: JWTPayload) => {
  return sign(payload, env.JWT_SECRET);
};

export const verifyToken = (token: string) => {
  return verify(token, env.JWT_SECRET);
};