"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Authenticated } from "@refinedev/core";
import { verifyAuthentication } from "@/utils/auth";
import LandingPage from "./landing/page";

export default function IndexPage() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Redirect authenticated users to dashboard
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authenticated = await verifyAuthentication();
        setIsAuthenticated(authenticated);
        if (authenticated) {
          router.push("/dashboard");
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsAuthenticated(false);
      } finally {
        setIsChecking(false);
      }
    };
    checkAuth();
  }, [router]);

  // Show loading while checking authentication
  if (isChecking) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        Loading…
      </div>
    );
  }

  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>Loading…</div>}>
      <Authenticated key="home-page" fallback={<LandingPage />}>
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          Redirecting to dashboard...
        </div>
      </Authenticated>
    </Suspense>
  );
}
