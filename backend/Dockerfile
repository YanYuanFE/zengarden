FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma

RUN pnpm install

COPY . .

RUN npx prisma generate
RUN pnpm run build

EXPOSE 3000

CMD ["pnpm", "start"]
