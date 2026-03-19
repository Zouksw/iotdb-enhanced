"use client";

import React from "react";
import { Typography, Breadcrumb, Space } from "antd";
import type { BreadcrumbProps } from "antd";
import { HomeOutlined } from "@ant-design/icons";
import { theme } from "antd";

const { Title, Text } = Typography;

export interface BreadcrumbItem {
  key: string;
  label: string;
  href?: string;
}

export interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  breadcrumbs?: BreadcrumbProps["items"];
  showBackButton?: boolean;
}

/**
 * PageHeader - Consistent page headers with title, description, and actions
 *
 * Provides a standardized header for pages with:
 * - Page title
 * - Optional description
 * - Optional action buttons
 * - Optional breadcrumbs
 * - Consistent spacing and typography
 */
export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  actions,
  breadcrumbs,
  showBackButton = false,
}) => {
  const { token } = theme.useToken();

  const headerStyle: React.CSSProperties = {
    marginBottom: token.marginLG,
  };

  const titleStyle: React.CSSProperties = {
    fontSize: token.fontSizeHeading3,
    fontWeight: 700,
    lineHeight: 1.25,
    color: token.colorText,
    margin: "0 0 8px 0",
  };

  const descriptionStyle: React.CSSProperties = {
    fontSize: token.fontSizeSM,
    color: token.colorTextSecondary,
    margin: 0,
  };

  const breadcrumbItems = showBackButton
    ? [
        {
          title: (
            <span style={{ display: "flex", alignItems: "center" }}>
              <HomeOutlined />
            </span>
          ),
          href: "/",
        },
        ...(breadcrumbs || []),
      ]
    : breadcrumbs;

  return (
    <div className="page-header" style={headerStyle}>
      {breadcrumbItems && breadcrumbItems.length > 0 && (
        <Breadcrumb
          items={breadcrumbItems}
          style={{ marginBottom: token.marginMD }}
        />
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: actions ? "flex-start" : "flex-start",
          gap: token.marginMD,
        }}
      >
        <div style={{ flex: 1 }}>
          <Title style={titleStyle}>{title}</Title>
          {description && (
            <Text style={descriptionStyle}>{description}</Text>
          )}
        </div>
        {actions && (
          <div
            style={{
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              gap: token.marginSM,
            }}
          >
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageHeader;
