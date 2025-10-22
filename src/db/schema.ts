import {
	pgTable,
	varchar,
	timestamp,
	text,
	boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

import { ulid } from "ulid";

export const roles = pgTable("roles", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => ulid()),
	name: varchar("name", { length: 50 }).notNull().unique(),
	canPostLogin: boolean("can_post_login").default(true).notNull(),
	canGetMyUser: boolean("can_get_my_user").default(true).notNull(),
	canGetUsers: boolean("can_get_users").default(false).notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const users = pgTable("users", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => ulid()),
	name: varchar("name", { length: 255 }).notNull().unique(),
	email: varchar("email", { length: 255 }).notNull().unique(),
	password: varchar("password", { length: 255 }).notNull(),
	roleId: text("role_id").references(() => roles.id),
	passwordChangedAt: timestamp("password_changed_at"),
	lastLoginAttempt: timestamp("last_login_attempt"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ one }) => ({
	role: one(roles, {
		fields: [users.roleId],
		references: [roles.id],
	}),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
	users: many(users),
}));

export type User = typeof users.$inferSelect;
export type Role = typeof roles.$inferSelect;
