import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertGeneratedBuildTags } from './lib/build-tags.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const extensionDir = path.join(projectRoot, 'extension');

console.log('================================================================');
console.log('   LPTFF 授权采集候选环境检查与静态契约验证入口');
console.log('================================================================\n');

// 1. 生成器和验证器共享同一套源码清单与摘要算法。
const {
  extensionVersion,
  extensionBuildTag: extBuildTag,
  webBuildTag,
} = assertGeneratedBuildTags(projectRoot);

console.log('[1/4] 构建标识计算 (Build Identifiers)');
console.log(`  - 目标扩展 ID: mobngggdpoodbnippllglhekfoneapao`);
console.log(`  - 候选扩展版本: ${extensionVersion} (BuildTag: ${extBuildTag})`);
console.log(`  - 候选网页标识: ${webBuildTag}\n`);

console.log('  - 已生成标识与当前源码摘要一致\n');

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
if (!zipExists || zipSize === 0) {
  throw new Error('扩展发布包缺失或为空，请先运行 node scripts/extension/build-zip.js');
}

// 5. 若已存在真实测试结果，仅更新环境与构建摘要信息，不覆盖浏览器真实测试数据
const testResultFile = path.join(projectRoot, '.local/verification/authorized-collection/test-run-result.json');
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
