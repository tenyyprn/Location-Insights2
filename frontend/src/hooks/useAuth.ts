import { useState, useCallback } from 'react';

interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  user: {
    id: string;
    email: string;
    role: string;
  } | null;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    role: string;
  };
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    token: localStorage.getItem('token'),
    user: null
  });

  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
      });

      if (!response.ok) {
        throw new Error('認証に失敗しました');
      }

      const data: AuthResponse = await response.json();
      
      localStorage.setItem('token', data.token);
      
      setAuthState({
        isAuthenticated: true,
        token: data.token,
        user: data.user
      });

      return true;
    } catch (error) {
      console.error('ログインエラー:', error);
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setAuthState({
      isAuthenticated: false,
      token: null,
      user: null
    });
  }, []);

  const checkAuthStatus = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      logout();
      return;
    }

    try {
      const response = await fetch('/api/auth/verify', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('トークンが無効です');
      }

      const data = await response.json();
      setAuthState({
        isAuthenticated: true,
        token,
        user: data.user
      });
    } catch (error) {
      console.error('認証確認エラー:', error);
      logout();
    }
  }, [logout]);

  const getAuthHeader = useCallback(() => {
    return authState.token ? {
      'Authorization': `Bearer ${authState.token}`
    } : {};
  }, [authState.token]);

  return {
    isAuthenticated: authState.isAuthenticated,
    user: authState.user,
    login,
    logout,
    checkAuthStatus,
    getAuthHeader
  };
};

export default useAuth;