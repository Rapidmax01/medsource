FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Set production env vars for Vite build
ENV VITE_API_URL=https://medsource-api.fly.dev/api
ENV VITE_GOOGLE_CLIENT_ID=111903154251-g4e39rv729m1bb83p2bu70ba2iqe5iud.apps.googleusercontent.com

RUN npm run build

# Serve with nginx
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

# SPA nginx config
RUN echo 'server { \
    listen 80; \
    server_name _; \
    root /usr/share/nginx/html; \
    index index.html; \
    gzip on; \
    gzip_vary on; \
    gzip_min_length 256; \
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript image/svg+xml; \
    location /assets/ { expires 1y; add_header Cache-Control "public, immutable"; } \
    location /sw.js { expires off; add_header Cache-Control "no-cache, no-store, must-revalidate"; } \
    location / { try_files $uri $uri/ /index.html; } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
