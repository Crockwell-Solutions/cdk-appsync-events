/*
 * CDK Nested Stack - API Resources
 *
 * This CDK nested stack sets up the API resources for the Airspace Alerter Demo.
 * This contains the API Gateway and routes for creating alerts and flight routes
 *
 * This software is licensed under the Apache License, Version 2.0 (the "License");
 */

import { Construct } from 'constructs';
import { NestedStack, NestedStackProps, RemovalPolicy } from 'aws-cdk-lib';
import { RestApi, LambdaIntegration, ApiKey, UsagePlan, ApiKeySourceType } from 'aws-cdk-lib/aws-apigateway';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { EnvironmentConfig, Stage } from '../../../config';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import {
  AwsCustomResource,
  AwsCustomResourcePolicy,
  AwsSdkCall,
  PhysicalResourceId,
} from 'aws-cdk-lib/custom-resources';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';

interface ApiResourcesProps extends NestedStackProps {
  stage: Stage;
  envConfig: EnvironmentConfig;
  triggerAlertsFunction: NodejsFunction;
  allowedOrigins?: string[];
}

export class ApiResources extends NestedStack {
  public api: RestApi;
  public apiKeyValue: string;

  constructor(scope: Construct, id: string, props: ApiResourcesProps) {
    super(scope, id, props);

    const { triggerAlertsFunction } = props;

    // Create the API Gateway
    this.api = new RestApi(this, 'AirspaceAlertsDemoApi', {
      restApiName: 'airspace-alerts-demo-api',
      description: 'API for Airspace Alerts Demo Operations',
      apiKeySourceType: ApiKeySourceType.HEADER,
      defaultCorsPreflightOptions: {
        allowOrigins: ['*'],
        allowMethods: ['GET', 'POST', 'OPTIONS'],
        allowHeaders: [
          'Content-Type',
          'Authorization',
          'X-Amz-Date',
          'X-Api-Key',
          'X-Amz-Security-Token',
          'X-Amz-User-Agent',
        ],
      },
    });

    // Create API Key
    const apiKey = new ApiKey(this, 'AirspaceAlertsDemoApiKey', {
      apiKeyName: `airspace-alerts-demo-api-key-${props.stage}`,
      description: `API Key for Airspace Alerts Demo - ${props.stage}`,
    });

    // Create Usage Plan
    const usagePlan = new UsagePlan(this, 'AirspaceAlertsDemoUsagePlan', {
      name: `airspace-alerts-demo-usage-plan-${props.stage}`,
      description: `Usage Plan for Airspace Alerts Demo - ${props.stage}`,
      apiStages: [
        {
          api: this.api,
          stage: this.api.deploymentStage,
        },
      ],
    });

    // Associate API Key with Usage Plan
    usagePlan.addApiKey(apiKey);

    // Get the API Key value
    const apiKeyFetch: AwsSdkCall = {
      service: 'APIGateway',
      action: 'getApiKey',
      parameters: {
        apiKey: apiKey.keyId,
        includeValue: true,
      },
      physicalResourceId: PhysicalResourceId.of(`APIKey:${apiKey.keyId}`),
    };

    const apiKeyCr = new AwsCustomResource(this, 'AirspaceAlerterApiKeyCr', {
      policy: AwsCustomResourcePolicy.fromStatements([
        new PolicyStatement({
          effect: Effect.ALLOW,
          resources: [apiKey.keyArn],
          actions: ['apigateway:GET'],
        }),
      ]),
      logGroup: new LogGroup(this, 'AirspaceAlerterApiKeyCrLogGroup', {
        logGroupName: '/aws/api/AirspaceAlerterApiKeyCrLogGroup',
        retention: RetentionDays.THREE_MONTHS,
        removalPolicy: RemovalPolicy.DESTROY,
      }),
      onCreate: apiKeyFetch,
      onUpdate: apiKeyFetch,
    });

    apiKeyCr.node.addDependency(apiKey);
    this.apiKeyValue = apiKeyCr.getResponseField('value');

    // Add generate alerts endpoint
    const generateAlerts = this.api.root.addResource('generate-alerts');
    generateAlerts.addMethod('POST', new LambdaIntegration(triggerAlertsFunction), {
      apiKeyRequired: true,
    });

    // Save the API URL and key to the System Manager Parameter Store
    new StringParameter(this, 'AirspaceAlerterApiUrlParameter', {
      parameterName: props.envConfig.apiUrlParameterName || '/airspaceAlerts/apiUrl',
      stringValue: this.api.url,
    });
  }
}
