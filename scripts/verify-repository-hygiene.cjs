'use strict';

const path = require('path');
const { spawnSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const allowedTopLevel = new Set([
  '.cspell.json', '.env.development', '.env.example', '.githooks', '.github', '.gitignore',
  '.nojekyll', '.vscode', 'AGENTS.md', 'CLAUDE.md', 'CNAME', 'README.md',
  'auto-imports.d.ts', 'components.d.ts', 'index.html',
  'package.json', 'package-lock.json', 'config', 'contracts', 'data', 'docs',
  'extension', 'public', 'scripts', 'src',
  'tsconfig.json', 'tsconfig.node.json', 'vite.config.ts',
]);
const allowedEnvironmentFiles = new Set(['.env.example', '.env.development']);

const forbiddenDirectory = /(^|\/)(?:node_modules|dist|dist-extension|coverage|playwright-report|test-results|__pycache__|\.pytest_cache|\.cache|\.temp|\.tmp|tmp|temp|logs?|screenshots?|\.local|\.artifacts|artifacts|\.claude)(?:\/|$)/i;
const forbiddenFile = /(^|\/)(?:\.DS_Store|Thumbs\.db|verification-report(?:\.[^/]*)?|walkthrough(?:\.[^/]*)?|(?:screenshot|screen-recording|codex-clipboard|chrome-devtools)(?:[-_.][^/]*)?|local-validation\.json|plan-output\.json|build-output\.json)$/i;
const forbiddenExtension = /(?:\.log|\.tmp|\.temp|\.bak|\.orig|\.rej|\.swp|\.swo|\.pyc|\.pyo|\.session(?:-journal)?|\.sqlite3?(?:-(?:wal|shm))?|\.db(?:-(?:wal|shm))?|\.zip|\.tgz|\.tar\.gz)$/i;
const environmentFile = /(^|\/)\.env(?:\.[^/]*)?$/i;
const secretMaterial = /(?:\.pem|\.key)$/i;
const repeatedDirectory = /(^|\/)([^/]+)\/\2(?:\/|$)/i;

function gitFileList(args) {
  const result = spawnSync('git', args, {
    cwd: repoRoot,
    encoding: 'utf8',
    windowsHide: true,
  });
  if (result.status !== 0) {
    throw new Error((result.stderr || result.error?.message || 'git ls-files failed').trim());
  }
  return result.stdout.split('\0').filter(Boolean).map(file => file.replace(/\\/g, '/'));
}

function gitFiles() {
  return gitFileList(['ls-files', '-z']);
}

function workingTreeFiles() {
  const deleted = new Set(gitFileList(['ls-files', '--deleted', '-z']));
  return gitFileList(['ls-files', '--cached', '--others', '--exclude-standard', '-z'])
    .filter(file => !deleted.has(file));
}

function filesToCheck() {
  if (process.argv.includes('--working-tree')) return workingTreeFiles();
  const marker = process.argv.indexOf('--check-path');
  if (marker < 0) return gitFiles();
  const files = process.argv.slice(marker + 1).map(file => file.replace(/\\/g, '/'));
  if (!files.length) throw new Error('--check-path requires at least one repository-relative path');
  return files;
}

function explainViolation(file) {
  const topLevel = file.split('/')[0];
  if (!allowedTopLevel.has(topLevel)) return `未登记的顶层入口: ${topLevel}`;
  if (repeatedDirectory.test(file)) return '目录出现连续重复分层，请检查迁移目标';
  if (forbiddenDirectory.test(file)) return '本地缓存、验证或构建目录不得跟踪';
  if (forbiddenFile.test(file)) return '验证报告或任务交接临时产物不得跟踪';
  if (forbiddenExtension.test(file)) return '日志、数据库、临时文件或打包产物不得跟踪';
  if (environmentFile.test(file) && !allowedEnvironmentFiles.has(file)) return '真实环境文件不得跟踪';
  if (secretMaterial.test(file)) return '密钥材料不得跟踪';
  return null;
}

function main() {
  const files = filesToCheck();
  const scope = process.argv.includes('--working-tree') ? 'working-tree candidate' : (process.argv.includes('--check-path') ? 'explicit paths' : 'Git index');
  const violations = files.map(file => ({ file, reason: explainViolation(file) })).filter(item => item.reason);
  const result = {
    status: violations.length ? 'REPOSITORY_HYGIENE_FAILED' : 'REPOSITORY_HYGIENE_PASSED',
    scope,
    checkedFiles: files.length,
    violations,
  };
  if (process.argv.includes('--json')) console.log(JSON.stringify(result, null, 2));
  else if (violations.length) {
    console.error('Repository hygiene check failed:');
    for (const item of violations) console.error(`- ${item.file}: ${item.reason}`);
  } else {
    console.log(`Repository hygiene passed (${files.length} files checked in ${scope}).`);
  }
  process.exitCode = violations.length ? 1 : 0;
}

try { main(); }
catch (error) {
  console.error(`Repository hygiene check could not run: ${error.message}`);
  process.exitCode = 1;
}
