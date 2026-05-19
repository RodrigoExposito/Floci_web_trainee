FROM node:20-slim AS builder
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@9

# Copy content from _content_desktop (needed for build)
COPY _content_desktop/ ./_content_desktop/

# Copy frontend
COPY frontend/ ./frontend/

WORKDIR /app/frontend
RUN pnpm install --frozen-lockfile
RUN node copy-content.mjs
RUN pnpm build

# ── Serve with nginx ──────────────────────────────────────────────────────────
FROM nginx:alpine AS runner
COPY --from=builder /app/frontend/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
