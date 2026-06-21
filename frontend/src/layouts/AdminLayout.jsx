import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Receipt,
  Image,
  BarChart3,
  Settings,
  Menu,
  X,
  LogOut,
  User,
  ChevronDown,
} from 'lucide-react';
import { logout } from '@/features/auth/authSlice';
import { toggleSidebar } from '@/features/ui/uiSlice';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const navGroups = [
  {
    label: 'Main',
    roles: ['super_admin', 'ecommerce_staff', 'billing_staff'],
    items: [
      { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
    ],
  },
  {
    label: 'Products',
    roles: ['super_admin', 'ecommerce_staff'],
    items: [
      { to: '/admin/products', icon: Package, label: 'All Products' },
      { to: '/admin/categories', icon: Package, label: 'Categories' },
      { to: '/admin/brands', icon: Package, label: 'Brands' },
    ],
  },
  {
    label: 'Orders',
    roles: ['super_admin', 'ecommerce_staff'],
    items: [
      { to: '/admin/orders', icon: ShoppingCart, label: 'Orders' },
    ],
  },
  {
    label: 'Customers',
    roles: ['super_admin', 'ecommerce_staff', 'billing_staff'],
    items: [
      { to: '/admin/customers', icon: Users, label: 'Customers' },
    ],
  },
  {
    label: 'Billing',
    roles: ['super_admin', 'billing_staff'],
    items: [
      { to: '/admin/billing', icon: Receipt, label: 'POS Billing' },
      { to: '/admin/billing/invoices', icon: Receipt, label: 'Invoices' },
    ],
  },
  {
    label: 'CMS',
    roles: ['super_admin', 'ecommerce_staff'],
    items: [
      { to: '/admin/cms/sliders', icon: Image, label: 'Sliders' },
    ],
  },
  {
    label: 'Reports',
    roles: ['super_admin', 'ecommerce_staff', 'billing_staff'],
    items: [
      { to: '/admin/reports/sales', icon: BarChart3, label: 'Sales Report' },
    ],
  },
  {
    label: 'System',
    roles: ['super_admin'],
    items: [
      { to: '/admin/users', icon: Users, label: 'Users' },
      { to: '/admin/settings', icon: Settings, label: 'Settings' },
    ],
  },
];

function AdminLayout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { sidebarOpen } = useSelector((state) => state.ui);
  const [mobileOpen, setMobileOpen] = useState(false);

  const userRole = user?.role?.name;
  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/account/login');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h2 className="text-xl font-bold">RINBILL</h2>
        <p className="text-xs text-muted-foreground">Admin Panel</p>
      </div>
      <nav className="flex-1 overflow-y-auto p-3 space-y-4">
        {navGroups.map((group) => {
          if (!group.roles.includes(userRole)) return null;
          return (
            <div key={group.label}>
              <p className="text-xs font-medium text-muted-foreground px-3 mb-1 uppercase tracking-wider">
                {group.label}
              </p>
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-accent hover:text-accent-foreground'
                    }`
                  }
                >
                  <item.icon className="size-4" />
                  {item.label}
                </NavLink>
              ))}
            </div>
          );
        })}
      </nav>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="hidden lg:flex lg:w-64 border-r bg-card flex-col">
        <SidebarContent />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-64 bg-card border-r shadow-lg">
            <div className="flex justify-end p-2">
              <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)}>
                <X className="size-5" />
              </Button>
            </div>
            <SidebarContent />
          </div>
        </div>
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="border-b bg-card">
          <div className="flex items-center justify-between px-4 h-14">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setMobileOpen(true)}
              >
                <Menu className="size-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="hidden lg:flex"
                onClick={() => dispatch(toggleSidebar())}
              >
                <Menu className="size-5" />
              </Button>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <Avatar className="size-8">
                    <AvatarFallback>{initials || 'U'}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm hidden sm:inline">{user?.name}</span>
                  <ChevronDown className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{user?.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/admin')}>
                  <LayoutDashboard className="size-4 mr-2" />
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/account/profile')}>
                  <User className="size-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="size-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
