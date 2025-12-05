'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { useSearchStore } from '@/store/search.store';
import { Button } from '@/components/common/Button/Button';
import { Sidebar } from '@/components/common/Sidebar/Sidebar';
import { GlobalSearchModal } from '@/components/common/GlobalSearch';
import { useGlobalSearchShortcut, getShortcutKey } from '@/hooks/useGlobalSearch';
import { Search } from 'lucide-react';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { openModal } = useSearchStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [shortcutKey, setShortcutKey] = useState('⌘K');

  // Register global keyboard shortcut
  useGlobalSearchShortcut();

  // Get shortcut key on client side
  useEffect(() => {
    setShortcutKey(getShortcutKey());
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Global Search Modal */}
      <GlobalSearchModal />

      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-white transform transition-transform duration-300 ease-in-out md:hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <Sidebar onNavigate={() => setSidebarOpen(false)} />
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <Sidebar />
      </div>

      <div className="md:pl-64 flex flex-col flex-1">
        {/* Top navigation */}
        <nav className="bg-white shadow-sm">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <button
                  type="button"
                  className="md:hidden -ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <h1 className="ml-2 md:ml-0 text-xl font-semibold text-gray-900">
                  LIMS Dashboard
                </h1>
              </div>
              <div className="flex items-center space-x-4">
                {/* Search Button */}
                <button
                  onClick={openModal}
                  className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-sm text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <Search className="w-4 h-4" />
                  <span>Search...</span>
                  <kbd className="hidden md:inline-flex px-1.5 py-0.5 text-xs font-semibold bg-white border border-gray-300 rounded">
                    {shortcutKey}
                  </kbd>
                </button>
                {/* Mobile search icon */}
                <button
                  onClick={openModal}
                  className="sm:hidden p-2 text-gray-500 hover:text-gray-900 rounded-lg"
                >
                  <Search className="w-5 h-5" />
                </button>
                {user && (
                  <span className="hidden sm:inline text-sm text-gray-700">
                    {user.fullName} ({user.role})
                  </span>
                )}
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </nav>

        {/* Main content */}
        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};


