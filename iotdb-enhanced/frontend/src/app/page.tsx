"use client";

import React, { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Authenticated } from "@refinedev/core";
import LandingPage from "./landing/page";

export default function IndexPage() {
  const router = useRouter();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        router.push("/dashboard");
      }
    };
    checkAuth();
  }, [router]);

  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>Loading...</div>}>
      <Authenticated key="home-page" fallback={<LandingPage />}>
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          Redirecting to dashboard...
        </div>
      </Authenticated>
    </Suspense>
  );
}
