import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';
import { initializeSocket, disconnectSocket } from '../services/socket';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    disconnectSocket();
    setLoading(false);
  };

  const fetchUser = async () => {
    try {
      const response = await api.get('/users/me');
      setUser(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching user:', error);
      logout();
    }
  };

  useEffect(() => {
    if (token) {
      try {
        const decoded = jwtDecode(token);
        // Verify token is still valid
        if (decoded.exp * 1000 > Date.now()) {
          // Initialize socket connection
          initializeSocket(token);
          // Fetch user data
          fetchUser();
        } else {
          // Token expired
          logout();
        }
      } catch (error) {
        console.error('Token decode error:', error);
        logout();
      }
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const register = async (name, email, password) => {
    try {
      const response = await api.post('/auth/register', {
        name,
        email,
        password,
      });
      const { token: newToken, user: newUser } = response.data;
      setToken(newToken);
      setUser(newUser);
      localStorage.setItem('token', newToken);
      initializeSocket(newToken);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed',
      };
    }
  };

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', {
        email,
        password,
      });
      const { token: newToken, user: newUser } = response.data;
      setToken(newToken);
      setUser(newUser);
      localStorage.setItem('token', newToken);
      initializeSocket(newToken);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed',
      };
    }
  };


  const updateUser = (userData) => {
    setUser({ ...user, ...userData });
  };

  const value = {
    user,
    token,
    loading,
    register,
    login,
    logout,
    updateUser,
    fetchUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

