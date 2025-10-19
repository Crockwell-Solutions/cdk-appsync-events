/*
 * CDK Nested Stack - Lambda Resources
 *
 * This CDK nested stack sets up the Lambda resources for the Airspace Alerter Demo.
 * This contains the Lambda functions and any associated resources such as EventBridge schedules and IAM roles.
 *
 * This software is licensed under the Apache License, Version 2.0 (the "License");
 */

import { Construct } from 'constructs';
import { NestedStack, NestedStackProps } from 'aws-cdk-lib';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { EnvironmentConfig, Stage } from '../../../config';
import { CustomLambda } from '../../constructs';
import { Table } from 'aws-cdk-lib/aws-dynamodb';

interface LambdaResourcesProps extends NestedStackProps {
  stage: Stage;
  envConfig: EnvironmentConfig;
  airspaceAlerterTable: Table;
}

export class LambdaResources extends NestedStack {
  public triggerHazardsFunction: NodejsFunction;
  public submitRouteFunction: NodejsFunction;

  constructor(scope: Construct, id: string, props: LambdaResourcesProps) {
    super(scope, id, props);

    const { envConfig, airspaceAlerterTable } = props;

    // Create the Trigger Hazards Lambda function
    this.triggerHazardsFunction = new CustomLambda(this, 'TriggerHazardsFunction', {
      envConfig: envConfig,
      source: 'src/api/trigger-hazards.ts',
      environmentVariables: {
        AIRSPACE_ALERTER_TABLE: airspaceAlerterTable.tableName,
        PARTITION_KEY_HASH_PRECISION: envConfig.partitionKeyHashPrecision?.toString(),
        PARTITION_KEY_SHARDS: envConfig.partitionKeyShards?.toString(),
        SORT_KEY_HASH_PRECISION: envConfig.sortKeyHashPrecision?.toString(),
        GSI_HASH_PRECISION: envConfig.gsiHashPrecision?.toString(),
      },
    }).lambda;
    airspaceAlerterTable.grantReadData(this.triggerHazardsFunction);

    // Create the Submit Route Lambda function
    this.submitRouteFunction = new CustomLambda(this, 'SubmitRouteFunction', {
      envConfig: envConfig,
      source: 'src/api/submit-route.ts',
      environmentVariables: {
        AIRSPACE_ALERTER_TABLE: airspaceAlerterTable.tableName,
        PARTITION_KEY_HASH_PRECISION: envConfig.partitionKeyHashPrecision?.toString(),
        PARTITION_KEY_SHARDS: envConfig.partitionKeyShards?.toString(),
        SORT_KEY_HASH_PRECISION: envConfig.sortKeyHashPrecision?.toString(),
        GSI_HASH_PRECISION: envConfig.gsiHashPrecision?.toString(),
      },
    }).lambda;
    airspaceAlerterTable.grantReadWriteData(this.submitRouteFunction);
  }
}
