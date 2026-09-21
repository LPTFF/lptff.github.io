import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

function computeDigest(filePaths) {
  const hash = crypto.createHash('sha256');
  for (const filePath of filePaths) {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Build tag source file is missing: ${filePath}`);
    }
    const content = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');
    hash.update(content, 'utf8');
  }
  return hash.digest('hex').slice(0, 10);
}

export function computeBuildTags(projectRoot) {
  const extensionDir = path.join(projectRoot, 'extension');
  const manifestPath = path.join(extensionDir, 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const extensionVersion = manifest.version;

  if (!extensionVersion) {
    throw new Error(`Extension manifest has no version: ${manifestPath}`);
  }

  const extensionDigest = computeDigest([
    manifestPath,
    path.join(extensionDir, 'background.js'),
    path.join(extensionDir, 'authorized-content.js'),
    path.join(extensionDir, 'lan-bridge-sync.js'),
    path.join(extensionDir, 'popup/authorized-panel.js'),
    path.join(extensionDir, 'content/web-bridge.js'),
  ]);

  const webDigest = computeDigest([
    path.join(projectRoot, 'src/utils/authorizedContent.ts'),
    path.join(projectRoot, 'src/views/home/entertainment/component/AuthorizedCollection.vue'),
    path.join(projectRoot, 'src/views/home/52pojie/index.vue'),
    path.join(projectRoot, 'src/views/home/welfare/index.vue'),
    path.join(projectRoot, 'src/views/home/entertainment/index.vue'),
    path.join(projectRoot, 'vite.config.ts'),
  ]);

  return {
    extensionVersion,
    extensionBuildTag: `cand-${extensionVersion}-${extensionDigest}`,
    webBuildTag: `cand-web-${webDigest}`,
  };
}

export function assertGeneratedBuildTags(projectRoot) {
  const tags = computeBuildTags(projectRoot);
  const extensionBuildInfoPath = path.join(projectRoot, 'extension/build-info.js');
  const webBuildInfoPath = path.join(projectRoot, 'src/build-info.ts');
  const extensionBuildInfo = fs.readFileSync(extensionBuildInfoPath, 'utf8');
  const webBuildInfo = fs.readFileSync(webBuildInfoPath, 'utf8');

  if (!extensionBuildInfo.includes(`version: "${tags.extensionVersion}"`) ||
      !extensionBuildInfo.includes(`buildTag: "${tags.extensionBuildTag}"`)) {
    throw new Error(`Extension build tag is stale: ${extensionBuildInfoPath}`);
  }
  if (!webBuildInfo.includes(`WEB_BUILD_TAG = "${tags.webBuildTag}"`) ||
      !webBuildInfo.includes(`EXPECTED_EXTENSION_BUILD_TAG = "${tags.extensionBuildTag}"`)) {
    throw new Error(`Web build tag is stale: ${webBuildInfoPath}`);
  }

  return tags;
}
