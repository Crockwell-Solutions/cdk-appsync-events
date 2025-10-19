/*
 * Submit Route Lambda Function
 *
 * This Lambda function is triggered by API Gateway to save a new flight route in the Airspace Alerts system.
 * The route itself is processed by DynamoDB Streams to evaluate potential hazards and notify subscribers.
 * The route is passed in as an array of latitude/longitude points in the request body.
 *
 * This software is licensed under the GNU General Public License v3.0.
 */

import { logger, Point, getRouteDistance, RETURN_HEADERS } from '../shared';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

const client = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(client);

// Load environment variables
const PARTITION_KEY_HASH_PRECISION = parseFloat(process.env.PARTITION_KEY_HASH_PRECISION || '5');

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.info('Processing new flight route', { event });

  // Save the route to DynamoDB
  const routePoints = JSON.parse(event.body || '[]') as Point[];

  // Evaluate the route
  const routeDistance = await getRouteDistance(routePoints);

  return {
    body: JSON.stringify({
      routeDistance: routeDistance,
    }),
    ...RETURN_HEADERS,
  };
};
