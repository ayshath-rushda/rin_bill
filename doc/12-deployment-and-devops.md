# RINBILL — Deployment & DevOps

---

## Docker Setup

### Dockerfile (Backend)

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:20-alpine
WORKDIR /app
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
COPY --from=builder /app/node_modules ./node_modules
COPY src/ ./src/
COPY package*.json ./
USER appuser
EXPOSE 5000
CMD ["node", "src/app.js"]
```

### Dockerfile (Frontend)

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### nginx.conf

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;
    gzip_min_length 1000;

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API proxy (if using same domain)
    location /api/ {
        proxy_pass http://backend:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    restart: unless-stopped
    env_file: ./backend/.env
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongo:27017/rinbill
    depends_on:
      - mongo
    networks:
      - rinbill-network

  frontend:
    build: ./frontend
    restart: unless-stopped
    ports:
      - "80:80"
    depends_on:
      - backend
    networks:
      - rinbill-network

  mongo:
    image: mongo:7
    restart: unless-stopped
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_ROOT_USER}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_ROOT_PASS}
    volumes:
      - mongo-data:/data/db
    networks:
      - rinbill-network

volumes:
  mongo-data:

networks:
  rinbill-network:
    driver: bridge
```

---

## Production Hardening

### Backend

| Concern | Implementation |
|---|---|
| **Process manager** | PM2 with cluster mode: `pm2 start src/app.js -i max` |
| **Logging** | Winston → log files + log rotation |
| **Secrets** | Environment variables via `.env` (never committed) |
| **HTTPS** | Terminated at nginx/reverse proxy (Let's Encrypt) |
| **CORS** | Whitelist only production frontend URL |
| **Rate limiting** | Stricter limits: 30 req/min for auth, 100 req/min for API |
| **DB** | MongoDB Atlas (prod) or self-hosted with auth + TLS |
| **Health check** | `GET /health` endpoint returns `{ status: "ok", uptime }` |
| **Graceful shutdown** | Handle SIGTERM: close DB, finish requests, exit |

### PM2 Ecosystem File

```javascript
// backend/ecosystem.config.js
module.exports = {
  apps: [{
    name: 'rinbill-api',
    script: 'src/app.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    max_memory_restart: '500M',
    autorestart: true,
  }],
};
```

### Environment-Specific Config

```javascript
// backend/src/config/env.js
const config = {
  development: {
    mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/rinbill',
    corsOrigin: 'http://localhost:5173',
    rateLimit: { windowMs: 15 * 60 * 1000, max: 100 },
  },
  test: {
    mongodbUri: process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/rinbill_test',
    corsOrigin: '*',
    rateLimit: { windowMs: 15 * 60 * 1000, max: 1000 },
  },
  production: {
    mongodbUri: process.env.MONGODB_URI,
    corsOrigin: process.env.FRONTEND_URL,
    rateLimit: { windowMs: 15 * 60 * 1000, max: 100 },
  },
};

export default config[process.env.NODE_ENV || 'development'];
```

---

## CI/CD (GitHub Actions)

### `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
        working-directory: ./backend
      - run: npm run lint
        working-directory: ./backend
      - run: npm ci
        working-directory: ./frontend
      - run: npm run lint
        working-directory: ./frontend

  test-backend:
    runs-on: ubuntu-latest
    services:
      mongo:
        image: mongo:7
        ports:
          - 27017:27017
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
        working-directory: ./backend
      - run: npm test
        working-directory: ./backend
        env:
          MONGODB_URI: mongodb://localhost:27017/rinbill_test
          JWT_ACCESS_SECRET: test-access-secret
          JWT_REFRESH_SECRET: test-refresh-secret
          NODE_ENV: test

  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
        working-directory: ./frontend
      - run: npm test
        working-directory: ./frontend

  build:
    needs: [lint, test-backend, test-frontend]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: docker compose build
      - run: docker compose up -d
      - run: sleep 10 && curl -f http://localhost/api/health
      - run: docker compose down
```

### `.github/workflows/deploy.yml`

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to VPS
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /opt/rinbill
            git pull origin main
            docker compose down
            docker compose build
            docker compose up -d
            docker system prune -f
```

---

## Hosting Options

| Option | Cost | Complexity | Best For |
|---|---|---|---|
| **VPS** (DigitalOcean, Hetzner, Linode) | $6-20/mo | Medium | Production, full control |
| **Railway / Render** | $5-20/mo | Low | Quick deployment, auto-deploy from GitHub |
| **AWS EC2 + DocumentDB** | $30+/mo | High | Enterprise, scaling |
| **Fly.io** | $5-15/mo | Low | Easy Docker deployments |

---

## MongoDB Setup

### Atlas (Production Recommendation)

1. Create free M0 cluster
2. Network access: whitelist VPS IP only
3. Database access: create app user with readWrite on `rinbill` DB
4. Connection string: `mongodb+srv://<user>:<pass>@cluster.mongodb.net/rinbill?retryWrites=true&w=majority`

### Self-Hosted with Docker

```yaml
# docker-compose.yml addition for auth
mongo:
  image: mongo:7
  environment:
    MONGO_INITDB_ROOT_USERNAME: ${MONGO_ROOT_USER}
    MONGO_INITDB_ROOT_PASSWORD: ${MONGO_ROOT_PASS}
  volumes:
    - mongo-data:/data/db
    - ./mongo-init.js:/docker-entrypoint-initdb.d/mongo-init.js:ro
```

```javascript
// mongo-init.js
db.createUser({
  user: 'rinbill_app',
  pwd: 'secure-password',
  roles: [{ role: 'readWrite', db: 'rinbill' }],
});
```

---

## Cloudinary Setup

1. Create a Cloudinary account (free tier: 25GB storage, 25GB bandwidth)
2. Create an upload preset:
   - **Signing Mode:** Unsigned (for direct frontend upload) or Signed (for backend upload)
   - **Folder:** `rinbill/products` / `rinbill/banners` / `rinbill/sliders`
   - **Auto-tagging:** enabled
3. For frontend upload: use `cloudinary-react` widget or direct to backend endpoint

---

## Domain & SSL

```bash
# Using nginx + Let's Encrypt (Certbot)
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d rinbill.com -d www.rinbill.com
```

### nginx SSL Config

```nginx
server {
    listen 443 ssl http2;
    server_name rinbill.com;

    ssl_certificate /etc/letsencrypt/live/rinbill.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/rinbill.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security headers
    add_header Strict-Transport-Security "max-age=63072000" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

---

## Backup Strategy

### MongoDB

```bash
# Daily backup via cron (crontab -e)
0 3 * * * mongodump --uri="$MONGODB_URI" --out=/backups/rinbill/$(date +\%Y-\%m-\%d)
0 5 * * * find /backups/rinbill -type d -mtime +30 -exec rm -rf {} \;

# Upload to S3-compatible storage
0 4 * * * tar -czf /tmp/rinbill-db.tar.gz /backups/rinbill/$(date +\%Y-\%m-\%d) \
  && aws s3 cp /tmp/rinbill-db.tar.gz s3://rinbill-backups/
```

### Cloudinary

- Cloudinary provides automatic backup to cloud storage (S3, GCS)
- Enable in Cloudinary Settings → Backups → Daily/Monthly

### Environment Variables

```bash
# Backup .env to encrypted vault or 1Password
cp /opt/rinbill/backend/.env /backups/env/rinbill-env-$(date +\%Y-\%m-\%d).backup
```

---

## Monitoring & Alerts

| Tool | What to Monitor |
|---|---|
| PM2 monit | CPU/memory per process |
| MongoDB Atlas metrics | Connections, ops/sec, disk usage |
| Uptime Robot | HTTP uptime check every 5 min |
| Sentry (optional) | Error tracking, performance |
| Cloudinary dashboard | Storage usage, bandwidth |
| Server: `htop`, `df -h` | CPU, RAM, disk |

---

## Deployment Checklist

- [ ] All `.env` values set for production
- [ ] `NODE_ENV=production`
- [ ] MongoDB connection string updated to Atlas/self-hosted
- [ ] CORS origin set to production frontend URL
- [ ] Rate limit tuned for production
- [ ] Helmet security headers enabled
- [ ] HTTPS configured (Let's Encrypt)
- [ ] Docker images built and tested
- [ ] PM2 configured and tested for crash recovery
- [ ] Log rotation configured
- [ ] Database backup cron set up
- [ ] Health check endpoint verified
- [ ] Frontend build minified with code splitting
- [ ] Git tag created for release version
- [ ] Smoke test: full purchase flow
- [ ] Smoke test: admin login + CRUD
- [ ] Smoke test: POS billing flow
