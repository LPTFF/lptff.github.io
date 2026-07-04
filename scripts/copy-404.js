import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distPath = path.resolve(__dirname, '../dist');
const indexPath = path.join(distPath, 'index.html');
const errorPath = path.join(distPath, '404.html');

fs.copyFile(indexPath, errorPath, (err) => {
    if (err) {
        console.error('复制 index.html 到 404.html 失败:', err);
    } else {
        console.log('成功复制 index.html 到 404.html');
    }
});