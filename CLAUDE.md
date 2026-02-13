# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ZenGarden is a Web3 focus app on **BNB Chain (BSC)** where users complete focus sessions to earn AI-generated flower NFTs. The core loop: **Connect Wallet → Focus → AI generates flower image → Mint NFT → View Garden**. Originally built for BNB Chain, briefly migrated to Solana, and has since migrated back to BNB Chain (BSC, chainId 56). Historical migration notes remain in `docs/solana-migration.md`.

## Repository Structure

Monorepo with four independent packages (no shared workspace root — each has its own `pnpm-lock.yaml`):

| Directory | What | Stack |
|-----------|------|-------|
| `web/` | Web frontend | React 19, Vite 7, Tailwind CSS 4, React Router, TanStack Query, Wagmi, Reown AppKit |
| `app/` | Mobile app | Expo 54, React Native 0.81, Expo Router, Wagmi, Reown AppKit |
| `backend/` | API server | Hono, Prisma 7, PostgreSQL, Viem (BSC minting), tsx (dev) |
| `nft/` | Smart contracts | Solidity 0.8.28, Hardhat 3, OpenZeppelin 5 (deployed on BSC) |

## Development Commands

### Backend (`cd backend`)
```bash
pnpm run dev          # Start dev server (tsx watch)
pnpm run build        # Compile TypeScript
pnpm run start        # Run compiled server (node dist/src/index.js)
pnpm run db:generate  # Generate Prisma client
pnpm run db:push      # Push schema to database
pnpm run db:migrate   # Run Prisma migrations
pnpm run db:studio    # Open Prisma Studio GUI
```

### Web (`cd web`)
```bash
pnpm run dev      # Vite dev server
pnpm run build    # tsc + vite build
pnpm run lint     # ESLint
pnpm run preview  # Preview production build
```

### Mobile App (`cd app`)
```bash
pnpm start        # Expo dev server
pnpm run ios      # iOS simulator
pnpm run android  # Android emulator
```

### Smart Contracts (`cd nft`)
```bash
npx hardhat compile                    # Compile contracts
npx hardhat test                       # Run contract tests
npx hardhat ignition deploy <module>   # Deploy via Ignition
```

## Architecture

### Backend (`backend/src/`)
- **Entry:** `index.ts` — Hono server with CORS, logger, health checks, route mounting, and background worker startup
- **Routes:** `routes/auth.ts`, `focus.ts`, `flowers.ts`, `stats.ts`, `community.ts` — mounted under `/api/*`
- **Services:** `services/flower-generator.ts` (two-step AI image generation via Gemini), `services/flower-worker.ts` (background task processor for flower generation + NFT minting on BSC)
- **Libs:** `lib/prisma.ts` (DB client), `lib/jwt.ts` (auth tokens), `lib/r2.ts` (Cloudflare R2 storage), `lib/nft.ts` (BSC/EVM minting via Viem), `lib/abi.ts` (contract ABI), `lib/solana.ts` (legacy — Solana minting via Umi/Metaplex, currently unused)
- **Generated:** `generated/prisma/` — Prisma client output (do not edit)

### Flower Generation Pipeline
1. User completes focus session → `FlowerTask` created with status `pending`
2. Background worker picks up task → status `generating`
3. Gemini Flash generates a detailed prompt from focus reason/duration
4. Gemini Pro generates flower image from that prompt
5. Image uploaded to Cloudflare R2 → status `uploading`
6. NFT minted on BSC via Viem (`lib/nft.ts`) → status `minting` → `completed`

### Database (Prisma schema at `backend/prisma/schema.prisma`)
Key models: `User` (wallet address, chainId defaults to 56/BSC, stats), `FocusSession` (focus records), `Flower` (generated images + NFT data), `FlowerTask` (async task queue with retry), `Like` (social interactions)

### Web3 Integration
- **Chain:** BNB Smart Chain (BSC, chainId 56)
- **Wallet connection:** Reown AppKit with Wagmi adapter (EVM-only, both web and mobile)
- **Auth flow:** Nonce-based ECDSA signature verification via Viem `verifyMessage` (secp256k1)
- **NFT contract:** `ZenGardenFlower.sol` — ERC-721 with minter role pattern (owner can add/remove minters), deployed on BSC
- **Explorer:** Transaction links point to BscScan (`https://bscscan.com/tx/...`)

### Web Frontend (`web/src/`)
- Uses `@` path alias (mapped to `src/`)
- Provider hierarchy: `QueryClientProvider` → `Web3Provider` (Wagmi + BSC) → `UserProvider` → `MobileWrapper` → `BrowserRouter`
- Pages: Login, Home, Focus, Garden, Community, Leaderboard, User profile
- UI primitives in `components/ui/` using CVA + tailwind-merge pattern

## Key API Routes

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/auth/nonce` | Get auth nonce |
| POST | `/api/auth/verify` | Verify EVM wallet signature |
| POST | `/api/focus/start` | Start focus session |
| POST | `/api/focus/:id/complete` | Complete session (triggers flower generation) |
| GET | `/api/flowers` | List user's flowers |
| GET | `/api/community/feed` | Community feed |
| GET | `/api/community/leaderboard` | Leaderboard |

## Environment Variables

Backend requires:
- **Core:** `DB_URL`, `JWT_SECRET`, `PORT`
- **AI:** `GEMINI_API_KEY`, `GEMINI_RELAY_URL`
- **Storage (R2):** `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL`
- **NFT Minting (BSC):** `MINTER_PRIVATE_KEY`, `NFT_CONTRACT_ADDRESS`
- **Legacy (Solana, unused):** `SOLANA_RPC_URL`, `SOLANA_MINTER_PRIVATE_KEY`, `SOLANA_COLLECTION_MINT`

## Deployment

Docker Compose with two services: `backend` (Node.js) and `web` (Nginx static). Uses `dokploy-network` external Docker network. Health check at `/api/health`.
