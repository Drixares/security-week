import { verifyToken } from "../utils/jwt";
import { db } from "../db";
import { users, apiKeys, User, Role } from "../db/schema";
import { eq } from "drizzle-orm";
import "../types";
import { base } from "../context";
import { hashApiKey } from "../utils/apikey";
import { tryCatch } from "../utils/try-catch";
import { checkPasswordChanged } from "../utils/password";

type FoundUser = Partial<User> & {
	id: string;
	role: Role | null;
};

export const authMiddleware = base.middleware(async (opts) => {
	const { procedure, context, next, errors } = opts;

	const authHeader = context.headers.get("Authorization");
	const apiKeyHeader = context.headers.get("x-api-key");

	if (!authHeader && !apiKeyHeader) {
		throw errors.UNAUTHORIZED({
			message: "Unauthorized - No authentication provided",
		});
	}

	let foundUser: FoundUser | undefined;

	if (apiKeyHeader) {
		const hashedKey = hashApiKey(apiKeyHeader);

		const apiKeyRecord = await db.query.apiKeys.findFirst({
			where: eq(apiKeys.key, hashedKey),
		});

		if (!apiKeyRecord) {
			throw errors.UNAUTHORIZED({
				message: "Unauthorized - Invalid API key",
			});
		}

		await db
			.update(apiKeys)
			.set({ lastUsedAt: new Date() })
			.where(eq(apiKeys.id, apiKeyRecord.id));

		foundUser = await getFoundUser({ userId: apiKeyRecord.userId });

		if (!foundUser) {
			throw errors.UNAUTHORIZED({
				message: "Unauthorized - User not found",
			});
		}
	} else if (authHeader) {
		if (!authHeader.startsWith("Bearer ")) {
			throw errors.UNAUTHORIZED({
				message: "Unauthorized - Invalid token format",
			});
		}

		const token = authHeader.split(" ")[1];

		if (!token) {
			throw errors.UNAUTHORIZED({
				message: "Unauthorized - Invalid token format",
			});
		}

		const [error, decoded] = await tryCatch(verifyToken(token));

		if (error) {
			console.error("Error verifying token:", error);
			throw errors.UNAUTHORIZED({
				message: "Unauthorized - Invalid or expired token",
			});
		}

		const { userId, iat } = decoded;

		foundUser = await getFoundUser({ userId: userId as string });

		if (!foundUser) {
			throw errors.UNAUTHORIZED({
				message: "Unauthorized - User not found",
			});
		}

		checkPasswordChanged({
			foundUser,
			iat,
			onError: () => {
				throw errors.UNAUTHORIZED({
					message:
						"Unauthorized - Token invalid due to password change. Please login again.",
				});
			},
		});
	}

	if (!procedure["~orpc"].meta.roles) {
		return next({ context: { ...context, user: foundUser as FoundUser } });
	}

	const requiredRoles = procedure["~orpc"].meta.roles;

	if (requiredRoles && requiredRoles.length > 0) {
		const userRole = foundUser?.role?.name;
		if (!userRole) {
			throw errors.UNAUTHORIZED();
		}
		if (!requiredRoles.includes(userRole)) {
			throw errors.FORBIDDEN();
		}
	}

	return next({ context: { ...context, user: foundUser as FoundUser } });
});

async function getFoundUser({ userId }: { userId: string }) {
	const foundUser = await db.query.users.findFirst({
		where: eq(users.id, userId),
		columns: {
			id: true,
			name: true,
			email: true,
			passwordChangedAt: true,
			lastLoginAttempt: true,
			createdAt: true,
			updatedAt: true,
		},
		with: {
			role: true,
		},
	});
	return foundUser;
}
