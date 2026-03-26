import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';

export interface ApiStackProps extends cdk.StackProps {
  userPool: cognito.IUserPool;
  usersTable: dynamodb.ITable;
  promptsTable: dynamodb.ITable;
  usageTable: dynamodb.ITable;
  cacheTable: dynamodb.ITable;
  chatHistoryTable: dynamodb.ITable;
  threadsTable: dynamodb.ITable;
  templatesTable: dynamodb.ITable;
  notificationsTable: dynamodb.ITable;
  profilesTable: dynamodb.ITable;
}

export class ApiStack extends cdk.Stack {
  public readonly api: apigateway.RestApi;
  public readonly optimizeFunction: nodejs.NodejsFunction;
  public readonly chatFunction: nodejs.NodejsFunction;
  public readonly assetsBucket: s3.Bucket;
  public readonly optimizeStreamUrl: lambda.FunctionUrl;
  public readonly chatStreamFunction: nodejs.NodejsFunction;
  public readonly chatStreamUrl: lambda.FunctionUrl;

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    const geminiApiKey = process.env.GEMINI_API_KEY || '';
    const deepseekApiKey = process.env.DEEPSEEK_API_KEY || '';
    const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN || '';
    const telegramChatId = process.env.TELEGRAM_CHAT_ID || '';

