import React, { createContext, useContext, useEffect, useState } from "react";
import api from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  async function fetchMe() {
    try {
      const { data } = await api.get("/api/auth/me/");
      setUser(data);
    } catch {
      setUser(null);
    }
  }

  useEffect(() => {
    if (localStorage.getItem("access")) fetchMe();
  }, []);

  async function login(username, password) {
    const { data } = await api.post("/api/auth/token/", { username, password });
    localStorage.setItem("access", data.access);
    await fetchMe();
  }

  async function register(username, email, password) {
    await api.post("/api/auth/register/", { username, email, password });
  }

  function logout() {
    localStorage.removeItem("access");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}