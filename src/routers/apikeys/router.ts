import { protectedProcedure } from "../../procedures/protected.procedure";
import {
	createApiKeySchema,
	deleteApiKeySchema,
} from "../../validators/schemas";
import { db } from "../../db";
import { apiKeys } from "../../db/schema";
import { eq, and, desc, DrizzleQueryError } from "drizzle-orm";
import { generateApiKey, hashApiKey } from "../../utils/apikey";
import { ORPCError } from "@orpc/server";
import { base } from "../../context";
import { tryCatch } from "../../utils/try-catch";

export const apiKeysRouter = base.router({
	createApiKey: protectedProcedure
		.route({ method: "POST", path: "/api-keys" })
		.input(createApiKeySchema)
		.handler(async ({ input, context }) => {
			const { name } = input;
			const user = context.user;

			const rawKey = generateApiKey();
			const hashedKey = hashApiKey(rawKey);

			const [error, newApiKey] = await tryCatch(
				db
					.insert(apiKeys)
					.values({
						name,
						key: hashedKey,
						userId: user.id,
					})
					.returning(),
			);

			if (error) {
				if (
					error instanceof DrizzleQueryError &&
					error.cause &&
					"code" in error.cause &&
					error.cause.code === "23505"
				) {
					throw new ORPCError("BAD_REQUEST", {
						message: "You already have an API key with this name",
					});
				}

				throw new ORPCError("INTERNAL_SERVER_ERROR", {
					message: `Failed to create API key: ${error.message}`,
				});
			}

			return {
				id: newApiKey[0].id,
				name: newApiKey[0].name,
				key: rawKey,
				message:
					"API key created successfully. Please save this key - it won't be shown again.",
			};
		}),

	getMyApiKeys: protectedProcedure
		.route({ method: "GET", path: "/api-keys" })
		.handler(async ({ context }) => {
			const user = context.user;

			const userApiKeys = await db.query.apiKeys.findMany({
				where: eq(apiKeys.userId, user.id),
				columns: {
					id: true,
					name: true,
					lastUsedAt: true,
					createdAt: true,
				},
				orderBy: desc(apiKeys.createdAt),
			});

			return userApiKeys;
		}),

	deleteApiKey: protectedProcedure
		.route({ method: "DELETE", path: "/api-keys/:id" })
		.input(deleteApiKeySchema)
		.handler(async ({ input, context }) => {
			const { id } = input;
			const user = context.user;

			const [deletedApiKey] = await db
				.delete(apiKeys)
				.where(and(eq(apiKeys.id, id), eq(apiKeys.userId, user.id)))
				.returning();

			if (!deletedApiKey) {
				throw new ORPCError("NOT_FOUND", {
					message:
						"API key not found or you don't have permission to delete it",
				});
			}

			return {
				message: "API key deleted successfully",
			};
		}),
});
