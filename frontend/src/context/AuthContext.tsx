"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

interface User {
  id: string;
  email: string;
  role: string;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => void;
  apiCall: (url: string, options?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  }, []);

  const apiCall = useCallback(async (url: string, options: RequestInit = {}) => {
    const storedToken = localStorage.getItem("token");
    const headers = {
      ...options.headers,
      ...(storedToken ? { Authorization: `Bearer ${storedToken}` } : {}),
    };
    
    const res = await fetch(url, { ...options, headers });
    
    if (res.status === 401) {
      logout();
    }
    return res;
  }, [logout]);

  const fetchProfile = useCallback(async (authToken: string) => {
    try {
      const res = await fetch("http://localhost:8000/api/users/me", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        logout();
      }
    } catch (err) {
      console.error("Failed to load user profile", err);
      logout();
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      setToken(storedToken);
      fetchProfile(storedToken);
    } else {
      setLoading(false);
    }
  }, [fetchProfile]);

  const login = async (email: string, password: string) => {
    const formData = new URLSearchParams();
    formData.append("username", email);
    formData.append("password", password);

    const res = await fetch("http://localhost:8000/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData.toString(),
    });

    const data = await res.json();
    if (res.ok) {
      localStorage.setItem("token", data.access_token);
      setToken(data.access_token);
      await fetchProfile(data.access_token);
    } else {
      const errMsg = typeof data.detail === "object" ? JSON.stringify(data.detail) : (data.detail || "Login failed");
      throw new Error(errMsg);
    }
  };

  const signup = async (email: string, password: string) => {
    const res = await fetch("http://localhost:8000/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (res.ok) {
      localStorage.setItem("token", data.access_token);
      setToken(data.access_token);
      await fetchProfile(data.access_token);
    } else {
      const errMsg = typeof data.detail === "object" ? JSON.stringify(data.detail) : (data.detail || "Signup failed");
      throw new Error(errMsg);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, logout, apiCall }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
