# proptimizer-v2
extension to optimize prompt and web to store template prompt

## GitHub Actions Secrets (Required)

For CI/CD deploys from GitHub Actions, local `.env` is not used.
Set these repository secrets in GitHub before running production deploys:

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`
- `AWS_ACCOUNT_ID`
- `DEEPSEEK_API_KEY`
- `GEMINI_API_KEY`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`
- `VITE_API_BASE_URL`
- `VITE_OPTIMIZE_STREAM_URL`
- `VITE_CHAT_STREAM_URL`
- `VITE_COGNITO_USER_POOL_ID`
- `VITE_COGNITO_USER_POOL_CLIENT_ID`
