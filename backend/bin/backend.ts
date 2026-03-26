#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { DatabaseStack } from '../lib/database-stack';
import { AuthStack } from '../lib/auth-stack';
import { ApiStack } from '../lib/api-stack';
import { FrontendStack } from '../lib/frontend-stack';

const app = new cdk.App();

// Initialize Database Stack
const databaseStack = new DatabaseStack(app, 'ProptimizerDatabaseStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  description: 'Proptimizer Database Stack - DynamoDB Tables',
});

// Initialize Auth Stack
const authStack = new AuthStack(app, 'ProptimizerAuthStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  description: 'Proptimizer Auth Stack - Cognito User Pool',
});

// Initialize API Stack (depends on Database and Auth)
const apiStack = new ApiStack(app, 'ProptimizerApiStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  description: 'Proptimizer API Stack - Lambda Functions and API Gateway',
  userPool: authStack.userPool,
  usersTable: databaseStack.usersTable,
  promptsTable: databaseStack.promptsTable,
  usageTable: databaseStack.usageTable,
  cacheTable: databaseStack.cacheTable,
  chatHistoryTable: databaseStack.chatHistoryTable,
  threadsTable: databaseStack.threadsTable,
  templatesTable: databaseStack.templatesTable,
  notificationsTable: databaseStack.notificationsTable,
  profilesTable: databaseStack.profilesTable,
});

// Initialize Frontend Stack (CloudFront + S3)
const frontendStack = new FrontendStack(app, 'ProptimizerFrontendStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  description: 'Proptimizer Frontend Stack - CloudFront + S3 Static Hosting',
});

// Add dependencies
apiStack.addDependency(databaseStack);
apiStack.addDependency(authStack);
// Frontend can be deployed independently

// Add tags to all stacks
cdk.Tags.of(app).add('Project', 'Proptimizer');
cdk.Tags.of(app).add('Environment', 'Production');

app.synth();