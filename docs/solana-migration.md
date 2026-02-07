# ZenGarden Solana 迁移技术方案

## 1. 概述


本文档描述将 ZenGarden 项目从 BNB Chain (EVM) 迁移到 Solana 的技术方案，包括钱包连接和 NFT Mint 两个核心模块的改造。

### 1.1 当前技术栈

| 模块 | 当前方案 | 说明 |
|------|----------|------|
| 钱包连接 (App) | Reown AppKit + WagmiAdapter | BNB Chain |
| 钱包连接 (Web) | Reown AppKit + WagmiAdapter | BNB Chain |
| 链交互 | viem | EVM 兼容 |
| NFT 合约 | 自定义 ERC721 | Solidity |
| 后端 Mint | privateKeyToAccount + writeContract | viem |

### 1.2 目标技术栈

| 模块 | 目标方案 | 说明 |
|------|----------|------|
| 钱包连接 (App) | Reown AppKit + SolanaAdapter | Multichain 支持 |
| 钱包连接 (Web) | Reown AppKit + SolanaAdapter | Multichain 支持 |
| 链交互 | @solana/web3.js | Solana 原生 |
| NFT 程序 | Metaplex Token Metadata | 标准 NFT |
| 后端 Mint | Umi + Metaplex | TypeScript SDK |

---

## 2. 钱包连接改造

### 2.1 React Native (App)

#### 依赖变更

**移除:**
```bash
pnpm remove @reown/appkit-wagmi-react-native wagmi viem
```

**新增:**
```bash
npx expo install @reown/appkit-react-native @reown/appkit-solana-react-native
```

#### 代码改造

**app/_layout.tsx:**

```typescript
import '@walletconnect/react-native-compat'; // 必须放在最前面

import { createAppKit } from '@reown/appkit-react-native';
import { SolanaAdapter } from '@reown/appkit-solana-react-native';
import { solana, solanaDevnet } from '@reown/appkit-react-native';

const projectId = process.env.EXPO_PUBLIC_REOWN_PROJECT_ID || '';

const metadata = {
  name: 'ZenGarden',
  description: 'Focus to harvest Flower NFTs',
  url: 'https://zengarden.xyz',
  icons: ['https://zengarden.xyz/icon.png'],
  redirect: {
    native: 'zengarden://',
  },
};

// 1. 创建 Solana Adapter
const solanaAdapter = new SolanaAdapter();

// 2. 定义支持的网络
const networks = [solana, solanaDevnet];

// 3. 创建 AppKit 实例
export const appkit = createAppKit({
  projectId,
  metadata,
  networks,
  adapters: [solanaAdapter],
  defaultNetwork: solana,
  features: {
    analytics: true,
  },
});

// 4. Provider 包装 (简化，不再需要 WagmiProvider)
function RootLayoutNav() {
  return (
    <SafeAreaProvider>
      <AppKitProvider instance={appkit}>
        <UserProvider>
          <Stack>
            {/* ... screens */}
          </Stack>
          <AppKit />
        </UserProvider>
      </AppKitProvider>
    </SafeAreaProvider>
  );
}
```

### 2.2 Web 前端

#### 依赖变更

**移除:**
```bash
pnpm remove @reown/appkit-adapter-wagmi wagmi viem
```

**新增:**
```bash
pnpm add @reown/appkit @reown/appkit-adapter-solana
```

#### 代码改造

**web/src/lib/appkit.ts:**

```typescript
import { createAppKit } from '@reown/appkit';
import { SolanaAdapter } from '@reown/appkit-adapter-solana';
import { solana, solanaDevnet } from '@reown/appkit/networks';
import type { AppKitNetwork } from '@reown/appkit/types';

const projectId = import.meta.env.VITE_REOWN_PROJECT_ID;

const metadata = {
  name: 'ZenGarden',
  description: 'Focus to harvest Flower NFTs',
  url: 'https://zengarden.xyz',
  icons: ['https://zengarden.xyz/icon.png'],
};

// 1. 创建 Solana Adapter
const solanaAdapter = new SolanaAdapter();

// 2. 定义支持的网络
const networks: [AppKitNetwork, ...AppKitNetwork[]] = [solana, solanaDevnet];

// 3. 创建 AppKit 实例
export const appkit = createAppKit({
  projectId,
  metadata,
  networks,
  adapters: [solanaAdapter],
  features: {
    analytics: true,
  },
});
```

