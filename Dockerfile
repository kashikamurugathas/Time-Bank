# Time Bank Platform - Multi-Stage Microservices Dockerfile
FROM node:22-alpine AS base
WORKDIR /app

# Install build dependencies for better-sqlite3 compilation
RUN apk add --no-cache python3 make g++ gcc sqlite-dev

COPY package.json ./
RUN npm install

COPY . .

# Build Vite frontend assets
RUN npm run build

EXPOSE 3000 5001 5002 5003 5004 5005 5006 5007 5008 5009 5010 5011 5012 5013 5014 5015

ENV NODE_ENV=production
ENV PORT=3000

# Default command starts the unified API Gateway and supervised microservices stack
CMD ["npm", "start"]
