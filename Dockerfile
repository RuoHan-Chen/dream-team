# Backend Dockerfile for Node.js
FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Copy .env if present
COPY .env .env
EXPOSE 3000
CMD ["node", "backend.ts"] 