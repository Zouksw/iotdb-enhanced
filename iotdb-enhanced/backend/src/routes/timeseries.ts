import { Router, Request, Response } from 'express';
import { prisma } from '../lib';
import { getIoTDBClient } from '../../config/iotdb';
import { asyncHandler, NotFoundError } from '../middleware/errorHandler';
import { getPagination, paginationSchema, limitSchema } from '../schemas/common';

const router = Router();

// GET /api/timeseries - Get all timeseries with filters
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { datasetId, search } = req.query;
  const { skip, take } = getPagination(req.query);
  const params = paginationSchema.parse(req.query);

  const where: any = {};
  if (datasetId) {
    where.datasetId = datasetId as string;
  }
  if (search) {
    where.OR = [
      { name: { contains: search as string, mode: 'insensitive' } },
      { description: { contains: search as string, mode: 'insensitive' } },
    ];
  }

  const [timeseries, total] = await Promise.all([
    prisma.timeseries.findMany({
      where,
      skip,
      take,
      include: {
        dataset: { select: { id: true, name: true, slug: true } },
        _count: { select: { dataPoints: true, anomalies: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.timeseries.count({ where }),
  ]);

  res.json({
    timeseries,
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages: Math.ceil(total / params.limit),
    },
  });
}));

// GET /api/timeseries/:id - Get single timeseries
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const params = limitSchema.parse(req.query);

  const timeseries = await prisma.timeseries.findUnique({
    where: { id },
    include: {
      dataset: { select: { id: true, name: true, slug: true } },
      _count: { select: { dataPoints: true, anomalies: true } },
    },
  });

  if (!timeseries) {
    throw new NotFoundError('Timeseries');
  }

  // Count datapoints
  const datapointCount = await prisma.datapoint.count({
    where: { timeseriesId: id }
  });

  const result: any = {
    ...timeseries,
    datapointCount,
  };

  // Try to get latest data from IoTDB
  try {
    const iotdbClient = await getIoTDBClient();
    const iotdbData = await iotdbClient.queryTimeseriesData(
      `root.${timeseries.datasetId}.${timeseries.name}`,
      params.limit
    );

    if (iotdbData && iotdbData.length > 0) {
      result.iotdbDataPoints = iotdbData.length;
      result.latestData = iotdbData[0];
    }
  } catch (err) {
    // IoTDB connection is optional
    console.debug('IoTDB query failed (expected if not configured):', err);
  }

  res.json(result);
}));

// GET /api/timeseries/:id/data - Get timeseries data
router.get('/:id/data', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { startTime, endTime } = req.query;
  const params = limitSchema.parse(req.query);

  const timeseries = await prisma.timeseries.findUnique({
    where: { id },
  });

  if (!timeseries) {
    throw new NotFoundError('Timeseries');
  }

  // Get datapoints from PostgreSQL
  const datapoints = await prisma.datapoint.findMany({
    where: { timeseriesId: id },
    take: params.limit,
    orderBy: { timestamp: 'desc' },
  });

  // Try to get data from IoTDB
  let iotdbData: any[] = [];
  try {
    const iotdbClient = await getIoTDBClient();
    iotdbData = await iotdbClient.queryTimeseriesData(
      `root.${timeseries.datasetId}.${timeseries.name}`,
      params.limit,
      startTime as string,
      endTime as string
    );
  } catch (err) {
    // IoTDB connection is optional
    console.debug('IoTDB query failed (expected if not configured):', err);
  }

  res.json({
    data: datapoints,
    iotdbData: iotdbData || [],
    pagination: {
      page: 1,
      limit: params.limit,
      total: datapoints.length + (iotdbData?.length || 0),
      totalPages: 1,
    },
  });
}));

// POST /api/timeseries/:id/data - Insert data point
router.post('/:id/data', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { timestamp, value, quality } = req.body;

  const timeseries = await prisma.timeseries.findUnique({
    where: { id },
  });

  if (!timeseries) {
    throw new NotFoundError('Timeseries');
  }

  const datapoint = await prisma.datapoint.create({
    data: {
      timeseriesId: id,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      valueJson: JSON.stringify(value !== undefined ? value : 0),
    },
  });

  // Try to write to IoTDB
  try {
    const iotdbClient = await getIoTDBClient();
    const ts = timestamp ? new Date(timestamp).getTime() : Date.now();
    await iotdbClient.insertRecords(
      [`root.${timeseries.datasetId}.${timeseries.name}`],
      [ts],
      [['value']],
      [['DOUBLE']],
      [[[value !== undefined ? value : 0]]],
      false
    );
  } catch (err) {
    // IoTDB connection is optional
    console.debug('IoTDB insert failed (expected if not configured):', err);
  }

  res.status(201).json(datapoint);
}));

// DELETE /api/timeseries/:id - Delete timeseries
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const timeseries = await prisma.timeseries.findUnique({
    where: { id },
  });

  if (!timeseries) {
    throw new NotFoundError('Timeseries');
  }

  // Try to delete from IoTDB
  try {
    const iotdbClient = await getIoTDBClient();
    await iotdbClient.deleteTimeseriesData(
      `root.${timeseries.datasetId}.${timeseries.name}`
    );
  } catch (err) {
    // IoTDB connection is optional
    console.debug('IoTDB delete failed (expected if not configured):', err);
  }

  // Delete from PostgreSQL
  await prisma.datapoint.deleteMany({
    where: { timeseriesId: id }
  });

  await prisma.timeseries.delete({
    where: { id }
  });

  res.json({
    success: true,
    message: 'Timeseries deleted successfully',
  });
}));

export { router as timeseriesRouter };
