import type { Context, Next } from "hono";

type Permission = "canPostLogin" | "canGetMyUser" | "canGetUsers";

export const requirePermission = (permission: Permission) => {
	return async (c: Context, next: Next) => {
		const user = c.get("user");

		if (!user) {
			return c.json({ error: "User not found in context" }, 401);
		}

		if (!user.role || !user.role[permission]) {
			return c.json({ error: "Forbidden - Insufficient permissions" }, 403);
		}

		await next();
	};
};
