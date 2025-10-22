import { pgTable, uuid, varchar, timestamp, boolean } from 'drizzle-orm/pg-core';


// Users table
export const users = pgTable('users', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    password: varchar('password', { length: 255 }).notNull(),
    roleId: uuid('role_id').references(() => roles.id),
    passwordChangedAt: timestamp('password_changed_at'),
    lastLoginAttempt: timestamp('last_login_attempt'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull()
  });
  
  // Roles table (for Phase 3)
  export const roles = pgTable('roles', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 50 }).notNull().unique(),
    canPostLogin: boolean('can_post_login').default(true).notNull(),
    canGetMyUser: boolean('can_get_my_user').default(true).notNull(),
    canGetUsers: boolean('can_get_users').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull()
  });