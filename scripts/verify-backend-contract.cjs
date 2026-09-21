#!/usr/bin/env node
'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const portalModalPath = path.join(repoRoot, 'src/components/PrivatePortalModal.vue');
const frozenContractPath = path.join(repoRoot, 'contracts/private-portal-contract.v1.json');

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])]));
  }
  return value;
}

function contractHash(contract) {
  return crypto.createHash('sha256').update(JSON.stringify(stable(contract))).digest('hex');
}

function readContract(filePath) {
  if (!fs.existsSync(filePath)) throw new Error(`Contract file is missing: ${filePath}`);
  const contract = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  if (contract.contractVersion !== '1.0.0') {
    throw new Error(`Unsupported private portal contract version: ${contract.contractVersion || '[missing]'}`);
  }
  if (!Array.isArray(contract.endpoints) || contract.endpoints.length === 0) {
    throw new Error('Contract must contain at least one endpoint');
  }
  const identities = new Set();
  for (const endpoint of contract.endpoints) {
    if (!endpoint.path || !endpoint.method || !endpoint.responses) {
      throw new Error(`Malformed endpoint in contract: ${JSON.stringify(endpoint)}`);
    }
    const identity = `${endpoint.method.toUpperCase()} ${endpoint.path}`;
    if (identities.has(identity)) throw new Error(`Duplicate contract endpoint: ${identity}`);
    identities.add(identity);
  }
  return contract;
}

function findBackendContract() {
  const candidates = [
    process.env.BACKEND_CONTRACT_PATH,
    path.resolve(repoRoot, '../qinglongBackup/contracts/portal/v1/private-portal-contract.json')
  ].filter(Boolean);
  return candidates.find(candidate => fs.existsSync(candidate)) || null;
}

function findBackendSource() {
  const candidates = [
    process.env.BACKEND_WEB_APP_PATH,
    path.resolve(repoRoot, '../qinglongBackup/src/resource_collector/web_app.py')
  ].filter(Boolean);
  return candidates.find(candidate => fs.existsSync(candidate)) || null;
}

function verifyFrontend(contract) {
  if (!fs.existsSync(portalModalPath)) throw new Error(`PrivatePortalModal.vue not found: ${portalModalPath}`);
  const content = fs.readFileSync(portalModalPath, 'utf8');
  const usedEndpoints = contract.endpoints.filter(endpoint => endpoint.frontendUsage !== 'none');
  for (const endpoint of usedEndpoints) {
    if (!content.includes(endpoint.path)) {
      throw new Error(`Frontend is missing contracted endpoint: ${endpoint.method} ${endpoint.path}`);
    }
  }
  console.log(`[CONTRACT] Frontend verified against ${usedEndpoints.length} declared consumer endpoints.`);
}

function verifyBackendImplementation(contract, backendPath) {
  const content = fs.readFileSync(backendPath, 'utf8');
  for (const endpoint of contract.endpoints) {
    if (endpoint.method.toUpperCase() !== 'GET' || !content.includes('def do_GET(self):')) {
      throw new Error(`Backend method is not implemented: ${endpoint.method} ${endpoint.path}`);
    }
    const normalizedPath = endpoint.path === '/app/' ? '/app' : endpoint.path;
    if (!content.includes(`"${normalizedPath}"`) && !content.includes(`'${normalizedPath}'`)) {
      throw new Error(`Backend route is missing: ${endpoint.method} ${endpoint.path}`);
    }
    for (const response of Object.values(endpoint.responses)) {
      for (const field of response.required || []) {
        if (!content.includes(`"${field}"`) && !content.includes(`'${field}'`)) {
          throw new Error(`Backend response field is missing for ${endpoint.path}: ${field}`);
        }
      }
    }
  }
  console.log(`[CONTRACT] Backend source verified against ${contract.endpoints.length} declared endpoints.`);
}

try {
  const frozenContract = readContract(frozenContractPath);
  const frozenHash = contractHash(frozenContract);
  verifyFrontend(frozenContract);

  const backendContractPath = findBackendContract();
  if (backendContractPath) {
    const backendContract = readContract(backendContractPath);
    const backendHash = contractHash(backendContract);
    if (backendHash !== frozenHash) {
      throw new Error(`Frozen frontend contract does not match backend contract v${backendContract.contractVersion}`);
    }
    console.log(`[CONTRACT] Frozen and backend contracts match (v${frozenContract.contractVersion}, sha256:${frozenHash.slice(0, 12)}).`);
  }

  const backendPath = findBackendSource();
  if (backendPath) {
    verifyBackendImplementation(frozenContract, backendPath);
    console.log('[CONTRACT] Frontend, frozen contract, and backend implementation verified.');
  } else {
    console.log(`[CONTRACT:NOTICE] Backend source unavailable in isolated CI; frontend verified against frozen contract v${frozenContract.contractVersion} (sha256:${frozenHash.slice(0, 12)}). Backend implementation remains UNVERIFIED in this run.`);
  }
  process.exit(0);
} catch (error) {
  console.error(`[CONTRACT] Verification FAILED: ${error.message}`);
  process.exit(1);
}
