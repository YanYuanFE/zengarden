# ZenGarden - 专注花园

## 项目概述

ZenGarden 是一个 Web3 专注应用，用户通过完成专注任务来收集独特的 AI 生成花朵 NFT，构建属于自己的数字花园。

**核心理念：** 专注 → 收获 → 花园

**目标赛道：** BNB Chain "Good Vibes Only" Hackathon - **Sanity Check**（心理健康）

**平台支持：** iOS / Android (Expo) + Web

---

## 1. 产品功能

### 1.1 核心流程

```
┌─────────────────────────────────────────────────────────────────┐
│                        ZenGarden 用户流程                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. 连接钱包 ──→ 2. 设置专注 ──→ 3. 开始专注 ──→ 4. 收获花朵    │
│     (Reown)       (时间+原因)      (计时器)       (Mint NFT)    │
│                                                                 │
│                              ↓                                  │
│                                                                 │
│                    5. 我的花园 ←─────────────────────────────── │
│                       (NFT Gallery)                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 功能清单

| 功能 | 描述 |
|------|------|
| **钱包登录** | Reown AppKit 连接 BNB Chain 钱包 |
| **专注设置** | 选择时长（15/25/45/60分钟）+ 输入原因 |
| **专注模式** | 全屏计时器，检测离开/切换 |
| **AI 生图** | 根据专注原因生成独特花朵图片 |
| **NFT Mint** | 将花朵图片铸造为 NFT |
| **我的花园** | 展示收集的所有花朵 NFT |
| **统计面板** | 专注时长、连续天数、花朵数量 |
| **社区动态** | 查看其他用户的专注记录和花朵 |
| **用户花园** | 浏览其他用户的花园 |
| **点赞互动** | 为喜欢的花朵点赞 |
| **排行榜** | 专注时长、花朵数量、连续天数排名 |

---

## 2. 系统架构

### 2.1 架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                          客户端                                  │
│  ┌─────────────────────────┐  ┌─────────────────────────┐      │
│  │   Expo App (iOS/Android) │  │      Web App            │      │
│  │   - React Native         │  │   - React + Vite        │      │
│  │   - AppState 检测        │  │   - visibilitychange    │      │
│  └─────────────────────────┘  └─────────────────────────┘      │
│                    │                      │                     │
│                    └──────────┬───────────┘                     │
│                               │                                 │
│                    ┌──────────▼───────────┐                     │
│                    │  共享 Web3 逻辑       │                     │
│                    │  Reown AppKit        │                     │
│                    └──────────────────────┘                     │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ZenGarden API (Hono)                          │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐    │
│  │ Auth API  │  │ Focus API │  │ Image API │  │ Stats API │    │
│  │ SIWE 验证 │  │ 记录专注   │  │ AI 生图   │  │ 用户统计   │    │
│  └───────────┘  └───────────┘  └───────────┘  └───────────┘    │
│                         │                                       │
│                    Prisma ORM                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ PostgreSQL      │  │ Gemini Relay    │  │ BNB Chain       │
│ (Prisma)        │  │ (AI 生图)       │  │ (NFT 合约)      │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

### 2.2 技术选型

| 组件 | 技术方案 | 说明 |
|------|---------|------|
| 移动端 | Expo (React Native) | iOS/Android 双端 |
| Web 端 | React + Vite | 浏览器访问 |
| Web3 连接 | Reown AppKit | 钱包连接和交互 |
| 后端框架 | Hono | 轻量级 API 服务 |
| ORM | Prisma | 类型安全的数据库访问 |
| 数据库 | PostgreSQL | 用户和专注记录 |
| AI 生图 | Gemini Relay | 复用 art-labs 服务 |
| NFT 合约 | Solidity + Hardhat | ERC-721 标准 |
| 图片存储 | Cloudflare R2 | 存储生成的花朵图片 |

---

## 3. 数据库设计 (Prisma)

### 3.1 Prisma Schema

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// 用户表
model User {
  id                String   @id @default(cuid())
  address           String   @unique
  chainId           Int
  nickname          String?  // 用户昵称
  avatar            String?  // 用户头像
  totalFocusMinutes Int      @default(0)
  totalFlowers      Int      @default(0)
  streakDays        Int      @default(0)
  lastFocusDate     DateTime?
  createdAt         DateTime @default(now())

  sessions          FocusSession[]
  flowers           Flower[]
  likes             Like[]
}

// 专注记录表
model FocusSession {
  id              String    @id @default(cuid())
  userId          String
  reason          String
  durationMinutes Int
  startedAt       DateTime
  completedAt     DateTime?
  status          String    @default("in_progress")
  interrupted     Boolean   @default(false)
  createdAt       DateTime  @default(now())

  user            User      @relation(fields: [userId], references: [id])
  flower          Flower?
}

// 花朵表
model Flower {
  id          String   @id @default(cuid())
  userId      String
  sessionId   String   @unique
  imageUrl    String
  metadataUrl String?
  tokenId     Int?
  txHash      String?
  minted      Boolean  @default(false)
  createdAt   DateTime @default(now())

  user        User         @relation(fields: [userId], references: [id])
  session     FocusSession @relation(fields: [sessionId], references: [id])
  likes       Like[]
}

// 点赞表
model Like {
  id        String   @id @default(cuid())
  userId    String
  flowerId  String
  createdAt DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id])
  flower    Flower   @relation(fields: [flowerId], references: [id])

  @@unique([userId, flowerId])
}
```

