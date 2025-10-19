/* eslint-disable @typescript-eslint/no-explicit-any */

/*
 * Geospatial Engine Module
 *
 * This module is responsible for processing geospatial data and performing queries
 * on DynamoDB using appropriate indexing strategies.
 *
 * This software is licensed under the Apache License, Version 2.0 (the "License");
 */

import * as geohash from 'ngeohash';
import { GeospatialConfig, GEOSPATIAL_QUERIES } from '../../config/geospatial-config';
import { logger, chunkArray, getAllShardPrefixes } from '.';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { getDistance, getRhumbLineBearing, computeDestinationPoint, getDistanceFromLine } from 'geolib';

const SPATIAL_DATA_TABLE = process.env.SPATIAL_DATA_TABLE;
const PARTITION_KEY_HASH_PRECISION = parseInt(process.env.PARTITION_KEY_HASH_PRECISION || '1');
const PARTITION_KEY_SHARDS = parseInt(process.env.PARTITION_KEY_SHARDS || '10');
const GSI_HASH_PRECISION = parseInt(process.env.GSI_HASH_PRECISION || '4');

export type Point = { lat: number; lon: number };
export type BoundingBox = { latMin: number; lonMin: number; latMax: number; lonMax: number };

/**
 * Calculates and returns an array of geohash strings that cover the specified bounding box.
 *
 * @param boundingBox - The bounding box defined by minimum and maximum latitude and longitude.
 * @param geospatialConfig - The geospatial configuration that includes the precision for the geohashes.
 * @returns An array of geohash strings covering the bounding box.
 */
export function getBoundingBoxGeoHashes(boundingBox: BoundingBox, geospatialConfig: GeospatialConfig): string[] {
  const { latMin, lonMin, latMax, lonMax } = boundingBox;
  logger.debug('Calculating geohashes for bounding box', { boundingBox });

  // Generate geohashes for the bounding box
  const hashes = geohash.bboxes(latMin, lonMin, latMax, lonMax, geospatialConfig.hashPrecision);
  logger.debug(`Generated ${hashes.length} geohashes for bounding box`, { hashes });

  // If this is the main DynamoDB partition (not the GSI), add the prefixes to the hashes
  if (geospatialConfig.index === 'primary') {
    const primaryIndexHashes = [];
    for (const hash of hashes) {
      primaryIndexHashes.push(...getAllShardPrefixes(PARTITION_KEY_SHARDS, hash));
    }
    logger.debug(`Using primary index with ${primaryIndexHashes.length} geohashes for bounding box`, {
      primaryIndexHashes,
    });
    return primaryIndexHashes;
  }

  return hashes;
}

/**
 * Generates a list of geohashes representing the route between two geographic points.
 *
 * The function computes geohashes along the straight path (rhumb line) from the start point to the end point,
 * at intervals specified by `stepMeters`. The geohash precision can be customized.
 * The start and end points are always included in the result.
 *
 * @param start - The starting geographic point with latitude and longitude.
 * @param end - The ending geographic point with latitude and longitude.
 * @param geospatialConfig - The geospatial configuration that includes the precision for the geohashes.
 * @param stepMeters - The distance in meters between each computed geohash along the route (default is 100).
 * @param bufferMeters - The buffer distance in meters around the route to include additional geohashes (default is 10,000).
 * @returns An array of unique geohash strings covering the route from start to end.
 */
