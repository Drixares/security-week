import { os } from "@orpc/server";
import z from "zod";
import type { Database } from "./db";
import type { Context } from "hono";

interface Meta {
	roles?: string[];
}

export const base = os
	.$context<{
		headers: Headers;
		db: Database;
		honoContext: Context;
		rawBody?: string;
	}>()
	.errors({
		RATE_LIMIT_EXCEEDED: {
			status: 429,
			data: z.object({
				retryAfterSeconds: z
					.number()
					.describe("The number of seconds to wait before retrying."),
				totalRequests: z
					.number()
					.describe("The total number of requests made."),
				remainingRequests: z
					.number()
					.describe("The number of requests remaining."),
			}),
		},
		UNAUTHORIZED: {
			status: 401,
		},
		FORBIDDEN: {
			status: 403,
		},
	})
	.$meta<Meta>({ roles: undefined });