---

## 4. NFT 合约设计

### 4.1 合约概述

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ZenGardenFlower is ERC721, ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;

    constructor() ERC721("ZenGarden Flower", "ZENF") Ownable(msg.sender) {}

    function mint(address to, string memory uri) public returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        return tokenId;
    }
}
```

### 4.2 NFT Metadata 格式

```json
{
  "name": "Zen Flower #1",
  "description": "专注于「学习 React」25 分钟后收获的花朵",
  "image": "https://r2.zengarden.xyz/flowers/xxx.png",
  "attributes": [
    { "trait_type": "Focus Reason", "value": "学习 React" },
    { "trait_type": "Duration", "value": "25 minutes" },
    { "trait_type": "Date", "value": "2026-01-25" }
  ]
}
```

---

## 5. AI 生图服务

### 5.1 两步生成流程

为了生成更高质量、更具创意的花朵图片，采用两步生成流程：

```
┌─────────────────────────────────────────────────────────────────┐
│                    AI 生图两步流程                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Prompt 生成                    2. 图片生成                   │
│  ┌─────────────────────┐          ┌─────────────────────┐      │
│  │ 输入: 专注原因+时长   │    →    │ 输入: 详细 Prompt    │      │
│  │ 模型: gemini-3-flash │          │ 模型: gemini-3-pro   │      │
│  │ 输出: 详细花朵描述    │          │ 输出: 花朵图片       │      │
│  └─────────────────────┘          └─────────────────────┘      │
│                                                                 │
│  "学习 React" → "A delicate cherry    → [生成的花朵图片]        │
│                 blossom with soft                               │
│                 pink petals..."                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Gemini Relay 服务

复用 art-labs 的 Gemini Relay 服务，提供两个端点：

| 端点 | 模型 | 用途 |
|------|------|------|
| `POST /generate/text` | gemini-3-flash-preview | 生成详细 Prompt |
| `POST /generate` | gemini-3-pro-image-preview | 生成花朵图片 |

### 5.3 服务实现