### 2.3 Hooks 迁移

| 旧 Hook (Wagmi) | 新 Hook (AppKit) | 说明 |
|-----------------|------------------|------|
| `useAccount()` | `useAppKitAccount()` | 获取连接账户 |
| `useDisconnect()` | `useAppKit().disconnect()` | 断开连接 |
| `useSignMessage()` | `useProvider()` + 手动签名 | 签名消息 |
| `useBalance()` | 需自行实现 | 获取余额 |

**获取 Solana Provider 示例:**

```typescript
import { useProvider } from '@reown/appkit-react-native';
import { Connection, PublicKey } from '@solana/web3.js';

function useSolanaProvider() {
  const { provider } = useProvider();

  const signMessage = async (message: string) => {
    if (!provider) throw new Error('Wallet not connected');
    const encodedMessage = new TextEncoder().encode(message);
    const signature = await provider.signMessage(encodedMessage);
    return signature;
  };

  return { provider, signMessage };
}
```

---

## 3. NFT Mint 改造

### 3.1 技术选型

采用 **Umi + Metaplex Token Metadata** 方案：

| 方案 | 优点 | 缺点 | 适用场景 |
|------|------|------|----------|
| **Umi + createNft** | 灵活、直接 mint | 需自行管理 Collection | ✅ 动态生成 NFT |
| Candy Machine | 批量、预设 | 需提前上传所有资产 | 固定数量 PFP |
| Compressed NFT | 成本极低 | 复杂度高 | 大规模空投 |

ZenGarden 的 NFT 是动态生成的（基于用户专注后 AI 生成），适合使用 **Umi + createNft** 方案。

### 3.2 Metadata 结构

#### On-Chain Metadata (PDA)

```typescript
interface OnChainMetadata {
  key: number;                    // 账户类型标识
  updateAuthority: PublicKey;     // 更新权限
  mint: PublicKey;                // Mint 账户
  name: string;                   // 名称 (max 32 chars)
  symbol: string;                 // 符号 (max 10 chars)
  uri: string;                    // 指向 off-chain JSON
  sellerFeeBasisPoints: number;   // 版税 (500 = 5%)
  creators: Creator[];            // 创作者列表 (max 5)
  collection?: {                  // 所属集合
    verified: boolean;
    key: PublicKey;
  };
  primarySaleHappened: boolean;
  isMutable: boolean;
}
```

#### Off-Chain Metadata (JSON)

```json
{
  "name": "ZenGarden Flower #1",
  "symbol": "ZENF",
  "description": "A flower grown through focused meditation",
  "image": "https://r2.zengarden.xyz/flowers/xxx.png",
  "external_url": "https://zengarden.xyz",
  "attributes": [
    { "trait_type": "Focus Duration", "value": "25 minutes" },
    { "trait_type": "Reason", "value": "Deep work" },
    { "trait_type": "Rarity", "value": "Common" }
  ],
  "properties": {
    "category": "image",
    "files": [
      {
        "uri": "https://r2.zengarden.xyz/flowers/xxx.png",
        "type": "image/png"
      }
    ],
    "creators": [
      {
        "address": "CREATOR_WALLET_ADDRESS",
        "share": 100
      }
    ]
  }
}
```

### 3.3 后端改造

#### 依赖变更

**移除:**
```bash
pnpm remove viem
```

**新增:**
```bash
pnpm add @solana/web3.js @metaplex-foundation/umi @metaplex-foundation/umi-bundle-defaults @metaplex-foundation/mpl-token-metadata bs58
```

#### 新增文件: backend/src/lib/solana.ts

