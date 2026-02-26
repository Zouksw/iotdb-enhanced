"use client";

import { Create, useForm, useSelect } from "@refinedev/antd";
import { Form, Input, Select, Switch, Row, Col, Typography } from "antd";

import { ContentCard } from "@/components/layout/ContentCard";

const { Text } = Typography;

export default function TimeseriesCreate() {
  const { formProps, saveButtonProps } = useForm({
    redirect: "show",
  });

  const { selectProps: datasetSelectProps } = useSelect({
    resource: "datasets",
    optionLabel: "name",
    optionValue: "id",
  });

  return (
    <Create saveButtonProps={saveButtonProps} title="Create Time Series">
      <ContentCard
        title="Basic Information"
        subtitle="Configure the basic properties of your time series"
      >
        <Form {...formProps} layout="vertical">
          <Row gutter={[24, 16]}>
            <Col xs={24} md={12}>
              <Form.Item
                label={<span style={{ fontWeight: 500 }}>Dataset</span>}
                name="datasetId"
                rules={[{ required: true, message: "Please select a dataset" }]}
              >
                <Select {...datasetSelectProps} placeholder="Select dataset" />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label={<span style={{ fontWeight: 500 }}>Name</span>}
                name="name"
                rules={[{ required: true, message: "Please enter a name" }]}
              >
                <Input placeholder="Temperature" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[24, 16]}>
            <Col xs={24} md={12}>
              <Form.Item
                label={<span style={{ fontWeight: 500 }}>Slug</span>}
                name="slug"
                rules={[
                  { required: true, message: "Please enter a slug" },
                  {
                    pattern: /^[a-z0-9-]+$/,
                    message: "Only lowercase letters, numbers, and hyphens",
                  },
                ]}
              >
                <Input placeholder="temperature" prefix="/" />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label={<span style={{ fontWeight: 500 }}>Unit</span>}
                name="unit"
                tooltip="The unit of measurement for this time series"
              >
                <Input placeholder="°C, MB, %" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label={<span style={{ fontWeight: 500 }}>Description</span>}
            name="description"
          >
            <Input.TextArea
              rows={3}
              placeholder="Describe what this time series measures..."
            />
          </Form.Item>
        </Form>
      </ContentCard>

      <ContentCard
        title="Display Settings"
        subtitle="Configure how this time series appears in visualizations"
      >
        <Form {...formProps} layout="vertical">
          <Row gutter={[24, 16]}>
            <Col xs={24} md={12}>
              <Form.Item
                label={<span style={{ fontWeight: 500 }}>Color</span>}
                name="colorHex"
                initialValue="#1890ff"
                tooltip="Color used in charts and visualizations"
              >
                <Input
                  type="color"
                  style={{ width: "100%", height: 40 }}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label={<span style={{ fontWeight: 500 }}>Timezone</span>}
                name="timezone"
                initialValue="UTC"
                tooltip="Timezone for timestamp display"
              >
                <Input placeholder="UTC" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </ContentCard>

      <ContentCard
        title="Advanced Options"
        subtitle="Configure additional features for this time series"
      >
        <Form {...formProps} layout="vertical">
          <Form.Item
            label={<span style={{ fontWeight: 500 }}>Anomaly Detection</span>}
            name="isAnomalyDetectionEnabled"
            valuePropName="checked"
            initialValue={false}
            tooltip="Enable automatic anomaly detection for this time series"
          >
            <Switch checkedChildren="Enabled" unCheckedChildren="Disabled" />
          </Form.Item>

          <Text type="secondary" style={{ fontSize: 12 }}>
            When enabled, the system will automatically analyze this time series for anomalies using machine learning algorithms.
          </Text>
        </Form>
      </ContentCard>
    </Create>
  );
}
