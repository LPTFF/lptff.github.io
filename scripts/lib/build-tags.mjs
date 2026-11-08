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

// Discover source modules instead of maintaining a partial list that misses extracted files.
export function computeWebDigest(projectRoot) {
  const files = ['index.html', 'package.json', 'package-lock.json', 'vite.config.ts'];
  function visit(directory) {
    for (const entry of fs.readdirSync(path.join(projectRoot, directory), { withFileTypes: true })) {
      const relative = `${directory}/${entry.name}`;
      if (entry.isDirectory()) visit(relative);
      else if (/\.(?:vue|[cm]?[jt]s|json|md|css)$/.test(entry.name) && relative !== 'src/build-info.ts') files.push(relative);
    }
  }
  visit('src');
  visit('scripts/vite');
  const hash = crypto.createHash('sha256');
  for (const relative of files.sort()) {
    hash.update(relative + '\0');
    hash.update(fs.readFileSync(path.join(projectRoot, relative), 'utf8').replace(/\r\n/g, '\n'));
    hash.update('\0');
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
    path.join(extensionDir, 'video-capture.js'),
    path.join(extensionDir, 'music-reader.js'),
    path.join(extensionDir, 'content/music-reader-bridge.js'),
    path.join(extensionDir, 'video/downloader.html'),
    path.join(extensionDir, 'video/downloader.js'),
    path.join(extensionDir, 'video/preview.html'),
    path.join(extensionDir, 'video/preview.js'),
    path.join(extensionDir, 'video/record.html'),
    path.join(extensionDir, 'video/record.js'),
    path.join(extensionDir, 'content/video-recorder.js'),
    path.join(extensionDir, 'vendor/hls.min.js'),
    path.join(extensionDir, 'vendor/ffmpeg.js'),
    path.join(extensionDir, 'vendor/814.ffmpeg.js'),
    path.join(extensionDir, 'vendor/ffmpeg-core.js'),
    path.join(extensionDir, 'vendor/ffmpeg-core.wasm'),
    path.join(extensionDir, 'authorized-content.js'),
    path.join(extensionDir, 'lan-bridge-sync.js'),
    path.join(extensionDir, 'popup/authorized-panel.js'),
    path.join(extensionDir, 'content/web-bridge.js'),
    path.join(extensionDir, 'private-bookmarks.js'),
    path.join(extensionDir, 'content/private-bookmarks-github.js'),
    path.join(extensionDir, 'popup/private-bookmarks-settings.js'),
    path.join(extensionDir, 'popup/private-bookmarks-settings.html'),
    path.join(extensionDir, 'popup/private-bookmarks-settings.css'),
  ]);

  const webDigest = computeWebDigest(projectRoot);

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
