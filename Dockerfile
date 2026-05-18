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
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --ignore-scripts
COPY . .
RUN pnpm run build
EXPOSE 3000
CMD ["node", "dist/index.js"]
