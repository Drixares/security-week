import { User, Role } from './db/schema';

declare module 'hono' {
  interface ContextVariableMap {
    user: User & { role: Role | null };
  }
}

