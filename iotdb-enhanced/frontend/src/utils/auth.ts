/**
 * Authentication utility functions
 * Provides helper functions for managing authentication tokens and user data
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8002";

/**
 * Get the authentication token from localStorage
 * @returns The JWT token or null
 */
export const getAuthToken = (): string | null => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("token");
  }
  return null;
};

/**
 * Set the authentication token in localStorage
 * @param token - The JWT token to store
 */
export const setAuthToken = (token: string): void => {
  if (typeof window !== "undefined") {
    localStorage.setItem("token", token);
  }
};

/**
 * Remove the authentication token from localStorage
 */
export const removeAuthToken = (): void => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("token");
  }
};

/**
 * Get the refresh token from localStorage
 * @returns The refresh token or null
 */
export const getRefreshToken = (): string | null => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("refreshToken");
  }
  return null;
};

/**
 * Set the refresh token in localStorage
 * @param token - The refresh token to store
 */
export const setRefreshToken = (token: string): void => {
  if (typeof window !== "undefined") {
    localStorage.setItem("refreshToken", token);
  }
};

/**
 * Remove the refresh token from localStorage
 */
export const removeRefreshToken = (): void => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("refreshToken");
  }
};

/**
 * Clear all authentication tokens
 */
export const clearAuthTokens = (): void => {
  removeAuthToken();
  removeRefreshToken();
};

/**
 * Get the Authorization header value for API requests
 * @returns The Authorization header value or undefined
 */
export const getAuthHeader = (): { Authorization: string } | undefined => {
  const token = getAuthToken();
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return undefined;
};

/**
 * Fetch with authentication headers
 * @param url - The URL to fetch
 * @param options - Fetch options
 * @returns The fetch response
 */
export const authFetch = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  const headers = {
    ...options.headers,
    ...getAuthHeader(),
  };

  return fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
  });
};

/**
 * Check if user is authenticated
 * @returns True if user has a valid token
 */
export const isAuthenticated = (): boolean => {
  return getAuthToken() !== null;
};

/**
 * Get the current user info from localStorage cache
 * @returns The cached user object or null
 */
export const getCachedUser = (): any | null => {
  if (typeof window !== "undefined") {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
  }
  return null;
};

/**
 * Cache the current user info in localStorage
 * @param user - The user object to cache
 */
export const setCachedUser = (user: any): void => {
  if (typeof window !== "undefined") {
    localStorage.setItem("user", JSON.stringify(user));
  }
};

/**
 * Clear the cached user info
 */
export const clearCachedUser = (): void => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("user");
  }
};
