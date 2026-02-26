"use client";

import { Create, useForm, useSelect } from "@refinedev/antd";
import { Form, Input, Select, Switch, Row, Col, Typography, Divider } from "antd";

import { ContentCard } from "@/components/layout/ContentCard";

const { Text } = Typography;

export default function DatasetCreate() {
  const { formProps, saveButtonProps } = useForm({});

  const { selectProps: organizationSelectProps } = useSelect({
    resource: "organizations",
    optionLabel: "name",
    optionValue: "id",
  });

  return (
    <Create saveButtonProps={saveButtonProps} title="Create New Dataset">
      {/* Dataset Information */}
      <ContentCard
        title="Dataset Information"
        subtitle="Basic information about your dataset"
      >
        <Form {...formProps} layout="vertical">
          <Row gutter={[24, 16]}>
            <Col xs={24} md={12}>
              <Form.Item
                label={<span style={{ fontWeight: 500 }}>Dataset Name</span>}
                name="name"
                rules={[
                  { required: true, message: "Please enter a dataset name" },
                  { min: 3, message: "Dataset name must be at least 3 characters" },
                  { max: 100, message: "Dataset name cannot exceed 100 characters" },
                ]}
              >
                <Input
                  placeholder="e.g., Temperature Sensors Data"
                  showCount
                  maxLength={100}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label={<span style={{ fontWeight: 500 }}>Slug</span>}
                name="slug"
                tooltip="Unique identifier for URLs and API references"
                rules={[
                  { required: true, message: "Please enter a slug" },
                  {
                    pattern: /^[a-z0-9-]+$/,
                    message: "Only lowercase letters, numbers, and hyphens",
                  },
                  {
                    pattern: /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/,
                    message: "Cannot start or end with a hyphen",
                  },
                ]}
              >
                <Input
                  placeholder="e.g., temperature-sensors-data"
                  prefix="/"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label={<span style={{ fontWeight: 500 }}>Description</span>}
            name="description"
            tooltip="Provide a detailed description of the dataset contents"
            rules={[{ max: 1000, message: "Description cannot exceed 1000 characters" }]}
          >
            <Input.TextArea
              rows={4}
              placeholder="Describe what data this dataset contains, its source, and any relevant metadata..."
              showCount
              maxLength={1000}
            />
          </Form.Item>
        </Form>
      </ContentCard>

      {/* Configuration */}
      <ContentCard
        title="Configuration"
        subtitle="Storage and visibility settings"
      >
        <Form {...formProps} layout="vertical">
          <Row gutter={[24, 16]}>
            <Col xs={24} md={12}>
              <Form.Item
                label={<span style={{ fontWeight: 500 }}>Storage Format</span>}
                name="storageFormat"
                rules={[{ required: true, message: "Please select a storage format" }]}
                initialValue="TSFILE"
                tooltip="Choose the storage backend for this dataset"
              >
                <Select placeholder="Select storage format">
                  <Select.Option value="TSFILE">
                    <div>
                      <div style={{ fontWeight: 500 }}>TSFile</div>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        High-performance time series file format
                      </Text>
                    </div>
                  </Select.Option>
                  <Select.Option value="IoTDB">
                    <div>
                      <div style={{ fontWeight: 500 }}>Apache IoTDB</div>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Native IoTDB database storage
                      </Text>
                    </div>
                  </Select.Option>
                  <Select.Option value="PARQUET">
                    <div>
                      <div style={{ fontWeight: 500 }}>Apache Parquet</div>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Columnar storage format for analytics
                      </Text>
                    </div>
                  </Select.Option>
                  <Select.Option value="INFLUXDB">
                    <div>
                      <div style={{ fontWeight: 500 }}>InfluxDB</div>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Time series database optimized storage
                      </Text>
                    </div>
                  </Select.Option>
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label={<span style={{ fontWeight: 500 }}>Organization</span>}
                name={["organization", "id"]}
                rules={[{ required: true, message: "Please select an organization" }]}
                tooltip="The organization that owns this dataset"
              >
                <Select
                  {...organizationSelectProps}
                  placeholder="Select organization"
                  showSearch
                  filterOption={(input, option) =>
                    String(option?.label ?? "")
                      .toLowerCase()
                      .includes(String(input).toLowerCase())
                  }
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label={<span style={{ fontWeight: 500 }}>File Path</span>}
            name="filePath"
            tooltip="Optional: Path to the data file (for imported datasets)"
          >
            <Input
              placeholder="/path/to/data.csv"
              prefix={<span>📁</span>}
            />
          </Form.Item>

          <Divider style={{ margin: "16px 0" }} />

          <Form.Item
            label={<span style={{ fontWeight: 500 }}>Visibility</span>}
            name="isPublic"
            valuePropName="checked"
            initialValue={false}
            tooltip="Public datasets can be accessed by other users in your organization"
          >
            <Switch checkedChildren="Public" unCheckedChildren="Private" />
          </Form.Item>

          <Text type="secondary" style={{ fontSize: 12 }}>
            Public datasets are visible to all users. Private datasets are only accessible to you and administrators.
          </Text>
        </Form>
      </ContentCard>
    </Create>
  );
}
