# Multi-stage Dockerfile for therapy_assist

# --- Builder stage ---
FROM node:20-alpine AS builder
WORKDIR /app

# Install build dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# Copy prisma schema and generate client early
COPY prisma ./prisma
RUN npx prisma generate

# Copy all source code and build TypeScript
COPY . .
RUN npm run build:ts

# --- Runner stage ---
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Install production dependencies only
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# Copy necessary prisma runtime artifacts & cli from builder so migrations can run at container start
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/node_modules/.bin/prisma ./node_modules/.bin/prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Copy compiled app and prisma schema
COPY --from=builder /app/dist ./dist
COPY prisma ./prisma

EXPOSE 4000

# At container start: run migrations, then start the app
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
