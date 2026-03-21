#!/usr/bin/env node
/**
 * IoTDB Sample Data Seeding Script
 * 
 * Creates realistic time-series data for testing AI features:
 * - Anomaly detection
 * - Prediction/forecasting
 * - Data visualization
 * 
 * Usage: node scripts/seed-data.js [options]
 * Options:
 *   --devices <number>    Number of devices to create (default: 3)
 *   --days <number>       Number of days of data (default: 7)
 *   --interval <seconds>  Data interval in seconds (default: 60)
 *   --anomalies <number>  Number of anomalies to inject (default: 5)
 *   --dry-run            Show what would be created without inserting
 */

const { Client } = require('@iotdb/iotdb-rpc');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  iotdb: {
    host: process.env.IOTDB_HOST || '127.0.0.1',
    port: parseInt(process.env.IOTDB_PORT) || 6667,
    username: process.env.IOTDB_USERNAME || 'root',
    password: process.env.IOTDB_PASSWORD || 'root',
  },
  devices: parseInt(process.argv[2]) || 3,
  days: parseInt(process.argv[3]) || 7,
  interval: parseInt(process.argv[4]) || 60,
  anomalies: parseInt(process.argv[5]) || 5,
  dryRun: process.argv.includes('--dry-run'),
};

// ANSI colors
const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  reset: '\x1b[0m',
};

function log(color, ...args) {
  console.log(`${color}[SEED]${colors.reset}`, ...args);
}

function generateTimeSeriesData(deviceId, startTime, endTime, intervalMs) {
  const data = [];
  let currentTime = startTime;
  
  // Base values for this device
  const baseTemp = 20 + Math.random() * 10; // 20-30°C
  const baseHumidity = 40 + Math.random() * 30; // 40-70%
  const basePressure = 1000 + Math.random() * 50; // 1000-1050 hPa
  
  while (currentTime <= endTime) {
    // Add realistic patterns
    const hourOfDay = (new Date(currentTime).getUTCHours() / 24);
    const dayOfYear = (new Date(currentTime).getUTCDay()) / 365;
    
    // Temperature: daily cycle + noise
    const tempVariation = Math.sin(hourOfDay * Math.PI * 2) * 5;
    const tempNoise = (Math.random() - 0.5) * 2;
    const temperature = baseTemp + tempVariation + tempNoise;
    
    // Humidity: inverse correlation with temperature
    const humidityVariation = -tempVariation * 3;
    const humidityNoise = (Math.random() - 0.5) * 5;
    const humidity = baseHumidity + humidityVariation + humidityNoise;
    
    // Pressure: slow random walk
    const pressureNoise = (Math.random() - 0.5) * 2;
    const pressure = basePressure + pressureNoise;
    
    data.push({
      timestamp: currentTime,
      temperature: Number(temperature.toFixed(2)),
      humidity: Number(Math.max(0, humidity).toFixed(2)),
      pressure: Number(pressure.toFixed(2)),
    });
    
    currentTime += intervalMs;
  }
  
  return data;
}

function injectAnomalies(data, count) {
  const anomalyIndices = new Set();
  
  while (anomalyIndices.size < count && anomalyIndices.size < data.length) {
    const index = Math.floor(Math.random() * data.length);
    if (index > 10 && index < data.length - 10) { // Avoid edges
      anomalyIndices.add(index);
    }
  }
  
  const anomalies = [];
  
  anomalyIndices.forEach(index => {
    const original = data[index];
    const anomalyType = Math.random();
    
    if (anomalyType < 0.3) {
      // Spike anomaly
      data[index].temperature = original.temperature + (15 + Math.random() * 10);
      anomalies.push({
        index,
        type: 'SPIKE',
        severity: original.temperature > 40 ? 'HIGH' : 'MEDIUM',
        original: original.temperature,
        anomalous: data[index].temperature,
      });
    } else if (anomalyType < 0.6) {
      // Drop anomaly
      data[index].temperature = original.temperature - (10 + Math.random() * 5);
      anomalies.push({
        index,
        type: 'DROP',
        severity: original.temperature < 10 ? 'HIGH' : 'MEDIUM',
        original: original.temperature,
        anomalous: data[index].temperature,
      });
    } else {
      // Flatline anomaly (same value for multiple points)
      const flatlineValue = original.temperature;
      for (let i = 0; i < 3 && index + i < data.length; i++) {
        data[index + i].temperature = flatlineValue;
      }
      anomalies.push({
        index,
        type: 'FLATLINE',
        severity: 'LOW',
        original: original.temperature,
        anomalous: flatlineValue,
      });
    }
  });
  
  return { data, anomalies };
}

