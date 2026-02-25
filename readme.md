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

### Prerequisites
- Python 3.12+
- Node.js 20+
- AWS CLI (optional — only needed for S3/Bedrock features locally)

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

## AWS Deployment

### Prerequisites
- AWS CLI configured with appropriate permissions
- Node.js (for CDK)
- CDK bootstrapped: `npx cdk bootstrap aws://684069405823/us-east-1`

### Build and deploy

```bash
# 1. Build the Lambda package (Linux ELF wheels — required for pydantic_core on Lambda)
./scripts/build_lambda.sh

# 2. Deploy backend infrastructure
cd cdk
npx cdk deploy ApiStack

# 3. Build and deploy frontend
cd ../frontend
npm run build
aws s3 sync dist/ s3://ski-app-frontend-684069405823-us-east-1/ --delete
aws cloudfront create-invalidation --distribution-id E2937UB6FM1NLL --paths "/*"
```

### Deploy all stacks (first time)

```bash
cd cdk
npx cdk deploy --all
```

### Live endpoints

| Resource | URL |
|----------|-----|
| Frontend | `https://d15vamwn6ru4nt.cloudfront.net` |
| API Gateway | `https://2xijxzzrm7.execute-api.us-east-1.amazonaws.com` |

### AWS resources

| Resource | Name / ARN |
|----------|-----------|
| AWS Account | `684069405823` (us-east-1) |
| Lambda | `ApiStack-SkiAppFunction73E938A9-p0cOfKjEuAgK` |
| CloudFront Distribution | `E2937UB6FM1NLL` |
| Uploads Bucket | `ski-app-uploads-684069405823-us-east-1` |
| Frontend Bucket | `ski-app-frontend-684069405823-us-east-1` |
| DB Secret ARN | `arn:aws:secretsmanager:us-east-1:684069405823:secret:ski-app/db-credentials-rf465n` |

### Lambda build notes

`scripts/build_lambda.sh` installs dependencies targeting `manylinux2014_x86_64` / Python 3.12 so compiled extensions (pydantic_core, etc.) run on Amazon Linux. `.dist-info` directories are intentionally preserved — pg8000's `scramp` dependency uses `importlib.metadata` at runtime.

Run the build script before every `cdk deploy ApiStack`.

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
