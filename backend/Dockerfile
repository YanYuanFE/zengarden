# Backend Dockerfile
FROM node:22-alpine AS base

# Install pnpm (stable version)
RUN npm install -g pnpm@9

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma

# Install dependencies
FROM base AS deps
COPY --from=base /app/package.json /app/pnpm-lock.yaml ./
COPY --from=base /app/prisma ./prisma
RUN pnpm install --frozen-lockfile

# Production image
FROM base AS runner

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build application
RUN pnpm run build

# Environment
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Run database migrations and start server
# First resolve the initial migration if needed (for existing databases), then deploy
CMD ["sh", "-c", "npx prisma migrate resolve --applied 0_init 2>/dev/null || true && npx prisma migrate deploy && pnpm start"]
