# RINBILL — Code Conventions, Database Queries, Search & File Upload

---

## 1. Code Conventions

### Naming Conventions

| Category | Convention | Example |
|---|---|---|
| **Files/Directories** | kebab-case | `product-list.jsx`, `order.service.js` |
| **React components** | PascalCase | `ProductList.jsx`, `DataTable.jsx` |
| **Hooks** | camelCase, `use` prefix | `useAuth`, `useDebounce` |
| **Mongoose models** | PascalCase, singular | `User`, `Product`, `OrderItem` |
| **Model files** | PascalCase | `User.js`, `StockTransaction.js` |
| **Controllers** | camelCase, object export | `{ list, getById, create, update, remove }` |
| **Routes** | kebab-case | `product.routes.js`, `order.routes.js` |
| **Variables** | camelCase | `accessToken`, `totalRevenue` |
| **Constants/Enums** | UPPER_SNAKE_CASE | `ORDER_STATUSES.NEW`, `PAYMENT_METHODS.CASH` |
| **Database fields** | camelCase | `sellingPrice`, `lowStockLimit` |
| **API endpoints** | kebab-case, plural | `/api/products`, `/api/stock-transactions` |
| **Environment variables** | UPPER_SNAKE_CASE | `JWT_ACCESS_SECRET`, `MONGODB_URI` |

### Import Order Rules

```javascript
// 1. Node built-ins
import path from 'path';
// blank line
// 2. Third-party packages
import express from 'express';
import jwt from 'jsonwebtoken';
// blank line
// 3. Internal modules (absolute)
import { AppError } from '#utils/AppError.js';
import { paginate } from '#utils/paginate.js';
// blank line
// 4. Relative imports
import Product from '../models/Product.js';
// blank line
// 5. Types/Constants
import { ORDER_STATUSES } from '../constants/orderStatus.js';
```

### ESLint Config

```javascript
// backend/.eslintrc.cjs
module.exports = {
  env: { node: true, es2022: true, jest: true },
  extends: ['eslint:recommended'],
  parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
  rules: {
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'prefer-const': 'error',
    'no-var': 'error',
    'eqeqeq': ['error', 'always'],
  },
};
```

```javascript
// frontend/.eslintrc.cjs
module.exports = {
  env: { browser: true, es2022: true },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
  ],
  parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
  plugins: ['react'],
  settings: { react: { version: 'detect' } },
  rules: {
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'warn',
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
  },
};
```

### Prettier Config

```javascript
// .prettierrc
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "bracketSpacing": true,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

### Component Conventions

```javascript
// 1. Imports
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import DataTable from '@/components/DataTable';

// 2. PropTypes (or JSDoc if JS)
ProductList.propTypes = {
  categorySlug: PropTypes.string,
  showFilters: PropTypes.bool,
};

