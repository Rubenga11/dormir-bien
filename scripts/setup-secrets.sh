#!/usr/bin/env bash
set -euo pipefail

echo "=== Creating Secrets Manager entries ==="
echo "This script reads secrets from the current Amplify app environment variables."
echo "Make sure you have the Amplify app ID set (default: d3d6t00shun5ys)."

AMPLIFY_APP_ID="${AMPLIFY_APP_ID:-d3d6t00shun5ys}"

# Fetch env vars from Amplify
echo "Fetching env vars from Amplify app $AMPLIFY_APP_ID..."
ENV_VARS=$(aws amplify get-app --app-id "$AMPLIFY_APP_ID" --query 'app.environmentVariables' --output json)

# Extract individual values
SUPABASE_URL=$(echo "$ENV_VARS" | python3 -c "import sys,json; print(json.load(sys.stdin).get('NEXT_PUBLIC_SUPABASE_URL',''))")
SUPABASE_ANON_KEY=$(echo "$ENV_VARS" | python3 -c "import sys,json; print(json.load(sys.stdin).get('NEXT_PUBLIC_SUPABASE_ANON_KEY',''))")
SUPABASE_SERVICE_KEY=$(echo "$ENV_VARS" | python3 -c "import sys,json; print(json.load(sys.stdin).get('SUPABASE_SERVICE_ROLE_KEY',''))")
ADMIN_SECRET=$(echo "$ENV_VARS" | python3 -c "import sys,json; print(json.load(sys.stdin).get('ADMIN_SECRET',''))")
S3_KEY_ID=$(echo "$ENV_VARS" | python3 -c "import sys,json; print(json.load(sys.stdin).get('S3_ACCESS_KEY_ID',''))")
S3_SECRET=$(echo "$ENV_VARS" | python3 -c "import sys,json; print(json.load(sys.stdin).get('S3_SECRET_ACCESS_KEY',''))")
S3_BUCKET=$(echo "$ENV_VARS" | python3 -c "import sys,json; print(json.load(sys.stdin).get('S3_UPLOAD_BUCKET',''))")
S3_REGION=$(echo "$ENV_VARS" | python3 -c "import sys,json; print(json.load(sys.stdin).get('S3_UPLOAD_REGION',''))")

SECRET_JSON=$(python3 -c "
import json
print(json.dumps({
    'NEXT_PUBLIC_SUPABASE_URL': '$SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY': '$SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY': '$SUPABASE_SERVICE_KEY',
    'ADMIN_SECRET': '$ADMIN_SECRET',
    'S3_ACCESS_KEY_ID': '$S3_KEY_ID',
    'S3_SECRET_ACCESS_KEY': '$S3_SECRET',
    'S3_UPLOAD_BUCKET': '$S3_BUCKET',
    'S3_UPLOAD_REGION': '$S3_REGION'
}))
")

for ENV in prd dev; do
  SECRET_NAME="breathe/${ENV}/app"
  echo ""
  echo "--- ${ENV} environment ---"

  if aws secretsmanager describe-secret --secret-id "$SECRET_NAME" >/dev/null 2>&1; then
    echo "Secret $SECRET_NAME exists, updating..."
    aws secretsmanager put-secret-value \
      --secret-id "$SECRET_NAME" \
      --secret-string "$SECRET_JSON"
    echo "Updated $SECRET_NAME"
  else
    echo "Creating secret $SECRET_NAME..."
    aws secretsmanager create-secret \
      --name "$SECRET_NAME" \
      --description "Breathe app secrets for ${ENV}" \
      --secret-string "$SECRET_JSON"
    echo "Created $SECRET_NAME"
  fi
done

echo ""
echo "=== Done ==="