```typescript
// services/flower-generator.ts
const GEMINI_RELAY_URL = process.env.GEMINI_RELAY_URL;

interface GenerateFlowerOptions {
  reason: string;
  duration: number;
  apiKey: string;
}

interface GenerateFlowerResult {
  imageBase64: string;
  mimeType: string;
  generatedPrompt: string;
}

export async function generateFlower(options: GenerateFlowerOptions): Promise<GenerateFlowerResult> {
  const { reason, duration, apiKey } = options;

  // Step 1: 生成详细的花朵描述 Prompt
  const detailedPrompt = await generateFlowerPrompt(reason, duration, apiKey);

  // Step 2: 使用详细 Prompt 生成图片
  const imageResult = await generateFlowerImage(detailedPrompt, apiKey);

  return {
    ...imageResult,
    generatedPrompt: detailedPrompt,
  };
}

// Step 1: 调用文本生成 API 生成详细 Prompt
async function generateFlowerPrompt(reason: string, duration: number, apiKey: string): Promise<string> {
  const metaPrompt = buildMetaPrompt(reason, duration);

  const response = await fetch(`${GEMINI_RELAY_URL}/generate/text`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      apiKey,
      prompt: metaPrompt,
      modelId: 'gemini-3-flash-preview',
      thinkingBudget: 0,
    }),
  });

  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || 'Failed to generate prompt');
  }

  return data.text;
}

// Step 2: 调用图片生成 API
async function generateFlowerImage(prompt: string, apiKey: string) {
  const response = await fetch(`${GEMINI_RELAY_URL}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      apiKey,
      prompt,
      modelId: 'gemini-3-pro-image-preview',
      aspectRatio: '1:1',
      imageSize: '1K',
    }),
  });

  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || 'Failed to generate image');
  }

  return {
    imageBase64: data.imageBase64,
    mimeType: data.mimeType,
  };
}
```

### 5.4 Meta Prompt 模板

Meta Prompt 用于指导 AI 生成详细的花朵描述：

```typescript
function buildMetaPrompt(reason: string, duration: number): string {
  return `You are a creative artist specializing in botanical illustrations.

Based on the following focus session, create a detailed image generation prompt for a unique flower:

Focus Reason: "${reason}"
Focus Duration: ${duration} minutes

Generate a detailed prompt (100-150 words) that describes:
1. A specific flower type that metaphorically relates to the focus theme
2. Color palette (2-3 main colors) that evokes the mood of the activity
3. Art style (watercolor, digital art, ink wash, etc.)
4. Background and composition details
5. Any subtle symbolic elements

Requirements for the output prompt:
- Single flower, centered composition
- Clean, minimal background
- Zen garden aesthetic
- Calming and rewarding visual feel
- Square format (1:1 aspect ratio)

Output ONLY the image generation prompt, no explanations.`;
}
```

### 5.5 示例输出

**输入：**
- 专注原因: "学习 React"
- 时长: 25 分钟

**Step 1 输出（生成的 Prompt）：**
```
A delicate lotus flower in soft gradient from pale blue to lavender,
symbolizing the clarity of learning. Digital watercolor style with
subtle code-like patterns in the petal veins. Clean cream background
with gentle circular ripples suggesting focus and concentration.
Single bloom centered, petals slightly unfurling to represent growth
and understanding. Zen garden aesthetic with minimalist composition.
```

**Step 2 输出：**
- 根据上述 Prompt 生成的独特花朵图片

---

## 6. 前端核心组件

### 6.1 专注计时器 (Expo)

```typescript
// components/FocusTimer.tsx
import { useState, useEffect, useRef } from 'react';
import { AppState, AppStateStatus, View, Text } from 'react-native';

interface FocusTimerProps {
  duration: number;
  onComplete: () => void;
  onInterrupt: () => void;
}

export function FocusTimer({ duration, onComplete, onInterrupt }: FocusTimerProps) {
  const [remaining, setRemaining] = useState(duration * 60);
  const appState = useRef(AppState.currentState);

  // AppState 检测（离开 App）
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (appState.current === 'active' && next.match(/inactive|background/)) {
        onInterrupt();
      }
      appState.current = next;
    });
    return () => sub.remove();
  }, [onInterrupt]);

  // 计时器
  useEffect(() => {
    if (remaining <= 0) return;
    const timer = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          onComplete();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [remaining, onComplete]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;

  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ fontSize: 72, fontFamily: 'monospace' }}>
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </Text>
    </View>
  );
}
```

### 6.2 花园展示 (Expo)

```typescript
// components/Garden.tsx
import { View, Image, Text, FlatList } from 'react-native';

interface Flower {
  id: string;
  imageUrl: string;
  reason: string;
  duration: number;
  createdAt: string;
  tokenId?: number;
}

interface GardenProps {
  flowers: Flower[];
}

