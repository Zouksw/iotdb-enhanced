"use client";

import { DataProvider } from "@refinedev/core";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8002/api";

/**
 * Get authentication token from localStorage
 */
const getAuthToken = (): string | null => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("token");
  }
  return null;
};

/**
 * Set authentication token in localStorage
 */
const setAuthToken = (token: string): void => {
  if (typeof window !== "undefined") {
    localStorage.setItem("token", token);
  }
};

/**
 * Clear authentication token from localStorage
 */
const clearAuthToken = (): void => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("token");
  }
};

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Request interceptor to add auth token to all requests
 */
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor to handle token refresh and 401 errors
 */
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Clear the invalid token
      clearAuthToken();

      // Redirect to login page if not already there
      if (typeof window !== "undefined" && !window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }

      return Promise.reject(error);
    }

    // Handle other errors
    return Promise.reject(error);
  }
);

/**
 * Custom data provider for IoTDB Enhanced backend
 * Adapts backend API response format to Refine's expected format
 */
export const dataProvider: DataProvider = {
  /**
   * Get API URL for a resource
   */
  getApiUrl: () => API_URL,

  /**
   * Get list of resources with pagination, filtering, and sorting
   */
  getList: async ({ resource, pagination, filters, sorters }) => {
    const { current = 1, pageSize = 10 } = (pagination as { current?: number; pageSize?: number }) || {};
    const sorter = (sorters && sorters[0]) || {};
    const sort = 'field' in sorter ? sorter.field : undefined;
    const order = 'order' in sorter ? sorter.order : undefined;

    const url = `/${resource}`;
    const params: Record<string, string | number | boolean> = {
      page: current,
      limit: pageSize,
    };

    if (sort) {
      params.sortBy = sort as string;
      params.order = order as string;
    }

    if (filters) {
      filters.forEach((filter) => {
        if ('field' in filter) {
          params[filter.field as string] = filter.value;
        }
      });
    }

    const response = await axiosInstance.get(url, { params });
    const data = response.data;

    // Adapt backend response to Refine format
    let items: any[] = [];
    let total = 0;

    // Handle different response formats from backend
    if (resource === 'blog_posts') {
      items = data.blog_posts || data.data || data.items || [];
    } else if (resource === 'categories') {
      items = data.categories || data.data || data.items || [];
    } else {
      // Default format for our resources
      items = data.data || data.items || [];
    }

    // Extract total from response
    total = data.pagination?.total || data.total || items.length;

    return {
      data: items,
      total: total,
    };
  },

  /**
   * Get single resource by ID
   */
  getOne: async ({ resource, id }) => {
    const url = `/${resource}/${id}`;
    const response = await axiosInstance.get(url);
    const data = response.data;

    // Return data in Refine format
    const item = data.data || data;

    return {
      data: item,
    };
  },

  /**
   * Create new resource
   */
  create: async ({ resource, variables }) => {
    const response = await axiosInstance.post(`/${resource}`, variables);
    const data = response.data;

    const item = data.data || data;

    return {
      data: item,
    };
  },

  /**
   * Update resource by ID
   */
  update: async ({ resource, id, variables }) => {
    const response = await axiosInstance.patch(`/${resource}/${id}`, variables);
    const data = response.data;

    const item = data.data || data;

    return {
      data: item,
    };
  },

  /**
   * Delete resource by ID
   */
  deleteOne: async ({ resource, id }) => {
    await axiosInstance.delete(`/${resource}/${id}`);

    return {
      data: { id } as any,
    };
  },

  /**
   * Custom API method for specific endpoints
   */
  custom: async ({ url, method, payload, query, headers }) => {
    let response;

    const config: Record<string, unknown> = {
      params: query,
    };

    if (headers) {
      config.headers = headers;
    }

    switch (method) {
      case 'get':
        response = await axiosInstance.get(url, config);
        break;
      case 'post':
        response = await axiosInstance.post(url, payload, config);
        break;
      case 'patch':
        response = await axiosInstance.patch(url, payload, config);
        break;
      case 'put':
        response = await axiosInstance.put(url, payload, config);
        break;
      case 'delete':
        response = await axiosInstance.delete(url, config);
        break;
      default:
        response = await axiosInstance.get(url, config);
    }

    return {
      data: response.data,
    };
  },
};

export default dataProvider;
