'use client';

import { useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const clientId = process.env.NEXT_PUBLIC_WORKOS_CLIENT_ID || '';
  const redirectUri = typeof window !== 'undefined' ? `${window.location.origin}/api/auth/callback` : '';

  useEffect(() => {
    // Check if user is authenticated by checking cookies
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = () => {
    // Redirect to WorkOS AuthKit with email/password authentication
    if (typeof window !== 'undefined') {
      const authUrl = `https://api.workos.com/user_management/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&provider=authkit`;
      window.location.href = authUrl;
    }
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    window.location.href = '/';
  };

  return { user, loading, login, logout };
}
