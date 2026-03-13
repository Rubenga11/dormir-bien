#!/usr/bin/env bash
set -euo pipefail

# Deploy frontend to S3 + invalidate CloudFront
# Usage: ENV=dev|prd ./scripts/deploy-frontend.sh

ENV="${ENV:-dev}"

if [ "$ENV" = "prd" ]; then
  S3_BUCKET="breathecalm-frontend-prd"
  CF_DIST_ID="${CF_DIST_ID_PRD:?Set CF_DIST_ID_PRD}"
  export NEXT_PUBLIC_API_URL="https://api.breathecalm.es"
else
  S3_BUCKET="breathecalm-frontend-dev"
  CF_DIST_ID="${CF_DIST_ID_DEV:?Set CF_DIST_ID_DEV}"
  export NEXT_PUBLIC_API_URL="https://api-dev.breathecalm.es"
fi

echo "==> Building frontend for $ENV..."
export BUILD_TARGET=frontend
npm run build:frontend

echo "==> Syncing to s3://$S3_BUCKET..."
aws s3 sync out/ "s3://$S3_BUCKET" --delete

echo "==> Invalidating CloudFront $CF_DIST_ID..."
aws cloudfront create-invalidation --distribution-id "$CF_DIST_ID" --paths "/*"

echo "==> Frontend deploy ($ENV) complete."
