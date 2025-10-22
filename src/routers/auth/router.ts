import { ORPCError, os } from "@orpc/server";
import * as z from "zod";
import { loginSchema, registerSchema } from "../../validators/schemas";
import { db } from "../../db";
import { roles, users } from "../../db/schema";
import { eq } from "drizzle-orm";
import { comparePassword, hashPassword } from "../../utils/password";
import { generateToken } from "../../utils/jwt";
import { base } from "../../context";

export const authRouter = base.router({
	login: os
		.route({ method: "POST", path: "/auth/login" })
		.input(loginSchema)
		.output(z.object({ message: z.string(), token: z.string() }))
		.handler(async ({ input }) => {
			const { email, password } = input;

			const user = await db.query.users.findFirst({
				where: eq(users.email, email),
			});

			if (!user) {
				throw new ORPCError("INVALID_CREDENTIALS");
			}

			const isPasswordValid = await comparePassword(password, user.password);

			await db
				.update(users)
				.set({ lastLoginAttempt: new Date() })
				.where(eq(users.id, user.id));

			if (!isPasswordValid) {
				throw new ORPCError("INVALID_CREDENTIALS");
			}

			const token = await generateToken({
				userId: user.id,
				roleId: user.roleId,
				passwordChangedAt: user.passwordChangedAt?.toISOString(),
			});

			return { message: "Login successful", token };
		}),

	register: os
		.route({ method: "POST", path: "/auth/register" })
		.input(registerSchema)
		.output(z.object({ message: z.string(), token: z.string() }))
		.handler(async ({ input }) => {
			const { name, email, password } = input;

			const existingUser = await db.query.users.findFirst({
				where: eq(users.email, email),
			});

			if (existingUser) {
				throw new ORPCError("EMAIL_ALREADY_EXISTS");
			}

			const hashedPassword = await hashPassword(password);

			const userRole = await db.query.roles.findFirst({
				where: eq(roles.name, "USER"),
			});

			const [newUser] = await db
				.insert(users)
				.values({
					name,
					email,
					password: hashedPassword,
					roleId: userRole?.id || null,
				})
				.returning();

			const token = await generateToken({
				userId: newUser.id,
				roleId: newUser.roleId,
				passwordChangedAt: newUser.passwordChangedAt?.toISOString(),
			});

			return { message: "User registered successfully", token };
		}),
});
