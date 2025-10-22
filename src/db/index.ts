import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "./schema";
import { env } from "../../env";

const pool = new Pool({
	connectionString: env.DATABASE_URL,
});

const db = drizzle(pool, { schema });

type Database = typeof db;

export { db, type Database };
