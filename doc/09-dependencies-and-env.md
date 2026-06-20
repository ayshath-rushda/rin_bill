# RINBILL — Dependencies & Environment Variables

---

## Backend Dependencies

```json
{
  "name": "rinbill-backend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "nodemon src/app.js",
    "start": "node src/app.js",
    "seed": "node seeds/index.js",
    "test": "jest --watchAll --detectOpenHandles"
  },
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^7.6.0",
    "jsonwebtoken": "^9.0.2",
    "bcryptjs": "^2.4.3",
    "dotenv": "^16.3.1",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "morgan": "^1.10.0",
    "cookie-parser": "^1.4.6",
    "express-rate-limit": "^7.1.0",
    "joi": "^17.11.0",
    "multer": "^1.4.5-lts.1",
    "cloudinary": "^1.41.0",
    "multer-storage-cloudinary": "^4.0.0",
    "nodemailer": "^6.9.7",
    "pdfkit": "^0.13.0",
    "exceljs": "^4.4.0",
    "uuid": "^9.0.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.1",
    "jest": "^29.7.0",
    "supertest": "^6.3.3"
  }
}
```

---

## Frontend Dependencies

```json
{
  "name": "rinbill-frontend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext js,jsx"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "axios": "^1.6.2",
    "@reduxjs/toolkit": "^2.0.0",
    "react-redux": "^9.0.0",
    "@tanstack/react-query": "^5.12.0",
    "react-hook-form": "^7.48.0",
    "@hookform/resolvers": "^3.3.2",
    "lucide-react": "^0.294.0",
    "recharts": "^2.10.0",
    "react-hot-toast": "^2.4.1",
    "react-select": "^5.8.0",
    "react-to-print": "^2.15.1",
    "date-fns": "^3.0.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.1.0"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "@vitejs/plugin-react": "^4.2.0",
    "tailwindcss": "^3.3.6",
    "postcss": "^8.4.32",
    "autoprefixer": "^10.4.16",
    "eslint": "^8.55.0",
    "eslint-plugin-react": "^7.33.0"
  }
}
```

---

## shadcn UI Components to Install

```bash
npx shadcn-ui@latest init

npx shadcn-ui@latest add button input card dialog dropdown-menu
npx shadcn-ui@latest add table form select badge avatar
npx shadcn-ui@latest add toast separator sheet tabs
npx shadcn-ui@latest add alert switch checkbox radio-group
npx shadcn-ui@latest add progress skeleton tooltip
npx shadcn-ui@latest add scroll-area command popover
```

---

## Environment Variables

### Backend `.env`

```bash
# Server
PORT=5000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/rinbill

# JWT
JWT_ACCESS_SECRET=your-access-secret-key-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-key-min-32-chars
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Email (Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@rinbill.com

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

### Frontend `.env`

```bash
VITE_API_URL=http://localhost:5000/api
VITE_CLOUDINARY_CLOUD_NAME=your-cloud-name
VITE_CLOUDINARY_UPLOAD_PRESET=rinbill_unsigned
```

---

## .gitignore

```gitignore
node_modules/
.env
.env.local
dist/
build/
.DS_Store
*.log
coverage/
```
