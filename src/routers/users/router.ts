import { ORPCError } from "@orpc/server";
import { base } from "../../context";
import { protectedProcedure } from "../../procedures/protected.procedure";
import { comparePassword, hashPassword } from "../../utils/password";
import { changePasswordSchema } from "../../validators/schemas";
import * as z from "zod";
import { users } from "../../db/schema";
import { eq } from "drizzle-orm";

export const usersRouter = base.router({
	getMyUser: protectedProcedure
		.route({ method: "GET", path: "/users/me" })
		.handler(({ context }) => {
			const { user } = context;
			return {
				id: user.id,
				name: user.name,
				email: user.email,
				createdAt: user.createdAt,
				updatedAt: user.updatedAt,
			};
		}),

	getUsers: base
		.route({ method: "GET", path: "/users" })
		.handler(async ({ context }) => {
			const { db } = context;

			const allUsers = await db.query.users.findMany({
				columns: {
					id: true,
					name: true,
					email: true,
					createdAt: true,
					updatedAt: true,
				},
				with: {
					role: {
						columns: {
							name: true,
							canPostLogin: true,
							canGetMyUser: true,
							canGetUsers: true,
						},
					},
				},
			});

			return {
				users: allUsers,
				count: allUsers.length,
			};
		}),

	changePassword: protectedProcedure
		.route({ method: "POST", path: "/users/change-password" })
		.input(changePasswordSchema)
		.output(z.object({ message: z.string() }))
		.handler(async ({ input, context }) => {
			const { db, user } = context;
			const { currentPassword, newPassword } = input;

			const userPassword = await db.query.users.findFirst({
				where: eq(users.id, user.id),
				columns: {
					password: true,
				},
			});

			if (!userPassword?.password) {
				throw new ORPCError("USER_NOT_FOUND");
			}

			const isCurrentPasswordValid = await comparePassword(
				currentPassword,
				userPassword?.password,
			);

			if (!isCurrentPasswordValid) {
				throw new ORPCError("INVALID_CREDENTIALS");
			}

			if (currentPassword === newPassword) {
				throw new ORPCError("PASSWORD_MUST_BE_DIFFERENT");
			}

			const hashedNewPassword = await hashPassword(newPassword);

			await db
				.update(users)
				.set({
					password: hashedNewPassword,
					passwordChangedAt: new Date(),
					updatedAt: new Date(),
				})
				.where(eq(users.id, user.id));

			return { message: "Password changed successfully" };
		}),
});
