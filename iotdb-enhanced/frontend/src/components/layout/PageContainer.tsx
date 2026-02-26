"use client";

import React from "react";
import { theme } from "antd";

export interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * PageContainer - Consistent page wrapper with spacing
 *
 * Provides a consistent container for page content with:
 * - Responsive padding
 * - Appropriate background color
 * - Maximum width constraint
 */
export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  className = "",
}) => {
  const { token } = theme.useToken();

  const containerStyle: React.CSSProperties = {
    minHeight: "100vh",
    backgroundColor: token.colorBgLayout,
    padding: token.paddingLG,
  };

  return (
    <div
      className={`page-container ${className}`}
      style={containerStyle}
    >
      {children}
    </div>
  );
};

export default PageContainer;
