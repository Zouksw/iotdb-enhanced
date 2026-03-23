"use client";

import React from "react";
import { Card, Space, Typography, theme } from "antd";
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  MinusOutlined,
} from "@ant-design/icons";

const { Text } = Typography;

export interface TrendIndicator {
  value: number;
  isPositive: boolean;
}

export type StatCardVariant =
  | "default"
  | "primary"
  | "success"
  | "warning"
  | "error";

export interface StatCardProps {
  title: string;
  value: number | string;
  icon?: React.ReactNode;
  trend?: TrendIndicator;
  variant?: StatCardVariant;
  loading?: boolean;
  onClick?: () => void;
}

/**
 * StatCard - Enhanced statistics display with variants
 *
 * Provides a standardized statistics card with:
 * - Icon support
 * - Trend indicator
 * - Color variants for visual distinction
 * - Loading state
 * - Optional click handler
 * - Consistent sizing and spacing
 */
export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  trend,
  variant = "default",
  loading = false,
  onClick,
}) => {
  const { token } = theme.useToken();

  // Define variant colors
  const variantColors: Record<
    StatCardVariant,
    { border: string; text: string; bg?: string }
  > = {
    default: {
      border: token.colorBorder,
      text: token.colorText,
    },
    primary: {
      border: token.colorPrimary,
      text: token.colorPrimary,
    },
    success: {
      border: token.colorSuccess,
      text: token.colorSuccess,
    },
    warning: {
      border: token.colorWarning,
      text: token.colorWarning,
    },
    error: {
      border: token.colorError,
      text: token.colorError,
    },
  };

  const colors = variantColors[variant];

  const cardStyle: React.CSSProperties = {
    borderRadius: 4,
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.12)",
    borderLeft: `2px solid ${colors.border}`,
    cursor: onClick ? "pointer" : "default",
    transition: "all 0.2s ease",
    height: "100%",
  };

  const valueStyle: React.CSSProperties = {
    fontSize: 24,
    fontWeight: 700,
    color: colors.text,
    margin: 0,
    lineHeight: 1.25,
  };

  const titleStyle: React.CSSProperties = {
    fontSize: token.fontSizeSM,
    color: token.colorTextSecondary,
    marginBottom: 4,
  };

  const iconStyle: React.CSSProperties = {
    color: token.colorTextSecondary,
    fontSize: token.fontSizeLG,
  };

  return (
    <Card
      className={`stat-card stat-card--${variant}`}
      style={cardStyle}
      loading={loading}
      variant="borderless"
      onClick={onClick}
      hoverable={!!onClick}
    >
      <Space direction="vertical" size={token.marginXS} style={{ width: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", gap: token.marginXS }}>
          {icon && <span style={iconStyle}>{icon}</span>}
          <Text style={titleStyle}>{title}</Text>
        </div>

        <div style={{ display: "flex", alignItems: "baseline", gap: token.marginSM }}>
          <Text style={valueStyle}>{value}</Text>

          {trend && (
            <Space size={token.marginXS}>
              <TrendIcon
                value={trend.value}
                isPositive={trend.isPositive}
                color={colors.text}
              />
              <Text
                type="secondary"
                style={{
                  fontSize: 12,
                  whiteSpace: "nowrap",
                }}
              >
                {trend.isPositive ? "+" : ""}
                {trend.value}%
              </Text>
            </Space>
          )}
        </div>
      </Space>
    </Card>
  );
};

interface TrendIconProps {
  value: number;
  isPositive: boolean;
  color: string;
}

const TrendIcon: React.FC<TrendIconProps> = ({ value, isPositive, color }) => {
  const style: React.CSSProperties = {
    color: isPositive && value > 0 ? color : undefined,
    fontSize: 12,
  };

  if (value === 0) {
    return <MinusOutlined style={style} />;
  }

  if (isPositive) {
    return <ArrowUpOutlined style={style} />;
  }

  return <ArrowDownOutlined style={style} />;
};

export default StatCard;
