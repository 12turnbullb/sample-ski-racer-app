# AWS Migration Strategy for Ski Racer Web App

## Current Architecture
- **Frontend**: React + TypeScript (Vite dev server)
- **Backend**: FastAPI + Python
- **Database**: SQLite (local file)
- **Storage**: Local filesystem for uploaded videos/images
- **AI**: AWS Bedrock (already integrated)

---

## Recommended AWS Architecture

### Option 1: Serverless-First (Recommended for Cost & Scalability)

```
┌─────────────────────────────────────────────────────────────┐
│                         CloudFront                          │
│                    (CDN + SSL/TLS)                          │
└────────────┬────────────────────────────────┬───────────────┘
             │                                │
             ▼                                ▼
    ┌────────────────┐              ┌─────────────────┐
    │   S3 Bucket    │              │  API Gateway    │
    │   (Frontend)   │              │   (REST API)    │
    └────────────────┘              └────────┬────────┘
                                             │
                                             ▼
                                    ┌─────────────────┐
                                    │  Lambda Functions│
                                    │   (FastAPI)     │
                                    └────────┬────────┘
                                             │
                    ┌────────────────────────┼────────────────────┐
                    ▼                        ▼                    ▼
            ┌───────────────┐      ┌─────────────────┐   ┌──────────────┐
            │  RDS Aurora   │      │   S3 Bucket     │   │   Bedrock    │
            │  Serverless   │      │  (Uploads)      │   │  (Already)   │
            │  (PostgreSQL) │      │                 │   │              │
            └───────────────┘      └─────────────────┘   └──────────────┘
```

#### Components:

**Frontend Hosting:**
- **AWS Amplify Hosting** or **S3 + CloudFront**
  - Amplify: Easier CI/CD, preview environments, custom domains
  - S3+CloudFront: More control, potentially lower cost
  - Both support HTTPS, custom domains, and global CDN

**Backend API:**
- **API Gateway + Lambda** (Serverless)
  - Use Mangum adapter to run FastAPI on Lambda
  - Pay only for requests (no idle costs)
  - Auto-scaling built-in
  - Cold start: ~1-2s (acceptable for this use case)

**Database:**
- **Amazon RDS Aurora Serverless v2 (PostgreSQL)**
  - Auto-scales from 0.5 to 128 ACUs based on load
  - Pauses when idle (saves cost)
  - PostgreSQL compatible (easy SQLAlchemy migration)
  - Alternative: RDS PostgreSQL (cheaper for consistent load)

**File Storage:**
- **S3 Bucket** for uploaded videos/images
  - Presigned URLs for secure uploads
  - CloudFront for fast delivery
  - Lifecycle policies for cost optimization
  - Versioning for data protection

**AI Processing:**
- **AWS Bedrock** (already integrated ✓)
  - Keep existing integration
  - Consider async processing for videos via SQS + Lambda

---

### Option 2: Container-Based (Better for Complex Workloads)

```
┌─────────────────────────────────────────────────────────────┐
│                         CloudFront                          │
└────────────┬────────────────────────────────┬───────────────┘
             │                                │
             ▼                                ▼
    ┌────────────────┐              ┌─────────────────┐
    │   Amplify      │              │  Application    │
    │   Hosting      │              │  Load Balancer  │
    └────────────────┘              └────────┬────────┘
                                             │
                                             ▼
                                    ┌─────────────────┐
                                    │   ECS Fargate   │
                                    │  (FastAPI)      │
                                    └────────┬────────┘
                                             │
                    ┌────────────────────────┼────────────────────┐
                    ▼                        ▼                    ▼
            ┌───────────────┐      ┌─────────────────┐   ┌──────────────┐
            │  RDS Aurora   │      │   S3 Bucket     │   │   Bedrock    │
            │  PostgreSQL   │      │  (Uploads)      │   │              │
            └───────────────┘      └─────────────────┘   └──────────────┘
```

#### Components:

**Backend:**
- **ECS Fargate** (Serverless containers)
  - Run FastAPI in Docker containers
  - No server management
  - Better for long-running requests
  - No cold starts
  - Alternative: App Runner (simpler, less control)

**Database:**
- **RDS Aurora PostgreSQL** (provisioned)
  - Better for consistent workloads
  - Multi-AZ for high availability

---

## Migration Comparison

