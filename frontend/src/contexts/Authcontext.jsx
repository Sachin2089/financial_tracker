import React, { createContext, useContext, useState, useEffect } from 'react';
import { isAuthenticated, getToken, removeToken } from '../service/apis';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in on app start
    const checkAuthStatus = () => {
      const authenticated = isAuthenticated();
      setIsLoggedIn(authenticated);
      setLoading(false);
    };

    checkAuthStatus();
  }, []);

  const login = (token) => {
    setIsLoggedIn(true);
  };

  const logout = () => {
    removeToken();
    setIsLoggedIn(false);
  };

  const value = {
    isLoggedIn,
    login,
    logout,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
