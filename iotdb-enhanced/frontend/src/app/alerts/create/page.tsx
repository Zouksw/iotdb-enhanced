"use client";

import { useState } from "react";
import { Form, Input, Select, Switch, Button, Row, Col, Typography, Alert, Space, Divider, InputNumber } from "antd";
import { ArrowLeftOutlined, BellOutlined } from "@ant-design/icons";
import { useGo, useInvalidate, useNotification } from "@refinedev/core";
import { useList } from "@refinedev/core";

import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/ui/PageHeader";
import { ContentCard } from "@/components/layout/ContentCard";

const { Text } = Typography;

const ALERT_TYPES = [
  { value: "ANOMALY", label: "Anomaly Detection", description: "Alerts when anomalies are detected" },
  { value: "FORECAST_READY", label: "Forecast Ready", description: "Alerts when forecast results are available" },
  { value: "SYSTEM", label: "System Event", description: "System-level notifications" },
  { value: "THRESHOLD", label: "Threshold Breach", description: "Alerts when values exceed thresholds" },
];

const SEVERITY_LEVELS = [
  { value: "INFO", label: "Info", color: "blue" },
  { value: "WARNING", label: "Warning", color: "orange" },
  { value: "ERROR", label: "Error", color: "red" },
];

export default function AlertCreate() {
  const go = useGo();
  const invalidate = useInvalidate();
  const { open } = useNotification();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  // Get timeseries list
  const timeseriesResult = useList({
    resource: "timeseries",
    pagination: { pageSize: 1000 },
    sorters: [{ field: "name", order: "asc" }],
  });

  const timeseriesList = timeseriesResult?.result?.data ?? [];

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/alerts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create alert");
      }

      open?.({
        type: "success",
        message: "Alert Created Successfully",
        description: `The alert has been configured.`,
      });

      invalidate({
        resource: "alerts",
        invalidates: ["list"],
      });

      setTimeout(() => {
        go({ to: "/alerts", type: "push" });
      }, 1000);
    } catch (error: any) {
      open?.({
        type: "error",
        message: "Failed to Create Alert",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <PageHeader
          title="Create Alert"
          description="Configure a new alert for monitoring your time series data"
          actions={
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => go({ to: "/alerts", type: "push" })}
            >
              Back to Alerts
            </Button>
          }
        />

        <Alert
          message="Alert Configuration"
          description="Configure alerts to notify you when specific events occur in your time series data. Alerts can be sent via email, webhook, or viewed in the alerts dashboard."
          type="info"
          showIcon
          icon={<BellOutlined />}
          style={{ marginBottom: 24 }}
        />

        <ContentCard title="Alert Details" subtitle="Configure alert settings">
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{
              severity: "INFO",
              enabled: true,
            }}
          >
            {/* Alert Name */}
            <Row gutter={[24, 16]}>
              <Col xs={24}>
                <Form.Item
                  label={<span style={{ fontWeight: 500 }}>Alert Name</span>}
                  name="name"
                  rules={[{ required: true, message: "Please enter an alert name" }]}
                >
                  <Input
                    placeholder="e.g., High Temperature Alert"
                    size="large"
                  />
                </Form.Item>
              </Col>
            </Row>

            {/* Alert Type and Severity */}
            <Row gutter={[24, 16]}>
              <Col xs={24} md={12}>
                <Form.Item
                  label={<span style={{ fontWeight: 500 }}>Alert Type</span>}
                  name="type"
                  rules={[{ required: true, message: "Please select alert type" }]}
                >
                  <Select placeholder="Select alert type" size="large">
                    {ALERT_TYPES.map((type) => (
                      <Select.Option key={type.value} value={type.value}>
                        <div>
                          <div>{type.label}</div>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {type.description}
                          </Text>
                        </div>
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  label={<span style={{ fontWeight: 500 }}>Severity Level</span>}
                  name="severity"
                  rules={[{ required: true, message: "Please select severity" }]}
                >
                  <Select placeholder="Select severity" size="large">
                    {SEVERITY_LEVELS.map((level) => (
                      <Select.Option key={level.value} value={level.value}>
                        <Space>
                          <span style={{ color: level.color }}>{level.label}</span>
                        </Space>
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            {/* Time Series Selection */}
            <Form.Item
              label={<span style={{ fontWeight: 500 }}>Time Series</span>}
              name="timeseriesId"
              rules={[{ required: true, message: "Please select a time series" }]}
              tooltip="Select the time series to monitor"
            >
              <Select
                placeholder="Select a time series"
                showSearch
                size="large"
                filterOption={(input, option) =>
                  String(option?.label ?? "")
                    .toLowerCase()
                    .includes(String(input).toLowerCase())
                }
              >
                {timeseriesList.map((ts: any) => (
                  <Select.Option key={ts.id} value={ts.id}>
                    <Space>
                      <span>{ts.name}</span>
                      {ts.unit && <Text type="secondary">({ts.unit})</Text>}
                    </Space>
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Divider />

            {/* Threshold Configuration (for THRESHOLD type) */}
            <Form.Item noStyle shouldUpdate={(prev, curr) => prev.type !== curr.type}>
              {({ getFieldValue }) =>
                getFieldValue("type") === "THRESHOLD" ? (
                  <Row gutter={[24, 16]}>
                    <Col xs={24} md={8}>
                      <Form.Item
                        label={<span style={{ fontWeight: 500 }}>Operator</span>}
                        name={["condition", "operator"]}
                        initialValue=">"
                      >
                        <Select>
                          <Select.Option value=">">Greater than</Select.Option>
                          <Select.Option value="<">Less than</Select.Option>
                          <Select.Option value=">=">Greater or equal</Select.Option>
                          <Select.Option value="<=">Less or equal</Select.Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={8}>
                      <Form.Item
                        label={<span style={{ fontWeight: 500 }}>Threshold Value</span>}
                        name={["condition", "value"]}
                        rules={[{ required: true, message: "Required" }]}
                      >
                        <InputNumber style={{ width: "100%" }} placeholder="e.g., 100" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={8}>
                      <Form.Item
                        label={<span style={{ fontWeight: 500 }}>Cooldown (minutes)</span>}
                        name="cooldownMinutes"
                        initialValue={5}
                        tooltip="Minimum time between alert notifications"
                      >
                        <InputNumber min={0} style={{ width: "100%" }} />
                      </Form.Item>
                    </Col>
                  </Row>
                ) : null
              }
            </Form.Item>

            {/* Description */}
            <Form.Item
              label={<span style={{ fontWeight: 500 }}>Description</span>}
              name="description"
            >
              <Input.TextArea
                rows={3}
                placeholder="Describe what this alert monitors and when it should trigger..."
              />
            </Form.Item>

            {/* Enable/Disable */}
            <Form.Item
              label={<span style={{ fontWeight: 500 }}>Status</span>}
              name="enabled"
              valuePropName="checked"
            >
              <Switch checkedChildren="Enabled" unCheckedChildren="Disabled" />
            </Form.Item>

            <Divider style={{ margin: "24px 0" }} />

            <Form.Item>
              <Button type="primary" size="large" htmlType="submit" loading={loading} block>
                Create Alert
              </Button>
            </Form.Item>
          </Form>
        </ContentCard>
      </div>
    </PageContainer>
  );
}