| Aspect | Option 1: Serverless | Option 2: Containers |
|--------|---------------------|---------------------|
| **Cost (low traffic)** | $10-30/month | $30-60/month |
| **Cost (high traffic)** | Scales linearly | More predictable |
| **Cold starts** | 1-2 seconds | None |
| **Complexity** | Medium | Higher |
| **Scalability** | Automatic | Automatic |
| **Best for** | Variable traffic | Consistent traffic |
| **Video processing** | May timeout (15min max) | Better for long tasks |

---

## Recommended: Option 1 (Serverless) + Enhancements

### Why Serverless?
1. **Cost-effective**: Pay only for what you use
2. **Auto-scaling**: Handles traffic spikes automatically
3. **Low maintenance**: No servers to manage
4. **Good fit**: Your app has variable traffic patterns

### Architecture Details

#### 1. Frontend (AWS Amplify Hosting)
```bash
# Deploy with Amplify CLI
amplify init
amplify add hosting
amplify publish
```

**Features:**
- Automatic CI/CD from Git
- Preview environments for PRs
- Custom domain + SSL
- Global CDN
- Cost: ~$1-5/month

#### 2. Backend (Lambda + API Gateway)

**Lambda Function Setup:**
```python
# lambda_handler.py
from mangum import Mangum
from app.main import app

handler = Mangum(app, lifespan="off")
```

**API Gateway:**
- REST API or HTTP API (cheaper)
- Custom domain mapping
- CORS configuration
- Request/response transformations

**Cost:** ~$5-15/month (1M requests free tier)

#### 3. Database (RDS Aurora Serverless v2)

**Migration from SQLite:**
```python
# Update database.py
SQLALCHEMY_DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://user:pass@aurora-endpoint:5432/skiracing"
)

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=3600
)
```

**Features:**
- Auto-scales: 0.5 ACU (1GB RAM) to 128 ACU
- Pauses after 5 minutes of inactivity
- Multi-AZ for production
- Automated backups

**Cost:** ~$15-40/month (depends on usage)

#### 4. File Storage (S3)

**Upload Flow:**
1. Frontend requests presigned URL from backend
2. Backend generates presigned URL (S3 PutObject)
3. Frontend uploads directly to S3
4. Frontend notifies backend of completion
5. Backend saves metadata to database

**Benefits:**
- No file size limits through API Gateway
- Faster uploads (direct to S3)
- Lower Lambda costs
- Better security

**Cost:** ~$1-5/month (50GB storage + transfer)

#### 5. Video Analysis (Async Processing)

For large video files, use async processing:

```
Upload → S3 → EventBridge → Lambda → Bedrock → Update DB
```

**Benefits:**
- No Lambda timeout issues (15min max)
- Better user experience (non-blocking)
- Can process multiple videos in parallel

---

## Migration Steps

### Phase 1: Database Migration (Week 1)

1. **Provision RDS Aurora Serverless v2**
   ```bash
   # Using AWS CLI or Console
   - Engine: PostgreSQL 15.x
   - Capacity: 0.5 - 2 ACU (start small)
   - VPC: Create new or use default
   - Security Group: Allow PostgreSQL (5432)
   ```

2. **Update Backend Code**
   ```python
   # requirements.txt
   # Add PostgreSQL driver
   psycopg2-binary==2.9.9
   
   # database.py
   # Update connection string to use environment variable
   DATABASE_URL = os.getenv("DATABASE_URL")
   ```

3. **Migrate Data**
   ```bash
   # Export SQLite data
   sqlite3 ski_racer.db .dump > dump.sql
   
   # Convert to PostgreSQL format (manual adjustments needed)
   # Import to Aurora
   psql -h aurora-endpoint -U admin -d skiracing < dump_pg.sql
   ```

4. **Test Locally**
   ```bash
   export DATABASE_URL="postgresql://user:pass@localhost:5432/test"
   python -m pytest
   ```

### Phase 2: File Storage Migration (Week 1-2)

1. **Create S3 Buckets**
   ```bash
   # Uploads bucket
   aws s3 mb s3://ski-racer-uploads-prod
   
   # Configure CORS
   aws s3api put-bucket-cors --bucket ski-racer-uploads-prod --cors-configuration file://cors.json
   ```

