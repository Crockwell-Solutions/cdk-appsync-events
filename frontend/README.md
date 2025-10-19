# Frontend Application

React-based frontend for the Airspace Alerter Demo application.

## Configuration

The application automatically loads configuration from `/cdk-output.json` which is generated during backend deployment.

### Expected Configuration Format

```json
{
  "AirspaceAlerterStatelessStack": {
    "restApiUrl": "https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/prod/",
    "restApiKey": "your-api-key-here",
    "eventsUrl": "wss://xxxxxxxxxx.appsync-api.us-east-1.amazonaws.com/event/realtime"
  }
}
```

The configuration file is:
- Generated at `frontend/src/cdk-output.json` during backend deployment
- Copied to `frontend/public/cdk-output.json` during frontend build
- Loaded at runtime by the application

## Development

```bash
npm install
npm run dev
```

For local development, ensure the backend is deployed first so the `cdk-output.json` file exists.

## Build

```bash
npm run build
```

The build output will be in the `build/` directory.
