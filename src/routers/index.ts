import { authRouter } from "./auth/router";
import { healthRouter } from "./health/router";
import { usersRouter } from "./users/router";
import { base } from "../context";

export const appRouter = base.router({
	health: healthRouter,
	auth: authRouter,
	users: usersRouter,
});
