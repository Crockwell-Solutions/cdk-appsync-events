/*
 * Simulate Airspace Hazards Function
 *
 * This Lambda function is triggered by an API Gateway event and will simulate airspace hazards by creating
 * geospatial data within the DynamoDB table used for spatial queries.
 *
 * This software is licensed under the Apache License, Version 2.0 (the "License");
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { logger, RETURN_HEADERS } from '../shared';
import * as geohash from 'ngeohash';
import { ulid } from 'ulid';

const AIRSPACE_ALERTER_TABLE = process.env.AIRSPACE_ALERTER_TABLE;
const GSI_HASH_PRECISION = parseInt(process.env.GSI_HASH_PRECISION || '4');

const client = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(client);

const HAZARD_TYPES = ['Airspace Alert', 'Thunderstorm', 'Bird Activity', 'Drone Activity'];

// UK bounding box (approximate)
const UK_BOUNDS = {
  latMin: 49.9,
  latMax: 58.7,
  lonMin: -8.2,
  lonMax: 1.8,
};

function getRandomUKLocation() {
  const lat = UK_BOUNDS.latMin + Math.random() * (UK_BOUNDS.latMax - UK_BOUNDS.latMin);
  const lon = UK_BOUNDS.lonMin + Math.random() * (UK_BOUNDS.lonMax - UK_BOUNDS.lonMin);
  return { lat, lon };
}

function getRandomHazardType() {
  return HAZARD_TYPES[Math.floor(Math.random() * HAZARD_TYPES.length)];
}

function getRandomDelay() {
  return (2 + Math.random() * 5) * 1000; // 2-7 seconds in milliseconds
}

async function createHazard() {
  const hazardId = ulid();
  const location = getRandomUKLocation();
  const hazardType = getRandomHazardType();
  const gsiHash = geohash.encode(location.lat, location.lon, GSI_HASH_PRECISION);

  await ddb.send(
    new PutCommand({
      TableName: AIRSPACE_ALERTER_TABLE,
      Item: {
        PK: 'HAZARD',
        SK: `HAZARD#${hazardId}`,
        GSI1PK: gsiHash,
        GSI1SK: `HAZARD#${hazardId}`,
        type: hazardType,
        lat: location.lat,
        lon: location.lon,
        timestamp: Date.now(),
        ttl: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour TTL
      },
    }),
  );

  logger.info('Created hazard', { hazardId, hazardType, location });
}

export const handler = async () => {
  logger.info('Starting hazard simulation for 1 minute');

  const startTime = Date.now();
  const endTime = startTime + 60000; // 1 minute
  let hazardCount = 0;

  while (Date.now() < endTime) {
    await createHazard();
    hazardCount++;

    const delay = getRandomDelay();
    const remainingTime = endTime - Date.now();

    if (remainingTime > delay) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    } else {
      break;
    }
  }

  logger.info('Hazard simulation completed', { hazardCount });

  return {
    body: JSON.stringify({
      message: 'Airspace hazards simulated successfully',
      hazardCount,
    }),
    ...RETURN_HEADERS,
  };
};
