#!/usr/bin/env node
// infra/bin/app.ts — CDK entry point, instantiates DEV and PRD stacks
import * as cdk from 'aws-cdk-lib'
import { FrontendStack } from '../lib/frontend-stack'
import { BackendStack } from '../lib/backend-stack'
import { CONFIG } from '../lib/config'

const app = new cdk.App()

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION || 'eu-west-1',
}

// DEV environment
new FrontendStack(app, 'Breathe-DEV-Frontend', { env, config: CONFIG.dev })
new BackendStack(app, 'Breathe-DEV-Backend', { env, config: CONFIG.dev })

// PRD environment
new FrontendStack(app, 'Breathe-PRD-Frontend', { env, config: CONFIG.prd })
new BackendStack(app, 'Breathe-PRD-Backend', { env, config: CONFIG.prd })
