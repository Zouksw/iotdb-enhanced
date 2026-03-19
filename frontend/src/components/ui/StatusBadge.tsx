"use client";

import React from "react";
import { Tag, theme } from "antd";
import type { TagProps } from "antd";

export type StatusType =
  | "active"
  | "inactive"
  | "pending"
  | "processing"
  | "success"
  | "warning"
  | "error"
  | "default";

export interface StatusBadgeProps extends Omit<TagProps, "color"> {
  status: StatusType | string;
  text?: string;
}

/**
 * StatusBadge - Status indicators with semantic colors
 *
 * Provides a standardized badge component for status display with:
 * - Semantic color mapping
 * - Custom status support
 * - Consistent styling
 * - Ant Design Tag integration
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  text,
  ...props
}) => {
  const { token } = theme.useToken();

  // Map status types to colors
  const statusColorMap: Record<StatusType, string> = {
    active: token.colorSuccess,
    inactive: token.colorTextSecondary,
    pending: token.colorWarning,
    processing: token.colorPrimary,
    success: token.colorSuccess,
    warning: token.colorWarning,
    error: token.colorError,
    default: token.colorTextSecondary,
  };

  const getBadgeColor = (statusValue: StatusType | string): string => {
    if (statusValue in statusColorMap) {
      return statusColorMap[statusValue as StatusType];
    }
    return statusColorMap.default;
  };

  const badgeStyle: React.CSSProperties = {
    borderRadius: 4,
    padding: "2px 8px",
    fontSize: 12,
    fontWeight: 500,
    border: "none",
    backgroundColor: `${getBadgeColor(status)}15`,
    color: getBadgeColor(status),
  };

  return (
    <Tag
      style={badgeStyle}
      {...props}
    >
      {text || status}
    </Tag>
  );
};

// Pre-configured status badges for common use cases
export const ActiveBadge: React.FC<{ text?: string }> = ({
  text = "Active"
}) => <StatusBadge status="active" text={text} />;

export const InactiveBadge: React.FC<{ text?: string }> = ({
  text = "Inactive"
}) => <StatusBadge status="inactive" text={text} />;

export const PendingBadge: React.FC<{ text?: string }> = ({
  text = "Pending"
}) => <StatusBadge status="pending" text={text} />;

export const SuccessBadge: React.FC<{ text?: string }> = ({
  text = "Success"
}) => <StatusBadge status="success" text={text} />;

export const ErrorBadge: React.FC<{ text?: string }> = ({
  text = "Error"
}) => <StatusBadge status="error" text={text} />;

export default StatusBadge;
