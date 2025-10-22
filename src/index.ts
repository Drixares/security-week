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
	const { matched, response } = await handler.handle(c.req.raw, {
		prefix: "/",
		context: { headers: c.req.raw.headers, db, honoContext: c },
	});

	if (matched) {
		return c.newResponse(response.body, response);
	}

	await next();
});

export default app;
