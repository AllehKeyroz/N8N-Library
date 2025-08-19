# Dockerfile otimizado para um projeto Next.js no Easypanel

# 1. Estágio de Dependências (Dependencies)
# Instala as dependências primeiro para aproveitar o cache do Docker.
FROM node:20-alpine AS dependencies
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install

# 2. Estágio de Build (Builder)
# Constrói a aplicação Next.js.
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
RUN npm run build

# 3. Estágio de Produção (Runner)
# Imagem final, otimizada e com apenas o necessário para rodar.
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copia os artefatos da build do estágio 'builder'
COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package.json ./package.json

# Instala apenas as dependências de produção
RUN npm install --omit=dev --ignore-scripts

EXPOSE 3000

# Define o usuário para 'nextjs' que o Next.js cria por padrão
USER nextjs

CMD ["npm", "start", "--", "-p", "3000"]
