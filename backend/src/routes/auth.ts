import { Hono } from 'hono';
import { prisma } from '../lib/prisma.js';
import { verifySignature } from '../lib/solana.js';
import { generateToken, jwtMiddleware, type JWTPayload } from '../lib/jwt.js';

const auth = new Hono<{ Variables: { user: JWTPayload } }>();

// 存储 nonce（生产环境应使用 Redis）
const nonceStore = new Map<string, { nonce: string; expiresAt: number }>();

// 生成随机 nonce
function generateNonce(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// GET /api/auth/nonce - 获取 SIWE nonce
auth.get('/nonce', (c) => {
  const nonce = generateNonce();
  const address = c.req.query('address');

  if (address) {
    // Solana 地址区分大小写，不进行 toLowerCase
    nonceStore.set(address, {
      nonce,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 分钟过期
    });
  }

  return c.json({ nonce });
});

// POST /api/auth/verify - 验证签名登录
auth.post('/verify', async (c) => {
  try {
    const { message, signature, address } = await c.req.json();

    if (!address) {
      return c.json({ error: 'Address is required' }, 400);
    }

    // 必须提供 message 和 signature
    if (!message || !signature) {
      return c.json({ error: 'Message and signature are required' }, 400);
    }

    // 验证 Solana 签名 (Ed25519)
    const isValid = verifySignature(message, signature, address);

    if (!isValid) {
      return c.json({ error: 'Invalid signature' }, 401);
    }

    // Solana 地址区分大小写，不进行 toLowerCase
    // 使用 upsert 避免并发问题
    const user = await prisma.user.upsert({
      where: { address },
      update: {},
      create: {
        address,
        chainId: 0, // Solana 不使用 EVM chainId
      },
    });

    // 生成 JWT token
    const token = await generateToken(user.id, user.address);

    return c.json({
      success: true,
      token,
      user: {
        id: user.id,
        address: user.address,
        totalFocusMinutes: user.totalFocusMinutes,
        totalFlowers: user.totalFlowers,
        streakDays: user.streakDays,
      },
    });
  } catch (error: any) {
    console.error('Auth verify error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// GET /api/auth/me - 获取当前用户信息（需要 JWT）
auth.get('/me', jwtMiddleware, async (c) => {
  try {
    const payload = c.get('user') as JWTPayload;

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json({
      user: {
        id: user.id,
        address: user.address,
        totalFocusMinutes: user.totalFocusMinutes,
        totalFlowers: user.totalFlowers,
        streakDays: user.streakDays,
      },
    });
  } catch (error: any) {
    console.error('Get user error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// POST /api/auth/logout - 退出登录
auth.post('/logout', jwtMiddleware, async (c) => {
  try {
    const payload = c.get('user') as JWTPayload;

    // 清理该用户的 nonce
    nonceStore.delete(payload.address);

    return c.json({ success: true });
  } catch (error: any) {
    console.error('Logout error:', error);
    return c.json({ error: error.message }, 500);
  }
});

export { auth, nonceStore };
