# Airspace Alerter - AppSync Events in Event Driven Architecture (EDA)

A CDK based serverless demo application demonstrating real-time airspace hazard alerts using AWS AppSync Events and EventBridge Pipes in a fully event-driven architecture.

![Application Screenshot](resources/images/application.png)

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

## 📋 Table of Contents

- [Airspace Alerter - AppSync Events in Event Driven Architecture (EDA)](#airspace-alerter---appsync-events-in-event-driven-architecture-eda)
  - [📋 Table of Contents](#-table-of-contents)
  - [🎯 Overview](#-overview)
  - [🔑 Key Concepts](#-key-concepts)
    - [1. EventBridge Pipes for Enrichment](#1-eventbridge-pipes-for-enrichment)
    - [2. AppSync Events for Real-Time Delivery](#2-appsync-events-for-real-time-delivery)
  - [🏗 Architecture](#-architecture)
  - [🔧 System Prerequisites](#-system-prerequisites)
  - [🚀 Getting Started](#-getting-started)
  - [📁 Project Structure](#-project-structure)
  - [💻 Frontend Application](#-frontend-application)
  - [🛠 Backend Application](#-backend-application)
    - [Local Development and Debugging](#local-development-and-debugging)
  - [🚢 Deployment](#-deployment)
  - [🌐 Backend REST API](#-backend-rest-api)
  - [🔄 How It Works](#-how-it-works)
  - [💰 Costs](#-costs)
  - [🗑️ Cleanup](#️-cleanup)
  - [📄 License](#-license)
  - [👤 About](#-about)

## 🎯 Overview

The **Airspace Alerter** demonstrates how airlines can plan flight routes and receive **real-time hazard alerts** as new events occur in airspace. This project showcases a pure event-driven architecture using AWS serverless services.

In the demo, users can:
- Submit and store planned flight routes
- Simulate random airspace hazards (thunderstorms, drone sightings, bird activity, airspace restrictions)
- Receive real-time alerts via WebSocket when a hazard impacts their routes

This project is built entirely with **AWS CDK (TypeScript)** and demonstrates modern serverless patterns for real-time event delivery.

## 🔑 Key Concepts

### 1. EventBridge Pipes for Enrichment

EventBridge Pipes act as a fully-managed bridge between event sources and targets, enabling filtering, transformation, and enrichment as events flow through the system.

In Airspace Alerter:
- **Source**: DynamoDB stream captures new hazard records
- **Enrichment**: Lambda function fetches flight routes and determines route/hazard intersections
- **Target**: AppSync Events API receives enriched alerts for real-time delivery

### 2. AppSync Events for Real-Time Delivery

AppSync Events provide **real-time WebSocket event delivery without requiring GraphQL**. This is a lightweight service for pushing events to connected clients, perfectly suited for event-driven architectures.

Once enriched events are published, users connected through the WebSocket channel receive alerts instantly.

## 🏗 Architecture

The architecture demonstrates a pure **Event-Driven Architecture (EDA)**:

1. User submits a flight route via the web application
2. Route is stored in **DynamoDB**
3. User triggers random **hazard events** (e.g., thunderstorm, drone sighting)
4. **DynamoDB Stream** captures the new hazard record
5. **EventBridge Pipe** enriches the event by fetching routes and checking for overlaps
6. If a route is impacted, an **alert** is published to **AppSync Events**
7. Connected users receive the alert in real-time via WebSocket

**Key AWS Services:**
- **AWS Lambda** - Serverless compute for business logic and enrichment
- **Amazon DynamoDB** - Data storage with streams for event capture
- **Amazon EventBridge Pipes** - Event filtering and enrichment pipeline
- **AWS AppSync Events** - Real-time WebSocket event delivery
- **Amazon API Gateway** - REST API for route submission and hazard simulation
- **Amazon S3 & CloudFront** - Static frontend hosting and content delivery

## 🔧 System Prerequisites

Before you begin, ensure you have the following prerequisites installed and configured on your local machine:
- Node.js
- npm (latest stable version)
- AWS CLI configured with appropriate credentials, connected to a valid AWS account
- AWS CDK CLI (`npm install -g aws-cdk`)
- A bootstrapped AWS environment in the desired region (e.g., `eu-west-1`): `cdk bootstrap --region eu-west-1`
- AWS SAM CLI (for local development / debugging)

## 🚀 Getting Started

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Deploy the application (Frontend and Backend)**
   ```bash
   npm run deploy
   ```

> Note: running npm run deploy will deploy the backend and the frontend of the application. These are technically two different CDK applications. More details of the deployment process can be found in the [Deployment](#-deployment) section.

Following deployment, the frontend application will be available at the CloudFront URL outputted in the terminal. The backend API will also be available, and the frontend will automatically connect to it.

## 📁 Project Structure

```bash
.
├── bin/                   # CDK app entry points (backend and frontend)
├── config/                # Environment configurations and types
├── frontend/              # React frontend application with Tailwind CSS
├── lib/                   # CDK infrastructure code
│   ├── constructs/        # Reusable CDK constructs (Lambda, DynamoDB)
│   ├── stateful/          # Stateful stacks (DynamoDB tables with streams)
│   ├── stateless/         # Stateless stacks (Lambda, API Gateway, EventBridge Pipes)
│   │   └── nested/        # Nested stacks for Lambda, API, and Events
│   └── frontend/          # Frontend stack (S3 and CloudFront)
├── src/                   # Lambda function source code
│   ├── api/               # API handlers (submit-route, trigger-hazards)
│   ├── event-processing/  # Event enrichment (hazard-enrichment)
│   └── shared/            # Shared utilities and geospatial logic
└── test/                  # Test files and payloads for local Lambda invocation
```

## 💻 Frontend Application

The frontend is built using **React**, **Tailwind CSS**, and **React Leaflet**, providing an interactive map interface for flight route planning and real-time hazard visualization. This is simply an example frontend to demonstrate the backend capabilities.

**Features:**
- **Interactive Map**: Built with React Leaflet for smooth map interactions
- **Route Planning**: Click on the map to plot flight routes
- **Hazard Simulation**: Trigger random airspace hazards with a button
- **Real-Time Alerts**: WebSocket connection displays alerts instantly when hazards impact routes
- **Visual Feedback**: Hazards and impacted routes are highlighted on the map

**Configuration:**

The app automatically loads configuration from `cdk-output.json` which includes:
- REST API endpoint URL
- REST API key for authentication
- AppSync Events WebSocket URL for real-time updates
- AppSync Events API key

**Local Development:**

```bash
cd frontend
npm install
npm run dev
```

The frontend connects to the deployed backend using configuration from `frontend/src/cdk-output.json`, which is automatically generated during backend deployment.

## 🛠 Backend Application

### Local Development and Debugging

It is possible to run and debug the backend Lambda functions locally using the AWS SAM CLI. This allows you to test Lambda functions and API Gateway endpoints without deploying to AWS.

For VSCode users, the launch configurations are provided in `.vscode/launch.json`. This allows you to run and debug Lambda functions locally with breakpoints and logging.

1. Install AWS SAM CLI and Docker
2. Ensure the backend is deployed at least once to create the necessary resources (see [Deployment](#-deployment) section)
3. Modify the `local.env.json` file in the root of the project. This file should contain the environment variables required for local development, such as API keys and DynamoDB table names.
4. Use VSCode debugging configurations in `.vscode/launch.json`
5. Run Lambda functions locally for testing

## 🚢 Deployment

The project uses **AWS CDK (TypeScript)** for infrastructure definition and deployment.

**Deployment is split into two CDK applications:**

1. **Backend** (Stateful + Stateless stacks):
   - DynamoDB table with streams
   - Lambda functions (route submission, hazard simulation, enrichment)
   - API Gateway with API key authentication
   - EventBridge Pipe connecting DynamoDB stream to AppSync Events
   - AppSync Events API for WebSocket connections
   
   Deploy with: `npm run deploy:backend`
   
   Outputs configuration to `frontend/src/cdk-output.json`

2. **Frontend** (Static hosting stack):
   - S3 bucket for static assets
   - CloudFront distribution for content delivery
   
   Deploy with: `npm run deploy:frontend`

**Deploy everything:**
```bash
npm run deploy
```

This runs both backend and frontend deployments sequentially.

## 🌐 Backend REST API

Following deployment, the backend API is available at:
```bash
https://[api-id].execute-api.[region].amazonaws.com/prod/
```

**Authentication:** Secured with an API key (generated during deployment)

**Key Endpoints:**

- `POST /submit-route` - Submit a new flight route
  - Body: `{ "points": [{ "lat": number, "lon": number }] }`
  - Returns: `{ "routeId": string, "routeDistance": number }`

- `POST /trigger-hazards` - Simulate random airspace hazards for 1 minute

**WebSocket Connection:**
```bash
wss://[events-api-id].appsync-realtime-api.[region].amazonaws.com/event/realtime
```

Subscribe to channel: `alerts/alert` to receive real-time hazard and alert events.

## 🔄 How It Works

**Event Flow:**

1. **Route Submission**: User plots a route → Lambda stores it in DynamoDB
2. **Hazard Creation**: User triggers hazards → Lambda creates random hazard records in DynamoDB
3. **Stream Capture**: DynamoDB stream emits event for each new hazard
4. **Enrichment**: EventBridge Pipe invokes Lambda to:
   - Fetch all stored routes
   - Check if hazard intersects any route
   - Create alert events for impacted routes
5. **Real-Time Delivery**: AppSync Events pushes alerts to connected WebSocket clients
6. **UI Update**: Frontend receives alert and highlights impacted route on map

**Event Types:**

- `Hazard` - New airspace hazard detected (all users receive)
- `Alert` - Route-specific alert when hazard impacts a flight path

## 💰 Costs

The application is fully serverless with **pay-per-use pricing**.

**Cost Considerations:**
- **AWS Lambda**: Charged per request and execution time
- **Amazon DynamoDB**: Charged for read/write capacity and storage (on-demand pricing)
- **DynamoDB Streams**: Low-cost, event-based pricing
- **EventBridge Pipes**: Charged per event processed, after filtering
- **AppSync Events**: Connection-based pricing
- **Amazon S3**: Storage and data transfer
- **CloudFront**: Data transfer and requests
- **AWS Secrets Manager**: Secret storage (used for AppSync Event API connection). Note that this is the only cost component that I don't agree with. As part of this project, a secret is created in Secrets Manager to store the AppSync Events API key, which is then referenced by the EventBridge connection which creates **another** secret. So you're paying $0.80 per month for two secrets when only one is actually needed.

**Note:** Consider using a Lambda destination with IAM-based invocation of AppSync Events instead of the API destination pattern to avoid Secrets Manager costs.

## 🗑️ Cleanup

To remove all deployed resources:
```bash
npm run destroy
```

This will destroy both frontend and backend stacks, removing all AWS resources.

## 📄 License

This project is licensed under the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0). See the [LICENSE](LICENSE) file for details.

---

## 👤 About

Built by Ian Brumby - AWS Serverless Specialist, AWS Community Builder, and AWS Certified Cloud Architect.

Connect on [LinkedIn](https://www.linkedin.com/in/ibrumby) | [Crockwell Solutions](https://crockwell.com)