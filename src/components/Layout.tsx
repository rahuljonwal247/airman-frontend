import Link from 'next/link';
import { useRouter } from 'next/router';
import { ReactNode, useState } from 'react';
import { useAuth } from '../lib/auth';
import toast from 'react-hot-toast';
import clsx from 'clsx';

interface NavItem {
  href: string;
  label: string;
  roles: string[];
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', roles: ['ADMIN', 'INSTRUCTOR', 'STUDENT'], icon: '🏠' },
  { href: '/courses', label: 'Courses', roles: ['ADMIN', 'INSTRUCTOR', 'STUDENT'], icon: '📚' },
  { href: '/bookings', label: 'Bookings', roles: ['ADMIN', 'INSTRUCTOR', 'STUDENT'], icon: '📅' },
  { href: '/availability', label: 'Availability', roles: ['INSTRUCTOR', 'ADMIN'], icon: '🕐' },
  { href: '/users', label: 'Users', roles: ['ADMIN'], icon: '👥' },
  { href: '/audit', label: 'Audit Log', roles: ['ADMIN'], icon: '📋' },
];

interface LayoutProps {
  children: ReactNode;
  title?: string;
}

export default function Layout({ children, title }: LayoutProps) {
  const { user, logout, isAdmin } = useAuth();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    router.push('/login');
  };

  const navItems = NAV_ITEMS.filter((item) => !user || item.roles.includes(user.role));

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar */}
      <aside className={clsx(
        'fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 flex flex-col transition-transform duration-200',
        mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      )}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-700">
          <span className="text-2xl">✈️</span>
          <div>
            <div className="text-white font-bold text-lg leading-none">AIRMAN</div>
            <div className="text-slate-400 text-xs mt-0.5">{user?.role || 'Core System'}</div>
          </div>
        </div>

        {/* Tenant badge */}
        {user && (
          <div className="px-4 py-2 mx-4 mt-3 rounded-md bg-blue-800/40 text-blue-200 text-xs text-center">
            🏢 {user.tenantSlug}
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const active = router.pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                  active
                    ? 'bg-blue-700 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                )}
                onClick={() => setMobileOpen(false)}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User footer */}
        {user && (
          <div className="px-4 py-4 border-t border-slate-700">
            <div className="text-slate-300 text-sm font-medium truncate">
              {user.firstName} {user.lastName}
            </div>
            <div className="text-slate-500 text-xs truncate">{user.email}</div>
            <button
              onClick={handleLogout}
              className="mt-3 w-full text-left text-xs text-slate-400 hover:text-white transition-colors"
            >
              Sign out →
            </button>
          </div>
        )}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 md:ml-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-4">
          <button
            className="md:hidden p-1 rounded text-slate-600"
            onClick={() => setMobileOpen(true)}
          >
            ☰
          </button>
          <h1 className="text-slate-800 font-semibold text-lg">{title || 'AIRMAN'}</h1>
        </header>

        {/* Page content */}
        <main className="p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
