import { Outlet } from 'react-router-dom';

function AuthLayout() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight">RINBILL</h1>
          <p className="text-muted-foreground text-sm mt-1">Business Management Platform</p>
        </div>
        <div className="bg-card rounded-xl border shadow-sm p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default AuthLayout;
