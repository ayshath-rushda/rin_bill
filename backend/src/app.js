import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import path from 'path';
import env from './config/env.js';
import { generalLimiter } from './middleware/rateLimiter.js';
import errorHandler from './middleware/errorHandler.js';
import authRoutes from './routes/auth.routes.js';
import categoryRoutes from './routes/category.routes.js';
import brandRoutes from './routes/brand.routes.js';
import productRoutes from './routes/product.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import inventoryRoutes from './routes/inventory.routes.js';
import cmsRoutes from './routes/cms.routes.js';
import cartRoutes from './routes/cart.routes.js';
import addressRoutes from './routes/address.routes.js';
import orderRoutes from './routes/order.routes.js';
import billingRoutes from './routes/billing.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import reportRoutes from './routes/report.routes.js';

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));
app.use(morgan('dev'));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(path.resolve('public/uploads')));
if (env.NODE_ENV !== 'test') {
  app.use(generalLimiter);
}

app.get('/api/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok' } });
});

app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/products', productRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/cms', cmsRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reports', reportRoutes);

app.use(errorHandler);

export default app;