    // S3 BUCKET FOR USER ASSETS
    this.assetsBucket = new s3.Bucket(this, 'AssetsBucket', {
      bucketName: `proptimizer-user-assets-${cdk.Stack.of(this).account}`,
      publicReadAccess: true,
      blockPublicAccess: new s3.BlockPublicAccess({
        blockPublicAcls: false,
        blockPublicPolicy: false,
        ignorePublicAcls: false,
        restrictPublicBuckets: false,
      }),
      cors: [
        {
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.PUT, s3.HttpMethods.POST],
          allowedOrigins: ['*'],
          allowedHeaders: ['*'],
          maxAge: 3000,
        },
      ],
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // LAMBDA FUNCTIONS
    this.optimizeFunction = new nodejs.NodejsFunction(this, 'OptimizeHandler', {
      functionName: 'Proptimizer-OptimizeHandler',
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: './lambda/optimize-handler/index.ts',
      handler: 'handler',
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      environment: {
        USAGE_TABLE_NAME: props.usageTable.tableName,
        CACHE_TABLE_NAME: props.cacheTable.tableName,
        USERS_TABLE_NAME: props.usersTable.tableName,
        PROMPTS_TABLE_NAME: props.promptsTable.tableName,
        GEMINI_API_KEY: geminiApiKey,
        DEEPSEEK_API_KEY: deepseekApiKey,
      },
      bundling: {
        minify: true,
        sourceMap: true,
        target: 'es2020',
        externalModules: ['@aws-sdk/*'],
      },
    });

    // Lambda Function URL for Response Streaming (bypasses API Gateway 29s timeout)
    this.optimizeStreamUrl = this.optimizeFunction.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
      invokeMode: lambda.InvokeMode.RESPONSE_STREAM,
      cors: {
        allowedOrigins: ['*'],
        allowedMethods: [lambda.HttpMethod.ALL],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Api-Key'],
      },
    });

    new cdk.CfnOutput(this, 'OptimizeStreamUrl', {
      value: this.optimizeStreamUrl.url,
      description: 'Lambda Function URL for streaming optimize requests',
    });

    this.chatFunction = new nodejs.NodejsFunction(this, 'ChatHandler', {
      functionName: 'Proptimizer-ChatHandler',
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: './lambda/chat-handler/index.ts',
      handler: 'handler',
      timeout: cdk.Duration.seconds(30),
      memorySize: 1024,
      environment: {
        CHAT_HISTORY_TABLE_NAME: props.chatHistoryTable.tableName,
        THREADS_TABLE_NAME: props.threadsTable.tableName,
        USERS_TABLE_NAME: props.usersTable.tableName,
        TEMPLATES_TABLE_NAME: props.templatesTable.tableName,
        NOTIFICATIONS_TABLE_NAME: props.notificationsTable.tableName,
        PROFILES_TABLE_NAME: props.profilesTable.tableName,
        ASSETS_BUCKET_NAME: this.assetsBucket.bucketName,
        AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
        GEMINI_API_KEY: geminiApiKey,
        DEEPSEEK_API_KEY: deepseekApiKey,
        TELEGRAM_BOT_TOKEN: telegramBotToken,
        TELEGRAM_CHAT_ID: telegramChatId,
      },
      bundling: {
        minify: true,
        sourceMap: true,
        target: 'es2020',
        externalModules: ['@aws-sdk/*'],
      },
    });

    // Chat Stream Lambda - Dedicated streaming handler for POST /chat
    this.chatStreamFunction = new nodejs.NodejsFunction(this, 'ChatStreamHandler', {
      functionName: 'Proptimizer-ChatStreamHandler',
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: './lambda/chat-stream-handler/index.ts',
      handler: 'handler',
      timeout: cdk.Duration.seconds(60),
      memorySize: 1024,
      environment: {
        CHAT_HISTORY_TABLE_NAME: props.chatHistoryTable.tableName,
        GEMINI_API_KEY: geminiApiKey,
        DEEPSEEK_API_KEY: deepseekApiKey,
        AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
      },
      bundling: {
        minify: true,
        sourceMap: true,
        target: 'es2020',
        externalModules: ['@aws-sdk/*'],
      },
    });

    // Function URL for Chat Streaming (bypasses API Gateway 29s timeout)
    this.chatStreamUrl = this.chatStreamFunction.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
      invokeMode: lambda.InvokeMode.RESPONSE_STREAM,
      cors: {
        allowedOrigins: ['*'],
        allowedMethods: [lambda.HttpMethod.ALL],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Api-Key'],
        exposedHeaders: ['X-Thread-Id', 'X-Conversation-Id'],
      },
    });

    new cdk.CfnOutput(this, 'ChatStreamUrl', {
      value: this.chatStreamUrl.url,
      description: 'Lambda Function URL for streaming chat requests',
    });

    // Grant chat stream function access to DynamoDB
    props.chatHistoryTable.grantFullAccess(this.chatStreamFunction);

    // IAM PERMISSIONS
    const bedrockPolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'bedrock:InvokeModel',
        'bedrock:InvokeModelWithResponseStream',
      ],
      resources: [
        `arn:aws:bedrock:${this.region}::foundation-model/*`,
      ],
    });

    this.optimizeFunction.addToRolePolicy(bedrockPolicy);
    this.chatFunction.addToRolePolicy(bedrockPolicy);

    props.usageTable.grantReadWriteData(this.optimizeFunction);
    props.cacheTable.grantReadWriteData(this.optimizeFunction);
    props.usersTable.grantReadData(this.optimizeFunction);
    props.promptsTable.grantReadWriteData(this.optimizeFunction);
    
    props.chatHistoryTable.grantFullAccess(this.chatFunction);
    props.threadsTable.grantFullAccess(this.chatFunction);
    props.usersTable.grantReadData(this.chatFunction);
    props.templatesTable.grantReadWriteData(this.chatFunction);
    props.notificationsTable.grantReadWriteData(this.chatFunction);
    props.profilesTable.grantReadWriteData(this.chatFunction);
    this.assetsBucket.grantReadWrite(this.chatFunction);
    this.assetsBucket.grantPutAcl(this.chatFunction);
    this.assetsBucket.grantDelete(this.chatFunction);

    this.chatFunction.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['dynamodb:*'],
      resources: [
        props.threadsTable.tableArn,
        `${props.threadsTable.tableArn}/*`,
      ],
    }));

    // Grant Cognito GetUser permission for email fetching
    this.chatFunction.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['cognito-idp:GetUser'],
      resources: ['*'],
    }));

    this.chatFunction.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:PutLogEvents',
      ],
      resources: ['*'],
    }));

    // API GATEWAY
    this.api = new apigateway.RestApi(this, 'ProptimizerApi', {
      restApiName: 'Proptimizer API',
      description: 'API for Proptimizer',
      cloudWatchRole: false,
      deployOptions: {
        stageName: 'prod',
        throttlingBurstLimit: 100,
        throttlingRateLimit: 50,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
          'X-Amz-Security-Token',
        ],
        allowCredentials: true,
      },
    });

    const authorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'ApiAuthorizer', {
      cognitoUserPools: [props.userPool],
      identitySource: 'method.request.header.Authorization',
    });

    // /optimize
    const optimizeResource = this.api.root.addResource('optimize');
    optimizeResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(this.optimizeFunction, { proxy: true }),
      { authorizer, authorizationType: apigateway.AuthorizationType.COGNITO }
    );
    optimizeResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(this.optimizeFunction, { proxy: true }),
      { authorizer, authorizationType: apigateway.AuthorizationType.COGNITO }
    );

    // /chat
    const chatResource = this.api.root.addResource('chat');
    chatResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(this.chatFunction, { proxy: true }),
      { authorizer, authorizationType: apigateway.AuthorizationType.COGNITO }
    );

    // /chat/threads
    const threadsResource = chatResource.addResource('threads');
    threadsResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(this.chatFunction, { proxy: true }),
      { authorizer, authorizationType: apigateway.AuthorizationType.COGNITO }
    );

    // /chat/threads/{threadId}
    const threadIdResource = threadsResource.addResource('{threadId}');
    threadIdResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(this.chatFunction, { proxy: true }),
      { authorizer, authorizationType: apigateway.AuthorizationType.COGNITO }
    );
    threadIdResource.addMethod(
      'PATCH',
      new apigateway.LambdaIntegration(this.chatFunction, { proxy: true }),
      { authorizer, authorizationType: apigateway.AuthorizationType.COGNITO }
    );
    threadIdResource.addMethod(
      'DELETE',
      new apigateway.LambdaIntegration(this.chatFunction, { proxy: true }),
      { authorizer, authorizationType: apigateway.AuthorizationType.COGNITO }
    );

    // /templates - Public endpoint (no auth)
    const templatesResource = this.api.root.addResource('templates');
    templatesResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(this.chatFunction, { proxy: true }),
      { authorizationType: apigateway.AuthorizationType.NONE }
    );
    
    // POST /templates - Auth required
    templatesResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(this.chatFunction, { proxy: true }),
      { authorizer, authorizationType: apigateway.AuthorizationType.COGNITO }
    );

    // /templates/my - Get user's templates
    const myTemplatesResource = templatesResource.addResource('my');
    myTemplatesResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(this.chatFunction, { proxy: true }),
      { authorizer, authorizationType: apigateway.AuthorizationType.COGNITO }
    );

    // /templates/{templateId} - PATCH and DELETE
    const templateIdResource = templatesResource.addResource('{templateId}');
    templateIdResource.addMethod(
      'PATCH',
      new apigateway.LambdaIntegration(this.chatFunction, { proxy: true }),
      { authorizer, authorizationType: apigateway.AuthorizationType.COGNITO }
    );
    templateIdResource.addMethod(
      'DELETE',
      new apigateway.LambdaIntegration(this.chatFunction, { proxy: true }),
      { authorizer, authorizationType: apigateway.AuthorizationType.COGNITO }
    );

    // /templates/{templateId}/like - Public endpoint (no auth)
    const likeResource = templateIdResource.addResource('like');
    likeResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(this.chatFunction, { proxy: true }),
      { authorizationType: apigateway.AuthorizationType.NONE }
    );

    // /templates/{templateId}/save - Public endpoint (no auth)
    const saveResource = templateIdResource.addResource('save');
    saveResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(this.chatFunction, { proxy: true }),
      { authorizationType: apigateway.AuthorizationType.NONE }
    );

    // /upload-url
    const uploadUrlResource = this.api.root.addResource('upload-url');
    uploadUrlResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(this.chatFunction, { proxy: true }),
      { authorizer, authorizationType: apigateway.AuthorizationType.COGNITO }
    );

    // /notifications - Get user's notifications
    const notificationsResource = this.api.root.addResource('notifications');
    notificationsResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(this.chatFunction, { proxy: true }),
      { authorizationType: apigateway.AuthorizationType.NONE }
    );

    // /notifications/mark-read - Mark notifications as read
    const markReadResource = notificationsResource.addResource('mark-read');
    markReadResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(this.chatFunction, { proxy: true }),
      { authorizationType: apigateway.AuthorizationType.NONE }
    );

    // /profile - User profile management
    const profileResource = this.api.root.addResource('profile');
    profileResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(this.chatFunction, { proxy: true }),
      { authorizationType: apigateway.AuthorizationType.NONE }
    );
    profileResource.addMethod(
      'PUT',
      new apigateway.LambdaIntegration(this.chatFunction, { proxy: true }),
      { authorizationType: apigateway.AuthorizationType.NONE }
    );

    // /profile/avatar-url - Generate presigned URL for avatar upload
    const avatarUrlResource = profileResource.addResource('avatar-url');
    avatarUrlResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(this.chatFunction, { proxy: true }),
      { authorizationType: apigateway.AuthorizationType.NONE }
    );

    // /feedback - Submit feedback (no auth required)
    const feedbackResource = this.api.root.addResource('feedback');
    feedbackResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(this.chatFunction, { proxy: true }),
      { authorizationType: apigateway.AuthorizationType.NONE }
    );

    // /health
    const healthResource = this.api.root.addResource('health');
    healthResource.addMethod(
      'GET',
      new apigateway.MockIntegration({
        integrationResponses: [{
          statusCode: '200',
          responseParameters: { 'method.response.header.Access-Control-Allow-Origin': "'*'" },
          responseTemplates: { 'application/json': '{"status": "ok"}' },
        }],
        requestTemplates: { 'application/json': '{"statusCode": 200}' },
      }),
      {
        methodResponses: [{
          statusCode: '200',
          responseParameters: { 'method.response.header.Access-Control-Allow-Origin': true },
        }],
      }
    );

    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: this.api.url,
      description: 'API Gateway endpoint',
    });
  }
}
