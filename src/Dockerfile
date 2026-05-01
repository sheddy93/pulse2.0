# Multi-stage build for PulseHR

# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production && npm ci

# Copy source
COPY . .

# Build app
RUN npm run build

# Stage 2: Production
FROM node:18-alpine

WORKDIR /app

# Install serve to run production build
RUN npm install -g serve

# Copy built app from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5173', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Expose port
EXPOSE 5173

# Start app
CMD ["serve", "-s", "dist", "-l", "5173"]