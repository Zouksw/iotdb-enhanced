"use client";

import {
  DevtoolsPanel,
  DevtoolsProvider as DevtoolsProviderBase,
} from "@refinedev/devtools";
import React from "react";

export const DevtoolsProvider = (props: React.PropsWithChildren) => {
  // Only show DevtoolsPanel in development
  const isDevelopment = process.env.NODE_ENV === "development";

  return (
    <DevtoolsProviderBase>
      {props.children}
      {isDevelopment && <DevtoolsPanel />}
    </DevtoolsProviderBase>
  );
};
