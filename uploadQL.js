const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const SftpClient = require('ssh2-sftp-client');
const { Client } = require('ssh2');

const LOCAL_DIR = './dist';
const ZIP_NAME = `upload_${getTimeStamp()}.zip`;
const TEMP_ZIP_PATH = path.join(__dirname, ZIP_NAME);

const REMOTE_CONFIG = {
    host: requireEnv('DEPLOY_HOST'),
    port: Number(process.env.DEPLOY_PORT || 60022),
    username: requireEnv('DEPLOY_USER'),
    password: requireEnv('DEPLOY_PASSWORD'),
    remotePath: process.env.DEPLOY_REMOTE_PATH || '/root/Test',
};

async function run() {
    try {
        console.log('[deploy] packaging dist...');
        await zipFolder(LOCAL_DIR, TEMP_ZIP_PATH);

        console.log('[deploy] uploading zip...');
        const sftp = new SftpClient();
        await sftp.connect(REMOTE_CONFIG);
        await sftp.put(TEMP_ZIP_PATH, `${REMOTE_CONFIG.remotePath}/${ZIP_NAME}`);
        await sftp.end();

        console.log('[deploy] extracting on remote host...');
        await runSSHCommand(`
cd ${REMOTE_CONFIG.remotePath} &&
unzip -oq ${ZIP_NAME} &&
rm -f ${ZIP_NAME} &&
cp -f index.html 404.html
        `);

        console.log('[deploy] restarting services...');
        fs.unlinkSync(TEMP_ZIP_PATH);
        await runSSHCommand('sudo systemctl restart http-server.service');
        await runSSHCommand('sudo systemctl restart frpc');

        console.log('[deploy] upload complete');
    } catch (err) {
        console.error('[deploy] failed:', err.message);
    } finally {
        if (fs.existsSync(TEMP_ZIP_PATH)) {
            try {
                fs.unlinkSync(TEMP_ZIP_PATH);
                console.log('[deploy] local archive removed');
            } catch (unlinkErr) {
                console.error('[deploy] archive cleanup failed:', unlinkErr.message);
            }
        }
    }
}

function requireEnv(name) {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}

function zipFolder(sourceDir, outPath) {
    return new Promise((resolve, reject) => {
        const output = fs.createWriteStream(outPath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        output.on('close', resolve);
        archive.on('error', reject);

        archive.pipe(output);
        archive.directory(sourceDir, false);
        archive.finalize();
    });
}

function runSSHCommand(command) {
    return new Promise((resolve, reject) => {
        const conn = new Client();
        conn
            .on('ready', () => {
                conn.exec(command, (err, stream) => {
                    if (err) return reject(err);
                    stream
                        .on('close', () => {
                            conn.end();
                            resolve();
                        })
                        .on('data', data => process.stdout.write(data))
                        .stderr.on('data', data => process.stderr.write(data));
                });
            })
            .on('error', reject)
            .connect(REMOTE_CONFIG);
    });
}

function getTimeStamp() {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

run();
