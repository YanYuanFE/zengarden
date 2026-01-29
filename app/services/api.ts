import { storage } from '@/utils/storage';

import Config from '@/constants/Config';

const API_URL = Config.EXPO_PUBLIC_API_URL;
const TOKEN_KEY = 'zengarden_jwt_token';

// Get stored token
async function getToken(): Promise<string | null> {
  const token = await storage.getItem<string>(TOKEN_KEY);
  return token ?? null;
}

// Save token
export async function setToken(token: string): Promise<void> {
  await storage.setItem(TOKEN_KEY, token);
}

// Clear token
export async function clearToken(): Promise<void> {
  await storage.removeItem(TOKEN_KEY);
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  requireAuth: boolean = false
): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  // Add Authorization header if authentication is required
  if (requireAuth) {
    const token = await getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

// Auth API
export const authApi = {
  getNonce: (address: string) =>
    request<{ nonce: string }>(`/api/auth/nonce?address=${address}`),

  verify: (params: {
    address: string;
    chainId?: number;
    message?: string;
    signature?: string;
  }) =>
    request<{
      success: boolean;
      token: string;
      user: {
        id: string;
        address: string;
        totalFocusMinutes: number;
        totalFlowers: number;
        streakDays: number;
      };
    }>('/api/auth/verify', {
      method: 'POST',
      body: JSON.stringify(params),
    }),

  getMe: () =>
    request<{
      user: {
        id: string;
        address: string;
        totalFocusMinutes: number;
        totalFlowers: number;
        streakDays: number;
      };
    }>('/api/auth/me', {}, true),
};

// Focus API
export const focusApi = {
  start: (reason: string, duration: number) =>
    request<{
      sessionId: string;
      startedAt: string;
    }>('/api/focus/start', {
      method: 'POST',
      body: JSON.stringify({ reason, duration }),
    }, true),

  complete: (sessionId: string) =>
    request<{
      success: boolean;
      session: { id: string; reason: string; duration: number };
    }>(`/api/focus/${sessionId}/complete`, {
      method: 'POST',
    }, true),

  interrupt: (sessionId: string) =>
    request<{ success: boolean }>(`/api/focus/${sessionId}/interrupt`, {
      method: 'POST',
    }, true),
};

// Flower Task Type
export interface FlowerTask {
  id: string;
  status: 'pending' | 'generating' | 'uploading' | 'minting' | 'completed' | 'failed';
  error?: string;
  retryCount: number;
}

// Flowers API
export const flowersApi = {
  list: () =>
    request<{
      flowers: Array<{
        id: string;
        imageUrl?: string;
        createdAt: string;
        session: { reason: string; durationSeconds: number };
        task?: FlowerTask;
      }>;
    }>('/api/flowers', {}, true),

  generate: (sessionId: string) =>
    request<{
      success: boolean;
      flower: { id: string; imageUrl: string; generatedPrompt: string };
      taskId: string;
    }>('/api/flowers/generate', {
      method: 'POST',
      body: JSON.stringify({ sessionId }),
    }, true),

  getTask: (taskId: string) =>
    request<{
      task: FlowerTask & { flower: { id: string; imageUrl?: string } };
    }>(`/api/flowers/task/${taskId}`, {}, true),

  retryTask: (taskId: string) =>
    request<{
      success: boolean;
      task: FlowerTask;
    }>(`/api/flowers/task/${taskId}/retry`, {
      method: 'POST',
    }, true),
};

// Community API Types
export interface CommunityUser {
  id: string;
  address: string;
  nickname?: string;
  avatar?: string;
  totalFocusMinutes: number;
  totalFlowers: number;
  streakDays: number;
}

export interface CommunityFlower {
  id: string;
  imageUrl?: string;
  createdAt: string;
  user: CommunityUser;
  session: { reason: string; durationSeconds: number };
  _count: { likes: number };
}

// Community API
export const communityApi = {
  getFeed: (page = 1, limit = 20) =>
    request<{ flowers: CommunityFlower[] }>(
      `/api/community/feed?page=${page}&limit=${limit}`
    ),

  getUser: (address: string) =>
    request<{ user: CommunityUser }>(`/api/community/users/${address}`),

  getUserGarden: (address: string) =>
    request<{ flowers: CommunityFlower[] }>(`/api/community/users/${address}/garden`),

  likeFlower: (flowerId: string) =>
    request<{ success: boolean; liked: boolean }>(
      `/api/community/flowers/${flowerId}/like`,
      { method: 'POST' },
      true
    ),

  getLeaderboard: (type: 'focus' | 'flowers' | 'streak' = 'focus') =>
    request<{ users: CommunityUser[] }>(`/api/community/leaderboard?type=${type}`),
};
