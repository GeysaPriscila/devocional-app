import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface User {
  email: string;
  name: string;
  theme: string;
}

interface AuthContextData {
  user: User | null;
  token: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateTheme: (theme: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredData();
  }, []);

  async function loadStoredData() {
    try {
      const storedToken = await AsyncStorage.getItem('@devotional:token');
      const storedUser = await AsyncStorage.getItem('@devotional:user');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Error loading stored data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function signIn(email: string, password: string) {
    try {
      const response = await axios.post(`${EXPO_PUBLIC_BACKEND_URL}/api/auth/login`, {
        email,
        password,
      });

      const { access_token, user: userData } = response.data;

      setToken(access_token);
      setUser(userData);

      await AsyncStorage.setItem('@devotional:token', access_token);
      await AsyncStorage.setItem('@devotional:user', JSON.stringify(userData));
    } catch (error: any) {
      console.error('Sign in error:', error);
      throw new Error(error.response?.data?.detail || 'Erro ao fazer login');
    }
  }

  async function signUp(email: string, password: string, name: string) {
    try {
      const response = await axios.post(`${EXPO_PUBLIC_BACKEND_URL}/api/auth/register`, {
        email,
        password,
        name,
      });

      const { access_token, user: userData } = response.data;

      setToken(access_token);
      setUser(userData);

      await AsyncStorage.setItem('@devotional:token', access_token);
      await AsyncStorage.setItem('@devotional:user', JSON.stringify(userData));
    } catch (error: any) {
      console.error('Sign up error:', error);
      throw new Error(error.response?.data?.detail || 'Erro ao criar conta');
    }
  }

  async function signOut() {
    setToken(null);
    setUser(null);
    await AsyncStorage.removeItem('@devotional:token');
    await AsyncStorage.removeItem('@devotional:user');
  }

  async function updateTheme(theme: string) {
    try {
      await axios.put(
        `${EXPO_PUBLIC_BACKEND_URL}/api/auth/theme`,
        { theme },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const updatedUser = { ...user!, theme };
      setUser(updatedUser);
      await AsyncStorage.setItem('@devotional:user', JSON.stringify(updatedUser));
    } catch (error) {
      console.error('Error updating theme:', error);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        signIn,
        signUp,
        signOut,
        updateTheme,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
