# Frontend Configuration Implementation Summary

## Overview
Updated the frontend application to automatically load REST API and AppSync Events endpoints from the `cdk-output.json` file generated during backend deployment.

## Changes Made

### 1. Configuration System (`frontend/src/config.ts`)
- Created a configuration loader that reads `cdk-output.json` at runtime
- Loads REST API URL, API key, and AppSync Events WebSocket URL
- Provides typed configuration interface

### 2. API Client (`frontend/src/api/client.ts`)
- Created a REST API client that automatically uses configuration
- Includes API key authentication in all requests
- Provides `get()` and `post()` methods for API calls

### 3. Updated Index Component (`frontend/src/pages/Index.tsx`)
- Loads configuration on component mount
- Automatically connects to AppSync Events WebSocket
- Shows loading state while configuration loads
- Falls back to manual WebSocket configuration if needed

### 4. Build Process Updates (`package.json`)
- Updated `build:frontend` to copy `cdk-output.json` to public directory
- Updated `deploy:frontend` to include configuration copy step
- Fixed frontend deployment script to use correct bin file

### 5. Vite Configuration (`frontend/vite.config.ts`)
- Configured build output directory as `build/`
- Ensured public directory files are copied to build output

### 6. Documentation
- Created `frontend/README.md` explaining configuration system
- Created `frontend/src/cdk-output.json.example` showing expected format
- Updated main `README.md` with configuration details

## Expected CDK Output Format

The backend deployment should output to `frontend/src/cdk-output.json`:

```json
{
  "AirspaceAlerterStatelessStack": {
    "restApiUrl": "https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/prod/",
    "restApiKey": "your-api-key-here",
    "eventsUrl": "wss://xxxxxxxxxx.appsync-api.us-east-1.amazonaws.com/event/realtime"
  }
}
```

## Usage

### For Developers
1. Deploy backend: `npm run deploy:backend`
2. Configuration is automatically written to `frontend/src/cdk-output.json`
3. Run frontend locally: `cd frontend && npm run dev`
4. Frontend automatically loads configuration and connects to services

### For Deployment
1. Run `npm run deploy` to deploy both backend and frontend
2. Configuration is automatically copied to the frontend build
3. Frontend loads configuration at runtime from `/cdk-output.json`

## API Client Usage Example

```typescript
import { apiClient } from '@/api/client';

// POST request
const response = await apiClient.post('/generate-alerts', {
  type: 'airspace',
  data: { ... }
});

// GET request
const data = await apiClient.get('/alerts');
```

## Next Steps

To complete the implementation, the backend CDK stack needs to:
1. Add AppSync Events infrastructure
2. Output the AppSync Events WebSocket URL in the CDK output
3. Ensure the output includes `eventsUrl` field

Example CDK output addition:
```typescript
new CfnOutput(this, 'eventsUrl', { 
  value: appSyncEventsApi.realtimeUrl 
});
```
