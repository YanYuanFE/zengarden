import type { SIWXConfig, SIWXSession } from '@reown/appkit-react-native';
import { storage } from './storage';
import { authApi } from '@/services/api';

const SESSIONS_KEY = 'zengarden_siwx_sessions';

export const siwxConfig: SIWXConfig = {
  createMessage: async (input) => {
    console.log('createMessage input:', JSON.stringify(input));

    const now = new Date();
    const expirationTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const nonce = Math.random().toString(36).substring(2) + Date.now().toString(36);

    const data = {
      ...input,
      domain: 'zengarden.pixstudio.art',
      uri: 'https://zengarden.pixstudio.art',
      version: '1',
      nonce,
      statement: 'Welcome to ZenGarden! Please sign to verify your wallet ownership.',
      issuedAt: now.toISOString(),
      expirationTime: expirationTime.toISOString(),
    };

    // Build SIWE message string
    const chainIdNum = input.chainId?.split(':')[1] || '56';
    const messageStr = [
      `${data.domain} wants you to sign in with your Ethereum account:`,
      data.accountAddress,
      '',
      data.statement,
      '',
      `URI: ${data.uri}`,
      `Version: ${data.version}`,
      `Chain ID: ${chainIdNum}`,
      `Nonce: ${data.nonce}`,
      `Issued At: ${data.issuedAt}`,
      `Expiration Time: ${data.expirationTime}`,
    ].join('\n');

    console.log('createMessage result:', messageStr);

    return {
      ...data,
      toString: () => messageStr,
    };
  },

  addSession: async (session) => {
    console.log('addSession:', session);

    // Send to backend to verify signature
    try {
      const message = typeof session.data.toString === 'function'
        ? session.data.toString()
        : JSON.stringify(session.data);

      await authApi.verify({
        address: session.data.accountAddress,
        chainId: parseInt(session.data.chainId.split(':')[1]),
        message,
        signature: session.signature,
      });
    } catch (error) {
      console.error('Backend verify failed:', error);
      throw error;
    }

    // Save session locally
    const sessions = await storage.getItem<SIWXSession[]>(SESSIONS_KEY) || [];
    sessions.push(session);
    await storage.setItem(SESSIONS_KEY, sessions);
  },

  // Custom signature verification, skip AppKit internal verification, verified by backend
  verifyMessage: async (params) => {
    console.log('verifyMessage:', params);
    return true;
  },

  revokeSession: async (chainId, address) => {
    const sessions = await storage.getItem<SIWXSession[]>(SESSIONS_KEY) || [];
    const filtered = sessions.filter(
      (s) => !(s.data.chainId === chainId && s.data.accountAddress === address)
    );
    await storage.setItem(SESSIONS_KEY, filtered);
  },

  setSessions: async (sessions) => {
    await storage.setItem(SESSIONS_KEY, sessions);
  },

  getSessions: async (chainId, address) => {
    const sessions = await storage.getItem<SIWXSession[]>(SESSIONS_KEY) || [];
    const now = new Date();

    return sessions.filter((s) => {
      if (s.data.chainId !== chainId || s.data.accountAddress !== address) {
        return false;
      }
      if (s.data.expirationTime && new Date(s.data.expirationTime) < now) {
        return false;
      }
      return true;
    });
  },

  getRequired: () => true,
  signOutOnDisconnect: true,
};
