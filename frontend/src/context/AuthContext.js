import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

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

  // Set default axios header
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      // Verify token and get user info
      verifyToken();
    } else {
      setLoading(false);
    }
  }, [token]);

  const verifyToken = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/auth/me');
      setUser(response.data.user);
    } catch (error) {
      console.error('Token verification error:', error);
      localStorage.removeItem('token');
      setToken(null);
      delete axios.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        username,
        password
      });

      const { token: newToken, user: userData } = response.data;
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userData);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);

      // Handle network errors
      if (!error.response) {
        return {
          success: false,
          message: 'Cannot connect to server. Please make sure the backend server is running on port 5000.'
        };
      }

      const errorMessage = error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        'Login failed. Please try again.';
      return {
        success: false,
        message: errorMessage
      };
    }
  };

  const signup = async (userData) => {
    try {
      const response = await axios.post('http://localhost:5000/api/auth/register', userData);
      const { token: newToken, user: newUser } = response.data;
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(newUser);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      return { success: true };
    } catch (error) {
      console.error('Signup error:', error);

      // Handle network errors
      if (!error.response) {
        return {
          success: false,
          message: 'Cannot connect to server. Please make sure the backend server is running on port 5000.'
        };
      }

      const errorMessage = error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        'Registration failed. Please try again.';
      return {
        success: false,
        message: errorMessage
      };
    }
  };

  const sendOtp = async (email) => {
    try {
      const response = await axios.post('http://localhost:5000/api/auth/send-otp', { email });
      return {
        success: true,
        message: response.data.message
      };
    } catch (error) {
      console.error('Send OTP error:', error);
      const errorMessage = error.response?.data?.message ||
        'Failed to send OTP. Please try again.';
      return {
        success: false,
        message: errorMessage
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  const value = {
    user,
    token,
    isAuthenticated: !!token,
    loading,
    login,
    signup,
    sendOtp,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
