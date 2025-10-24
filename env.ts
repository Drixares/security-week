import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
	server: {
		DATABASE_URL: z.url(),
		JWT_SECRET: z.string(),
		JWT_EXPIRY: z.string(),

		PORT: z.coerce.number().default(3000),
		NODE_ENV: z
			.enum(["development", "production", "test"])
			.default("development"),

		SHOPIFY_SHOP_NAME: z.string(),
		SHOPIFY_ACCESS_TOKEN: z.string(),
		SHOPIFY_WEBHOOK_SECRET: z.string(),
	},
	runtimeEnv: process.env,
});
