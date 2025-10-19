/*
 * CDK Nested Stack - Event Driven Resources
 *
 * This CDK nested stack sets up the event driven resources for the Airspace Alerter Demo.
 * This contains the Lambda functions, EventBridge events, and DynamoDB streams.
 *
 * This software is licensed under the GNU General Public License v3.0.
 */

import { Construct } from 'constructs';
import { aws_iam, NestedStack, NestedStackProps, SecretValue } from 'aws-cdk-lib';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { EnvironmentConfig, Stage } from '../../../config';
import { AppSyncAuthorizationType, EventApi } from 'aws-cdk-lib/aws-appsync';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import { Connection, Authorization, ApiDestination, HttpMethod } from 'aws-cdk-lib/aws-events';
import {
  Pipe,
  Filter,
  FilterPattern,
  InputTransformation,
  IEnrichment,
  IPipe,
  EnrichmentParametersConfig,
  LogLevel,
  IncludeExecutionData,
  CloudwatchLogsLogDestination,
} from '@aws-cdk/aws-pipes-alpha';
import { DynamoDBSource, DynamoDBStartingPosition } from '@aws-cdk/aws-pipes-sources-alpha';
import { ApiDestinationTarget } from '@aws-cdk/aws-pipes-targets-alpha';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { Function } from 'aws-cdk-lib/aws-lambda';

interface EventResourcesProps extends NestedStackProps {
  stage: Stage;
  envConfig: EnvironmentConfig;
  airspaceAlerterTable: Table;
  hazardsEnrichmentFunction: NodejsFunction;
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

    // Create a new secret for the AppSync Events API Key
    const apiKeySecret = new Secret(this, 'AirspaceAlertsApiKeySecret', {
      secretName: 'AirspaceAlertsApiKey',
      secretStringValue: SecretValue.unsafePlainText(this.eventsApi.apiKeys['Default'].attrApiKey),
    });

    // Create an Eventbridge API destinations used for sending events to AppSync Events
    const connection = new Connection(this, 'AirspaceAlertsAppsyncConnection', {
      authorization: Authorization.apiKey('x-api-key', apiKeySecret.secretValue),
      description: 'Connection with API Key x-api-key',
    });
    const airspaceAlertsAppsyncDestination = new ApiDestination(this, 'AirspaceAlertsAppsyncDestination', {
      connection,
      endpoint: `https://${this.eventsApi.httpDns}/event`,
      httpMethod: HttpMethod.POST,
      description: 'Calling AppSync Events API',
    });

    // Create the filter that will be used for the EventBridge Pipe
    const sourceFilter = new Filter([
      FilterPattern.fromObject({
        eventName: ['INSERT'],
        dynamodb: {
          NewImage: {
            PK: {
              S: ['HAZARD'],
            },
          },
        },
      }),
    ]);

    // Create the log group used for the EventBridge Pipe
    const logGroup = new LogGroup(this, 'HazardEventsPipeLogGroup', {
      retention: RetentionDays.ONE_WEEK,
    });
    const cwlLogDestination = new CloudwatchLogsLogDestination(logGroup);

    // Create the EventBridge Pipe that will process new hazard events from DynamoDB stream and publish to AppSync Events API
    new Pipe(this, 'HazardEventsPipe', {
      source: new DynamoDBSource(props.airspaceAlerterTable, {
        startingPosition: DynamoDBStartingPosition.LATEST,
        batchSize: 1,
      }),
      target: new ApiDestinationTarget(airspaceAlertsAppsyncDestination),
      enrichment: new LambdaEnrichment(props.hazardsEnrichmentFunction),
      logLevel: LogLevel.TRACE,
      logIncludeExecutionData: [IncludeExecutionData.ALL],
      logDestinations: [cwlLogDestination],
      filter: sourceFilter,
    });
  }
}

class LambdaEnrichment implements IEnrichment {
  enrichmentArn: string;
  private inputTransformation: InputTransformation | undefined;

  constructor(
    private readonly lambda: Function,
    props: { inputTransformation?: InputTransformation } = {},
  ) {
    this.enrichmentArn = lambda.functionArn;
    this.inputTransformation = props?.inputTransformation;
  }

  bind(pipe: IPipe): EnrichmentParametersConfig {
    return {
      enrichmentParameters: {
        inputTemplate: this.inputTransformation?.bind(pipe).inputTemplate,
      },
    };
  }

  grantInvoke(pipeRole: aws_iam.IRole): void {
    this.lambda.grantInvoke(pipeRole);
  }
}
