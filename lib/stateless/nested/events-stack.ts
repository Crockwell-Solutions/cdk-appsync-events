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

interface EventResourcesProps extends NestedStackProps {
  stage: Stage;
  envConfig: EnvironmentConfig;
}

export class EventResources extends NestedStack {
  public optimiseNewRoute: NodejsFunction;
  public eventsApi: EventApi;

  constructor(scope: Construct, id: string, props: EventResourcesProps) {
    super(scope, id, props);

    // Create the AppSync Events Websocket API
    const apiKeyProvider = { authorizationType: AppSyncAuthorizationType.API_KEY };

    // Create the Appsync Events API
    this.eventsApi = new EventApi(this, 'AirspaceAlerterEventsApi', {
      apiName: 'AirspaceAlertsEvents',
      authorizationConfig: { authProviders: [apiKeyProvider] },
    });

    // add a channel namespace called `alerts`
    this.eventsApi.addChannelNamespace('alerts');
  }
}
