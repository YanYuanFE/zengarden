const API_URL = '';
const TOKEN_KEY = 'zengarden_jwt_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  requireAuth = false
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (requireAuth) {
    const token = getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

export interface User {
  id: string;
  address: string;
  totalFocusMinutes: number;
  totalFlowers: number;
  streakDays: number;
}

export const authApi = {
  getNonce: (address: string) =>
    request<{ nonce: string }>(`/api/auth/nonce?address=${address}`),

  verify: (params: {
    address: string;
    chainId?: number;
    message?: string;
    signature?: string;
  }) =>
    request<{ success: boolean; token: string; user: User }>('/api/auth/verify', {
      method: 'POST',
      body: JSON.stringify(params),
    }),

  getMe: () => request<{ user: User }>('/api/auth/me', {}, true),

  logout: () => request<{ success: boolean }>('/api/auth/logout', {
    method: 'POST',
  }, true),
};

export const focusApi = {
  start: (reason: string, duration: number) =>
    request<{ sessionId: string; startedAt: string }>('/api/focus/start', {
      method: 'POST',
      body: JSON.stringify({ reason, duration }),
    }, true),

  complete: (sessionId: string) =>
    request<{ success: boolean; session: { id: string; reason: string; duration: number } }>(
      `/api/focus/${sessionId}/complete`,
      { method: 'POST' },
      true
    ),

  interrupt: (sessionId: string) =>
    request<{ success: boolean }>(`/api/focus/${sessionId}/interrupt`, {
      method: 'POST',
    }, true),
};

export interface Flower {
  id: string;
  imageUrl?: string;
  createdAt: string;
  txHash?: string;
  tokenId?: string;
  metadataUrl?: string;
  minted?: boolean;
  prompt?: string;
  session: { reason: string; durationSeconds: number };
  task?: FlowerTask;
}

export interface FlowerTask {
  id: string;
  status: 'pending' | 'generating' | 'uploading' | 'minting' | 'completed' | 'failed';
  error?: string;
  retryCount: number;
  flower?: Flower;
}

export const flowersApi = {
  list: () => request<{ flowers: Flower[] }>('/api/flowers', {}, true),

  generate: (sessionId: string) =>
    request<{ success: boolean; flower: { id: string; sessionId: string }; taskId: string }>(
      '/api/flowers/generate',
      { method: 'POST', body: JSON.stringify({ sessionId }) },
      true
    ),

  getTask: (taskId: string) =>
    request<{ task: FlowerTask & { flower: Flower } }>(`/api/flowers/task/${taskId}`, {}, true),

  retryTask: (taskId: string) =>
    request<{ success: boolean; task: FlowerTask }>(`/api/flowers/task/${taskId}/retry`, {
      method: 'POST',
    }, true),

  getMetadata: (flowerId: string) =>
    request<{ metadata: Record<string, unknown> }>(`/api/community/flowers/${flowerId}/metadata`),
};

// Community API
export interface CommunityUser {
  id: string;
  address: string;
  nickname?: string;
  avatar?: string;
  totalFocusMinutes: number;
  totalFlowers: number;
  streakDays: number;
  createdAt?: string;
}

export interface CommunityFlower {
  id: string;
  imageUrl: string;
  createdAt: string;
  txHash?: string;
  tokenId?: string;
  metadataUrl?: string;
  minted?: boolean;
  user: Pick<CommunityUser, 'id' | 'address' | 'nickname' | 'avatar'>;
  session: { reason: string; durationSeconds: number };
  _count: { likes: number };
}

export const communityApi = {
  getFeed: (page = 1, limit = 20) =>
    request<{ flowers: CommunityFlower[] }>(`/api/community/feed?page=${page}&limit=${limit}`),

  getUser: (address: string) =>
    request<{ user: CommunityUser }>(`/api/community/users/${address}`),

  getUserGarden: (address: string, page = 1, limit = 20) =>
    request<{ flowers: CommunityFlower[] }>(`/api/community/users/${address}/garden?page=${page}&limit=${limit}`),

  likeFlower: (flowerId: string) =>
    request<{ liked: boolean }>(`/api/community/flowers/${flowerId}/like`, {
      method: 'POST',
    }, true),

  getLeaderboard: (type: 'focus' | 'flowers' | 'streak' = 'focus', limit = 20) =>
    request<{ users: CommunityUser[]; type: string }>(`/api/community/leaderboard?type=${type}&limit=${limit}`),
};
