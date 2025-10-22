import { verifyToken } from "../utils/jwt";
import { db } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import "../types";
import type { JWTPayload } from "hono/utils/jwt/types";
import { base } from "../context";
import { ORPCError } from "@orpc/server";

export const authMiddleware = base.middleware(async (opts) => {
	const { procedure, context, next, errors } = opts;

	const authHeader = context.headers.get("Authorization");

	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		throw errors.UNAUTHORIZED({
			message: "Unauthorized - No token provided",
		});
	}

	const token = authHeader.split(" ")[1];

	if (!token) {
		throw errors.UNAUTHORIZED({
			message: "Unauthorized - Invalid token format",
		});
	}

	let decoded: JWTPayload;
	try {
		decoded = await verifyToken(token);
	} catch {
		throw errors.UNAUTHORIZED({
			message: "Unauthorized - Invalid or expired token",
		});
	}

	const { userId, iat } = decoded;

	if (!userId) {
		throw errors.UNAUTHORIZED({
			message: "Unauthorized - Invalid token payload",
		});
	}

	const user = await db.query.users.findFirst({
		where: eq(users.id, userId as string),
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

	if (!user) {
		throw new ORPCError("UNAUTHORIZED", {
			message: "Unauthorized - User not found",
		});
	}

	// Check if user.passwordChangedAt is newer than token.iat
	if (user.passwordChangedAt && iat) {
		const passwordChangedAtTimestamp = user.passwordChangedAt.getTime();

		// If password was changed after token was issued, token is invalid
		// Convert iat from seconds to milliseconds for comparison
		if (passwordChangedAtTimestamp > iat * 1000) {
			throw new ORPCError("UNAUTHORIZED", {
				message:
					"Unauthorized - Token invalid due to password change. Please login again.",
			});
		}
	}

	if (!procedure["~orpc"].meta.roles) {
		return next({ context: { ...context, user } });
	}

	const requiredRoles = procedure["~orpc"].meta.roles;

	if (requiredRoles && requiredRoles.length > 0) {
		const userRole = user.role?.name;
		if (!userRole) {
			throw errors.UNAUTHORIZED();
		}
		if (!requiredRoles.includes(userRole)) {
			throw errors.FORBIDDEN();
		}
	}

	return next({ context: { ...context, user } });
});
