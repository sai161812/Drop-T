import React, { createContext, useContext, useState, useEffect } from 'react';
import { PublicUser, SignUpPayload, SignInPayload } from '@droptest/shared';

interface AuthContextType {
  user: PublicUser | null;
  token: string | null;
  isLoading: boolean;
  signIn: (payload: SignInPayload) => Promise<{ success: boolean; error?: string }>;
  signUp: (payload: SignUpPayload) => Promise<{ success: boolean; error?: string; issues?: any[] }>;
  signOut: () => Promise<void>;
  quickDemoLogin: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('droptest_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch current user on mount or token change
  useEffect(() => {
    const fetchMe = async () => {
      if (!token) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          if (!data.user) {
            localStorage.removeItem('droptest_token');
            setToken(null);
          }
        } else {
          localStorage.removeItem('droptest_token');
          setToken(null);
          setUser(null);
        }
      } catch (err) {
        console.error('Failed to restore session:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMe();
  }, [token]);

  const signIn = async (payload: SignInPayload): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Sign in failed' };
      }
      localStorage.setItem('droptest_token', data.token);
      setToken(data.token);
      setUser(data.user);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: 'Network error during sign in' };
    }
  };

  const signUp = async (payload: SignUpPayload): Promise<{ success: boolean; error?: string; issues?: any[] }> => {
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Registration failed', issues: data.issues };
      }
      localStorage.setItem('droptest_token', data.token);
      setToken(data.token);
      setUser(data.user);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: 'Network error during registration' };
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      if (token) {
        await fetch('/api/auth/signout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (err) {
      console.warn('Sign out request failed:', err);
    } finally {
      localStorage.removeItem('droptest_token');
      setToken(null);
      setUser(null);
    }
  };

  const quickDemoLogin = async (email: string): Promise<void> => {
    await signIn({ email, password: 'password123' });
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, signIn, signUp, signOut, quickDemoLogin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
