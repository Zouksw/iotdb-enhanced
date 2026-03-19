"use client";

import React from "react";
import { Empty, Button, Space, theme } from "antd";
import {
  FileTextOutlined,
  DatabaseOutlined,
  BugOutlined,
  SearchOutlined,
} from "@ant-design/icons";

export type EmptyStateType =
  | "default"
  | "data"
  | "datasets"
  | "errors"
  | "search";

export interface EmptyStateProps {
  type?: EmptyStateType;
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  illustration?: React.ReactNode;
}

/**
 * EmptyState - Empty state illustrations with helpful CTAs
 *
 * Provides a standardized empty state component with:
 * - Type-based illustrations
 * - Customizable messaging
 * - Optional action button
 * - Consistent spacing
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  type = "default",
  title,
  description,
  actionText,
  onAction,
  illustration,
}) => {
  const { token } = theme.useToken();

  const containerStyle: React.CSSProperties = {
    textAlign: "center",
    padding: `${token.paddingXL}px ${token.paddingLG}px`,
  };

  // Default messages by type
  const defaultMessages: Record<
    EmptyStateType,
    { title: string; description: string; icon: React.ReactNode }
  > = {
    default: {
      title: "No Data",
      description: "There is no data to display at the moment.",
      icon: <Empty />,
    },
    data: {
      title: "No Data Available",
      description: "Get started by creating your first item.",
      icon: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />,
    },
    datasets: {
      title: "No Datasets",
      description: "Create your first dataset to start managing time series data.",
      icon: (
        <DatabaseOutlined
          style={{ fontSize: 48, color: token.colorTextTertiary }}
        />
      ),
    },
    errors: {
      title: "No Errors",
      description: "Everything is working correctly. No errors to display.",
      icon: (
        <BugOutlined style={{ fontSize: 48, color: token.colorTextTertiary }} />
      ),
    },
    search: {
      title: "No Results Found",
      description: "We couldn't find anything matching your search criteria.",
      icon: (
        <SearchOutlined
          style={{ fontSize: 48, color: token.colorTextTertiary }}
        />
      ),
    },
  };

  const messages = defaultMessages[type];
  const displayTitle = title || messages.title;
  const displayDescription = description || messages.description;
  const displayIllustration = illustration || messages.icon;

  return (
    <div className="empty-state" style={containerStyle}>
      <Space direction="vertical" size={token.marginLG}>
        {displayIllustration}

        <div>
          <div
            style={{
              fontSize: token.fontSizeLG,
              fontWeight: 600,
              color: token.colorText,
              marginBottom: token.marginXS,
            }}
          >
            {displayTitle}
          </div>
          <div
            style={{
              fontSize: token.fontSizeSM,
              color: token.colorTextSecondary,
            }}
          >
            {displayDescription}
          </div>
        </div>

        {actionText && onAction && (
          <Button type="primary" onClick={onAction}>
            {actionText}
          </Button>
        )}
      </Space>
    </div>
  );
};

// Pre-configured empty states for common use cases
export const NoData: React.FC<{ actionText?: string; onAction?: () => void }> = ({
  actionText,
  onAction,
}) => (
  <EmptyState
    type="data"
    actionText={actionText}
    onAction={onAction}
  />
);

export const NoDatasets: React.FC<{
  actionText?: string;
  onAction?: () => void;
}> = ({ actionText = "Create Dataset", onAction }) => (
  <EmptyState
    type="datasets"
    actionText={actionText}
    onAction={onAction}
  />
);

export const NoSearchResults: React.FC = () => (
  <EmptyState type="search" />
);

export default EmptyState;
