#!/usr/bin/env bash
set -euo pipefail

# Deploy backend to ECR + update ECS service
# Usage: ENV=dev|prd ./scripts/deploy-backend.sh

ENV="${ENV:-dev}"
AWS_REGION="${AWS_REGION:-eu-west-1}"
ECR_REPO="breathe-api"
ECS_CLUSTER="breathe-${ENV}"
ECS_SERVICE="breathe-api-${ENV}"

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_URI="${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO}"
IMAGE_TAG="${ENV}-$(git rev-parse --short HEAD)"

echo "==> Logging into ECR..."
aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "$ECR_URI"

echo "==> Building Docker image..."
docker build -t "${ECR_REPO}:${IMAGE_TAG}" .

echo "==> Tagging and pushing..."
docker tag "${ECR_REPO}:${IMAGE_TAG}" "${ECR_URI}:${IMAGE_TAG}"
docker tag "${ECR_REPO}:${IMAGE_TAG}" "${ECR_URI}:${ENV}-latest"
docker push "${ECR_URI}:${IMAGE_TAG}"
docker push "${ECR_URI}:${ENV}-latest"

echo "==> Updating ECS service..."
aws ecs update-service \
  --cluster "$ECS_CLUSTER" \
  --service "$ECS_SERVICE" \
  --force-new-deployment \
  --region "$AWS_REGION"

echo "==> Backend deploy ($ENV) complete. Image: ${IMAGE_TAG}"
