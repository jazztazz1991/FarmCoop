FROM node:20-alpine
WORKDIR /app

# Copy root package files for shared dependencies
COPY package.json package-lock.json ./
COPY prisma ./prisma/

RUN npm ci --omit=dev
RUN npx prisma generate

# Copy bridge source
COPY bridge ./bridge/
# Copy shared domain/lib code that bridge may import
COPY src/domain ./src/domain/
COPY src/lib ./src/lib/
COPY tsconfig.json ./

EXPOSE 3001
CMD ["npx", "tsx", "bridge/index.ts"]
