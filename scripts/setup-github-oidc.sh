#!/usr/bin/env bash
set -euo pipefail

ACCOUNT_ID="704617281771"
REPO="Rubenga11/dormir-bien"
ROLE_NAME="github-actions-dormir-bien"
OIDC_URL="https://token.actions.githubusercontent.com"

echo "=== Step 1: Create GitHub OIDC Provider ==="

# Check if OIDC provider already exists
EXISTING=$(aws iam list-open-id-connect-providers --query "OpenIDConnectProviderList[?ends_with(Arn, 'token.actions.githubusercontent.com')].Arn" --output text 2>/dev/null || true)

if [ -n "$EXISTING" ] && [ "$EXISTING" != "None" ]; then
  echo "OIDC provider already exists: $EXISTING"
  OIDC_ARN="$EXISTING"
else
  echo "Creating OIDC provider..."
  OIDC_ARN=$(aws iam create-open-id-connect-provider \
    --url "$OIDC_URL" \
    --client-id-list sts.amazonaws.com \
    --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1 \
    --query 'OpenIDConnectProviderArn' --output text)
  echo "Created OIDC provider: $OIDC_ARN"
fi

echo ""
echo "=== Step 2: Create IAM Role ==="

# Check if role already exists
if aws iam get-role --role-name "$ROLE_NAME" >/dev/null 2>&1; then
  echo "Role $ROLE_NAME already exists"
  ROLE_ARN=$(aws iam get-role --role-name "$ROLE_NAME" --query 'Role.Arn' --output text)
else
  echo "Creating role $ROLE_NAME..."

  TRUST_POLICY=$(cat <<TRUSTEOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::${ACCOUNT_ID}:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:${REPO}:*"
        }
      }
    }
  ]
}
TRUSTEOF
)

  ROLE_ARN=$(aws iam create-role \
    --role-name "$ROLE_NAME" \
    --assume-role-policy-document "$TRUST_POLICY" \
    --description "GitHub Actions deployment role for dormir-bien" \
    --query 'Role.Arn' --output text)
  echo "Created role: $ROLE_ARN"
fi

echo ""
echo "=== Step 3: Attach Permissions Policy ==="

DEPLOY_POLICY=$(cat <<'POLICYEOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "S3Frontend",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket",
        "s3:GetBucketLocation"
      ],
      "Resource": [
        "arn:aws:s3:::breathecalm-frontend-*",
        "arn:aws:s3:::breathecalm-frontend-*/*"
      ]
    },
    {
      "Sid": "CloudFront",
      "Effect": "Allow",
      "Action": [
        "cloudfront:CreateInvalidation",
        "cloudfront:GetInvalidation",
        "cloudfront:ListInvalidations"
      ],
      "Resource": "*"
    },
    {
      "Sid": "ECR",
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "ecr:PutImage",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload"
      ],
      "Resource": "*"
    },
    {
      "Sid": "ECS",
      "Effect": "Allow",
      "Action": [
        "ecs:UpdateService",
        "ecs:DescribeServices",
        "ecs:DescribeClusters",
        "ecs:DescribeTaskDefinition",
        "ecs:RegisterTaskDefinition",
        "ecs:ListTasks",
        "ecs:DescribeTasks"
      ],
      "Resource": "*"
    },
    {
      "Sid": "IAMPassRole",
      "Effect": "Allow",
      "Action": "iam:PassRole",
      "Resource": "arn:aws:iam::704617281771:role/*breathe*"
    },
    {
      "Sid": "Logs",
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "*"
    }
  ]
}
POLICYEOF
)

aws iam put-role-policy \
  --role-name "$ROLE_NAME" \
  --policy-name "deploy-permissions" \
  --policy-document "$DEPLOY_POLICY"

echo "Attached deploy-permissions policy"

echo ""
echo "=== Done ==="
echo "Role ARN: $ROLE_ARN"
