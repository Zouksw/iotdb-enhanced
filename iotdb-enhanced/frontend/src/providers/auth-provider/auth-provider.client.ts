"use client";

import type { AuthProvider } from "@refinedev/core";
import Cookies from "js-cookie";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8002/api";

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Set up interceptor to include auth token in requests
axiosInstance.interceptors.request.use((config) => {
  const auth = Cookies.get("auth");
  if (auth) {
    try {
      const parsedAuth = JSON.parse(auth);
      if (parsedAuth.token) {
        config.headers.Authorization = `Bearer ${parsedAuth.token}`;
      }
    } catch (e) {
      // Invalid auth cookie, ignore
    }
  }
  return config;
});

export const authProviderClient: AuthProvider = {
  login: async ({ email, password, remember }) => {
    try {
      const response = await axiosInstance.post("/auth/login", {
        email,
        password,
      });

      const { user, token } = response.data;

      // Store both user info and token in cookie
      Cookies.set("auth", JSON.stringify({ ...user, token }), {
        expires: remember ? 30 : 7, // 30 days if remember me, else 7 days
        path: "/",
      });

      return {
        success: true,
        redirectTo: "/",
      };
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || "Invalid email or password";
      console.error("Login error:", error.response?.data);
      return {
        success: false,
        error: {
          name: "LoginError",
          message: errorMessage,
        },
      };
    }
  },

  register: async (params) => {
    try {
      const response = await axiosInstance.post("/auth/register", {
        email: params.email,
        password: params.password,
        name: params.name || "",  // Add name field (optional)
      });

      const { user, token } = response.data;

      Cookies.set("auth", JSON.stringify({ ...user, token }), {
        expires: 30,
        path: "/",
      });

      return {
        success: true,
        redirectTo: "/",
      };
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || "Registration failed";
      console.error("Registration error:", error.response?.data);
      return {
        success: false,
        error: {
          name: "RegisterError",
          message: errorMessage,
        },
      };
    }
  },

  forgotPassword: async (params) => {
    try {
      await axiosInstance.post("/auth/forgot-password", {
        email: params.email,
      });

      return {
        success: true,
        notification: {
          message: "Password reset email sent",
          description: "Check your email for password reset instructions",
          type: "success",
        },
      };
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || "Failed to send reset email";
      return {
        success: false,
        error: {
          name: "ForgotPasswordError",
          message: errorMessage,
        },
      };
    }
  },

  updatePassword: async (params) => {
    try {
      await axiosInstance.post("/auth/reset-password", {
        token: params.token,
        password: params.password,
      });

      return {
        success: true,
        notification: {
          message: "Password updated successfully",
          type: "success",
        },
      };
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || "Failed to update password";
      return {
        success: false,
        error: {
          name: "UpdatePasswordError",
          message: errorMessage,
        },
      };
    }
  },

  logout: async () => {
    try {
      // Optional: Call backend logout endpoint
      await axiosInstance.post("/auth/logout");
    } catch (error) {
      // Ignore logout errors
    }
    Cookies.remove("auth", { path: "/" });
    return {
      success: true,
      redirectTo: "/login",
    };
  },

  check: async () => {
    const auth = Cookies.get("auth");
    if (auth) {
      try {
        const parsedAuth = JSON.parse(auth);
        if (parsedAuth.token) {
          // Optionally verify token with backend
          return {
            authenticated: true,
          };
        }
      } catch (e) {
        // Invalid auth cookie
      }
    }

    return {
      authenticated: false,
      logout: true,
      redirectTo: "/login",
    };
  },

  getPermissions: async () => {
    const auth = Cookies.get("auth");
    if (auth) {
      try {
        const parsedAuth = JSON.parse(auth);
        return parsedAuth.roles || [];
      } catch (e) {
        return [];
      }
    }
    return [];
  },

  getIdentity: async () => {
    const auth = Cookies.get("auth");
    if (auth) {
      try {
        const parsedAuth = JSON.parse(auth);
        return {
          id: parsedAuth.id,
          name: parsedAuth.name,
          email: parsedAuth.email,
          avatar: parsedAuth.avatar,
          roles: parsedAuth.roles,
        };
      } catch (e) {
        return null;
      }
    }
    return null;
  },

  onError: async (error) => {
    if (error.response?.status === 401) {
      return {
        logout: true,
      };
    }

    return { error };
  },
};
