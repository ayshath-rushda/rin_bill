import { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { ShoppingCart, Menu, X, User, LogOut, Package } from 'lucide-react';
import { logout } from '@/features/auth/authSlice';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

function CustomerLayout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const [mobileOpen, setMobileOpen] = useState(false);

  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b bg-card sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </Button>
            <Link to="/" className="text-xl font-bold">
              RINBILL
            </Link>
            <nav className="hidden lg:flex items-center gap-1 ml-6">
              <Link to="/" className="text-sm px-3 py-2 rounded-md hover:bg-accent">
                Home
              </Link>
              <Link to="/products" className="text-sm px-3 py-2 rounded-md hover:bg-accent">
                Products
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <Link to="/cart">
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="size-5" />
              </Button>
            </Link>

            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2">
                    <Avatar className="size-8">
                      <AvatarFallback>{initials || 'U'}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm hidden sm:inline">{user?.name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigate('/account/profile')}>
                    <User className="size-4 mr-2" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/account/orders')}>
                    <Package className="size-4 mr-2" />
                    Orders
                  </DropdownMenuItem>
                  {user?.role?.name === 'super_admin' && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate('/admin')}>
                        <User className="size-4 mr-2" />
                        Admin Panel
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="size-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="default" size="sm" onClick={() => navigate('/account/login')}>
                Login
              </Button>
            )}
          </div>
        </div>

        {mobileOpen && (
          <div className="lg:hidden border-t bg-card px-4 py-3 space-y-1">
            <Link
              to="/"
              className="block text-sm px-3 py-2 rounded-md hover:bg-accent"
              onClick={() => setMobileOpen(false)}
            >
              Home
            </Link>
            <Link
              to="/products"
              className="block text-sm px-3 py-2 rounded-md hover:bg-accent"
              onClick={() => setMobileOpen(false)}
            >
              Products
            </Link>
          </div>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t bg-card py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} RINBILL. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default CustomerLayout;