export function getRouteGeoHashes(
  start: Point,
  end: Point,
  geospatialConfig: GeospatialConfig,
  stepMeters = 1000, // 1km spacing for performance
  bufferMeters = 10000,
): string[] {
  const routeLength = getDistance(start, end); // in meters
  logger.debug(`Route length from start to end: ${routeLength} meters`, { start, end });

  const geoHashes = new Set<string>();

  // Always include start and end
  geoHashes.add(geohash.encode(start.lat, start.lon, geospatialConfig.hashPrecision));
  geoHashes.add(geohash.encode(end.lat, end.lon, geospatialConfig.hashPrecision));

  const bearing = getRhumbLineBearing(start, end);
  const steps = Math.floor(routeLength / stepMeters);

  for (let i = 0; i <= steps; i++) {
    const point = computeDestinationPoint(start, i * stepMeters, bearing);

    // Convert buffer radius from meters to degrees approximately
    const latBuffer = bufferMeters / 111000; // 1 deg ≈ 111 km
    const lonBuffer = bufferMeters / (111000 * Math.cos((point.latitude * Math.PI) / 180));

    const hashes = geohash.bboxes(
      point.latitude - latBuffer,
      point.longitude - lonBuffer,
      point.latitude + latBuffer,
      point.longitude + lonBuffer,
      geospatialConfig.hashPrecision,
    );

    hashes.forEach((h) => geoHashes.add(h));
  }

  const hashes = Array.from(geoHashes);

  // If this is the main DynamoDB partition (not the GSI), add the prefixes to the hashes
  if (geospatialConfig.index === 'primary') {
    const primaryIndexHashes = [];
    for (const hash of hashes) {
      primaryIndexHashes.push(...getAllShardPrefixes(PARTITION_KEY_SHARDS, hash));
    }
    logger.debug(`Using primary index with ${primaryIndexHashes.length} geohashes for bounding box`, {
      primaryIndexHashes,
    });
    return primaryIndexHashes;
  }

  return hashes;
}

/**
 * Returns an array of geo points that are near the route defined by the start and end points.
 * Points within 10,000 meters of the route are included.
 *
 * @param start - The starting point of the route.
 * @param end - The ending point of the route.
 * @param geoPoints - An array of geo points to check, each expected to have `lat`, `lon`, and `type` properties.
 * @param bufferMeters - The maximum distance in meters from the route to consider a point as "near" (default is 10,000 meters).
 * @returns An array of geo points that are near the route according to their type-specific distance thresholds.
 */
export function getPointsNearRoute(start: Point, end: Point, geoPoints: Array<any>, bufferMeters = 10000): Array<any> {
  const results: Array<any> = [];

  const routeLength = getDistance(start, end); // in meters
  logger.debug(`Route length from start to end: ${routeLength} meters`, { start, end });

  for (const point of geoPoints) {
    if (point.lat && point.lon) {
      const distance = getDistanceFromLine(
        { latitude: point.lat, longitude: point.lon },
        { latitude: start.lat, longitude: start.lon },
        { latitude: end.lat, longitude: end.lon },
      );
      logger.debug(`Distance from point to route: ${distance} meters`, { point });
      if (distance <= bufferMeters) {
        results.push(point);
      }
    }
  }

  return results;
}

/**
 * Calculates the appropriate geohash precision configuration based on the distance
 * between two geographic points.
 *
 * Iterates through the available geospatial query configurations and selects the first
 * configuration where the distance between the start and end points is greater than or
 * equal to the configuration's distance threshold.
 *
 * @param startPoint - The starting geographic point.
 * @param endPoint - The ending geographic point.
 * @returns The selected {@link GeospatialConfig} if a suitable configuration is found; otherwise, `undefined`.
 */
export function calculateGeoHashPrecision(startPoint: Point, endPoint: Point): GeospatialConfig {
  const distance = getDistance(startPoint, endPoint);
  logger.info('Calculating geohash precision based on distance', { distance });
  for (const config of GEOSPATIAL_QUERIES) {
    if (distance >= config.distance) {
      logger.info('Selected geospatial config based on distance', { config });
      return config;
    }
  }
  // If no suitable configuration is found, return the last one (most precise)
  const lastConfig = GEOSPATIAL_QUERIES[GEOSPATIAL_QUERIES.length - 1];
  logger.info('No suitable geospatial config found, using the most precise one', { lastConfig });
  return lastConfig;
}

