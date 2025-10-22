import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import { env } from '../env';
import health from './routes/health';
import auth from './routes/auth';
import usersRouter from './routes/users';
import { every } from 'hono/combine';

const app = new Hono();

app.use('*', every(
  cors(),
  logger(),
));

app.route('/health', health);
app.route('/auth', auth);
app.route('/api', usersRouter);


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
