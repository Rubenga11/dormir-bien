// infra/lib/config.ts — Per-environment configuration

export interface EnvConfig {
  envName: 'dev' | 'prd'
  domain: string
  apiDomain: string
  hostedZoneName: string
  vCpu: number
  memoryMiB: number
  desiredCount: number
  minCapacity: number
  maxCapacity: number
  enableAutoScaling: boolean
  enableNat: boolean
  dbInstanceClass: string
  dbAllocatedStorageGiB: number
  dbBackupRetentionDays: number
}

export const CONFIG: Record<string, EnvConfig> = {
  dev: {
    envName: 'dev',
    domain: 'dev.breathecalm.es',
    apiDomain: 'api-dev.breathecalm.es',
    hostedZoneName: 'breathecalm.es',
    vCpu: 256,       // 0.25 vCPU
    memoryMiB: 512,
    desiredCount: 1,
    minCapacity: 1,
    maxCapacity: 1,
    enableAutoScaling: false,
    enableNat: false,
    dbInstanceClass: 't3.micro',
    dbAllocatedStorageGiB: 20,
    dbBackupRetentionDays: 7,
  },
  prd: {
    envName: 'prd',
    domain: 'breathecalm.es',
    apiDomain: 'api.breathecalm.es',
    hostedZoneName: 'breathecalm.es',
    vCpu: 512,       // 0.5 vCPU
    memoryMiB: 1024,
    desiredCount: 2,
    minCapacity: 2,
    maxCapacity: 6,
    enableAutoScaling: true,
    enableNat: true,
    dbInstanceClass: 't3.micro',
    dbAllocatedStorageGiB: 20,
    dbBackupRetentionDays: 14,
  },
}