export function Garden({ flowers }: GardenProps) {
  return (
    <FlatList
      data={flowers}
      numColumns={3}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View style={{ flex: 1, margin: 4 }}>
          <Image
            source={{ uri: item.imageUrl }}
            style={{ aspectRatio: 1, borderRadius: 8 }}
          />
          <Text numberOfLines={1}>{item.reason}</Text>
        </View>
      )}
    />
  );
}
```

---

## 7. API 路由设计

### 7.1 路由清单

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/auth/nonce` | 获取 SIWE nonce |
| POST | `/api/auth/verify` | 验证签名登录 |
| POST | `/api/focus/start` | 开始专注 |
| POST | `/api/focus/:id/complete` | 完成专注 |
| POST | `/api/focus/:id/interrupt` | 中断专注 |
| GET | `/api/flowers` | 获取用户花朵列表 |
| POST | `/api/flowers/:id/mint` | Mint NFT |
| GET | `/api/stats` | 获取用户统计 |
| GET | `/api/community/feed` | 社区动态流 |
| GET | `/api/community/users/:address` | 获取用户主页 |
| GET | `/api/community/users/:address/garden` | 获取用户花园 |
| POST | `/api/community/flowers/:id/like` | 点赞/取消点赞 |
| GET | `/api/community/leaderboard` | 排行榜 |

### 7.2 开始专注 API

```typescript
// POST /api/focus/start
interface StartFocusRequest {
  reason: string;
  duration: number; // 15 | 25 | 45 | 60
}

interface StartFocusResponse {
  sessionId: string;
  startedAt: string;
}
```

### 7.3 完成专注 API

```typescript
// POST /api/focus/:id/complete
interface CompleteFocusResponse {
  flower: {
    id: string;
    imageUrl: string;
  };
  stats: {
    totalMinutes: number;
    totalFlowers: number;
  };
}
```

---

## 8. 项目结构

```
zengarden/
├── apps/
│   ├── mobile/              # Expo App
│   │   ├── app/             # Expo Router 页面
│   │   ├── components/      # 共享组件
│   │   └── services/        # API 调用
│   ├── web/                 # Web App (可选)
│   │   └── ...
│   └── api/                 # 后端 API
│       ├── src/
│       │   ├── routes/      # Hono 路由
│       │   ├── services/    # 业务逻辑
│       │   └── index.ts
│       └── prisma/
│           └── schema.prisma
├── contracts/               # NFT 合约
│   └── ZenGardenFlower.sol
└── packages/
    └── shared/              # 共享类型
```

---

## 9. 环境变量

```bash
# 数据库
DATABASE_URL=postgresql://...

# Gemini Relay
GEMINI_RELAY_URL=https://gemini-relay.xxx.com
GEMINI_API_KEY=xxx

# Cloudflare R2
R2_ENDPOINT=xxx
R2_ACCESS_KEY_ID=xxx
R2_SECRET_ACCESS_KEY=xxx
R2_BUCKET_NAME=zengarden

# BNB Chain
BNB_RPC_URL=https://bsc-dataseed.binance.org
CONTRACT_ADDRESS=0x...

# Reown
REOWN_PROJECT_ID=xxx
```

---

## 10. 实现步骤

### 阶段一：基础框架

1. 初始化 monorepo 项目
2. 创建 Expo App (expo-router)
3. 配置 Reown AppKit 钱包登录
4. 创建 Hono API 项目
5. 配置 Prisma + PostgreSQL

### 阶段二：专注功能

1. 实现专注设置页面
2. 实现 FocusTimer 组件
3. 实现 AppState 离开检测
4. 实现 SIWE 后端验证
5. 实现专注记录 API

### 阶段三：AI 生图

1. 部署 Gemini Relay 服务
2. 实现花朵生成 Prompt
3. 实现图片上传到 R2
4. 完成专注后自动生成花朵

### 阶段四：NFT 功能

1. 编写 ERC-721 合约
2. 部署到 BNB Chain 测试网
3. 实现 Mint 功能
4. 生成 NFT Metadata

### 阶段五：花园展示

1. 实现花园 Gallery 页面
2. 实现统计面板
3. 优化 UI/UX

---

## 11. 黑客松要求对照

| 要求 | 实现方式 |
|------|----------|
| 项目 X 账号 | 创建 @ZenGardenApp |
| 项目 GitHub | 创建 zengarden 仓库 |
| 链上交易 | NFT Mint 交易 |
| #VibingOnBNB | 分享专注成果和花朵 |

---

## 12. 参考链接

- [Reown AppKit](https://docs.reown.com/appkit/overview)
- [Wagmi](https://wagmi.sh/)
- [SIWE](https://eips.ethereum.org/EIPS/eip-4361)
- [OpenZeppelin ERC-721](https://docs.openzeppelin.com/contracts/5.x/erc721)
- [BNB Chain](https://docs.bnbchain.org/)
```
```
```