// 3. Default exports for pages, named exports for components
export default function ProductList({ categorySlug, showFilters = true }) {
  // 4. Hooks at top
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // 5. Queries
  const { data, isLoading } = useQuery(['products', { search, page }], () =>
    productApi.getAll({ search, page })
  );

  // 6. Derived state
  const totalPages = data?.meta?.totalPages || 0;

  // 7. Handlers
  const handleSearch = (value) => { setSearch(value); setPage(1); };

  // 8. Render
  if (isLoading) return <Skeleton className="h-96" />;
  return (
    <div>
      <SearchInput value={search} onChange={handleSearch} />
      <DataTable columns={columns} data={data?.data || []} />
      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}
```

---

## 2. Database Queries & Indexes

### Mongoose Population Paths

| Query | Paths to Populate |
|---|---|
| `Product.find()` | `category` (name), `brand` (name) |
| `Order.findById()` | `customer` (name, email, phone), `items`, `shippingAddress` |
| `OrderItem.find()` | `product` (name, code, images) |
| `Invoice.findById()` | `customer` (name, email), `order` (orderNumber) |
| `StockTransaction.find()` | `product` (name, code), `user` (name) |

### Compound Indexes

```javascript
// Product
productSchema.index({ name: 'text', description: 'text' }); // text search
productSchema.index({ category: 1, status: 1 });
productSchema.index({ status: 1, createdAt: -1 });
productSchema.index({ sellingPrice: 1 });
productSchema.index({ code: 1 }, { unique: true });

// Order
orderSchema.index({ customer: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ orderNumber: 1 }, { unique: true });

// StockTransaction
stockTransactionSchema.index({ product: 1, createdAt: -1 });
stockTransactionSchema.index({ type: 1, createdAt: -1 });
stockTransactionSchema.index({ user: 1 });

// Notification
notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

// ActivityLog
activityLogSchema.index({ user: 1, createdAt: -1 });
activityLogSchema.index({ resource: 1, resourceId: 1 });

// Cart
cartSchema.index({ user: 1 }, { unique: true });
```

### Common Aggregation Pipelines

#### Sales Report (Daily)

```javascript
// reports/sales.report.js
export async function getSalesReport(period = 'daily', from, to) {
  const groupFormat = {
    daily: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
    weekly: { $dateToString: { format: '%Y-W%V', date: '$createdAt' } },
    monthly: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
    yearly: { $dateToString: { format: '%Y', date: '$createdAt' } },
  };

  const match = { status: 'delivered' };
  if (from || to) {
    match.createdAt = {};
    if (from) match.createdAt.$gte = new Date(from);
    if (to) match.createdAt.$lte = new Date(to);
  }

  const result = await Order.aggregate([
    { $match: match },
    {
      $group: {
        _id: groupFormat[period],
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: '$total' },
        averageOrderValue: { $avg: '$total' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return result;
}
```

#### Top Products

```javascript
export async function getTopProducts(limit = 10) {
  return OrderItem.aggregate([
    {
      $group: {
        _id: '$product',
        totalQuantity: { $sum: '$quantity' },
        totalRevenue: { $sum: '$total' },
        orderCount: { $sum: 1 },
      },
    },
    { $sort: { totalQuantity: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: '_id',
        as: 'product',
      },
    },
    { $unwind: '$product' },
    {
      $project: {
        _id: 1,
        name: '$product.name',
        code: '$product.code',
        image: { $arrayElemAt: ['$product.images', 0] },
        totalQuantity: 1,
        totalRevenue: 1,
        orderCount: 1,
      },
    },
  ]);
}
```

### N+1 Query Prevention

**Bad (N+1):**
```javascript
const orders = await Order.find();
for (const order of orders) {
  const items = await OrderItem.find({ order: order._id }); // N queries
}
```

**Good (single query + population):**
```javascript
// Single query with population
const orders = await Order.find()
  .populate({
    path: 'items',
    populate: { path: 'product', select: 'name code images sellingPrice' }
  })
  .lean();

// Or batch query
const orders = await Order.find().lean();
const orderIds = orders.map(o => o._id);
const items = await OrderItem.find({ order: { $in: orderIds } }).lean();

// Group items by order in JavaScript
const itemsByOrder = items.reduce((acc, item) => {
  (acc[item.order.toString()] = acc[item.order.toString()] || []).push(item);
  return acc;
}, {});
const ordersWithItems = orders.map(o => ({ ...o, items: itemsByOrder[o._id.toString()] || [] }));
```

---

## 3. Search Specification

### Backend Search Implementation

```javascript
// controllers/product.controller.js
export async function list(req, res) {
  const {
    search,
    category,
    brand,
    minPrice,
    maxPrice,
    sortBy = '-createdAt',
    page = 1,
    limit = 10,
    status,
  } = req.query;

  const filter = {};

  // Text search
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { code: { $regex: search, $options: 'i' } },
      { sku: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { vehicleCompatibility: { $regex: search, $options: 'i' } },
    ];
  }

  // Filters
  if (category) filter.category = category;
  if (brand) filter.brand = brand;
  if (minPrice || maxPrice) {
    filter.sellingPrice = {};
    if (minPrice) filter.sellingPrice.$gte = Number(minPrice);
    if (maxPrice) filter.sellingPrice.$lte = Number(maxPrice);
  }

  // Admin sees all statuses; public only sees active
  const isAdmin = req.user?.role !== 'customer' && req.user;
  if (!isAdmin) filter.status = 'active';
  else if (status) filter.status = status;

  // Sort
  const sortMap = {
    price_asc: { sellingPrice: 1 },
    price_desc: { sellingPrice: -1 },
    newest: { createdAt: -1 },
    name: { name: 1 },
    best_seller: { soldCount: -1 },
  };
  const sort = sortMap[sortBy] || { createdAt: -1 };

  const result = await paginate(Product, filter, {
    page: Number(page),
    limit: Math.min(Number(limit), 100),
    sort,
    populate: 'category brand',
  });

  res.json({ success: true, ...result });
}
```

### MongoDB Text Index (Alternative)

```javascript
// For larger datasets, use MongoDB $text index instead of $regex
productSchema.index(
  { name: 'text', description: 'text', vehicleCompatibility: 'text' },
  { weights: { name: 10, vehicleCompatibility: 5, description: 1 } }
);

// Query
if (search) {
  filter.$text = { $search: search };
  // Add relevance score to sort
  projection = { score: { $meta: 'textScore' } };
  sort = { score: { $meta: 'textScore' } };
}
```

### POS Barcode/Quick Search

```javascript
// controllers/billing.controller.js
export async function searchProduct(req, res) {
  const { q } = req.query;
  if (!q || q.length < 2) {
    return res.json({ success: true, data: [] });
  }

  const products = await Product.find({
    status: 'active',
    stock: { $gt: 0 },
    $or: [
      { code: { $regex: `^${q}`, $options: 'i' } },
      { sku: { $regex: `^${q}`, $options: 'i' } },
      { name: { $regex: q, $options: 'i' } },
    ],
  })
    .select('name code sku sellingPrice stock images')
    .limit(20)
    .lean();

  res.json({ success: true, data: products });
}
```

### Frontend Search Component Pattern

```javascript
// hooks/useDebounce.js
export default function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

// Usage in product listing
function ProductFilters() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);

  const { data } = useQuery(
    ['products', { search: debouncedSearch, category, page }],
    () => productApi.getAll({ search: debouncedSearch, category, page })
  );

  return (
    <Input
      placeholder="Search products..."
      value={search}
      onChange={(e) => setSearch(e.target.value)}
    />
  );
}
```

---

## 4. File Upload Details

### Cloudinary Configuration

```javascript
// config/cloudinary.js
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: (req, file) => {
      // Route-based folder selection
      if (req.baseUrl.includes('products')) return 'rinbill/products';
      if (req.baseUrl.includes('sliders')) return 'rinbill/sliders';
      if (req.baseUrl.includes('banners')) return 'rinbill/banners';
      if (req.baseUrl.includes('categories')) return 'rinbill/categories';
      if (req.baseUrl.includes('brands')) return 'rinbill/brands';
      return 'rinbill/misc';
    },
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    transformation: [{ quality: 'auto', fetch_format: 'auto' }],
    max_file_size: 5 * 1024 * 1024, // 5MB
  },
});

