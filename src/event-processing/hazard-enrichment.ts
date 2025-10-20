/* eslint-disable @typescript-eslint/no-explicit-any */
/*
 * Hazard Enrichment Lambda
 *
 * This Lambda function is used by EventBridge Pipes to enrich hazard events
 * before they are sent to the AppSync Events API.
 *
 * This software is licensed under the GNU General Public License v3.0.
 */

import { unmarshall } from '@aws-sdk/util-dynamodb';
import { logger, Point, isPointNearRoute } from '../shared';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';

const AIRSPACE_ALERTER_TABLE = process.env.AIRSPACE_ALERTER_TABLE;

const client = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(client);

export const handler = async (event: any): Promise<any> => {
  logger.info('Processing new hazard event', { event });

  const returnedEvents = [];

  // Fetch all the routes from DynamoDB
  const queryInput: any = {
    TableName: AIRSPACE_ALERTER_TABLE,
    Limit: 50,
    KeyConditionExpression: 'PK = :pk',
    ExpressionAttributeValues: {
      ':pk': 'ROUTE',
    },
  };
  const queryParams = new QueryCommand(queryInput);
  const routes: any = await ddb.send(queryParams);
  logger.info('Fetched routes from DynamoDB for enrichment', { routeCount: routes.Items?.length });

  for (const record of event) {
    // Unmarshall the DynamoDB record
    const newRecord = unmarshall(record.dynamodb.NewImage);
    logger.info('Unmarshalled DynamoDB record', { newRecord });

    returnedEvents.push(
      JSON.stringify({
        type: 'Hazard',
        data: {
          hazardId: newRecord.SK.split('#')[1],
          type: newRecord.type,
          lat: newRecord.lat,
          lon: newRecord.lon,
        },
      }),
    );

    // Check if the hazard affects any routes and add this to any responses as an alert
    const hazardPoint: Point = { lat: newRecord.lat, lon: newRecord.lon };
    for (const route of routes.Items || []) {
      if (isPointNearRoute(route.routePoints, hazardPoint)) {
        returnedEvents.push(
          JSON.stringify({
            type: 'Alert',
            data: {
              hazardId: newRecord.SK.split('#')[1],
              routeId: route.SK.split('#')[1],
              type: newRecord.type,
              lat: newRecord.lat,
              lon: newRecord.lon,
            },
          }),
        );
      }
    }
  }

  return {
    channel: 'alerts/alert',
    events: returnedEvents,
  };
};