async function createTimeseries(client, deviceIds) {
  log(colors.blue, 'Creating time series...');
  
  const timeseries = [];
  deviceIds.forEach(deviceId => {
    timeseries.push(`root.testing.${deviceId}.temperature`);
    timeseries.push(`root.testing.${deviceId}.humidity`);
    timeseries.push(`root.testing.${deviceId}.pressure`);
  });
  
  if (CONFIG.dryRun) {
    log(colors.yellow, '[DRY RUN] Would create timeseries:');
    timeseries.forEach(ts => console.log(`  - ${ts}`));
    return timeseries;
  }
  
  for (const ts of timeseries) {
    try {
      await client.createTimeseries(ts, 'DOUBLE', 'GORILLA', 'SNAPPY');
      log(colors.green, `✓ Created: ${ts}`);
    } catch (error) {
      if (error.message.includes('already exists')) {
        log(colors.yellow, `⊘ Already exists: ${ts}`);
      } else {
        log(colors.red, `✗ Failed to create ${ts}:`, error.message);
      }
    }
  }
  
  return timeseries;
}

async function insertData(client, deviceIds, startTime, endTime) {
  log(colors.blue, `Generating data for ${CONFIG.days} days...`);
  
  const intervalMs = CONFIG.interval * 1000;
  const allAnomalies = {};
  
  for (const deviceId of deviceIds) {
    const data = generateTimeSeriesData(deviceId, startTime, endTime, intervalMs);
    const { data: dataWithAnomalies, anomalies } = injectAnomalies(data, CONFIG.anomalies);
    
    allAnomalies[deviceId] = anomalies;
    
    if (CONFIG.dryRun) {
      log(colors.yellow, `[DRY RUN] ${deviceId}:`);
      log(colors.yellow, `  - ${dataWithAnomalies.length} data points`);
      log(colors.yellow, `  - ${anomalies.length} anomalies`);
      continue;
    }
    
    // Insert in batches
    const batchSize = 100;
    for (let i = 0; i < dataWithAnomalies.length; i += batchSize) {
      const batch = dataWithAnomalies.slice(i, i + batchSize);
      
      const records = batch.map(point => ({
        deviceId: `root.testing.${deviceId}`,
        timestamp: point.timestamp,
        measurements: [
          { name: 'temperature', value: point.temperature },
          { name: 'humidity', value: point.humidity },
          { name: 'pressure', value: point.pressure },
        ],
      }));
      
      try {
        await client.insertRecords(records);
      } catch (error) {
        log(colors.red, `✗ Failed to insert batch at ${new Date(batch[0].timestamp).toISOString()}:`, error.message);
      }
    }
    
    log(colors.green, `✓ Inserted ${dataWithAnomalies.length} points for ${deviceId}`);
  }
  
  return allAnomalies;
}

async function main() {
  log(colors.blue, 'IoTDB Sample Data Seeding Script');
  log(colors.blue, '================================');
  log(colors.blue, `Devices: ${CONFIG.devices}`);
  log(colors.blue, `Duration: ${CONFIG.days} days`);
  log(colors.blue, `Interval: ${CONFIG.interval}s`);
  log(colors.blue, `Anomalies: ${CONFIG.anomalies} per device`);
  log(colors.blue, `Dry Run: ${CONFIG.dryRun}`);
  console.log('');
  
  const startTime = Date.now() - (CONFIG.days * 24 * 60 * 60 * 1000);
  const endTime = Date.now();
  
  const deviceIds = Array.from({ length: CONFIG.devices }, (_, i) => `device_${i + 1}`);
  
  if (CONFIG.dryRun) {
    log(colors.yellow, '[DRY RUN] Skipping actual database operations');
    await createTimeseries(null, deviceIds);
    await insertData(null, deviceIds, startTime, endTime);
    log(colors.yellow, '[DRY RUN] Run without --dry-run to actually insert data');
    return;
  }
  
  let client;
  try {
    client = new Client(CONFIG.iotdb.host, CONFIG.iotdb.port, CONFIG.iotdb.username, CONFIG.iotdb.password);
    log(colors.green, '✓ Connected to IoTDB');
    
    await createTimeseries(client, deviceIds);
    const anomalies = await insertData(client, deviceIds, startTime, endTime);
    
    console.log('');
    log(colors.green, '================================');
    log(colors.green, 'Seeding completed successfully!');
    log(colors.green, '================================');
    log(colors.blue, '\nAnomalies injected:');
    Object.entries(anomalies).forEach(([deviceId, anomalyList]) => {
      log(colors.blue, `\n${deviceId}:`);
      anomalyList.forEach((a, i) => {
        const color = a.severity === 'HIGH' ? colors.red : colors.yellow;
        log(color, `  ${i + 1}. ${a.type} at index ${a.index} (${a.severity}): ${a.original.toFixed(1)} → ${a.anomalous.toFixed(1)}`);
      });
    });
    
    log(colors.blue, '\nTest queries:');
    deviceIds.forEach(deviceId => {
      log(colors.blue, `  SELECT temperature FROM root.testing.${deviceId} LIMIT 5`);
      log(colors.blue, `  SELECT humidity FROM root.testing.${deviceId}`);
    });
    
  } catch (error) {
    log(colors.red, '✗ Error:', error.message);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

// Parse command line arguments
const argIndex = process.argv.indexOf('--devices');
if (argIndex !== -1 && process.argv[argIndex + 1]) {
  CONFIG.devices = parseInt(process.argv[argIndex + 1]);
}

main().catch(error => {
  log(colors.red, 'Fatal error:', error);
  process.exit(1);
});
