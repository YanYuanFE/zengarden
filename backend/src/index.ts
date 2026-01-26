import 'dotenv/config';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { auth } from './routes/auth.js';
import { focus } from './routes/focus.js';
import { flowers } from './routes/flowers.js';
import { stats } from './routes/stats.js';
import { community } from './routes/community.js';
import { logger } from 'hono/logger';
import { startWorker } from './services/flower-worker.js';

import type { JWTPayload } from './lib/jwt.js';

type Variables = {
  user: JWTPayload;
};

const app = new Hono<{ Variables: Variables }>();

app.use('*', logger());

// 启用 CORS
app.use('*', cors());

// 健康检查
app.get('/health', (c) => {
  return c.json({ status: 'ok', service: 'zengarden-api' });
});

// 挂载路由
app.route('/api/auth', auth);
app.route('/api/focus', focus);
app.route('/api/flowers', flowers);
app.route('/api/stats', stats);
app.route('/api/community', community);

const port = parseInt(process.env.PORT || '3000', 10);

serve({
  fetch: app.fetch,
  port,
}, (info) => {
  console.log(`ZenGarden API running on http://localhost:${info.port}`);
  // 启动后台 Worker
  startWorker();
});
