import { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';

const STAFF_ROLES = ['super_admin', 'ecommerce_staff', 'billing_staff'];

function AdminRoute() {
  const { isAuthenticated, isLoading, user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (!isLoading && isAuthenticated && user?.role?.name && !STAFF_ROLES.includes(user.role.name)) {
      toast.error('You do not have permission to access this area');
    }
  }, [isLoading, isAuthenticated, user]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/account/login" replace />;
  }

  const roleName = user?.role?.name;
  if (!STAFF_ROLES.includes(roleName)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export default AdminRoute;
