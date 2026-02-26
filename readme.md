# Beek Racing — Ski Racer Management Platform

A full-stack web application for managing ski racer profiles, uploading training footage for AI-powered form analysis, and tracking race calendar events.

---

## Overview

Beek Racing provides a single-racer dashboard with four views:

| View | Description |
|------|-------------|
| **Home** | Dashboard overview — profile summary and upcoming events |
| **Profile** | Racer details: height, weight, ski types, binding measurements, personal records, racing goals |
| **Analyze** | Upload ski videos or images; AWS Bedrock analyzes ski form and returns coaching feedback |
| **Calendar** | Race event management with a monthly grid view and a list view |

---

## Getting Started

### Prerequisites

Before you can run or deploy this project, make sure you have the following installed and configured:

| Tool | Version | Purpose |
|------|---------|---------|
| [Git](https://git-scm.com/) | Any | Clone the repository |
| [Node.js](https://nodejs.org/) | 20+ | Frontend dev server, CDK CLI |
| [Python](https://www.python.org/) | 3.12+ | Backend API |
| [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html) | v2 | Deploy to AWS, manage resources |
| [AWS CDK](https://docs.aws.amazon.com/cdk/latest/guide/getting_started.html) | Latest | Infrastructure as code |

You also need:

- **An AWS account** — sign up at [aws.amazon.com](https://aws.amazon.com). The deployment uses several services: Lambda, API Gateway, Aurora Serverless, S3, CloudFront, and Bedrock.
- **AWS Bedrock model access** — in the AWS Console, navigate to **Bedrock → Model access** and enable access to an Anthropic Claude model (e.g. Claude 3 Haiku or Claude 3 Sonnet) in your chosen region. This is required for the AI video analysis feature.

### Install the AWS CDK CLI

```bash
npm install -g aws-cdk
cdk --version   # verify install
```

### Configure the AWS CLI

```bash
aws configure
```

You will be prompted for your AWS Access Key ID, Secret Access Key, default region (e.g. `us-east-1`), and output format. If you do not have IAM credentials yet, create them in the AWS Console under **IAM → Users → Security credentials**.

### Clone the repository

```bash
git clone https://github.com/12turnbullb/ski-app-sample.git
cd ski-app-sample
```

---

## Architecture

```
Browser → CloudFront → S3 (frontend static assets)
                    → API Gateway → Lambda (FastAPI/Mangum) → Aurora PostgreSQL
                                                             → S3 (media uploads)
                                                             → AWS Bedrock (AI analysis)
```

### Frontend
- React 19, TypeScript, Vite
- Tailwind CSS v4
- React Router v7
- Vitest + Testing Library

### Backend
- Python 3.12, FastAPI, SQLAlchemy 2, Pydantic v2
- Mangum adapter for AWS Lambda
- pg8000 PostgreSQL driver (pure Python — no native deps)
- SQLite for local development (automatic fallback)

### Infrastructure (AWS CDK — TypeScript)
Five CDK stacks in `cdk/`:

| Stack | Resources |
|-------|-----------|
| `NetworkStack` | VPC, subnets, security groups |
| `DatabaseStack` | Aurora PostgreSQL Serverless v2, Secrets Manager credential |
| `StorageStack` | S3 bucket for media uploads |
| `ApiStack` | Lambda function, API Gateway HTTP API |
| `FrontendStack` | S3 bucket for static assets, CloudFront distribution |

---

## Local Development

Run the app locally without any AWS account. The backend automatically falls back to a local SQLite database when no cloud credentials are present.

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

The API starts at `http://localhost:8000`. Swagger docs at `http://localhost:8000/docs`.

Without `DATABASE_URL` or `DB_SECRET_ARN` set, the backend automatically uses a local SQLite database at `backend/data/ski_racer.db`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The app starts at `http://localhost:5173` and proxies API requests to the backend.

**Environment variables:**

| Variable | Description |
|----------|-------------|
| `VITE_API_BASE_URL` | Backend base URL (defaults to `http://localhost:8000` in dev) |

---

## AWS Deployment

This section walks you through deploying the full stack to your own AWS account from scratch.

### Step 1 — Bootstrap CDK

CDK bootstrap creates the S3 bucket and IAM roles CDK needs to deploy assets into your account. You only need to do this once per account/region.

```bash
# Get your AWS account ID
aws sts get-caller-identity --query Account --output text

# Bootstrap CDK (replace ACCOUNT_ID and REGION with your values)
cd cdk
npm install
npx cdk bootstrap aws://ACCOUNT_ID/REGION
```

Example:
```bash
npx cdk bootstrap aws://123456789012/us-east-1
```

### Step 2 — Enable Bedrock model access

In the AWS Console, go to **Amazon Bedrock → Model access** and request access to the Anthropic Claude model you want to use. Model access is approved instantly for most regions. The backend's `services/bedrock.py` specifies which model ID to call — update it if you choose a different model.

### Step 3 — Build the Lambda package

The Lambda runtime runs on Amazon Linux. Python packages with native extensions (like pydantic-core) must be compiled for that platform, not your local machine.

```bash
# Run from the repo root
./scripts/build_lambda.sh
```

This script installs dependencies targeting `manylinux2014_x86_64` / Python 3.12 and outputs them to `backend/lambda_pkg/`. Run this script before every backend deploy.

### Step 4 — Deploy all infrastructure

```bash
cd cdk
npx cdk deploy --all
```

CDK will display a summary of the IAM permissions it needs to create and ask for confirmation. Type `y` to proceed. The first deploy takes approximately 10–15 minutes because Aurora Serverless takes time to provision.

After the deploy completes, CDK will print output values including your:
- **API Gateway URL** — the backend endpoint
- **CloudFront URL** — the frontend URL
- **S3 bucket names** — for uploads and static assets

Copy these values; you will need them in the next step.

### Step 5 — Configure and build the frontend

Create or update `frontend/.env.production` with your API Gateway URL from Step 4:

```bash
# frontend/.env.production
VITE_API_BASE_URL=https://YOUR_API_GATEWAY_ID.execute-api.REGION.amazonaws.com
```

Then build and deploy the frontend:

```bash
cd frontend
npm install
npm run build

# Sync to the S3 bucket CDK created (use the bucket name from CDK outputs)
aws s3 sync dist/ s3://YOUR_FRONTEND_BUCKET_NAME/ --delete

# Invalidate the CloudFront cache so the new build is served immediately
aws cloudfront create-invalidation \
  --distribution-id YOUR_CLOUDFRONT_DISTRIBUTION_ID \
  --paths "/*"
```

Your app is now live at the CloudFront URL from Step 4.

---

### Subsequent backend deploys

After any backend code change, rebuild and redeploy only the API stack:

```bash
./scripts/build_lambda.sh
cd cdk
npx cdk deploy ApiStack
```

### Subsequent frontend deploys

```bash
cd frontend
npm run build
aws s3 sync dist/ s3://YOUR_FRONTEND_BUCKET_NAME/ --delete
aws cloudfront create-invalidation \
  --distribution-id YOUR_CLOUDFRONT_DISTRIBUTION_ID \
  --paths "/*"
```

---

## API Reference

Base path: `/api`

### Health
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | Health check |

### Racers
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/racers/{id}` | Get racer profile |
| `POST` | `/api/racers` | Create racer profile |
| `PUT` | `/api/racers/{id}` | Update racer profile |
| `DELETE` | `/api/racers/{id}` | Delete racer profile |

### Documents (Upload & Analysis)
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/racers/{id}/documents/upload-url` | Get presigned S3 PUT URL (production) |
| `POST` | `/api/racers/{id}/documents/{doc_id}/analyze` | Run Bedrock AI analysis on uploaded file |
| `GET` | `/api/racers/{id}/documents` | List all documents for a racer |
| `GET` | `/api/documents/{doc_id}` | Get single document |
| `GET` | `/api/documents/{doc_id}/url` | Get presigned S3 GET URL for media viewing |
| `DELETE` | `/api/documents/{doc_id}` | Delete document and S3 object |
| `POST` | `/api/racers/{id}/documents` | Single-step multipart upload (local dev only) |

### Events
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/racers/{id}/events` | List events |
| `POST` | `/api/racers/{id}/events` | Create event |
| `PUT` | `/api/events/{id}` | Update event |
| `DELETE` | `/api/events/{id}` | Delete event |

---

## Data Models

**Racer** — `racer_name`, `height` (cm), `weight` (kg), `ski_types`, `binding_measurements`, `personal_records`, `racing_goals`

**Document** — `filename`, `file_path` (S3 key in prod / local path in dev), `file_type`, `file_size`, `analysis` (Bedrock output), `status` (`pending` | `complete`)

**Event** — `event_name`, `event_date`, `location`, `notes`

---

## Document Upload Flow (Production)

1. **Frontend** → `POST /api/racers/{id}/documents/upload-url` with filename, type, size
2. **Backend** creates a `pending` DB record and returns a presigned S3 PUT URL
3. **Frontend** → `PUT <presigned-url>` — uploads the file directly to S3
4. **Frontend** → `POST /api/racers/{id}/documents/{doc_id}/analyze`
5. **Backend** reads file from S3, calls AWS Bedrock, updates record to `complete`, returns analysis

---

## Testing

```bash
# Frontend
cd frontend
npm test                  # run tests
npm run test:coverage     # with coverage report
npm run test:ui           # Vitest browser UI

# Backend
cd backend
source venv/bin/activate
pytest
```

---

## Project Structure

```
ski-app-sample/
├── frontend/               # React + Vite app
│   ├── src/
│   │   ├── components/     # UI components (Overview, ProfileForm, DocumentUploader, Calendar, …)
│   │   ├── services/       # API client
│   │   └── types/          # TypeScript types
│   ├── tailwind.config.js  # Custom Tailwind tokens (usa-red, carbon-*, etc.)
│   └── .env.production     # VITE_API_BASE_URL for production build
├── backend/
│   ├── app/
│   │   ├── main.py         # FastAPI app + Mangum Lambda handler
│   │   ├── database.py     # SQLAlchemy engine (SQLite dev / Aurora prod)
│   │   ├── models.py       # ORM models: Racer, Document, Event
│   │   ├── schemas.py      # Pydantic request/response schemas
│   │   ├── routers/        # FastAPI routers: racers, documents, events
│   │   ├── repositories/   # DB query layer
│   │   └── services/       # Business logic + Bedrock / S3 integration
│   ├── requirements.txt
│   └── lambda_pkg/         # Built by scripts/build_lambda.sh (CDK asset)
├── cdk/                    # AWS CDK infrastructure (TypeScript)
│   └── lib/                # NetworkStack, DatabaseStack, StorageStack, ApiStack, FrontendStack
└── scripts/
    ├── build_lambda.sh     # Builds Linux-compatible Lambda zip
    └── migrate_sqlite_to_aurora.py
```

---

## Design System

The UI uses a **Team USA dark theme** — carbon/navy backgrounds with red and navy accents.

- Font: [Barlow Condensed](https://fonts.google.com/specimen/Barlow+Condensed) (headings, uppercase bold)
- Primary color: `usa-red` (`#d31118`)
- Accent: `usa-navy-medium` (`#4264d0`)
- Backgrounds: `carbon-*` dark scale
- Utility classes: `glass-dark`, `glass`, `gradient-text`, `btn-primary`, `card-hover`

See `frontend/DESIGN_SYSTEM.md` for full token reference.
