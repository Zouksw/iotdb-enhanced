"use client";

import { ErrorComponent } from "@refinedev/antd";
import { Authenticated } from "@refinedev/core";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Authenticated key="error">
      <ErrorComponent />
    </Authenticated>
  );
}
