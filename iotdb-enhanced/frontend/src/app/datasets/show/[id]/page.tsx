"use client";

import {
  DateField,
  Show,
} from "@refinedev/antd";
import { useShow, useList } from "@refinedev/core";
import { Card, Descriptions, Tag, Typography, Table, Button } from "antd";
import { useRouter } from "next/navigation";

const { Title, Paragraph } = Typography;

export default function DatasetShow() {
  const { result: showResult } = useShow({});
  const dataset = showResult?.data;
  const isLoading = showResult === undefined;

  const timeseriesResult = useList({
    resource: "timeseries",
    pagination: { pageSize: 10 },
    filters: [{ field: "datasetId", operator: "eq", value: dataset?.id }],
    queryOptions: { enabled: !!dataset },
  });
  const timeseriesData = timeseriesResult?.result?.data ?? [];

  const router = useRouter();

  if (isLoading) return <Show><Card loading /></Show>;

  return (
    <Show>
      <Card>
        <Descriptions bordered column={2}>
          <Descriptions.Item label="ID">
            <code>{dataset?.id}</code>
          </Descriptions.Item>
          <Descriptions.Item label="Name">
            {dataset?.name}
          </Descriptions.Item>
          <Descriptions.Item label="Slug">
            <code>{dataset?.slug}</code>
          </Descriptions.Item>
          <Descriptions.Item label="Storage Format">
            <Tag color="blue">{dataset?.storageFormat}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Organization">
            {dataset?.organization?.name}
          </Descriptions.Item>
          <Descriptions.Item label="Owner">
            {dataset?.owner?.name} ({dataset?.owner?.email})
          </Descriptions.Item>
          <Descriptions.Item label="Time Series">
            <Tag color="green">{dataset?._count?.timeseries || 0}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Public">
            <Tag color={dataset?.isPublic ? "green" : "default"}>
              {dataset?.isPublic ? "Yes" : "No"}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Created At">
            <DateField value={dataset?.createdAt} />
          </Descriptions.Item>
          <Descriptions.Item label="Last Accessed">
            <DateField value={dataset?.lastAccessedAt} />
          </Descriptions.Item>
        </Descriptions>

        {dataset?.description && (
          <>
            <Title level={5}>Description</Title>
            <Paragraph>{dataset.description}</Paragraph>
          </>
        )}
      </Card>

      <Card
        title={<Title level={5}>Time Series ({timeseriesData.length || 0})</Title>}
        style={{ marginTop: 16 }}
        extra={
          <Button
            type="primary"
            onClick={() => router.push(`/timeseries/create?datasetId=${dataset?.id}`)}
          >
            Add Time Series
          </Button>
        }
      >
        <Table
          dataSource={timeseriesData}
          rowKey="id"
          pagination={false}
        >
          <Table.Column dataIndex="name" title="Name" />
          <Table.Column dataIndex="slug" title="Slug" />
          <Table.Column
            dataIndex={["_count", "dataPoints"]}
            title="Data Points"
          />
          <Table.Column
            dataIndex="isAnomalyDetectionEnabled"
            title="Anomaly Detection"
            render={(enabled) => (
              <Tag color={enabled ? "green" : "default"}>
                {enabled ? "Enabled" : "Disabled"}
              </Tag>
            )}
          />
        </Table>
      </Card>
    </Show>
  );
}