/**
 * Fetches items from a DynamoDB table for a list of geohash prefixes.
 *
 * Processes the provided geohash prefixes in chunks (batches) of 50, querying DynamoDB for each prefix in parallel.
 * Aggregates all items returned from the queries into a single array.
 * Logs errors for individual prefix queries and logs the total count of items retrieved.
 *
 * @param ddb - The DynamoDBDocumentClient instance used to send queries.
 * @param geoHashes - An array of geohash prefix strings to query.
 * @param geospatialConfig - The geospatial configuration to use for the query.
 * @returns A promise that resolves to an array of items retrieved from DynamoDB.
 */
export async function fetchGeoHashItemsFromDynamoDB(
  ddb: DynamoDBDocumentClient,
  geoHashes: string[],
  geospatialConfig: GeospatialConfig,
  queryLimit: number,
): Promise<any[]> {
  const results: any[] = [];
  // Calculate the fetch limit based on the provided query limit and the geospatial config multiplier
  const fetchLimit = Math.max(Math.ceil(queryLimit * geospatialConfig.fetchLimitMultiplier), 10);
  // Process the DynamoDB queries in parallel in chunks of 50
  const chunks = chunkArray(geoHashes, 50);
  for (const chunk of chunks) {
    await Promise.all(
      chunk.map(async (prefix) => {
        try {
          const response = await performGeospatialQueryCommand(ddb, prefix, geospatialConfig, fetchLimit);
          if (response) results.push(...response);
        } catch (err) {
          logger.error(`Error querying prefix ${prefix}`, { error: err });
        }
      }),
    );
  }
  return results;
}

/**
 * Performs a paginated geospatial query on a DynamoDB table using the provided geoHash as the partition key.
 * Fetches up to `MAXIMUM_DYNAMODB_FETCH` pages of results, each limited by `DYNAMODB_FETCH_LIMIT`.
 * Aggregates and returns all retrieved items as an array.
 *
 * @param ddb - The DynamoDBDocumentClient instance used to execute the query.
 * @param geoHash - The geohash string used as the partition key for the query.
 * @param geospatialConfig - The geospatial configuration that includes the index and hash precision.
 * @param queryLimit - The maximum number of items to fetch in total (default is `MAXIMUM_DYNAMODB_RECORDS`).
 * @returns A promise that resolves to an array of items retrieved from the DynamoDB table.
 */
export async function performGeospatialQueryCommand(
  ddb: DynamoDBDocumentClient,
  geoHash: string,
  geospatialConfig: GeospatialConfig,
  queryLimit: number,
): Promise<any[]> {
  const returnData: any[] = [];

  const queryInput: any = {
    TableName: SPATIAL_DATA_TABLE,
    Limit: queryLimit,
  };

  // Build the query parameters based on the geospatial configuration

  // If this hash is the same precision as the partition key, perform a PK only query
  if (geospatialConfig.hashPrecision === PARTITION_KEY_HASH_PRECISION) {
    queryInput.KeyConditionExpression = 'PK = :pk';
    queryInput.ExpressionAttributeValues = {
      ':pk': geoHash,
    };
  }

  // If the hash is the longer than the partition key hash precision, but less than the GSI hash precision
  // then perform a PK and SK query
  if (
    geospatialConfig.hashPrecision > PARTITION_KEY_HASH_PRECISION &&
    geospatialConfig.hashPrecision < GSI_HASH_PRECISION
  ) {
    const pkHash = `${geoHash.split('#')[0]}#${geoHash.split('#')[1].substring(0, PARTITION_KEY_HASH_PRECISION)}`;
    queryInput.KeyConditionExpression = 'PK = :pk AND begins_with(SK, :sk)';
    queryInput.ExpressionAttributeValues = {
      ':pk': pkHash,
      ':sk': geoHash.split('#')[1],
    };
  }

  // If the hash is the same as the GSI hash precision, perform query directly against GSI1PK
  if (geospatialConfig.hashPrecision === GSI_HASH_PRECISION) {
    queryInput.KeyConditionExpression = 'GSI1PK = :pk';
    queryInput.IndexName = 'GSI1';
    queryInput.ExpressionAttributeValues = {
      ':pk': geoHash,
    };
  }

  // If the hash is the longer than the GSI hash precision, perform a query against GSI1 with the sort key
  if (geospatialConfig.hashPrecision > GSI_HASH_PRECISION) {
    const pkHash = geoHash.substring(0, GSI_HASH_PRECISION);
    queryInput.KeyConditionExpression = 'GSI1PK = :pk AND begins_with(GSI1SK, :sk)';
    queryInput.IndexName = 'GSI1';
    queryInput.ExpressionAttributeValues = {
      ':pk': pkHash,
      ':sk': geoHash,
    };
  }

  const queryParams = new QueryCommand(queryInput);

  const data: any = await ddb.send(queryParams);
  if (data === false) return [];
  if (data.Items && data.Items.length > 0) returnData.push(...data.Items);
  logger.debug('Successfully retrieved record(s) from DynamoDB Query', {
    numberOfRecords: returnData.length,
  });
  return returnData;
}

