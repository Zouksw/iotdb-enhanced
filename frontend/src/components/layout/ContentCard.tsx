"use client";

import React from "react";
import { Card, theme } from "antd";
import type { CardProps as AntCardProps } from "antd";

export interface ContentCardProps {
  className?: string;
  title?: string;
  subtitle?: string | React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  style?: React.CSSProperties;
  loading?: boolean;
  hoverable?: boolean;
}

/**
 * ContentCard - Card with consistent styling
 *
 * Provides a standardized card component with:
 * - Consistent border radius
 * - Subtle shadow
 * - Optional title and subtitle
 * - Optional header actions
 * - Loading state support
 */
export const ContentCard: React.FC<ContentCardProps> = ({
  title,
  subtitle,
  actions,
  children,
  className = "",
  ...props
}) => {
  const { token } = theme.useToken();

  const cardStyle: React.CSSProperties = {
    borderRadius: 4,
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.12)",
    marginBottom: token.marginLG,
  };

  const header = title || actions ? (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: token.marginMD,
      }}
    >
      <div>
        {title && (
          <div
            style={{
              fontSize: token.fontSizeLG,
              fontWeight: 600,
              color: token.colorText,
              margin: 0,
            }}
          >
            {title}
          </div>
        )}
        {subtitle && (
          <div
            style={{
              fontSize: token.fontSizeSM,
              color: token.colorTextSecondary,
              marginTop: token.marginXS,
            }}
          >
            {subtitle}
          </div>
        )}
      </div>
      {actions && <div>{actions}</div>}
    </div>
  ) : undefined;

  return (
    <Card
      className={`content-card ${className}`}
      style={cardStyle}
      title={header}
      variant="borderless"
      {...props}
    >
      {children}
    </Card>
  );
};

export default ContentCard;
