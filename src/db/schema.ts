import {
	pgTable,
	varchar,
	timestamp,
	text,
	boolean,
	integer,
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
	canPostProducts: boolean("can_post_products").default(false).notNull(),
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

export const products = pgTable("products", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => ulid()),
	shopifyId: varchar("shopify_id", { length: 255 }).notNull().unique(),
	createdBy: text("created_by")
		.references(() => users.id)
		.notNull(),
	salesCount: integer("sales_count").default(0).notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const apiKeys = pgTable("api_keys", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => ulid()),
	name: varchar("name", { length: 255 }).unique().notNull(),
	key: varchar("key", { length: 255 }).notNull().unique(),
	userId: text("user_id")
		.references(() => users.id, { onDelete: "cascade" })
		.notNull(),
	lastUsedAt: timestamp("last_used_at"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ one, many }) => ({
	role: one(roles, {
		fields: [users.roleId],
		references: [roles.id],
	}),
	products: many(products),
	apiKeys: many(apiKeys),
}));

export const productsRelations = relations(products, ({ one }) => ({
	creator: one(users, {
		fields: [products.createdBy],
		references: [users.id],
	}),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
	users: many(users),
}));

export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
	user: one(users, {
		fields: [apiKeys.userId],
		references: [users.id],
	}),
}));

export type User = typeof users.$inferSelect;
export type Role = typeof roles.$inferSelect;
export type Product = typeof products.$inferSelect;
export type ApiKey = typeof apiKeys.$inferSelect;