/**
 * Calculates the length in meters between a set of points.
 *
 * @param routePoints - An array of `Point` objects representing the route, where the first point is the start and the last point is the end.
 * Each point should have `lat` and `lon` properties.
 * If the array is empty or contains only one point, the function returns 0.
 * @returns A promise that resolves to the length in meters
 */
export async function getRouteDistance(routePoints: Array<Point>): Promise<number> {
  // Calculate the round trip distance in meters between the start and end points
  const distance = routePoints.reduce((acc, point, i) => {
    if (i === 0) return acc;
    return acc + getDistance(routePoints[i - 1], point);
  }, 0);
  return distance;
}

/**
 * Returns a random sample of `n` unique elements from the given array.
 * If `n` is greater than or equal to the array's length, returns a shallow copy of the entire array.
 *
 * @typeParam T - The type of elements in the array.
 * @param arr - The array to sample from.
 * @param n - The number of unique elements to sample.
 * @returns An array containing `n` randomly selected unique elements from `arr`.
 */
function randomSample<T>(arr: T[], n: number): T[] {
  if (n >= arr.length) return [...arr];
  const result: T[] = [];
  const indices = new Set<number>();
  while (result.length < n) {
    const idx = Math.floor(Math.random() * arr.length);
    if (!indices.has(idx)) {
      indices.add(idx);
      result.push(arr[idx]);
    }
  }
  return result;
}

/**
 * Distribute a set of points evenly across a spatial grid.
 *
 * @param points The dataset of points (must include lat and lon fields).
 * @param limit  The max number of points to return.
 */
export function getDistributedPoints<T extends { lat: number; lon: number }>(points: T[], limit: number): T[] {
  if (points.length <= limit) return [...points];

  // Find bounds
  const lats = points.map((p) => p.lat);
  const lons = points.map((p) => p.lon);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);

  // Create spatial grid
  const gridSize = Math.ceil(Math.sqrt(limit));
  const latStep = (maxLat - minLat) / gridSize;
  const lonStep = (maxLon - minLon) / gridSize;

  // Group points by grid cell
  const grid: Record<string, T[]> = {};
  for (const point of points) {
    const gridLat = Math.floor((point.lat - minLat) / latStep);
    const gridLon = Math.floor((point.lon - minLon) / lonStep);
    const key = `${gridLat},${gridLon}`;
    if (!grid[key]) grid[key] = [];
    grid[key].push(point);
  }

  // Sample from each grid cell
  const cells = Object.values(grid);
  const pointsPerCell = Math.max(1, Math.floor(limit / cells.length));
  const result: T[] = [];

  for (const cell of cells) {
    const take = Math.min(pointsPerCell, cell.length);
    result.push(...randomSample(cell, take));
  }

  // Fill remaining quota from unused points
  if (result.length < limit) {
    const remaining = limit - result.length;
    const unused = points.filter((p) => !result.includes(p));
    result.push(...randomSample(unused, remaining));
  }

  return result.slice(0, limit);
}
