import { createContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  updateProfile: (name?: string, avatar?: string | File) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const verifyToken = async () => {
      const storedToken = localStorage.getItem('token');
      if (!storedToken) {
        setIsLoading(false);
        return;
      }
      try {
        const res = await fetch(API_URL + '/auth/verify', {
          headers: { Authorization: 'Bearer ' + storedToken },
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          setToken(storedToken);
        } else {
          localStorage.removeItem('token');
          setToken(null);
        }
      } catch {
        localStorage.removeItem('token');
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    };
    verifyToken();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(API_URL + '/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login failed');
      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data.user);
      console.log('Login successful, navigating to /chat');
      navigate('/chat');
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (name?: string, avatar?: string | File) => {
    setIsLoading(true);
    try {
      const currentToken = token || localStorage.getItem('token');
      
      let body: any;
      let headers: any = {
        Authorization: 'Bearer ' + currentToken,
      };

      // Handle File upload (FormData)
      if (avatar instanceof File) {
        const formData = new FormData();
        formData.append('name', name || user?.name || '');
        formData.append('profileImage', avatar);
        body = formData;
        // Don't set Content-Type for FormData - browser will do it automatically
      } else {
        // Handle Base64 or JSON
        headers['Content-Type'] = 'application/json';
        body = JSON.stringify({
          name: name || user?.name,
          avatar: avatar,
        });
      }

      const res = await fetch(API_URL + '/auth/update-profile', {
        method: 'POST',
        headers,
        body,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Update failed');
      
      // Update user state with new avatar
      console.log('Profile updated successfully:', data.user);
      setUser(data.user);
      localStorage.setItem('token', currentToken!);
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(API_URL + '/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Registration failed');
      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data.user);
      console.log('Registration successful, navigating to /chat');
      navigate('/chat');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    navigate('/', { replace: true });
  };

  const forgotPassword = async (email: string) => {
    const res = await fetch(API_URL + '/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to send reset email');
  };

  const resetPassword = async (token: string, newPassword: string) => {
    const res = await fetch(API_URL + '/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to reset password');
    navigate('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        updateProfile,
        register,
        logout,
        forgotPassword,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}