```typescript
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import {
  createNft,
  mplTokenMetadata
} from '@metaplex-foundation/mpl-token-metadata';
import {
  generateSigner,
  keypairIdentity,
  percentAmount,
  publicKey,
} from '@metaplex-foundation/umi';
import bs58 from 'bs58';

// 环境变量
const RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
const MINTER_PRIVATE_KEY = process.env.SOLANA_MINTER_PRIVATE_KEY!;
const COLLECTION_MINT = process.env.SOLANA_COLLECTION_MINT!;

// 初始化 Umi
const umi = createUmi(RPC_URL).use(mplTokenMetadata());

// 从 Base58 私钥创建 Keypair
const secretKey = bs58.decode(MINTER_PRIVATE_KEY);
const keypair = umi.eddsa.createKeypairFromSecretKey(secretKey);
umi.use(keypairIdentity(keypair));

export interface MintResult {
  signature: string;
  mint: string;
}

export async function mintNFT(
  recipientAddress: string,
  metadataUri: string,
  name: string
): Promise<MintResult> {
  // 生成新的 mint 账户
  const mint = generateSigner(umi);

  // 创建 NFT
  const { signature } = await createNft(umi, {
    mint,
    name,
    symbol: 'ZENF',
    uri: metadataUri,
    sellerFeeBasisPoints: percentAmount(5), // 5% 版税
    tokenOwner: publicKey(recipientAddress),
    collection: {
      key: publicKey(COLLECTION_MINT),
      verified: false, // 后续需要 verify
    },
    creators: [
      {
        address: keypair.publicKey,
        verified: true,
        share: 100,
      },
    ],
  }).sendAndConfirm(umi);

  return {
    signature: bs58.encode(signature),
    mint: mint.publicKey.toString(),
  };
}

// 验证签名 (用于登录认证)
export function verifySignature(
  message: string,
  signature: string,
  publicKey: string
): boolean {
  const nacl = require('tweetnacl');
  const messageBytes = new TextEncoder().encode(message);
  const signatureBytes = bs58.decode(signature);
  const publicKeyBytes = bs58.decode(publicKey);

  return nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);
}
```

#### 修改文件: backend/src/services/flower-worker.ts

```typescript
// 替换 EVM mint 为 Solana mint
import { mintNFT } from '../lib/solana.js';
import { uploadJson } from '../lib/r2.js';

// ... 在生成花朵后 ...

// 上传 metadata JSON
const metadata = {
  name: `ZenGarden Flower #${flower.id}`,
  symbol: 'ZENF',
  description: `A flower grown through ${session.durationSeconds / 60} minutes of focused ${session.reason}`,
  image: imageUrl,
  external_url: 'https://zengarden.xyz',
  attributes: [
    { trait_type: 'Focus Duration', value: `${Math.floor(session.durationSeconds / 60)} minutes` },
    { trait_type: 'Reason', value: session.reason },
  ],
  properties: {
    category: 'image',
    files: [{ uri: imageUrl, type: 'image/png' }],
  },
};

const metadataUrl = await uploadJson(metadata, `metadata/${flower.id}.json`);

// Mint NFT
const { signature, mint } = await mintNFT(
  user.address, // Solana 地址 (Base58)
  metadataUrl,
  metadata.name
);

// 更新数据库
await prisma.flower.update({
  where: { id: flower.id },
  data: {
    metadataUrl,
    txHash: signature,
    tokenId: mint, // Solana 使用 mint address 作为唯一标识
  },
});
```

### 3.4 签名认证改造

#### 修改文件: backend/src/routes/auth.ts

```typescript
import { verifySignature } from '../lib/solana.js';

// 验证签名 (登录)
auth.post('/verify', async (c) => {
  const { address, signature, nonce } = await c.req.json();

  // 获取存储的 nonce
  const storedNonce = nonceStore.get(address.toLowerCase());
  if (!storedNonce || storedNonce !== nonce) {
    return c.json({ error: 'Invalid nonce' }, 400);
  }

  // 验证 Solana 签名
  const isValid = verifySignature(nonce, signature, address);
  if (!isValid) {
    return c.json({ error: 'Invalid signature' }, 401);
  }

  // 生成 JWT...
});
```

---

## 4. 数据库改造

### 4.1 Schema 变更

```prisma
model User {
  id        String   @id @default(cuid())
  address   String   @unique  // 改为 Solana Base58 地址
  // ... 其他字段不变
}

