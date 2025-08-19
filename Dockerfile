# 1. Install dependencies
FROM node:20-slim AS deps
WORKDIR /app

COPY package.json package-lock.json* ./
# Use --omit=dev to not install devDependencies
RUN npm ci --omit=dev

# 2. Build the app
FROM node:20-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Don't run postinstall scripts
ENV npm_config_bignore_prepublish=true
RUN npm run build

# 3. Production image
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED 1

COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/package.json ./
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules


# Expose the port the app runs on
EXPOSE 3000

# Start the app
CMD ["npm", "start"]
