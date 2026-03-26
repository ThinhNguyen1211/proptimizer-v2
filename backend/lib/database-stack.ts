import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

export class DatabaseStack extends cdk.Stack {
  public readonly usersTable: dynamodb.Table;
  public readonly promptsTable: dynamodb.Table;
  public readonly ratingsTable: dynamodb.Table;
  public readonly usageTable: dynamodb.Table;
  public readonly cacheTable: dynamodb.Table;
  public readonly chatHistoryTable: dynamodb.Table;
  public readonly threadsTable: dynamodb.Table;
  public readonly templateMediaTable: dynamodb.Table;
  public readonly modelAccessTable: dynamodb.Table;
  public readonly templatesTable: dynamodb.Table;
  public readonly notificationsTable: dynamodb.Table;
  public readonly profilesTable: dynamodb.Table;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.usersTable = new dynamodb.Table(this, 'UsersTable', {
      tableName: 'Proptimizer-Users',
      partitionKey: { name: 'user_id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      pointInTimeRecovery: true,
    });

    this.usersTable.addGlobalSecondaryIndex({
      indexName: 'email-index',
      partitionKey: { name: 'email', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    this.promptsTable = new dynamodb.Table(this, 'PromptsTable', {
      tableName: 'Proptimizer-Prompts',
      partitionKey: { name: 'prompt_id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      pointInTimeRecovery: true,
    });

    this.promptsTable.addGlobalSecondaryIndex({
      indexName: 'user_id-created_at-index',
      partitionKey: { name: 'user_id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'created_at', type: dynamodb.AttributeType.NUMBER },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    this.ratingsTable = new dynamodb.Table(this, 'RatingsTable', {
      tableName: 'Proptimizer-Ratings',
      partitionKey: { name: 'prompt_id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'user_id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    this.usageTable = new dynamodb.Table(this, 'UsageTable', {
      tableName: 'Proptimizer-Usage',
      partitionKey: { name: 'user_id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'date', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    this.cacheTable = new dynamodb.Table(this, 'CacheTable', {
      tableName: 'Proptimizer-Cache',
      partitionKey: { name: 'cache_key', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      timeToLiveAttribute: 'ttl',
    });

    this.chatHistoryTable = new dynamodb.Table(this, 'ChatHistoryTable', {
      tableName: 'Proptimizer-ChatHistory',
      partitionKey: { name: 'user_id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'conversation_id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      timeToLiveAttribute: 'expires_at',
    });

    this.threadsTable = new dynamodb.Table(this, 'ThreadsTable', {
      tableName: 'Proptimizer-Threads',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'threadId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      pointInTimeRecovery: true,
    });

    this.threadsTable.addGlobalSecondaryIndex({
      indexName: 'userId-updatedAt-index',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'updatedAt', type: dynamodb.AttributeType.NUMBER },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    this.templateMediaTable = new dynamodb.Table(this, 'TemplateMediaTable', {
      tableName: 'Proptimizer-TemplateMedia',
      partitionKey: { name: 'template_id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    this.modelAccessTable = new dynamodb.Table(this, 'ModelAccessTable', {
      tableName: 'Proptimizer-ModelAccess',
      partitionKey: { name: 'user_id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Templates Table for community templates feature
    this.templatesTable = new dynamodb.Table(this, 'TemplatesTable', {
      tableName: 'Proptimizer-Templates',
      partitionKey: { name: 'templateId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pointInTimeRecovery: true,
    });

    // GSI for querying public templates (feed)
    this.templatesTable.addGlobalSecondaryIndex({
      indexName: 'isPublic-createdAt-index',
      partitionKey: { name: 'isPublic', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.NUMBER },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // GSI for querying user's own templates
    this.templatesTable.addGlobalSecondaryIndex({
      indexName: 'userId-createdAt-index',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.NUMBER },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // Notifications Table for user alerts (like Pinterest)
    this.notificationsTable = new dynamodb.Table(this, 'NotificationsTable', {
      tableName: 'Proptimizer-Notifications',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.NUMBER },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pointInTimeRecovery: true,
    });

    // GSI for querying unread notifications
    this.notificationsTable.addGlobalSecondaryIndex({
      indexName: 'userId-isRead-index',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'isRead', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // PROFILES TABLE
    this.profilesTable = new dynamodb.Table(this, 'ProfilesTable', {
      tableName: 'Proptimizer-Profiles',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pointInTimeRecovery: true,
    });

    new cdk.CfnOutput(this, 'UsersTableName', {
      value: this.usersTable.tableName,
    });

    new cdk.CfnOutput(this, 'PromptsTableName', {
      value: this.promptsTable.tableName,
    });

    new cdk.CfnOutput(this, 'ChatHistoryTableName', {
      value: this.chatHistoryTable.tableName,
    });

    new cdk.CfnOutput(this, 'ThreadsTableName', {
      value: this.threadsTable.tableName,
    });

    new cdk.CfnOutput(this, 'TemplatesTableName', {
      value: this.templatesTable.tableName,
    });

    new cdk.CfnOutput(this, 'NotificationsTableName', {
      value: this.notificationsTable.tableName,
    });

    new cdk.CfnOutput(this, 'ProfilesTableName', {
      value: this.profilesTable.tableName,
    });
  }
}
