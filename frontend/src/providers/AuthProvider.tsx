'use client';

import { useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import { usePathname, useRouter } from 'next/navigation';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isLoading);
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const initTheme = useThemeStore((state) => state.initTheme);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    initTheme();
    checkAuth();
  }, [checkAuth, initTheme]);

  useEffect(() => {
    if (isLoading) return;

    const publicRoutes = ['/login', '/signup'];
    const isPublicRoute = publicRoutes.includes(pathname);

    if (isAuthenticated) {
      if (isPublicRoute) {
        router.push('/dashboard');
      }
    } else {
      // Redirect if not authenticated and trying to access private page
      if (!isPublicRoute && pathname !== '/') {
        router.push('/login');
      }
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-zinc-300 dark:border-zinc-700 border-t-zinc-900 dark:border-t-zinc-100 rounded-full animate-spin"></div>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium animate-pulse">Initializing session...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
