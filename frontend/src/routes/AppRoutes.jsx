import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import ErrorBoundary from '@/components/shared/ErrorBoundary';

const AuthLayout = lazy(() => import('@/layouts/AuthLayout'));
const AdminLayout = lazy(() => import('@/layouts/AdminLayout'));
const CustomerLayout = lazy(() => import('@/layouts/CustomerLayout'));
const ProtectedRoute = lazy(() => import('@/routes/ProtectedRoute'));
const AdminRoute = lazy(() => import('@/routes/AdminRoute'));

const HomePage = lazy(() => import('@/pages/customer/HomePage'));
const ProductListing = lazy(() => import('@/pages/customer/ProductListing'));
const ProductDetailPage = lazy(() => import('@/pages/customer/ProductDetailPage'));
const LoginPage = lazy(() => import('@/pages/customer/auth/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/customer/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/customer/auth/ForgotPasswordPage'));
const ProfilePage = lazy(() => import('@/pages/customer/account/ProfilePage'));
const CartPage = lazy(() => import('@/pages/customer/CartPage'));
const CheckoutPage = lazy(() => import('@/pages/customer/CheckoutPage'));
const OrderConfirmation = lazy(() => import('@/pages/customer/OrderConfirmation'));
const AddressesPage = lazy(() => import('@/pages/customer/account/AddressesPage'));
const OrdersPage = lazy(() => import('@/pages/customer/account/OrdersPage'));
const OrderDetailPage = lazy(() => import('@/pages/customer/account/OrderDetailPage'));

const OrderList = lazy(() => import('@/pages/admin/orders/OrderList'));
const OrderDetail = lazy(() => import('@/pages/admin/orders/OrderDetail'));

const POSBilling = lazy(() => import('@/pages/admin/billing/POSBilling'));
const InvoiceList = lazy(() => import('@/pages/admin/billing/InvoiceList'));
const InvoiceDetail = lazy(() => import('@/pages/admin/billing/InvoiceDetail'));
const InvoicePrint = lazy(() => import('@/pages/admin/billing/InvoicePrint'));

const CategoryList = lazy(() => import('@/pages/admin/products/CategoryList'));
const BrandList = lazy(() => import('@/pages/admin/products/BrandList'));
const ProductList = lazy(() => import('@/pages/admin/products/ProductList'));
const ProductForm = lazy(() => import('@/pages/admin/products/ProductForm'));

const InventoryPage = lazy(() => import('@/pages/admin/inventory/InventoryPage'));
const InventoryHistory = lazy(() => import('@/pages/admin/inventory/InventoryHistory'));

const CustomerList = lazy(() => import('@/pages/admin/customers/CustomerList'));
const SliderList = lazy(() => import('@/pages/admin/cms/SliderList'));
const BannerList = lazy(() => import('@/pages/admin/cms/BannerList'));
const FeaturedProducts = lazy(() => import('@/pages/admin/cms/FeaturedProducts'));

const PageLoader = () => (
  <div className="p-6 space-y-4">
    <Skeleton className="h-8 w-64" />
    <Skeleton className="h-96 w-full" />
  </div>
);

function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <h1 className="text-6xl font-bold text-muted-foreground">404</h1>
      <p className="text-lg text-muted-foreground mt-2">Page not found</p>
    </div>
  );
}

function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Customer Website */}
          <Route element={<CustomerLayout />}>
          <Route index element={<HomePage />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="products" element={<ProductListing />} />
          <Route path="products/:slug" element={<ProductDetailPage />} />

          {/* Customer Auth Pages */}
          <Route element={<AuthLayout />}>
            <Route path="account/login" element={<LoginPage />} />
            <Route path="account/register" element={<RegisterPage />} />
            <Route path="account/forgot-password" element={<ForgotPasswordPage />} />
          </Route>

          {/* Customer Protected Pages */}
          <Route element={<ProtectedRoute />}>
            <Route path="checkout" element={<ErrorBoundary><CheckoutPage /></ErrorBoundary>} />
            <Route path="order-confirmation/:orderId" element={<OrderConfirmation />} />
            <Route path="account/profile" element={<ProfilePage />} />
            <Route path="account/orders" element={<OrdersPage />} />
            <Route path="account/orders/:orderId" element={<OrderDetailPage />} />
            <Route path="account/addresses" element={<AddressesPage />} />
          </Route>
        </Route>

        {/* Admin Portal */}
        <Route element={<AdminRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="admin" element={<div className="p-6"><h1 className="text-2xl font-bold">Dashboard</h1><p className="text-muted-foreground">Coming soon</p></div>} />
            <Route path="admin/products" element={<ProductList />} />
            <Route path="admin/products/new" element={<ProductForm />} />
            <Route path="admin/products/:id/edit" element={<ProductForm />} />
            <Route path="admin/categories" element={<CategoryList />} />
            <Route path="admin/brands" element={<BrandList />} />
            <Route path="admin/inventory" element={<InventoryPage />} />
            <Route path="admin/inventory/history" element={<InventoryHistory />} />
            <Route path="admin/cms/sliders" element={<SliderList />} />
            <Route path="admin/cms/banners" element={<BannerList />} />
            <Route path="admin/cms/featured-products" element={<FeaturedProducts />} />
            <Route path="admin/orders" element={<OrderList />} />
            <Route path="admin/orders/:id" element={<OrderDetail />} />
            <Route path="admin/billing" element={<POSBilling />} />
            <Route path="admin/billing/invoices" element={<InvoiceList />} />
            <Route path="admin/billing/invoices/:id" element={<InvoiceDetail />} />
            <Route path="admin/billing/invoices/:id/print" element={<InvoicePrint />} />
            <Route path="admin/customers" element={<CustomerList />} />
          </Route>
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

export default AppRoutes;
