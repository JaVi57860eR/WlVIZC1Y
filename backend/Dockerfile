# ==========================================
# 1. BUILD STAGE
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./
COPY nest-cli.json ./
COPY tsconfig*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Argument to select which app to build (auth-service, product-service, etc.)
ARG APP_NAME

# Build the specified application
RUN npx nest build ${APP_NAME}

# ==========================================
# 2. PRODUCTION STAGE
# ==========================================
FROM node:20-alpine AS runner

WORKDIR /usr/src/app

ARG APP_NAME
ENV APP_NAME=${APP_NAME}
ENV NODE_ENV=production

COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy built application assets from builder stage
COPY --from=builder /usr/src/app/dist/apps/${APP_NAME} ./dist/apps/${APP_NAME}

# Expose port (overridden by ENV if needed)
EXPOSE 3000

# Start application
CMD node dist/apps/${APP_NAME}/main.js
