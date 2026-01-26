import { Hono } from 'hono';
import { prisma } from '../lib/prisma.js';
import { jwtMiddleware, type JWTPayload } from '../lib/jwt.js';

const stats = new Hono();

// 所有 stats 路由都需要 JWT 认证
stats.use('*', jwtMiddleware);

// GET /api/stats - 获取用户统计
stats.get('/', async (c) => {
  try {
    const payload = c.get('user') as JWTPayload;

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json({
      totalFocusMinutes: user.totalFocusMinutes,
      totalFlowers: user.totalFlowers,
      streakDays: user.streakDays,
      lastFocusDate: user.lastFocusDate,
    });
  } catch (error: any) {
    console.error('Get stats error:', error);
    return c.json({ error: error.message }, 500);
  }
});

export { stats };
