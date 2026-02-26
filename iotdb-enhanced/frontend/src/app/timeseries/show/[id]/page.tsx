"use client";

import {
  DateField,
  NumberField,
  Show,
} from "@refinedev/antd";
import { useShow, useList } from "@refinedev/core";
import {
  Card,
  Descriptions,
  Tag,
  Typography,
  Table,
  Row,
  Col,
  Statistic,
} from "antd";

const { Title } = Typography;

export default function TimeseriesShow() {
  const { result: showResult } = useShow({});
  const timeseries = showResult?.data;
  const isLoading = showResult === undefined;

  const dataPointsResult = useList({
    resource: "dataPoints",
    pagination: { pageSize: 100 },
    filters: [{ field: "timeseriesId", operator: "eq", value: timeseries?.id }],
    sorters: [{ field: "timestamp", order: "desc" }],
    queryOptions: { enabled: !!timeseries },
  });
  const dataPoints = dataPointsResult?.result?.data ?? [];
  const count = dataPointsResult?.result?.total ?? 0;

  const latestValue = dataPoints[0];

  // Simple statistics
  const values = dataPoints.map(dp => Number(dp.valueJson) || 0);
  const min = values.length ? Math.min(...values) : 0;
  const max = values.length ? Math.max(...values) : 0;
  const avg = values.length ? (values.reduce((a, b) => a + b, 0) / values.length) : 0;

  // Simple bar chart using CSS
  const maxValue = Math.max(...values, 1);
  const chartHeight = 200;
  const barWidth = Math.max(2, Math.min(20, 800 / values.length));

  if (isLoading) return <Show><Card loading /></Show>;

  return (
    <Show>
      <Card>
        <Descriptions bordered column={2}>
          <Descriptions.Item label="Name">{timeseries?.name}</Descriptions.Item>
          <Descriptions.Item label="Slug">{timeseries?.slug}</Descriptions.Item>
          <Descriptions.Item label="Unit">{timeseries?.unit || "-"}</Descriptions.Item>
          <Descriptions.Item label="Timezone">{timeseries?.timezone}</Descriptions.Item>
          <Descriptions.Item label="Dataset">{timeseries?.dataset?.name}</Descriptions.Item>
          <Descriptions.Item label="Anomaly Detection">
            <Tag color={timeseries?.isAnomalyDetectionEnabled ? "green" : "default"}>
              {timeseries?.isAnomalyDetectionEnabled ? "Enabled" : "Disabled"}
            </Tag>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic title="Data Points" value={count} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="Latest" value={latestValue?.valueJson || 0} precision={2} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="Average" value={avg} precision={2} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="Range" value={`${min} - ${max}`} />
          </Card>
        </Col>
      </Row>

      <Card title={<Title level={5}>Time Series Data</Title>} style={{ marginTop: 16 }}>
        {values.length > 0 ? (
          <div
            style={{
              height: chartHeight,
              display: 'flex',
              alignItems: 'flex-end',
              gap: 1,
              padding: 16,
              background: '#fafafa',
              borderRadius: 8,
              overflowX: 'auto',
            }}
          >
            {values.slice(0, 100).reverse().map((val, i) => {
              const height = (val / maxValue) * (chartHeight - 40);
              return (
                <div
                  key={i}
                  title={`Value: ${val.toFixed(2)}`}
                  style={{
                    width: barWidth,
                    height: Math.max(height, 4),
                    background: '#1890ff',
                    borderRadius: '2px 2px 0 0',
                    transition: 'height 0.3s',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#40a9ff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#1890ff';
                  }}
                />
              );
            })}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: 40 }}>No data available</div>
        )}
      </Card>

      <Card title={<Title level={5}>Recent Data Points</Title>} style={{ marginTop: 16 }}>
        <Table
          dataSource={dataPoints}
          rowKey="id"
          pagination={{ pageSize: 20 }}
          size="small"
        >
          <Table.Column
            dataIndex="timestamp"
            title="Timestamp"
            render={(val) => <DateField value={val} format="YYYY-MM-DD HH:mm:ss" />}
          />
          <Table.Column
            dataIndex="valueJson"
            title="Value"
            render={(val) => <NumberField value={Number(val) || 0} />}
          />
          <Table.Column
            dataIndex="qualityScore"
            title="Quality"
            render={(score) => score ? `${(score * 100).toFixed(0)}%` : '-'}
          />
        </Table>
      </Card>
    </Show>
  );
}
