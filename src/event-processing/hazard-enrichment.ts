/*
 * Hazard Enrichment Lambda
 *
 * This Lambda function is used by EventBridge Pipes to enrich hazard events
 * before they are sent to the AppSync Events API.
 *
 * This software is licensed under the GNU General Public License v3.0.
 */

import { unmarshall } from '@aws-sdk/util-dynamodb';
import { logger, Point, getRouteDistance, createRouteRecord } from '../shared';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(client);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const handler = async (event: any): Promise<any> => {
  logger.info('Processing new hazard event', { event });

  const returnedEvents = [];

  for (const record of event) {
    // Unmarshall the DynamoDB record
    const newRecord = unmarshall(record.dynamodb.NewImage);
    logger.info('Unmarshalled DynamoDB record', { newRecord });

    returnedEvents.push(
      JSON.stringify({
        type: 'Hazard',
        data: {
          type: newRecord.type,
          lat: newRecord.lat,
          lon: newRecord.lon,
        },
      }),
    );
  }

  return {
    channel: 'alerts/alert',
    events: returnedEvents,
  };
};
