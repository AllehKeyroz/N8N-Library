# 1. Estágio de Dependências
FROM node:20-slim AS deps
WORKDIR /app

# Copia os arquivos de definição de dependências
COPY package.json package-lock.json* ./

# Instala todas as dependências (incluindo devDependencies)
RUN echo "--- Instalando todas as dependências ---" && \
    npm install

# 2. Estágio de Build
FROM node:20-slim AS builder
WORKDIR /app

# Copia as dependências pré-instaladas do estágio 'deps'
COPY --from=deps /app/node_modules ./node_modules
# Copia o restante do código da aplicação
COPY . .

# Constrói a aplicação Next.js
RUN echo "--- Executando o build da aplicação ---" && \
    npm run build

# 3. Estágio de Produção (Runner)
FROM node:20-slim AS runner
WORKDIR /app

# Define o ambiente para produção
ENV NODE_ENV=production

# Cria um usuário não-root para segurança
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copia os arquivos de definição de dependências para instalar apenas as de produção
COPY package.json package-lock.json* ./

# Instala apenas as dependências de produção
RUN echo "--- Instalando dependências de produção ---" && \
    npm install --omit=dev --ignore-scripts

# Copia os artefatos de build do estágio 'builder'
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/next.config.ts ./
# A pasta 'public' não é usada, então não será copiada.

# Muda a propriedade dos arquivos para o usuário não-root
RUN chown -R nextjs:nodejs /app/.next

# Define o usuário para executar a aplicação
USER nextjs

# Expõe a porta que a aplicação vai rodar
EXPOSE 3000

# Comando para iniciar a aplicação
CMD ["npm", "run", "start"]
