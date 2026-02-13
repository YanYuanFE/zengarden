# ZenGarden — Focus to Bloom

## What is ZenGarden?

ZenGarden is a Web3 productivity app on BNB Chain that transforms focus sessions into AI-generated flower NFTs. The core loop is simple: **Focus → AI generates a unique flower → Mint as NFT → Grow your garden.**

Every flower is one-of-a-kind, shaped by what you focused on and how long you stayed committed. Over time, users cultivate a personal digital garden — a living, visual record of their productivity journey.

## Problem

Digital distractions make sustained focus harder than ever. Existing productivity tools rely purely on self-discipline, offering no tangible reward for deep work. Meanwhile, most Web3 projects lack real-world utility that everyday users can relate to.

ZenGarden bridges this gap — making focus feel rewarding, AI feel personal, and Web3 feel useful.

## Core Features

- **Focus Timer** — Set a duration and reason, stay focused, complete the session
- **AI Flower Generation** — Each completed session triggers a two-step AI pipeline that creates a unique flower artwork based on your focus context
- **NFT Minting** — Flowers are automatically minted as ERC-721 tokens on BNB Chain
- **Personal Garden** — A visual gallery of all your focus-earned flowers, with full metadata and on-chain proof
- **Social Layer** — Community feed, leaderboards, user profiles, and likes — turning solitary focus into a shared experience
- **Cross-Platform** — Available on both web and mobile (iOS/Android)

## Tech Architecture

| Layer | Stack |
|-------|-------|
| Web Frontend | React 19, Vite 7, Tailwind CSS 4, Wagmi, Reown AppKit |
| Mobile App | Expo 54, React Native 0.81, Wagmi, Reown AppKit |
| Backend | Hono, Prisma 7, PostgreSQL, Background Worker |
| AI Pipeline | Google Gemini (Flash + Pro) |
| Storage | Cloudflare R2 |
| Smart Contract | Solidity 0.8.28, OpenZeppelin 5, ERC-721 |
| Chain | BNB Smart Chain (BSC) |
| Deployment | Docker Compose (Node.js + Nginx) |

## How AI is Used

ZenGarden uses a **two-step AI generation pipeline** powered by Google Gemini:

1. **Prompt Generation (Gemini Flash)** — Analyzes the user's focus reason and duration to generate a detailed, contextual flower description (100-150 words)
2. **Image Generation (Gemini Pro)** — Creates a unique 1:1 flower artwork from that description

This means every flower is semantically tied to the user's actual focus activity — a 2-hour deep coding session produces a different flower than a 30-minute reading session. The AI doesn't generate random art; it generates *meaningful* art.

## On-Chain Integration

- **Chain:** BNB Smart Chain (BSC, chainId 56)
- **Contract:** `ZenGardenFlower` — ERC-721 with minter role pattern (deployed at `0x4b347Cc44A751EAd7d6dA9578eD2D3d4cB731Ff3`)
- **Authentication:** Nonce-based ECDSA signature verification (Sign-In with Ethereum)
- **Minting:** Server-side minting via Viem — users pay zero gas, the backend mints on their behalf
- **Metadata:** Stored on Cloudflare R2 with on-chain URI reference
- **Explorer:** All transactions verifiable on [BscScan](https://bscscan.com/address/0x4b347Cc44A751EAd7d6dA9578eD2D3d4cB731Ff3)

## Screenshots

<!-- TODO: Add screenshots -->

## Links

- **Live Demo:** [https://zengarden.pixstudio.art](https://zengarden.pixstudio.art)
- **Smart Contract:** [BscScan](https://bscscan.com/address/0x4b347Cc44A751EAd7d6dA9578eD2D3d4cB731Ff3)

---

# ZenGarden — 专注即绽放

## 项目介绍

ZenGarden 是一款基于 BNB Chain 的 Web3 效率应用，将专注时光转化为 AI 生成的花卉 NFT。核心循环很简单：**专注 → AI 生成独特花卉 → 铸造为 NFT → 培育你的花园。**

每朵花都独一无二，由你的专注内容和时长塑造。日积月累，用户将培育出一座属于自己的数字花园——一份鲜活的、可视化的生产力旅程记录。

## 解决的问题

数字干扰让持续专注变得前所未有的困难。现有效率工具完全依赖自律，对深度工作没有任何实质回报。与此同时，大多数 Web3 项目缺乏普通用户能感知的真实使用场景。

ZenGarden 弥合了这个断层——让专注有回报，让 AI 有温度，让 Web3 有用处。

## 核心功能

- **专注计时器** — 设定时长和原因，保持专注，完成会话
- **AI 花卉生成** — 每次完成专注后触发两步 AI 管线，根据专注内容生成独特的花卉画作
- **NFT 铸造** — 花卉自动铸造为 BNB Chain 上的 ERC-721 代币
- **个人花园** — 展示所有专注所得花卉的可视化画廊，包含完整元数据和链上证明
- **社交层** — 社区动态、排行榜、用户主页和点赞——将孤独的专注变成共享体验
- **跨平台** — 同时支持网页端和移动端（iOS/Android）

## 技术架构

| 层级 | 技术栈 |
|------|--------|
| 网页前端 | React 19, Vite 7, Tailwind CSS 4, Wagmi, Reown AppKit |
| 移动应用 | Expo 54, React Native 0.81, Wagmi, Reown AppKit |
| 后端 | Hono, Prisma 7, PostgreSQL, 后台任务处理器 |
| AI 管线 | Google Gemini (Flash + Pro) |
| 存储 | Cloudflare R2 |
| 智能合约 | Solidity 0.8.28, OpenZeppelin 5, ERC-721 |
| 链 | BNB Smart Chain (BSC) |
| 部署 | Docker Compose (Node.js + Nginx) |

## AI 如何使用

ZenGarden 使用基于 Google Gemini 的**两步 AI 生成管线**：

1. **提示词生成（Gemini Flash）** — 分析用户的专注原因和时长，生成详细的、有上下文的花卉描述（100-150 词）
2. **图像生成（Gemini Pro）** — 根据该描述创建独一无二的 1:1 花卉画作

这意味着每朵花都与用户的实际专注活动语义关联——2 小时的深度编程会话和 30 分钟的阅读会话会产生完全不同的花。AI 不是生成随机艺术，而是生成*有意义的*艺术。

## 链上集成

- **链：** BNB Smart Chain（BSC，chainId 56）
- **合约：** `ZenGardenFlower` — 带有铸造者角色模式的 ERC-721（部署于 `0x4b347Cc44A751EAd7d6dA9578eD2D3d4cB731Ff3`）
- **认证：** 基于 Nonce 的 ECDSA 签名验证（Sign-In with Ethereum）
- **铸造：** 通过 Viem 进行服务端铸造——用户零 Gas 费，后端代为铸造
- **元数据：** 存储在 Cloudflare R2，链上引用 URI
- **浏览器：** 所有交易可在 [BscScan](https://bscscan.com/address/0x4b347Cc44A751EAd7d6dA9578eD2D3d4cB731Ff3) 上验证

## 截图

<!-- TODO: 补充截图 -->

## 链接

- **在线演示：** [https://zengarden.pixstudio.art](https://zengarden.pixstudio.art)
- **智能合约：** [BscScan](https://bscscan.com/address/0x4b347Cc44A751EAd7d6dA9578eD2D3d4cB731Ff3)
