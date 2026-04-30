# Deploy PulseHR on Railway

## Backend
Build:
`bash deploy/railway/backend-build.sh`

Start:
`bash deploy/railway/backend-start.sh`

## Frontend
Build:
`bash deploy/railway/frontend-build.sh`

Start:
`bash deploy/railway/frontend-start.sh`

## Required services
- Railway Postgres
- Backend service
- Frontend service

## Order
1. create Postgres
2. deploy backend with env vars
3. deploy frontend with backend API url
4. run smoke checks
