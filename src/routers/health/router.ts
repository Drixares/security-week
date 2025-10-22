import { os } from "@orpc/server";
import { base } from "../../context";

export const healthRouter = base.router({
	health: os.route({ method: "GET", path: "/health" }).handler(() => {
		return { status: "Hello world" };
	}),
});
