"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { getAuthToken } from "@/utils/auth";
import type { Alert, Forecast } from "@/types/api";

export interface DashboardStats {
  datasets: {
    total: number;
    trend: number;
  };
  timeseries: {
    total: number;
    trend: number;
  };
  forecasts: {
    total: number;
    trend: number;
  };
  alerts: {
    total: number;
    bySeverity: {
      critical: number;
      high: number;
      medium: number;
      low: number;
    };
    trend: number;
  };
  aiModels: {
    active: number;
    total: number;
  };
  recentAlerts: Alert[];
  recentForecasts: Forecast[];
}

// SWR fetcher function
const fetcher = async (url: string) => {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Not authenticated");
  }

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};

export const useDashboardStats = () => {
  const [error, setError] = useState<Error | null>(null);
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

  // Use SWR for each API endpoint with 30-second cache
  const { data: datasetsData, error: datasetsError } = useSWR(
    () => (getAuthToken() ? `${API_BASE}/datasets?page=1&limit=1` : null),
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000, // 30 seconds cache
      shouldRetryOnError: false,
    }
  );

  const { data: timeseriesData, error: timeseriesError } = useSWR(
    () => (getAuthToken() ? `${API_BASE}/timeseries?page=1&limit=1` : null),
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
      shouldRetryOnError: false,
    }
  );

  const { data: forecastsData, error: forecastsError } = useSWR(
    () => (getAuthToken() ? `${API_BASE}/forecasts?page=1&limit=1` : null),
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
      shouldRetryOnError: false,
    }
  );

  const { data: alertsData } = useSWR(
    () => (getAuthToken() ? `${API_BASE}/alerts?page=1&limit=100` : null),
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
      shouldRetryOnError: false,
    }
  );

  const { data: recentAlertsData } = useSWR(
    () => (getAuthToken() ? `${API_BASE}/alerts?limit=5` : null),
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
      shouldRetryOnError: false,
    }
  );

  const { data: recentForecastsData } = useSWR(
    () => (getAuthToken() ? `${API_BASE}/forecasts?limit=5` : null),
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
      shouldRetryOnError: false,
    }
  );

  // Combine loading states
  const loading = !datasetsData && !timeseriesData && !forecastsData && !alertsData;

  // Handle errors
  useEffect(() => {
    const errors = [datasetsError, timeseriesError, forecastsError].filter(Boolean);
    if (errors.length > 0) {
      setError(errors[0] as Error);
    }
  }, [datasetsError, timeseriesError, forecastsError]);

  // Calculate trends (mock data for now)
  const mockTrends = {
    datasets: Math.floor(Math.random() * 30) - 10,
    timeseries: Math.floor(Math.random() * 20) - 5,
    forecasts: Math.floor(Math.random() * 40) - 15,
    alerts: Math.floor(Math.random() * 50) - 25,
  };

  // Count alerts by severity
  const alertsBySeverity = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  };

  alertsData?.data?.forEach((alert: Alert) => {
    const severity = alert.severity?.toLowerCase();
    if (severity in alertsBySeverity) {
      alertsBySeverity[severity as keyof typeof alertsBySeverity]++;
    }
  });

  const stats: DashboardStats | null = datasetsData && timeseriesData && forecastsData && alertsData ? {
    datasets: {
      total: datasetsData.total || datasetsData.data?.length || 0,
      trend: mockTrends.datasets,
    },
    timeseries: {
      total: timeseriesData.total || timeseriesData.data?.length || 0,
      trend: mockTrends.timeseries,
    },
    forecasts: {
      total: forecastsData.total || forecastsData.data?.length || 0,
      trend: mockTrends.forecasts,
    },
    alerts: {
      total: alertsData.total || alertsData.data?.length || 0,
      bySeverity: alertsBySeverity,
      trend: mockTrends.alerts,
    },
    aiModels: {
      active: 5, // Mock data
      total: 7,
    },
    recentAlerts: recentAlertsData?.data || recentAlertsData?.items || [],
    recentForecasts: recentForecastsData?.data || recentForecastsData?.items || [],
  } : null;

  return { stats, loading, error };
};
