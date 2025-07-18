'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  LogOut, 
  User, 
  Settings, 
  Home,
  FileText,
  CreditCard,
  FolderOpen,
  MessageSquare,
  Users,
  BarChart3
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, isAdmin, signOut } = useAuth();
  const pathname = usePathname();

  const clientNavItems = [
    { href: '/dashboard', icon: Home, label: 'Dashboard' },
    { href: '/projects', icon: FolderOpen, label: 'Projects' },
    { href: '/invoices', icon: CreditCard, label: 'Invoices' },
    { href: '/documents', icon: FileText, label: 'Documents' },
    { href: '/requests', icon: MessageSquare, label: 'Service Requests' },
  ];

  const adminNavItems = [
    { href: '/admin', icon: BarChart3, label: 'Admin Dashboard' },
    { href: '/admin/users', icon: Users, label: 'Users' },
    { href: '/admin/projects', icon: FolderOpen, label: 'Projects' },
    { href: '/admin/invoices', icon: CreditCard, label: 'Invoices' },
    { href: '/admin/documents', icon: FileText, label: 'Documents' },
    { href: '/admin/tickets', icon: MessageSquare, label: 'Tickets' },
  ];

  const navItems = isAdmin ? adminNavItems : clientNavItems;

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg flex flex-col">
        {/* Logo/Header */}
        <div className="p-6 border-b">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-3 bg-black shadow-md">
              <Image 
                src="/devouLogo.png" 
                alt="Devou Logo" 
                width={60} 
                height={60}
              />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Devou</h1>
              <p className="text-xs text-gray-500">
                {isAdmin ? 'Admin Portal' : 'Client Portal'}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                pathname === href
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        {/* User Info & Sign Out */}
        <div className="p-4 border-t">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.name || 'User'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user?.email}
              </p>
              {isAdmin && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                  Admin
                </span>
              )}
            </div>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h2 className="text-2xl font-semibold text-gray-900">
                {(() => {
                  switch (pathname) {
                    case '/dashboard':
                      return 'Dashboard';
                    case '/projects':
                      return 'Projects';
                    case '/invoices':
                      return 'Invoices';
                    case '/documents':
                      return 'Documents';
                    case '/requests':
                      return 'Service Requests';
                    case '/admin':
                      return 'Admin Dashboard';
                    case '/admin/users':
                      return 'User Management';
                    case '/admin/projects':
                      return 'Project Management';
                    case '/admin/invoices':
                      return 'Invoice Management';
                    case '/admin/documents':
                      return 'Document Management';
                    case '/admin/tickets':
                      return 'Ticket Management';
                    default:
                      return 'Portal';
                  }
                })()}
              </h2>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                Welcome back, {user?.name}
              </span>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
