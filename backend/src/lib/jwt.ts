import { sign, verify } from 'hono/jwt';
import type { Context, Next } from 'hono';

const JWT_SECRET = process.env.JWT_SECRET || 'zengarden-jwt-secret-change-in-production-2024';

export interface JWTPayload {
  userId: string;
  address: string;
  exp: number;
}

// 生成 JWT token
export async function generateToken(userId: string, address: string): Promise<string> {
  const payload: JWTPayload = {
    userId,
    address,
    exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 天过期
  };
  return await sign(payload, JWT_SECRET);
}

// 验证 JWT token
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const payload = await verify(token, JWT_SECRET, 'HS256') as JWTPayload;
    return payload;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

// JWT 中间件
export async function jwtMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const token = authHeader.substring(7);
  const payload = await verifyToken(token);

  if (!payload) {
    return c.json({ error: 'Invalid or expired token' }, 401);
  }

  // 将用户信息存入 context
  c.set('user', payload);
  await next();
}
