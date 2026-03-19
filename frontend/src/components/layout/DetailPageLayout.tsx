/**
 * Detail Page Layout Component
 *
 * A consistent layout component for all detail pages (forecasts, datasets, anomalies, API keys)
 * Provides:
 * - Responsive grid layout
 * - Breadcrumb navigation
 * - Page header with actions
 * - Loading and error states
 * - Mobile-optimized layout
 */

"use client";

import React, { ReactNode } from "react";
import { Row, Col, Breadcrumb, Button, Space, Spin } from "antd";
import { HomeOutlined } from "@ant-design/icons";
import { PageHeader } from "../ui/PageHeader";
import { GlassCard } from "../ui/GlassCard";
import { useIsMobile } from "@/lib/responsive-utils";

export interface DetailPageLayoutProps {
  /** Page title */
  title: string;
  /** Optional subtitle/description */
  subtitle?: string;
  /** Breadcrumb items */
  breadcrumb?: Array<{ label: string; href?: string }>;
  /** Action buttons */
  actions?: Array<{
    icon: ReactNode;
    label: string;
    onClick?: () => void;
    href?: string;
    danger?: boolean;
  }>;
  /** Is page loading? */
  loading?: boolean;
  /** Error message */
  error?: string;
  /** Page content */
  children?: ReactNode;
  /** Extra content in header */
  extra?: ReactNode;
  /** Mobile - stack columns vertically */
  mobileStack?: boolean;
}

export function DetailPageLayout({
  title,
  subtitle,
  breadcrumb,
  actions,
  loading = false,
  error,
  children,
  extra
}: DetailPageLayoutProps) {
  const isMobile = useIsMobile();

  // Loading state
  if (loading) {
    return (
      <div style={{ padding: "24px", textAlign: "center", minHeight: "400px" }}>
        <Spin size="large" tip="Loading..." />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={{ padding: "24px", textAlign: "center", minHeight: "400px" }}>
        <GlassCard style={{ maxWidth: "500px", margin: "0 auto" }}>
          <h3 style={{ color: "#ef4444", marginBottom: "16px" }}>Error</h3>
          <p style={{ color: "#64748b", marginBottom: "24px" }}>{error}</p>
          <Button type="primary" onClick={() => window.history.back()}>
            Go Back
          </Button>
        </GlassCard>
      </div>
    );
  }

  // Build breadcrumb with home link
  const breadcrumbItems = breadcrumb ? [
    { label: "Home", href: "/" },
    ...breadcrumb
  ] : [];

  // Build action buttons
  const actionButtons = actions?.map((action, index) => {
    if (action.href) {
      return (
        <Button
          key={index}
          icon={action.icon}
          danger={action.danger}
          href={action.href}
        >
          {isMobile ? "" : action.label}
        </Button>
      );
    }
    return (
      <Button
        key={index}
        icon={action.icon}
        danger={action.danger}
        onClick={action.onClick}
      >
        {isMobile ? "" : action.label}
      </Button>
    );
  });

  return (
    <div style={{ padding: isMobile ? "16px" : "24px" }}>
      {/* Breadcrumb */}
      {breadcrumbItems.length > 0 && (
        <Breadcrumb style={{ marginBottom: "16px" }}>
          <Breadcrumb.Item key="home" href="/">
            <HomeOutlined />
          </Breadcrumb.Item>
          {breadcrumbItems.slice(0, -1).map((item, index) => (
            <Breadcrumb.Item key={index} href={item.href}>
              {item.label}
            </Breadcrumb.Item>
          ))}
          <Breadcrumb.Item key="current">
            {breadcrumbItems[breadcrumbItems.length - 1].label}
          </Breadcrumb.Item>
        </Breadcrumb>
      )}

      {/* Page Header */}
      <PageHeader
        title={title}
        description={subtitle}
        actions={!isMobile ? actionButtons : undefined}
      />

      {/* Mobile Actions */}
      {isMobile && actionButtons && actionButtons.length > 0 && (
        <Space style={{ marginBottom: "16px" }}>
          {actionButtons}
        </Space>
      )}

      {/* Extra Content */}
      {extra && (
        <div style={{ marginBottom: "24px" }}>
          {extra}
        </div>
      )}

      {/* Main Content */}
      <Row gutter={[16, 16]}>
        {React.Children.map(children, (child, index) => {
          if (!React.isValidElement(child)) return null;

          // Check if child is a DetailSection with colSpan (it handles its own Col wrapper)
          const childProps = child.props as { colSpan?: number };
          if (child.type === DetailSection && childProps.colSpan !== undefined) {
            return <React.Fragment key={index}>{child}</React.Fragment>;
          }

          // For other children, wrap in Col
          const colSpan = childProps.colSpan || (isMobile ? 24 : undefined);
          return (
            <Col key={index} xs={24} md={colSpan}>
              {child}
            </Col>
          );
        })}
      </Row>
    </div>
  );
}

/**
 * DetailSection Component
 *
 * A section within a detail page with consistent spacing and styling
 */
export interface DetailSectionProps {
  title: string;
  children: ReactNode;
  /** Column span for responsive layout */
  colSpan?: number;
  /** Extra content in header */
  extra?: ReactNode;
  /** No padding */
  noPadding?: boolean;
}

export function DetailSection({ title, children, colSpan, extra, noPadding }: DetailSectionProps) {
  const cardContent = (
    <GlassCard
      title={title}
      extra={extra}
      style={{ height: "100%" }}
      styles={noPadding ? { body: { padding: 0 } } : undefined}
    >
      {children}
    </GlassCard>
  );

  // If colSpan is specified, wrap in Col component
  if (colSpan !== undefined) {
    return <Col md={colSpan} xs={24}>{cardContent}</Col>;
  }

  return cardContent;
}
