import { Hono } from "hono";
import { appRouter } from "./routers";
import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { onError } from "@orpc/server";
import { CORSPlugin } from "@orpc/server/plugins";
import { db } from "./db";

const app = new Hono();

const handler = new OpenAPIHandler(appRouter, {
	plugins: [new CORSPlugin()],
	interceptors: [onError((error) => console.error(error))],
});

app.use("*", async (c, next) => {
	// Buffer the raw body for webhook routes (needed for signature verification)
	let rawBody: string | undefined;
	let newRequest: Request | undefined;

	if (c.req.path.startsWith("/webhooks/")) {
		rawBody = await c.req.text();

		newRequest = new Request(c.req.raw, {
			body: rawBody,
			headers: c.req.raw.headers,
			method: c.req.raw.method,
		});
	}

	const { matched, response } = await handler.handle(newRequest ?? c.req.raw, {
		prefix: "/",
		context: {
			headers: c.req.raw.headers,
			db,
			honoContext: c,
			rawBody,
		},
	});

	if (matched) {
		return c.newResponse(response.body, response);
	}

	await next();
});

export default app;
