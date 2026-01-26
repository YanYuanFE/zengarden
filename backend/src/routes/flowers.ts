import { Hono } from 'hono';
import { prisma } from '../lib/prisma.js';
import { jwtMiddleware, type JWTPayload } from '../lib/jwt.js';

const flowers = new Hono();

flowers.use('*', jwtMiddleware);

// GET /api/flowers - 获取用户花朵列表
flowers.get('/', async (c) => {
  try {
    const payload = c.get('user') as JWTPayload;

    const flowerList = await prisma.flower.findMany({
      where: { userId: payload.userId },
      orderBy: { createdAt: 'desc' },
      include: {
        session: {
          select: {
            reason: true,
            durationSeconds: true,
          },
        },
        task: {
          select: {
            id: true,
            status: true,
            error: true,
            retryCount: true,
          },
        },
      },
    });

    return c.json({ flowers: flowerList });
  } catch (error: any) {
    console.error('Get flowers error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// POST /api/flowers/generate - 异步生成花朵
flowers.post('/generate', async (c) => {
  try {
    const payload = c.get('user') as JWTPayload;
    const { sessionId } = await c.req.json();

    if (!sessionId) {
      return c.json({ error: 'sessionId is required' }, 400);
    }

    const session = await prisma.focusSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return c.json({ error: 'Session not found' }, 404);
    }

    if (session.userId !== payload.userId) {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    // 检查是否已有花朵记录
    const existingFlower = await prisma.flower.findUnique({
      where: { sessionId },
      include: { task: true },
    });

    if (existingFlower) {
      return c.json({
        success: true,
        flower: existingFlower,
        taskId: existingFlower.task?.id,
      });
    }

    // 创建花朵和任务记录
    const flower = await prisma.flower.create({
      data: {
        userId: payload.userId,
        sessionId,
        task: {
          create: {},
        },
      },
      include: { task: true },
    });

    return c.json({
      success: true,
      flower: {
        id: flower.id,
        sessionId: flower.sessionId,
      },
      taskId: flower.task?.id,
    });
  } catch (error: any) {
    console.error('Generate flower error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// GET /api/flowers/task/:taskId - 查询任务状态
flowers.get('/task/:taskId', async (c) => {
  try {
    const payload = c.get('user') as JWTPayload;
    const taskId = c.req.param('taskId');

    const task = await prisma.flowerTask.findUnique({
      where: { id: taskId },
      include: {
        flower: {
          include: {
            session: {
              select: {
                reason: true,
                durationSeconds: true,
              },
            },
          },
        },
      },
    });

    if (!task) {
      return c.json({ error: 'Task not found' }, 404);
    }

    if (task.flower.userId !== payload.userId) {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    return c.json({ task });
  } catch (error: any) {
    console.error('Get task error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// POST /api/flowers/task/:taskId/retry - 重试失败任务
flowers.post('/task/:taskId/retry', async (c) => {
  try {
    const payload = c.get('user') as JWTPayload;
    const taskId = c.req.param('taskId');

    const task = await prisma.flowerTask.findUnique({
      where: { id: taskId },
      include: { flower: true },
    });

    if (!task) {
      return c.json({ error: 'Task not found' }, 404);
    }

    if (task.flower.userId !== payload.userId) {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    if (task.status !== 'failed') {
      return c.json({ error: 'Task is not in failed status' }, 400);
    }

    // 重置任务状态
    const updatedTask = await prisma.flowerTask.update({
      where: { id: taskId },
      data: {
        status: 'pending',
        error: null,
        retryCount: 0,
      },
    });

    return c.json({ success: true, task: updatedTask });
  } catch (error: any) {
    console.error('Retry task error:', error);
    return c.json({ error: error.message }, 500);
  }
});

export { flowers };
