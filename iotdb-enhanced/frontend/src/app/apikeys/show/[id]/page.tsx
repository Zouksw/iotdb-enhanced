"use client";

import { Row, Col, Typography, Tag, Button, Space, Alert, Descriptions, Badge } from "antd";
import { ArrowLeftOutlined, KeyOutlined, CheckCircleOutlined, ClockCircleOutlined } from "@ant-design/icons";
import { useGo } from "@refinedev/core";
import { useOne } from "@refinedev/core";
import dayjs from "dayjs";

import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/ui/PageHeader";
import { ContentCard } from "@/components/layout/ContentCard";

const { Text, Paragraph } = Typography;

interface ApiKeyShowPageProps {
  params: { id: string };
}

export default function ApiKeyShowPage({ params }: ApiKeyShowPageProps) {
  const go = useGo();

  const apiKeyResult = useOne({
    resource: "apikeys",
    id: params.id,
  });

  const apiKey = apiKeyResult?.result?.data;
  const isLoading = apiKeyResult?.query?.isLoading ?? false;

  if (isLoading) {
    return (
      <PageContainer>
        <ContentCard>
          <Alert message="Loading API key details..." type="info" />
        </ContentCard>
      </PageContainer>
    );
  }

  if (!apiKey) {
    return (
      <PageContainer>
        <ContentCard>
          <Alert message="API key not found" type="error" />
        </ContentCard>
      </PageContainer>
    );
  }

  const isExpired = apiKey.expiresAt ? dayjs(apiKey.expiresAt).isBefore(dayjs()) : false;

  return (
    <PageContainer>
      <PageHeader
        title="API Key Details"
        description="View detailed information about this API key"
        actions={
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => go({ to: "/apikeys", type: "push" })}
          >
            Back to API Keys
          </Button>
        }
      />

      <Row gutter={[24, 24]}>
        {/* Main Details */}
        <Col xs={24} lg={16}>
          <ContentCard title="API Key Information" subtitle="Details about this API key">
            <Descriptions bordered column={{ xs: 1, sm: 2 }} size="middle">
              <Descriptions.Item label="API Key ID" span={2}>
                <Text code>{apiKey.id}</Text>
              </Descriptions.Item>

              <Descriptions.Item label="Name" span={2}>
                <Text strong style={{ fontSize: 16 }}>{apiKey.name}</Text>
              </Descriptions.Item>

              <Descriptions.Item label="Status">
                <Tag
                  icon={apiKey.isActive ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
                  color={apiKey.isActive ? "green" : "red"}
                  style={{ margin: 0, fontSize: 13, padding: "4px 12px" }}
                >
                  {apiKey.isActive ? "Active" : "Inactive"}
                </Tag>
              </Descriptions.Item>

              <Descriptions.Item label="Expiration">
                {apiKey.expiresAt ? (
                  <Text type={isExpired ? "danger" : "secondary"}>
                    {dayjs(apiKey.expiresAt).format("YYYY-MM-DD HH:mm")}
                    {isExpired && " (Expired)"}
                  </Text>
                ) : (
                  <Text type="secondary">Never</Text>
                )}
              </Descriptions.Item>

              <Descriptions.Item label="Last Characters">
                <Text code style={{ fontSize: 13 }}>
                  ...{apiKey.lastCharacters?.toString(16).toUpperCase().padStart(8, "0") || "N/A"}
                </Text>
              </Descriptions.Item>

              <Descriptions.Item label="Usage Count">
                <Text strong>{apiKey.usageCount || 0}</Text> {apiKey.usageCount === 1 ? "request" : "requests"}
              </Descriptions.Item>

              <Descriptions.Item label="Created At" span={2}>
                {apiKey.createdAt ? dayjs(apiKey.createdAt).format("YYYY-MM-DD HH:mm:ss") : "N/A"}
              </Descriptions.Item>

              {apiKey.lastUsedAt && (
                <Descriptions.Item label="Last Used At" span={2}>
                  {dayjs(apiKey.lastUsedAt).format("YYYY-MM-DD HH:mm:ss")}
                  <Text type="secondary" style={{ marginLeft: 8 }}>
                    ({dayjs(apiKey.lastUsedAt).fromNow()})
                  </Text>
                </Descriptions.Item>
              )}
            </Descriptions>
          </ContentCard>
        </Col>

        {/* Side Panel */}
        <Col xs={24} lg={8}>
          {/* Security Info */}
          <ContentCard title="Security Information" subtitle="Key security details">
            <Space direction="vertical" style={{ width: "100%" }} size="middle">
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>Security Status</Text>
                <div style={{ marginTop: 4 }}>
                  <Badge
                    status={apiKey.isActive && !isExpired ? "success" : "error"}
                    text={apiKey.isActive && !isExpired ? "Secure" : "Check Required"}
                  />
                </div>
              </div>

              {!apiKey.isActive && (
                <Alert
                  message="Key Inactive"
                  description="This API key is currently inactive and cannot be used for authentication."
                  type="warning"
                  showIcon
                />
              )}

              {isExpired && (
                <Alert
                  message="Key Expired"
                  description="This API key has expired. Please generate a new key for continued access."
                  type="error"
                  showIcon
                />
              )}

              {apiKey.isActive && !isExpired && (
                <Alert
                  message="Key Active"
                  description="This API key is active and can be used for authentication."
                  type="success"
                  showIcon
                />
              )}
            </Space>
          </ContentCard>

          {/* Usage Statistics */}
          {apiKey.usageCount !== undefined && (
            <ContentCard title="Usage Statistics" subtitle="API key usage" style={{ marginTop: 16 }}>
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Total Requests">
                  <Text strong style={{ fontSize: 18 }}>{apiKey.usageCount}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Last Used">
                  {apiKey.lastUsedAt ? dayjs(apiKey.lastUsedAt).fromNow() : "Never"}
                </Descriptions.Item>
              </Descriptions>
            </ContentCard>
          )}

          {/* Quick Actions */}
          <ContentCard title="Quick Actions" subtitle="Available actions" style={{ marginTop: 16 }}>
            <Space direction="vertical" style={{ width: "100%" }}>
              <Button block icon={<KeyOutlined />}>
                Edit API Key
              </Button>
              <Button block danger>
                Revoke Key
              </Button>
            </Space>
          </ContentCard>
        </Col>
      </Row>
    </PageContainer>
  );
}
