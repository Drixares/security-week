import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import * as schema from './schema';
import { env } from '../../env';

const pool = new Pool({
    connectionString: env.DATABASE_URL,
});

type Database = typeof schema;

const db = drizzle(pool, { schema });

export { db, type Database };