model Flower {
  id          String   @id @default(cuid())
  tokenId     String?  // 改为 Solana Mint Address (Base58)
  txHash      String?  // 改为 Solana Transaction Signature
  metadataUrl String?
  // ... 其他字段不变
}
```

### 4.2 地址格式

| 链 | 格式 | 示例 |
|----|------|------|
| EVM (BNB) | 0x + 40 hex | `0x1234...abcd` |
| Solana | Base58 | `7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU` |

---

## 5. 环境变量变更

### 5.1 移除

```env
# EVM 相关
MINTER_PRIVATE_KEY=0x...      # EVM 私钥
NFT_CONTRACT_ADDRESS=0x...    # ERC721 合约地址
```

### 5.2 新增

```env
# Solana 相关
SOLANA_RPC_URL=https://your-quicknode-endpoint.solana-mainnet.quiknode.pro/xxx
SOLANA_MINTER_PRIVATE_KEY=Base58EncodedPrivateKey
SOLANA_COLLECTION_MINT=CollectionNFTMintAddress
```

---

## 6. Collection NFT 创建

在开始 mint 之前，需要先创建一个 Collection NFT：

```typescript
// scripts/create-collection.ts
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { createNft, mplTokenMetadata } from '@metaplex-foundation/mpl-token-metadata';
import { generateSigner, keypairIdentity, percentAmount } from '@metaplex-foundation/umi';

async function createCollection() {
  const umi = createUmi('YOUR_RPC_URL').use(mplTokenMetadata());
  // ... 设置 identity

  const collectionMint = generateSigner(umi);

  await createNft(umi, {
    mint: collectionMint,
    name: 'ZenGarden Flowers',
    symbol: 'ZENF',
    uri: 'https://r2.zengarden.xyz/collection.json',
    sellerFeeBasisPoints: percentAmount(5),
    isCollection: true, // 标记为 Collection NFT
  }).sendAndConfirm(umi);

  console.log('Collection Mint:', collectionMint.publicKey.toString());
  // 将此地址保存到环境变量 SOLANA_COLLECTION_MINT
}
```

---

## 7. 迁移步骤

### Phase 1: 准备工作
1. [x] 申请 Solana RPC (QuickNode / Helius)
2. [x] 创建 Minter 钱包并充值 SOL
3. [x] 创建 Collection NFT
4. [x] 上传 Collection Metadata 到 R2

### Phase 2: 后端改造
1. [x] 安装 Solana 依赖
2. [x] 实现 `lib/solana.ts`
3. [x] 修改签名验证逻辑
4. [x] 修改 flower-worker NFT mint 逻辑
5. [x] 更新数据库 Schema
6. [ ] 本地测试 (devnet)

### Phase 3: 前端改造 (Web)
1. [x] 安装新依赖
2. [x] 替换 AppKit 配置
3. [x] 修改 Hooks 调用
4. [x] 修改签名逻辑
5. [ ] 测试钱包连接

### Phase 4: App 改造
1. [x] 安装新依赖
2. [x] 替换 AppKit 配置
3. [x] 修改 Hooks 调用
4. [x] 修改签名逻辑
5. [ ] 测试钱包连接

### Phase 5: 部署上线
1. [ ] Devnet 全流程测试
2. [ ] Mainnet 环境变量配置
3. [ ] 部署后端
4. [ ] 部署前端
5. [ ] 发布 App 更新

---

## 8. 成本对比

| 项目 | BNB Chain | Solana | 节省 |
|------|-----------|--------|------|
| NFT Mint | ~$0.05 | ~$0.002 | 96% |
| 交易确认 | ~3s | ~0.4s | 87% |
| RPC 成本 | 中等 | 低 (免费额度多) | - |

---

## 9. 风险与注意事项

1. **钱包兼容性**: Phantom、Solflare、Backpack 等主流钱包均支持
2. **RPC 稳定性**: 建议使用付费 RPC (QuickNode/Helius) 而非公共节点
3. **签名格式**: Solana 使用 Ed25519，与 EVM 的 secp256k1 不同
4. **地址格式**: 需更新所有地址验证逻辑
5. **历史数据**: 旧用户需重新连接钱包（地址体系不同）

---

## 10. 参考资料

- [Reown AppKit Multichain 文档](https://docs.reown.com)
- [Metaplex Token Metadata 文档](https://developers.metaplex.com/token-metadata)
- [Umi Framework 文档](https://developers.metaplex.com/umi)
- [QuickNode Solana NFT 教程](https://www.quicknode.com/guides/solana-development/nfts)
- [Solana Cookbook](https://solanacookbook.com)
