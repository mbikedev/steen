'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  email: string;
  role: string;
  name: string;
  permissions: string[];
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string, remember?: boolean) => Promise<boolean>;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const isAuthenticated = !!user;

  // Check for existing authentication on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      if (!token) {
        setIsLoading(false);
        return;
      }

      // First try to validate demo token locally (faster and more reliable)
      try {
        const tokenData = JSON.parse(atob(token));
        if (tokenData.email && tokenData.timestamp && Date.now() - tokenData.timestamp < 24 * 60 * 60 * 1000) {
          // Demo token is still valid
          setUser({
            email: tokenData.email,
            role: 'admin',
            name: getUserName(tokenData.email),
            permissions: ['*']
          });
          setIsLoading(false);
          return;
        }
      } catch (localError) {
        console.log('Local token validation failed, trying API...');
      }

      // Try backend validation as fallback
      try {
        const response = await fetch(`/api/php/index.php?endpoint=auth&token=${encodeURIComponent(token)}`, {
          method: 'GET',
          headers: {
            'X-Api-Key': process.env.NEXT_PUBLIC_API_KEY || '',
          },
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.valid) {
            setUser(result.user);
            setIsLoading(false);
            return;
          }
        }
      } catch (apiError) {
        console.log('API token validation failed:', apiError);
      }

      // If we get here, token is invalid
      localStorage.removeItem('auth_token');
      sessionStorage.removeItem('auth_token');
      setUser(null);
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('auth_token');
      sessionStorage.removeItem('auth_token');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const getUserName = (email: string): string => {
    const names: { [key: string]: string } = {
      'admin@ooc.be': 'Administrator',
      'manager@ooc.be': 'Manager',
      'staff@ooc.be': 'Staff Member'
    };
    return names[email] || 'User';
  };

  const login = async (email: string, password: string, remember: boolean = false): Promise<boolean> => {
    try {
      // Check demo credentials first
      if (email === 'admin@ooc.be' && password === 'admin123') {
        const authToken = btoa(JSON.stringify({
          email,
          timestamp: Date.now(),
          remember
        }));

        if (remember) {
          localStorage.setItem('auth_token', authToken);
        } else {
          sessionStorage.setItem('auth_token', authToken);
        }

        setUser({
          email,
          role: 'admin',
          name: 'Administrator',
          permissions: ['*']
        });

        return true;
      }

      // Try API authentication
      const response = await fetch('/api/php/index.php?endpoint=auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': process.env.NEXT_PUBLIC_API_KEY || '',
        },
        body: JSON.stringify({
          email,
          password,
          remember
        }),
      });

      if (!response.ok) {
        return false;
      }

      const result = await response.json();

      if (result.success) {
        const storage = remember ? localStorage : sessionStorage;
        storage.setItem('auth_token', result.token);
        
        setUser(result.user);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      
      if (token) {
        // Try to logout via API
        try {
          await fetch('/api/php/index.php?endpoint=auth', {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'X-Api-Key': process.env.NEXT_PUBLIC_API_KEY || '',
            },
            body: JSON.stringify({ token }),
          });
        } catch (error) {
          console.warn('API logout failed:', error);
        }
      }

      // Clear local storage
      localStorage.removeItem('auth_token');
      sessionStorage.removeItem('auth_token');
      
      setUser(null);
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      // Force clear even if API fails
      localStorage.removeItem('auth_token');
      sessionStorage.removeItem('auth_token');
      setUser(null);
      router.push('/login');
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    if (user.permissions.includes('*')) return true;
    return user.permissions.includes(permission);
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    hasPermission,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Higher-order component for protecting routes
export function withAuth<P extends object>(Component: React.ComponentType<P>) {
  return function AuthenticatedComponent(props: P) {
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!isLoading && !isAuthenticated) {
        router.push('/login');
      }
    }, [isAuthenticated, isLoading, router]);

    if (isLoading) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-slate-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Verifying authentication...</p>
          </div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return null; // Will redirect to login
    }

    return <Component {...props} />;
  };
}

// Hook for checking permissions
export function usePermissions() {
  const { hasPermission, user } = useAuth();
  
  return {
    hasPermission,
    canCreate: (resource: string) => hasPermission(`${resource}.create`),
    canEdit: (resource: string) => hasPermission(`${resource}.edit`),
    canDelete: (resource: string) => hasPermission(`${resource}.delete`),
    canView: (resource: string) => hasPermission(`${resource}.view`),
    isAdmin: user?.role === 'admin',
    isManager: user?.role === 'manager' || user?.role === 'admin',
    isStaff: !!user
  };
}