2. **Update Backend for S3**
   ```python
   # services/storage_service.py (new file)
   import boto3
   from botocore.config import Config
   
   s3_client = boto3.client('s3', config=Config(signature_version='s3v4'))
   
   def generate_presigned_upload_url(key: str, content_type: str) -> str:
       return s3_client.generate_presigned_url(
           'put_object',
           Params={
               'Bucket': os.getenv('UPLOAD_BUCKET'),
               'Key': key,
               'ContentType': content_type
           },
           ExpiresIn=3600
       )
   ```

3. **Update Frontend**
   ```typescript
   // Upload directly to S3 using presigned URL
   const response = await fetch(presignedUrl, {
       method: 'PUT',
       body: file,
       headers: { 'Content-Type': file.type }
   });
   ```

4. **Migrate Existing Files**
   ```bash
   aws s3 sync backend/uploads/ s3://ski-racer-uploads-prod/
   ```

### Phase 3: Backend Deployment (Week 2)

1. **Containerize FastAPI (for Lambda)**
   ```dockerfile
   # Dockerfile
   FROM public.ecr.aws/lambda/python:3.11
   
   COPY requirements.txt .
   RUN pip install -r requirements.txt
   
   COPY app/ ${LAMBDA_TASK_ROOT}/app/
   COPY lambda_handler.py ${LAMBDA_TASK_ROOT}/
   
   CMD ["lambda_handler.handler"]
   ```

2. **Deploy Lambda Function**
   ```bash
   # Build and push to ECR
   aws ecr create-repository --repository-name ski-racer-api
   docker build -t ski-racer-api .
   docker tag ski-racer-api:latest <account>.dkr.ecr.us-east-1.amazonaws.com/ski-racer-api:latest
   docker push <account>.dkr.ecr.us-east-1.amazonaws.com/ski-racer-api:latest
   
   # Create Lambda function
   aws lambda create-function \
       --function-name ski-racer-api \
       --package-type Image \
       --code ImageUri=<account>.dkr.ecr.us-east-1.amazonaws.com/ski-racer-api:latest \
       --role arn:aws:iam::<account>:role/lambda-execution-role \
       --timeout 30 \
       --memory-size 1024
   ```

3. **Configure API Gateway**
   ```bash
   # Create HTTP API (simpler, cheaper)
   aws apigatewayv2 create-api \
       --name ski-racer-api \
       --protocol-type HTTP \
       --target arn:aws:lambda:us-east-1:<account>:function:ski-racer-api
   ```

4. **Set Environment Variables**
   ```bash
   aws lambda update-function-configuration \
       --function-name ski-racer-api \
       --environment Variables="{
           DATABASE_URL=postgresql://...,
           UPLOAD_BUCKET=ski-racer-uploads-prod,
           AWS_REGION=us-east-1
       }"
   ```

### Phase 4: Frontend Deployment (Week 2-3)

1. **Update API Endpoint**
   ```typescript
   // src/services/api.ts
   const API_BASE_URL = import.meta.env.VITE_API_URL || 
       'https://api.yourdomain.com';
   ```

2. **Deploy with Amplify**
   ```bash
   # Option A: Amplify Console (recommended)
   # - Connect GitHub repo
   # - Configure build settings
   # - Deploy automatically on push
   
   # Option B: Amplify CLI
   amplify init
   amplify add hosting
   amplify publish
   ```

3. **Configure Custom Domain**
   ```bash
   # In Amplify Console
   # - Add custom domain
   # - Configure DNS (Route 53 or external)
   # - SSL certificate auto-provisioned
   ```

### Phase 5: Monitoring & Optimization (Week 3-4)

1. **CloudWatch Dashboards**
   - Lambda invocations, errors, duration
   - API Gateway requests, latency
   - RDS connections, CPU, storage
   - S3 requests, storage size

2. **Cost Optimization**
   - Enable S3 Intelligent-Tiering
   - Set Aurora min capacity to 0.5 ACU
   - Use Lambda reserved concurrency if needed
   - Enable CloudFront caching

3. **Security Hardening**
   - Enable WAF on API Gateway
   - S3 bucket policies (private by default)
   - VPC for Lambda + RDS
   - Secrets Manager for credentials
   - Enable CloudTrail logging

---

## Infrastructure as Code (Recommended)

Use **AWS CDK** or **Terraform** for reproducible deployments:

