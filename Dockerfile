# ── Stage 1: Build frontend ───────────────────────────────────────────────────
FROM node:20-slim AS frontend-builder
WORKDIR /app

RUN npm install -g pnpm@9

# Copy content and frontend source
COPY _content_desktop/ ./_content_desktop/
COPY frontend/package.json frontend/pnpm-lock.yaml ./frontend/
WORKDIR /app/frontend
RUN pnpm install --frozen-lockfile
COPY frontend/ .
RUN node copy-content.mjs
RUN pnpm build
# frontend/dist now has the SPA

# ── Stage 2: Backend runtime ──────────────────────────────────────────────────
FROM node:20-slim
WORKDIR /app

# Install AWS CLI v2 + python3
RUN apt-get update && apt-get install -y --no-install-recommends \
      curl unzip ca-certificates python3 \
    && curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o /tmp/awscliv2.zip \
    && unzip /tmp/awscliv2.zip -d /tmp \
    && /tmp/aws/install \
    && rm -rf /tmp/awscliv2.zip /tmp/aws \
    && rm -rf /var/lib/apt/lists/*

RUN npm install -g pnpm@9

# Install backend deps and build
COPY package.json pnpm-lock.yaml .npmrc ./
RUN pnpm install --frozen-lockfile --ignore-scripts
COPY src/ ./src/
COPY tsconfig.json ./
RUN pnpm run build

# Copy frontend build into public/
COPY --from=frontend-builder /app/frontend/dist ./public/

EXPOSE 3000
CMD ["node", "dist/index.js"]
