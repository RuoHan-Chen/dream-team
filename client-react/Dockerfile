# Frontend Dockerfile for Vite/React
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Copy .env.local if present
COPY .env.local .env.local
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY --from=build /app/.env.local /usr/share/nginx/html/.env.local
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"] 