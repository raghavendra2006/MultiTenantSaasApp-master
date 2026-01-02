import React, { createContext, useState, useEffect, useContext } from "react";
import api from "../utils/api";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");

      if (token && storedUser) {
        try {
          const response = await api.get("/auth/me");
          if (response.data.success) {
            setUser(response.data.data);
          } else {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
          }
        } catch (error) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email, password, tenantSubdomain) => {
    try {
      const response = await api.post("/auth/login", {
        email,
        password,
        tenantSubdomain,
      });

      if (response.data.success) {
        const { token, user } = response.data.data;
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
        setUser(user);
        return response.data;
      }
    } catch (error) {
      throw error.response?.data || error;
    }
  };

  const registerTenant = async (
    tenantName,
    subdomain,
    adminEmail,
    adminPassword,
    adminFullName
  ) => {
    try {
      const response = await api.post("/auth/register-tenant", {
        tenantName,
        subdomain,
        adminEmail,
        adminPassword,
        adminFullName,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, setUser, loading, login, registerTenant, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};
