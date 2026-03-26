/**
 * AWS Amplify Configuration
 * Connected to Proptimizer Backend Infrastructure
 */
export const awsConfig = {
  Auth: {
    Cognito: {
      userPoolId: import.meta.env['VITE_COGNITO_USER_POOL_ID'],
      userPoolClientId: import.meta.env['VITE_COGNITO_USER_POOL_CLIENT_ID'],
      loginWith: {
        email: true,
      },
    },
  },
};

export const API_CONFIG = {
  baseUrl: import.meta.env['VITE_API_BASE_URL'],
};
