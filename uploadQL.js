const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const SftpClient = require('ssh2-sftp-client');
const { Client } = require('ssh2');

// ====== 配置项 ======
const LOCAL_DIR = './dist'; // ✅ 本地目录
const ZIP_NAME = `upload_${getTimeStamp()}.zip`;
const TEMP_ZIP_PATH = path.join(__dirname, ZIP_NAME);

const REMOTE_CONFIG = {
    host: '****',
    port: 0,
    username: '***',
    password: '***',
    remotePath: '/root/Test' // ✅ 远程上传目录
};

async function run() {
    try {
        console.log('📦 正在打包...');
        await zipFolder(LOCAL_DIR, TEMP_ZIP_PATH);

        console.log('📤 正在上传...');
        const sftp = new SftpClient();
        await sftp.connect(REMOTE_CONFIG);
        await sftp.put(TEMP_ZIP_PATH, `${REMOTE_CONFIG.remotePath}/${ZIP_NAME}`);
        await sftp.end();

        console.log('📂 正在远程解压...');
        await runSSHCommand(`
        cd ${REMOTE_CONFIG.remotePath} &&
        unzip -oq ${ZIP_NAME} &&
        rm -f ${ZIP_NAME} &&
        cp -f index.html 404.html
        `);


        // 启动 http-server
        console.log('启动新服务');
        fs.unlinkSync(TEMP_ZIP_PATH);
        await runSSHCommand('sudo systemctl restart http-server.service');
        // 重启 frpc 服务以确保端口映射正常
        console.log('🌐 重启 frpc 服务以刷新公网映射');
        await runSSHCommand('sudo systemctl restart frpc');
        console.log('✅ 上传部署完成');
    } catch (err) {
        console.error('❌ 出错:', err.message);
    } finally {
        // 确保无论成功失败都删除本地打包文件
        if (fs.existsSync(TEMP_ZIP_PATH)) {
            try {
                fs.unlinkSync(TEMP_ZIP_PATH);
                console.log('✅ 本地打包文件已删除');
            } catch (unlinkErr) {
                console.error('❌ 删除本地打包文件失败:', unlinkErr.message);
            }
        }
    }
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
    return `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}${now.getSeconds().toString().padStart(2, '0')}`;
}

run();