export const upload = multer({ storage });

export default cloudinary;
```

### Upload Endpoint

```javascript
// routes/product.routes.js
import { upload } from '../config/cloudinary.js';

router.post(
  '/:id/images',
  auth,
  rbac('product.update'),
  upload.array('images', 10), // max 10 images
  productController.uploadImages
);
```

### Controller for Multi-Image Upload

```javascript
// controllers/product.controller.js
export async function uploadImages(req, res, next) {
  const { id } = req.params;
  const product = await Product.findById(id);
  if (!product) {
    throw new AppError('Product not found', 404, 'NOT_FOUND');
  }

  const urls = req.files.map(file => file.path);
  product.images.push(...urls);
  await product.save();

  res.status(201).json({
    success: true,
    data: { images: product.images },
    message: `${req.files.length} image(s) uploaded`,
  });
}

export async function deleteImage(req, res, next) {
  const { id, imageId } = req.params;
  const product = await Product.findById(id);
  if (!product) {
    throw new AppError('Product not found', 404, 'NOT_FOUND');
  }

  // Extract Cloudinary public_id from URL
  const imageUrl = product.images.find(url => url.includes(imageId));
  if (imageUrl) {
    const publicId = imageUrl.split('/').slice(-2).join('/').split('.')[0];
    await cloudinary.uploader.destroy(publicId);
  }

  product.images = product.images.filter(url => !url.includes(imageId));
  await product.save();

  res.json({ success: true, data: { images: product.images } });
}
```

### Frontend File Upload Component

```javascript
// components/FileUpload.jsx
import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function FileUpload({ onUpload, maxFiles = 5, accept = { 'image/*': [] } }) {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles) => {
    const remaining = maxFiles - files.length;
    const newFiles = acceptedFiles.slice(0, remaining);
    setFiles(prev => [...prev, ...newFiles.map(f => Object.assign(f, {
      preview: URL.createObjectURL(f),
    }))]);
  }, [files, maxFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept, maxFiles });

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    setUploading(true);
    const formData = new FormData();
    files.forEach(f => formData.append('images', f));

    try {
      await onUpload(formData);
      toast.success('Upload complete');
      setFiles([]);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div {...getRootProps()} className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer">
        <input {...getInputProps()} />
        <Upload className="mx-auto h-10 w-10 text-muted-foreground" />
        {isDragActive ? <p>Drop files here...</p> : <p>Drag & drop or click to select</p>}
      </div>

      {files.length > 0 && (
        <div className="mt-4 grid grid-cols-4 gap-2">
          {files.map((file, i) => (
            <div key={i} className="relative">
              <img src={file.preview} className="h-20 w-20 object-cover rounded" />
              <button onClick={() => removeFile(i)} className="absolute -top-1 -right-1 bg-destructive text-white rounded-full p-0.5">
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {files.length > 0 && (
        <Button onClick={handleUpload} disabled={uploading} className="mt-4">
          {uploading ? 'Uploading...' : `Upload ${files.length} file(s)`}
        </Button>
      )}
    </div>
  );
}
```

---

## 5. Performance & Caching

### Backend Caching

```javascript
// Simple in-memory cache for settings/feature flags
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 min

export async function getCachedSetting(key) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.value;
  }
  const setting = await Setting.findOne({ key });
  cache.set(key, { value: setting?.value, timestamp: Date.now() });
  return setting?.value;
}

// Invalidate on write
export async function setSetting(key, value) {
  await Setting.findOneAndUpdate({ key }, { value }, { upsert: true });
  cache.delete(key);
}
```

### Frontend Code Splitting

```javascript
// App.jsx — Lazy load admin routes
import { lazy, Suspense } from 'react';

const AdminLayout = lazy(() => import('@/layouts/AdminLayout'));
const Dashboard = lazy(() => import('@/pages/admin/Dashboard'));
const ProductList = lazy(() => import('@/pages/admin/products/ProductList'));
const POSBilling = lazy(() => import('@/pages/admin/billing/POSBilling'));

function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="products" element={<ProductList />} />
          <Route path="billing" element={<POSBilling />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
```

### Image Optimization

- Cloudinary auto-format + auto-quality (`f_auto`, `q_auto`)
- Use Cloudinary transformations for thumbnails: `w_200,h_200,c_fill`
- Frontend: lazy load images with `loading="lazy"`
- Use `<picture>` element or `srcSet` for responsive images

### Pagination Approach

Use **offset-based pagination** (page + limit) for simplicity. For large datasets (+100K records), consider **cursor-based pagination** using `_id` or `createdAt`.

```javascript
// Cursor-based alternative
// ?cursor=665a1b2c3d4e5f6a7b8c9d0e&limit=10
const products = await Product.find({
  ...filter,
  _id: { $lt: cursor }, // or { $gt: cursor } for forward
})
  .sort({ _id: -1 })
  .limit(limit + 1)
  .lean();

const hasNext = products.length > limit;
const data = hasNext ? products.slice(0, limit) : products;
const nextCursor = data.length > 0 ? data[data.length - 1]._id : null;
```
