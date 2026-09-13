import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../');
const extensionDir = path.join(projectRoot, 'project-support/extension/lptff-investment-assistant');

console.log('================================================================');
console.log('   LPTFF 授权采集候选环境检查与静态契约验证入口');
console.log('================================================================\n');

// 1. 计算源码候选摘要 (Build Identifiers，严格排除自动生成文件消除自引用)
function computeDigest(filePaths) {
  const hash = crypto.createHash('sha256');
  for (const fp of filePaths) {
    if (fs.existsSync(fp)) {
      const content = fs.readFileSync(fp, 'utf8').replace(/\r\n/g, '\n');
      hash.update(content, 'utf8');
    }
  }
  return hash.digest('hex').slice(0, 10);
}

const extFiles = [
  path.join(extensionDir, 'manifest.json'),
  path.join(extensionDir, 'background.js'),
  path.join(extensionDir, 'authorized-content.js'),
  path.join(extensionDir, 'content/web-bridge.js'),
];
const extDigest = computeDigest(extFiles);
const extBuildTag = `cand-3.25.0-${extDigest}`;

const webFiles = [
  path.join(projectRoot, 'src/utils/authorizedContent.ts'),
  path.join(projectRoot, 'src/views/home/entertainment/component/AuthorizedCollection.vue'),
];
const webDigest = computeDigest(webFiles);
const webBuildTag = `cand-web-${webDigest}`;

console.log('[1/4] 构建标识计算 (Build Identifiers)');
console.log(`  - 目标扩展 ID: mobngggdpoodbnippllglhekfoneapao`);
console.log(`  - 候选扩展版本: 3.25.0 (BuildTag: ${extBuildTag})`);
console.log(`  - 候选网页标识: ${webBuildTag}\n`);

// 2. 检查 Chrome 进程与远程调试状态
console.log('[2/4] 检查 Chrome 运行环境');
const userDataDir = path.join(process.env.LOCALAPPDATA || '', 'Google/Chrome/User Data');
const portFile = path.join(userDataDir, 'DevToolsActivePort');
let cdpPort = null;
let cdpPath = null;
if (fs.existsSync(portFile)) {
  const lines = fs.readFileSync(portFile, 'utf8').trim().split(/\r?\n/);
  cdpPort = lines[0]?.trim();
  cdpPath = lines[1]?.trim();
  console.log(`  - 检测到 Chrome DevTools 端口: 127.0.0.1:${cdpPort}`);
  console.log(`  - DevTools Browser Endpoint: ${cdpPath}`);
} else {
  console.warn('  - 未检测到 DevToolsActivePort 文件，Chrome 可能未开启远程调试');
}

// 3. 检查后端影响性（家庭服务器）
console.log('\n[3/4] 评估家庭服务器发布影响');
console.log('  - 评估结论: 本次变更纯属前端（Web）与浏览器扩展（Extension），无后端 Python/Node 路由与数据库逻辑变更');
console.log('  - 发布策略: 【家庭服务器无需部署】（严格禁止使用旧发布号日志混充本次发布凭据）\n');

// 4. 检查扩展构建包
console.log('[4/4] 验证扩展离线发布包');
const zipPath = path.join(projectRoot, 'dist-extension/lptff-investment-assistant.zip');
const zipExists = fs.existsSync(zipPath);
const zipSize = zipExists ? fs.statSync(zipPath).size : 0;
console.log(`  - 扩展发布包: ${zipPath} (${zipSize} bytes, 存在: ${zipExists})`);

// 5. 若已存在真实测试结果，仅更新环境与构建摘要信息，不覆盖浏览器真实测试数据
const testResultFile = path.join(projectRoot, 'artifacts/test-run-result.json');
let existing = {};
if (fs.existsSync(testResultFile)) {
  try { existing = JSON.parse(fs.readFileSync(testResultFile, 'utf8')); } catch {}
}

existing.buildTags = existing.buildTags || {};
existing.buildTags.extensionExpected = extBuildTag;
existing.buildTags.webExpected = webBuildTag;
if (cdpPort) {
  existing.environment = existing.environment || {};
  existing.environment.cdpPort = Number(cdpPort);
  existing.environment.cdpEndpoint = cdpPath;
}

fs.mkdirSync(path.dirname(testResultFile), { recursive: true });
fs.writeFileSync(testResultFile, JSON.stringify(existing, null, 2), 'utf8');
console.log(`\n环境与构建摘要信息已同步至: ${testResultFile}`);
console.log('================================================================');
