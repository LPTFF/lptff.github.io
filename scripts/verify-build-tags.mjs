import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertGeneratedBuildTags } from './lib/build-tags.mjs';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tags = assertGeneratedBuildTags(projectRoot);

console.log(`Build tags verified: ${tags.extensionBuildTag}, ${tags.webBuildTag}`);
