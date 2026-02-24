#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { NetworkStack } from '../lib/network-stack';
import { DatabaseStack } from '../lib/database-stack';
import { StorageStack } from '../lib/storage-stack';
import { ApiStack } from '../lib/api-stack';
import { FrontendStack } from '../lib/frontend-stack';

const app = new cdk.App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
};

const networkStack = new NetworkStack(app, 'NetworkStack', { env });

const databaseStack = new DatabaseStack(app, 'DatabaseStack', {
  env,
  vpc: networkStack.vpc,
  lambdaSecurityGroup: networkStack.lambdaSecurityGroup,
});

const storageStack = new StorageStack(app, 'StorageStack', { env });

const apiStack = new ApiStack(app, 'ApiStack', {
  env,
  vpc: networkStack.vpc,
  lambdaSecurityGroup: networkStack.lambdaSecurityGroup,
  uploadsBucket: storageStack.uploadsBucket,
  dbSecret: databaseStack.secret,
});

new FrontendStack(app, 'FrontendStack', {
  env,
  frontendBucket: storageStack.frontendBucket,
  apiUrl: apiStack.apiUrl,
});
