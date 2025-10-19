/*
 * CDK Nested Stack - Event Driven Resources
 *
 * This CDK nested stack sets up the event driven resources for the Airspace Alerter Demo.
 * This contains the Lambda functions, EventBridge events, and DynamoDB streams.
 *
 * This software is licensed under the GNU General Public License v3.0.
 */

import { Construct } from 'constructs';
import { NestedStack, NestedStackProps } from 'aws-cdk-lib';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { EnvironmentConfig, Stage } from '../../../config';
import { AppSyncAuthorizationType, EventApi } from 'aws-cdk-lib/aws-appsync';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import { EventBus } from 'aws-cdk-lib/aws-events';
import { Pipe } from '@aws-cdk/aws-pipes-alpha';
import { DynamoDBSource, DynamoDBStartingPosition } from '@aws-cdk/aws-pipes-sources-alpha';
import { EventBridgeTarget } from '@aws-cdk/aws-pipes-targets-alpha';

interface EventResourcesProps extends NestedStackProps {
  stage: Stage;
  envConfig: EnvironmentConfig;
  airspaceAlerterTable: Table;
}

export class EventResources extends NestedStack {
  public optimiseNewRoute: NodejsFunction;
  public eventsApi: EventApi;

  constructor(scope: Construct, id: string, props: EventResourcesProps) {
    super(scope, id, props);

    // Create a custom event bus for the airspace alerter demo
    const eventBus = new EventBus(this, 'AirspaceAlerterEventBus');

    // Create the AppSync Events Websocket API
    const apiKeyProvider = { authorizationType: AppSyncAuthorizationType.API_KEY };

    // Create the Appsync Events API
    this.eventsApi = new EventApi(this, 'AirspaceAlerterEventsApi', {
      apiName: 'AirspaceAlertsEvents',
      authorizationConfig: { authProviders: [apiKeyProvider] },
    });

    // Add the EventBridge data source to the Events API
    this.eventsApi.addEventBridgeDataSource('AirspaceAlerterEventBridgeDataSource', eventBus);

    // Create the EventBridge Pipe that will process new hazard events from DynamoDB stream and publish to AppSync Events API
    new Pipe(this, 'HazardEventsPipe', {
      source: new DynamoDBSource(props.airspaceAlerterTable, {
        startingPosition: DynamoDBStartingPosition.LATEST,
      }),
      target: new EventBridgeTarget(eventBus),
    });

    // add a channel namespace called `alerts`
    this.eventsApi.addChannelNamespace('alerts');
  }
}
