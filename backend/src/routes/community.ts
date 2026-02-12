import { Hono } from 'hono';
import { prisma } from '../lib/prisma.js';
import { jwtMiddleware, type JWTPayload } from '../lib/jwt.js';

const community = new Hono<{ Variables: { user: JWTPayload } }>();

// GET /api/community/feed - 获取社区动态流
community.get('/feed', async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '20');
    const skip = (page - 1) * limit;

    const flowers = await prisma.flower.findMany({
      where: {
        imageUrl: { not: null },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            address: true,
            nickname: true,
            avatar: true,
          },
        },
        session: {
          select: {
            reason: true,
            durationSeconds: true,
          },
        },
        _count: {
          select: { likes: true },
        },
      },
    });

    return c.json({ flowers });
  } catch (error: any) {
    console.error('Get feed error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// GET /api/community/users/:address - 获取用户主页
community.get('/users/:address', async (c) => {
  try {
    const address = c.req.param('address');

    const user = await prisma.user.findUnique({
      where: { address },
      select: {
        id: true,
        address: true,
        nickname: true,
        avatar: true,
        totalFocusMinutes: true,
        totalFlowers: true,
        streakDays: true,
        createdAt: true,
      },
    });

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json({ user });
  } catch (error: any) {
    console.error('Get user error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// GET /api/community/users/:address/garden - 获取用户花园
community.get('/users/:address/garden', async (c) => {
  try {
    const address = c.req.param('address');
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '20');
    const skip = (page - 1) * limit;

    const user = await prisma.user.findUnique({
      where: { address },
    });

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    const flowers = await prisma.flower.findMany({
      where: {
        userId: user.id,
        imageUrl: { not: null },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        session: {
          select: {
            reason: true,
            durationSeconds: true,
          },
        },
        _count: {
          select: { likes: true },
        },
      },
    });

    return c.json({ flowers });
  } catch (error: any) {
    console.error('Get garden error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// POST /api/community/flowers/:id/like - 点赞/取消点赞
community.post('/flowers/:id/like', jwtMiddleware, async (c) => {
  try {
    const payload = c.get('user') as JWTPayload;
    const flowerId = c.req.param('id');

    const existingLike = await prisma.like.findUnique({
      where: {
        userId_flowerId: {
          userId: payload.userId,
          flowerId,
        },
      },
    });

    if (existingLike) {
      await prisma.like.delete({
        where: { id: existingLike.id },
      });
      return c.json({ liked: false });
    } else {
      await prisma.like.create({
        data: {
          userId: payload.userId,
          flowerId,
        },
      });
      return c.json({ liked: true });
    }
  } catch (error: any) {
    console.error('Like error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// GET /api/community/leaderboard - 排行榜
community.get('/leaderboard', async (c) => {
  try {
    const type = c.req.query('type') || 'focus'; // focus | flowers | streak
    const limit = parseInt(c.req.query('limit') || '20');

    let orderBy: any;
    switch (type) {
      case 'flowers':
        orderBy = { totalFlowers: 'desc' };
        break;
      case 'streak':
        orderBy = { streakDays: 'desc' };
        break;
      default:
        orderBy = { totalFocusMinutes: 'desc' };
    }

    const users = await prisma.user.findMany({
      orderBy,
      take: limit,
      select: {
        id: true,
        address: true,
        nickname: true,
        avatar: true,
        totalFocusMinutes: true,
        totalFlowers: true,
        streakDays: true,
      },
    });

    return c.json({ users, type });
  } catch (error: any) {
    console.error('Leaderboard error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// GET /api/community/flowers/:id/metadata - 公开获取花朵 metadata JSON
community.get('/flowers/:id/metadata', async (c) => {
  try {
    const flowerId = c.req.param('id');

    const flower = await prisma.flower.findUnique({
      where: { id: flowerId },
    });

    if (!flower) {
      return c.json({ error: 'Flower not found' }, 404);
    }

    if (!flower.metadataUrl) {
      return c.json({ error: 'No metadata available' }, 404);
    }

    const response = await fetch(flower.metadataUrl);
    if (!response.ok) {
      return c.json({ error: 'Failed to fetch metadata' }, 502);
    }

    const metadata = await response.json();
    return c.json({ metadata });
  } catch (error: any) {
    console.error('Get metadata error:', error);
    return c.json({ error: error.message }, 500);
  }
});

export { community };
