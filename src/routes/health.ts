import { Hono } from 'hono';

const health = new Hono();

health.get('/', (c) => {
  return c.json({ test: "hello world" });
});

export default health;