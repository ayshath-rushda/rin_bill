import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

const AuthLayout = lazy(() => import('@/layouts/AuthLayout'));
const AdminLayout = lazy(() => import('@/layouts/AdminLayout'));
const CustomerLayout = lazy(() => import('@/layouts/CustomerLayout'));
const ProtectedRoute = lazy(() => import('@/routes/ProtectedRoute'));
const AdminRoute = lazy(() => import('@/routes/AdminRoute'));

const LoginPage = lazy(() => import('@/pages/customer/auth/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/customer/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/customer/auth/ForgotPasswordPage'));
const ProfilePage = lazy(() => import('@/pages/customer/account/ProfilePage'));

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
          <Route index element={<Navigate to="/account/login" replace />} />
          <Route path="products" element={<div className="p-6"><h1 className="text-2xl font-bold">Products</h1><p className="text-muted-foreground">Coming soon</p></div>} />

          {/* Customer Auth Pages */}
          <Route element={<AuthLayout />}>
            <Route path="account/login" element={<LoginPage />} />
            <Route path="account/register" element={<RegisterPage />} />
            <Route path="account/forgot-password" element={<ForgotPasswordPage />} />
          </Route>

          {/* Customer Protected Pages */}
          <Route element={<ProtectedRoute />}>
            <Route path="account/profile" element={<ProfilePage />} />
            <Route path="account/orders" element={<div className="p-6"><h1 className="text-2xl font-bold">My Orders</h1><p className="text-muted-foreground">Coming soon</p></div>} />
          </Route>
        </Route>

        {/* Admin Portal */}
        <Route element={<AdminRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="admin" element={<div className="p-6"><h1 className="text-2xl font-bold">Dashboard</h1><p className="text-muted-foreground">Coming soon</p></div>} />
          </Route>
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

export default AppRoutes;
