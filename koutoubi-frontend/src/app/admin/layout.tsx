'use client';

import { ReactNode } from 'react';
import { AdminGuard } from '@/components/auth/admin-guard';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { 
  LayoutDashboard, 
  Users, 
  Users2, 
  BookOpen, 
  BarChart3,
  Settings,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminLayoutProps {
  children: ReactNode;
}

const adminNavItems = [
  {
    title: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard
  },
  {
    title: 'Utilisateurs',
    href: '/admin/users',
    icon: Users
  },
  {
    title: 'Groupes',
    href: '/admin/groups',
    icon: Users2
  },
  {
    title: 'Contenu',
    href: '/admin/content',
    icon: BookOpen
  },
  {
    title: 'Rapports',
    href: '/admin/reports',
    icon: BarChart3
  }
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();

  return (
    <AdminGuard>
      <div className="min-h-screen bg-gray-50">
        {/* Admin Header */}
        <div className="bg-white border-b">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-semibold">Administration</h1>
                <ChevronRight className="w-5 h-5 mx-2 text-gray-400" />
                <nav className="flex space-x-4">
                  {adminNavItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                        pathname === item.href
                          ? "bg-gray-900 text-white"
                          : "text-gray-700 hover:bg-gray-100"
                      )}
                    >
                      <div className="flex items-center space-x-2">
                        <item.icon className="w-4 h-4" />
                        <span>{item.title}</span>
                      </div>
                    </Link>
                  ))}
                </nav>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="text-sm text-red-600 hover:text-red-900"
                >
                  Déconnexion
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </AdminGuard>
  );
}