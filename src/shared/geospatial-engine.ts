/*
 * Geospatial Engine Module
 *
 * This module is responsible for processing geospatial data and performing queries
 * on DynamoDB using appropriate indexing strategies.
 *
 * This software is licensed under the Apache License, Version 2.0 (the "License");
 */

import { ulid } from 'ulid';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { getDistance, getDistanceFromLine } from 'geolib';

const AIRSPACE_ALERTER_TABLE = process.env.AIRSPACE_ALERTER_TABLE;

export type Point = { lat: number; lon: number };
export type BoundingBox = { latMin: number; lonMin: number; latMax: number; lonMax: number };

/**
 * Returns true if the given geo point is near the route defined by a set of points.
 * Points within 10,000 meters of the route are included.
 *
 * @param route - An array of points defining the route.
 * @param geoPoint - The geo point to check.
 * @param bufferMeters - The maximum distance in meters from the route to consider a point as "near" (default is 50km).
 * @returns True if the geo point is near the route, false otherwise.
 */
export function isPointNearRoute(route: [Point], geoPoint: Point, bufferMeters = 50000): boolean {
  for (let i = 0; i < route.length - 1; i++) {
    const start = route[i];
    const end = route[i + 1];
    const distance = getDistanceFromLine(
      { latitude: geoPoint.lat, longitude: geoPoint.lon },
      { latitude: start.lat, longitude: start.lon },
      { latitude: end.lat, longitude: end.lon },
    );
    if (distance <= bufferMeters) {
      return true;
    }
  }
  return false;
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
 * Creates a new route record in the DynamoDB table with a unique route ID.
 *
 * @param ddb - The DynamoDBDocumentClient instance used to interact with DynamoDB.
 * @param route - An array of `Point` objects representing the route to be stored.
 * @returns A promise that resolves to the generated route ID as a string.
 *
 * @remarks
 * The route record will have a TTL (time-to-live) of 7 days from the time of creation.
 */
export async function createRouteRecord(ddb: DynamoDBDocumentClient, route: Array<Point>): Promise<string> {
  const routeId = ulid();
  const params = new PutCommand({
    TableName: AIRSPACE_ALERTER_TABLE,
    Item: {
      PK: 'ROUTE',
      SK: `ROUTE#${routeId}`,
      routePoints: route,
      ttl: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 days TTL
    },
  });
  await ddb.send(params);
  return routeId;
}
