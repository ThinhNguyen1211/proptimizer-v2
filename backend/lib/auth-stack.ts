import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cognito from 'aws-cdk-lib/aws-cognito';

/**
 * AuthStack - Manages Cognito User Pool and Authentication
 */
export class AuthStack extends cdk.Stack {
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create Cognito User Pool
    this.userPool = new cognito.UserPool(this, 'ProptimizerUserPool', {
      userPoolName: 'Proptimizer-Users',
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
      },
      autoVerify: {
        email: true,
      },
      standardAttributes: {
        email: {
          required: true,
          mutable: true,
        },
        givenName: {
          required: false,
          mutable: true,
        },
        familyName: {
          required: false,
          mutable: true,
        },
      },
      customAttributes: {
        subscription_tier: new cognito.StringAttribute({
          minLen: 1,
          maxLen: 20,
          mutable: true,
        }),
        credits_used: new cognito.NumberAttribute({
          min: 0,
          max: 1000000,
          mutable: true,
        }),
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create User Pool Client (no secret for web/mobile apps)
    this.userPoolClient = new cognito.UserPoolClient(this, 'ProptimizerUserPoolClient', {
      userPool: this.userPool,
      userPoolClientName: 'Proptimizer-WebClient',
      generateSecret: false,
      authFlows: {
        userPassword: true,
        userSrp: true,
        custom: true,
      },
      // MAXIMUM TOKEN LIFETIME (Cognito limits):
      // - accessToken/idToken: Max 1 day (Cognito limit)
      // - refreshToken: Max 3650 days (10 years) - auto-refresh access/id tokens
      accessTokenValidity: cdk.Duration.days(1),
      idTokenValidity: cdk.Duration.days(1),
      refreshTokenValidity: cdk.Duration.days(3650), // 10 years
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
          implicitCodeGrant: false,
        },
        scopes: [
          cognito.OAuthScope.EMAIL,
          cognito.OAuthScope.OPENID,
          cognito.OAuthScope.PROFILE,
        ],
        callbackUrls: [
          'http://localhost:3000/callback',
          'https://proptimizer.com/callback',
        ],
        logoutUrls: [
          'http://localhost:3000',
          'https://proptimizer.com',
        ],
      },
      preventUserExistenceErrors: true,
    });

    // Outputs for frontend configuration
    new cdk.CfnOutput(this, 'UserPoolId', {
      value: this.userPool.userPoolId,
      description: 'Cognito User Pool ID',
      exportName: 'ProptimizerUserPoolId',
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: this.userPoolClient.userPoolClientId,
      description: 'Cognito User Pool Client ID',
      exportName: 'ProptimizerUserPoolClientId',
    });

    new cdk.CfnOutput(this, 'UserPoolArn', {
      value: this.userPool.userPoolArn,
      description: 'Cognito User Pool ARN',
    });
  }
}
