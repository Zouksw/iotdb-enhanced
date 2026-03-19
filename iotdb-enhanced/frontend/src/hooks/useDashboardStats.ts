"use client";

import { useState, useEffect } from "react";
import { useCustom } from "@refinedev/core";
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

export const useDashboardStats = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch all stats at once
  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      try {
        const token = getAuthToken();
        if (!token) {
          throw new Error("Not authenticated");
        }

        const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

        // Fetch all data in parallel
        const [
          datasetsRes,
          timeseriesRes,
          forecastsRes,
          alertsRes,
          recentAlertsRes,
          recentForecastsRes,
        ] = await Promise.all([
          fetch(`${API_BASE}/datasets?page=1&limit=1`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE}/timeseries?page=1&limit=1`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE}/forecasts?page=1&limit=1`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE}/alerts?page=1&limit=100`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE}/alerts?limit=5`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE}/forecasts?limit=5`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const datasets = await datasetsRes.json();
        const timeseries = await timeseriesRes.json();
        const forecasts = await forecastsRes.json();
        const alerts = await alertsRes.json();
        const recentAlerts = await recentAlertsRes.json();
        const recentForecasts = await recentForecastsRes.json();

        // Calculate trends (mock data for now, in production this would come from backend)
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

        alerts?.data?.forEach((alert: Alert) => {
          const severity = alert.severity?.toLowerCase();
          if (severity in alertsBySeverity) {
            alertsBySeverity[severity as keyof typeof alertsBySeverity]++;
          }
        });

        setStats({
          datasets: {
            total: datasets?.total || datasets?.data?.length || 0,
            trend: mockTrends.datasets,
          },
          timeseries: {
            total: timeseries?.total || timeseries?.data?.length || 0,
            trend: mockTrends.timeseries,
          },
          forecasts: {
            total: forecasts?.total || forecasts?.data?.length || 0,
            trend: mockTrends.forecasts,
          },
          alerts: {
            total: alerts?.total || alerts?.data?.length || 0,
            bySeverity: alertsBySeverity,
            trend: mockTrends.alerts,
          },
          aiModels: {
            active: 5, // Mock data, in production fetch from AI models endpoint
            total: 7,
          },
          recentAlerts: recentAlerts?.data || recentAlerts?.items || [],
          recentForecasts: recentForecasts?.data || recentForecasts?.items || [],
        });

        setLoading(false);
      } catch (err) {
        setError(err as Error);
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  return { stats, loading, error };
};
