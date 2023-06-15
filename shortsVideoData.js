import puppeteer from 'puppeteer';
import fs from 'fs';

async function crawlPage(url) {
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

    // 模拟滚动加载更多视频
    await autoScroll(page);

    // 提取视频信息
    const videoElements = await page.$$('video');
    const videoInfoList = [];

    for (const videoElement of videoElements) {
        const src = await videoElement.evaluate((el) => el.getAttribute('src'));
        const title = await videoElement.evaluate((el) => el.getAttribute('title'));

        videoInfoList.push({ src, title });
    }

    await browser.close();

    return videoInfoList;
}

// 自动滚动页面加载更多内容
async function autoScroll(page) {
    await page.evaluate(async () => {
        await new Promise((resolve, reject) => {
            let totalHeight = 0;
            const distance = 100;
            const timer = setInterval(() => {
                const scrollHeight = document.documentElement.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                if (totalHeight >= scrollHeight) {
                    clearInterval(timer);
                    resolve();
                }
            }, 100);
        });
    });
}

async function run() {
    const url = 'https://www.douyin.com/'; // 替换为目标网站的URL
    const videoInfoList = await crawlPage(url);

    console.log('视频信息:');
    console.log(videoInfoList);

    const jsonData = JSON.stringify(videoInfoList, null, 2);
    fs.writeFile('video_info.json', jsonData, (err) => {
        if (err) {
            console.error('保存JSON文件时出错：', err);
        } else {
            console.log('提取的数据已保存成功。');
        }
    });
}

run();
