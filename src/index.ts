import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import { env } from '../env';
import health from './routes/health';
import auth from './routes/auth';

// Create Hono app instance
const app = new Hono();

app.use('*', logger());
app.use('*', cors());

app.route('/health', health);
app.route('/auth', auth);

app.onError((err, c) => {
  console.error(`Error: ${err.message}`, err);
  return c.json(
    {
      error: err.message || 'Internal Server Error',
    },
    500
  );
});


export default {
  port: env.PORT,
  fetch: app.fetch,
};
