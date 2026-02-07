import { Hono } from 'hono';
import { prisma } from '../lib/prisma.js';
import { jwtMiddleware, type JWTPayload } from '../lib/jwt.js';

const focus = new Hono<{ Variables: { user: JWTPayload } }>();

// 所有 focus 路由都需要 JWT 认证
focus.use('*', jwtMiddleware);

// 计算连续天数
function calculateStreak(lastFocusDate: Date | null, currentStreak: number): number {
  if (!lastFocusDate) {
    // 第一次专注
    return 1;
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const lastDate = new Date(lastFocusDate.getFullYear(), lastFocusDate.getMonth(), lastFocusDate.getDate());

  const diffDays = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    // 今天已经专注过，保持当前连续天数
    return currentStreak;
  } else if (diffDays === 1) {
    // 昨天专注过，连续天数 +1
    return currentStreak + 1;
  } else {
    // 超过1天没专注，重置为1
    return 1;
  }
}

// POST /api/focus/start - 开始专注
focus.post('/start', async (c) => {
  try {
    const payload = c.get('user') as JWTPayload;
    const { reason, duration } = await c.req.json();

    if (!reason || !duration) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    const session = await prisma.focusSession.create({
      data: {
        userId: payload.userId,
        reason,
        durationSeconds: duration,
        startedAt: new Date(),
        status: 'in_progress',
      },
    });

    return c.json({
      sessionId: session.id,
      startedAt: session.startedAt.toISOString(),
    });
  } catch (error: any) {
    console.error('Focus start error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// POST /api/focus/:id/complete - 完成专注
focus.post('/:id/complete', async (c) => {
  try {
    const sessionId = c.req.param('id');

    const session = await prisma.focusSession.update({
      where: { id: sessionId },
      data: {
        status: 'completed',
        completedAt: new Date(),
      },
      include: { user: true },
    });

    // 计算新的连续天数
    const newStreak = calculateStreak(session.user.lastFocusDate, session.user.streakDays);

    // 更新用户统计（转换为分钟）
    await prisma.user.update({
      where: { id: session.userId },
      data: {
        totalFocusMinutes: { increment: Math.floor(session.durationSeconds / 60) },
        lastFocusDate: new Date(),
        streakDays: newStreak,
      },
    });

    return c.json({
      success: true,
      session: {
        id: session.id,
        reason: session.reason,
        duration: session.durationSeconds,
      },
    });
  } catch (error: any) {
    console.error('Focus complete error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// POST /api/focus/:id/interrupt - 中断专注
focus.post('/:id/interrupt', async (c) => {
  try {
    const sessionId = c.req.param('id');

    await prisma.focusSession.update({
      where: { id: sessionId },
      data: {
        status: 'interrupted',
        interrupted: true,
        completedAt: new Date(),
      },
    });

    return c.json({ success: true });
  } catch (error: any) {
    console.error('Focus interrupt error:', error);
    return c.json({ error: error.message }, 500);
  }
});

export { focus };
