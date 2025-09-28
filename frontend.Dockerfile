# Frontend Dockerfile - Vite build + Nginx serve
# Build stage
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* .npmrc* ./
RUN npm ci || npm install
COPY . .
RUN npm run build

# Serve stage
FROM nginx:1.27-alpine
WORKDIR /usr/share/nginx/html
COPY --from=build /app/dist .
# Basic security headers (can also be set at reverse proxy/CDN)
RUN <<'EOF' cat > /etc/nginx/conf.d/default.conf
server {
  listen 80;
  server_name _;
  add_header Content-Security-Policy "default-src 'self'; img-src 'self' data:; media-src 'self' data:" always;
  add_header X-Content-Type-Options nosniff always;
  add_header Referrer-Policy strict-origin-when-cross-origin always;
  add_header X-Frame-Options DENY always;
  add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
  root /usr/share/nginx/html;
  index index.html;
  location / {
    try_files $uri $uri/ /index.html;
  }
  location ~* \.(js|css|svg|mp4|mp3)$ {
    add_header Cache-Control "public, max-age=31536000, immutable";
  }
}
EOF
EXPOSE 80
