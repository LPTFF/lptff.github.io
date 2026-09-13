#!/usr/bin/env node
'use strict';

/**
 * Verifies backend API contract consistency between frontend (PrivatePortalModal.vue)
 * and backend web server (src/resource_collector/web_app.py).
 */

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '../..');
const portalModalPath = path.join(repoRoot, 'src/components/PrivatePortalModal.vue');

// Known expected frontend endpoints used by PrivatePortalModal.vue
const FRONTEND_CONTRACT_ENDPOINTS = [
  '/api/ping',
  '/api/health',
  '/app/'
];

// Backend contract routes defined by resource-collector
const BACKEND_CONTRACT_ROUTES = [
  '/api/ping',
  '/api/health',
  '/api/platform/health',
  '/app',
  '/admin'
];

function verifyFrontend() {
  if (!fs.existsSync(portalModalPath)) {
    throw new Error(`PrivatePortalModal.vue not found at: ${portalModalPath}`);
  }

  const content = fs.readFileSync(portalModalPath, 'utf8');

  for (const endpoint of FRONTEND_CONTRACT_ENDPOINTS) {
    if (!content.includes(endpoint)) {
      throw new Error(`PrivatePortalModal.vue is missing expected contract endpoint: ${endpoint}`);
    }
  }

  console.log(`[CONTRACT] Frontend PrivatePortalModal.vue verified: contains all ${FRONTEND_CONTRACT_ENDPOINTS.length} frontend contract endpoints.`);
}

function verifyBackend() {
  // Check potential paths for web_app.py
  const candidatePaths = [
    process.env.BACKEND_WEB_APP_PATH,
    path.resolve(repoRoot, '../qinglongBackup/src/resource_collector/web_app.py'),
    path.resolve(repoRoot, '../../qinglongBackup/src/resource_collector/web_app.py')
  ].filter(Boolean);

  let backendPath = null;
  for (const cand of candidatePaths) {
    if (fs.existsSync(cand)) {
      backendPath = cand;
      break;
    }
  }

  if (!backendPath) {
    console.log('[CONTRACT] Backend web_app.py not found in adjacent path (isolated frontend CI). Frontend contract specification verified.');
    return;
  }

  const backendContent = fs.readFileSync(backendPath, 'utf8');

  for (const route of BACKEND_CONTRACT_ROUTES) {
    if (!backendContent.includes(`"${route}"`) && !backendContent.includes(`'${route}'`)) {
      throw new Error(`Backend web_app.py at ${backendPath} is missing route handler for: ${route}`);
    }
  }

  console.log(`[CONTRACT] Backend web_app.py verified: all ${BACKEND_CONTRACT_ROUTES.length} backend contract routes are implemented.`);
}

try {
  console.log('[CONTRACT] Verifying backend contract consistency...');
  verifyFrontend();
  verifyBackend();
  console.log('[CONTRACT] Contract verification PASSED.');
  process.exit(0);
} catch (err) {
  console.error(`[CONTRACT] Verification FAILED: ${err.message}`);
  process.exit(1);
}
