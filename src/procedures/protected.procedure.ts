import { base } from "../context";
import { authMiddleware } from "../middlewares/auth.middleware";

export const protectedProcedure = base.use(authMiddleware);