### AWS CDK Example Structure:
```typescript
// lib/ski-racer-stack.ts
export class SkiRacerStack extends Stack {
  constructor(scope: Construct, id: string) {
    // VPC
    const vpc = new ec2.Vpc(this, 'VPC', { maxAzs: 2 });
    
    // Aurora Serverless
    const cluster = new rds.ServerlessCluster(this, 'Database', {
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_15_2
      }),
      vpc,
      scaling: { minCapacity: 0.5, maxCapacity: 2 }
    });
    
    // S3 Bucket
    const uploadBucket = new s3.Bucket(this, 'Uploads', {
      cors: [/* ... */]
    });
    
    // Lambda Function
    const apiFunction = new lambda.DockerImageFunction(this, 'API', {
      code: lambda.DockerImageCode.fromImageAsset('./backend'),
      environment: {
        DATABASE_URL: cluster.secret!.secretValueFromJson('connectionString').toString(),
        UPLOAD_BUCKET: uploadBucket.bucketName
      },
      vpc
    });
    
    // API Gateway
    const api = new apigateway.LambdaRestApi(this, 'APIGateway', {
      handler: apiFunction
    });
    
    // Amplify Hosting
    const amplifyApp = new amplify.App(this, 'Frontend', {
      sourceCodeProvider: new amplify.GitHubSourceCodeProvider({
        owner: 'your-username',
        repository: 'ski-racer-app',
        oauthToken: SecretValue.secretsManager('github-token')
      })
    });
  }
}
```

---

## Cost Estimates

### Monthly Costs (Low Traffic - 10K requests/month):
- **Amplify Hosting**: $1-2
- **API Gateway**: $0 (free tier)
- **Lambda**: $0-5 (free tier covers most)
- **RDS Aurora Serverless**: $15-25 (0.5 ACU, pauses when idle)
- **S3 Storage**: $1-3 (50GB)
- **CloudFront**: $0-2
- **Bedrock**: Variable (pay per request)
- **Total**: ~$20-40/month

### Monthly Costs (Medium Traffic - 1M requests/month):
- **Amplify Hosting**: $2-5
- **API Gateway**: $3-5
- **Lambda**: $10-20
- **RDS Aurora Serverless**: $40-80 (scales up during peak)
- **S3 Storage**: $5-10 (200GB)
- **CloudFront**: $5-10
- **Bedrock**: Variable
- **Total**: ~$65-130/month

---

## Alternative: Simpler Approach (AWS App Runner)

If you want the simplest migration:

```
Frontend (Amplify) → App Runner (FastAPI) → RDS + S3
```

**AWS App Runner:**
- Deploy from Dockerfile or source code
- Auto-scaling built-in
- No Lambda/API Gateway complexity
- Slightly higher cost but simpler
- Good middle ground between Lambda and ECS

```bash
# Deploy with App Runner
aws apprunner create-service \
    --service-name ski-racer-api \
    --source-configuration file://source-config.json
```

---

## Recommendations

### Start Here:
1. **Phase 1**: Migrate to RDS Aurora Serverless (test locally first)
2. **Phase 2**: Move uploads to S3 (keep local as backup initially)
3. **Phase 3**: Deploy backend to Lambda + API Gateway
4. **Phase 4**: Deploy frontend to Amplify
5. **Phase 5**: Monitor, optimize, and iterate

### Quick Wins:
- Use AWS CDK for infrastructure (reproducible, version-controlled)
- Enable CloudWatch alarms for errors and high costs
- Use AWS Secrets Manager for credentials
- Implement CI/CD with GitHub Actions or Amplify

### Future Enhancements:
- Add CloudFront in front of API Gateway (caching, DDoS protection)
- Implement async video processing with SQS + Lambda
- Add ElastiCache (Redis) for session management
- Use Cognito for user authentication
- Add Step Functions for complex workflows

---

## Questions to Consider

1. **Expected traffic patterns?** (helps size Aurora and Lambda)
2. **Budget constraints?** (affects RDS vs Aurora Serverless choice)
3. **Video file sizes?** (affects S3 costs and Lambda timeout strategy)
4. **Multi-user support planned?** (affects auth strategy)
5. **Compliance requirements?** (affects VPC, encryption, logging)

Let me know which approach resonates with you, and I can help with the detailed implementation!
