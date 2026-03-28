"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { verifyAuthentication } from "@/utils/auth";
import LandingPage from "./landing/page";

export default function IndexPage() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authenticated = await verifyAuthentication();
        if (authenticated) {
          router.push("/dashboard");
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      }
    };

    checkAuth();
  }, [router]);

  // Show landing page immediately, redirect happens in background if authenticated
  return <LandingPage />;
}
