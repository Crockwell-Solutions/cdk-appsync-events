#!/usr/bin/env node

import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { StatefulStack } from '../lib/stateful/stateful-stack';
import { StatelessStack } from '../lib/stateless/stateless-stack';
import { Stage, getStage, getEnvironmentConfig } from '../config';

const stage = getStage(process.env.STAGE as Stage) as Stage;
const envConfig = getEnvironmentConfig(stage);

const app = new cdk.App();

const statefulStack = new StatefulStack(app, 'AirspaceAlerterStatefulStack', {
  stage: stage,
  envConfig: envConfig,
});

const statelessStack = new StatelessStack(app, 'AirspaceAlerterStatelessStack', {
  stage: stage,
  envConfig: envConfig,
  airspaceAlerterTable: statefulStack.airspaceAlerterTable,
});

// Ensure the stateful stack is deployed before the stateless stack
statelessStack.addDependency(statefulStack);

// Tag all resources in CloudFormation with the stage name
cdk.Tags.of(app).add('service', 'airspace-alerter-backend');
cdk.Tags.of(app).add('stage', `${stage}`);
