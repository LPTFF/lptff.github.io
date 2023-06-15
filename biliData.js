import puppeteer from 'puppeteer';
import fs from 'fs';

//获取网页数据
async function crawlPage(url, keyDom) {
    // 启动 Puppeteer
    const browser = await puppeteer.launch({
        headless: "new"
    });
    const page = await browser.newPage();
    // 导航到目标网页
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    const domData = [];
    for (let index = 0; index < keyDom.length; index++) {
        const element = await page.$$eval(keyDom[index], liElements => {
            //处理文本标签
            function extractText(str) {
                const arr = str.split('\n').map(item => item.trim()).filter(item => item !== '');
                return arr.length > 0 ? arr : '';
            }
            // 定义一个辅助函数，用于递归提取标签内的数据
            function extractData(element) {
                const data = {};
                // 提取 href 属性值
                if (element.tagName.toLowerCase() === 'a') {
                    data.href = element.href;
                }
                // 提取 src 属性值
                if (element.tagName.toLowerCase() === 'img') {
                    data.imgSrc = element.src;
                }
                // 提取 span 属性值
                if (element.tagName.toLowerCase() === 'span') {
                    data.span = element.title ? element.title : '';
                }
                // 提取文本内容
                data.text = element.textContent.trim();
                data.text = extractText(data.text);
                // 递归处理子元素
                if (element.children.length > 0) {
                    data.children = Array.from(element.children).map(child => extractData(child));
                }
                return data;
            }
            // 定义一个空数组，用于存储解析后的数据
            const newData = [];
            // 遍历每个 <li> 元素
            liElements.forEach(li => {
                // 提取 <li> 元素内的数据
                const extractedData = extractData(li);
                // 将解析后的数据添加到 newData 数组中
                newData.push(extractedData);
            });
            // 返回封装好的新数组
            return newData;
        });
        domData.push(element);
    }
    // 关闭浏览器
    await browser.close();
    return domData
}

async function run() {
    const url = "https://space.bilibili.com/520754513/dynamic?spm_id_from=444.41.list.card_avatar.click";
    const keyDom = ['.bili-dyn-list__items']//根据页面id获取内容
    const liData = (await crawlPage(url, keyDom))
    const jsonData = JSON.stringify(liData, null, 2);
    fs.writeFile('test.json', jsonData, (err) => {
        if (err) {
            console.error('保存JSON文件时出错：', err);
        } else {
            console.log('提取的数据已保存成功。');
        }
    });
}

run();
