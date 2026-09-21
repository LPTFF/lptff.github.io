#!/usr/bin/env node
'use strict';

/**
 * Validates build artifacts in dist/ against strict privacy and publication whitelists.
 * Ensures no private platform data, confidential records, credentials, or unapproved
 * JSON schemas leak into publicly hosted static packages.
 */

const fs = require('fs');
const path = require('path');

const PROHIBITED_KEYS = new Set([
  'confidentiality',
  'strict_private',
  'aaguid',
  'credential_id',
  'publicKeyPem',
  'actionDigest',
  'approvalId',
  'tombstones',
  'idempotency',
  'private_key',
  'cookie',
  'accessToken',
  'restore_runtime',
  'encryption_key',
  'device_store',
]);

const PROHIBITED_REGEXES = [
  /BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY/i,
  /AIzaSy[A-Za-z0-9_-]{33}/,
  /"confidentiality"\s*:\s*"(private|strict_private)"/i,
  /"formatVersion"\s*:\s*"private-platform/i,
];

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const relPath = path.relative(process.cwd(), filePath);

  // 1. Regex check across all files
  for (const regex of PROHIBITED_REGEXES) {
    if (regex.test(content)) {
      console.error(`[VIOLATION] Prohibited pattern ${regex} found in: ${relPath}`);
      return false;
    }
  }

  // 2. Deep JSON structure check
  if (filePath.endsWith('.json')) {
    try {
      const data = JSON.parse(content);
      const violations = scanObjectForProhibitedKeys(data);
      if (violations.length > 0) {
        console.error(`[VIOLATION] Prohibited private fields found in ${relPath}: ${violations.join(', ')}`);
        return false;
      }
    } catch {
      // not valid JSON, skipped
    }
  }

  return true;
}

function scanObjectForProhibitedKeys(obj, prefix = '') {
  if (!obj || typeof obj !== 'object') return [];
  const violations = [];
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      violations.push(...scanObjectForProhibitedKeys(obj[i], `${prefix}[${i}]`));
    }
  } else {
    for (const [k, v] of Object.entries(obj)) {
      const currentPath = prefix ? `${prefix}.${k}` : k;
      if (PROHIBITED_KEYS.has(k)) {
        violations.push(currentPath);
      }
      violations.push(...scanObjectForProhibitedKeys(v, currentPath));
    }
  }
  return violations;
}

function scanDir(dir) {
  let ok = true;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (!scanDir(full)) ok = false;
    } else if (ent.isFile()) {
      if (!checkFile(full)) ok = false;
    }
  }
  return ok;
}

const targetDir = process.argv[2] ? path.resolve(process.argv[2]) : path.resolve(process.cwd(), 'dist');
if (!fs.existsSync(targetDir)) {
  console.log(`[INFO] Directory ${targetDir} does not exist yet. Run build first.`);
  process.exit(0);
}

console.log(`[SECURITY] Verifying publication whitelist on: ${targetDir}...`);
const passed = scanDir(targetDir);
if (!passed) {
  console.error('[FATAL] Publication security verification FAILED. Blocking deployment.');
  process.exit(1);
}

console.log('[SECURITY] All public artifacts passed publication whitelist verification.');
process.exit(0);
