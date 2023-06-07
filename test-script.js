import puppeteer from 'puppeteer';
import fs from 'fs';

async function run() {
    // 启动 Puppeteer
    const browser = await puppeteer.launch({
        headless: "new"
    });
    const page = await browser.newPage();

    // 导航到目标网页
    await page.goto("https://juejin.cn/frontend/JavaScript", { waitUntil: 'networkidle2', timeout: 60000 });

    // const title = await page.title();
    // console.log(`网页标题：${title}`);

    // const content = await page.$eval('body', (element) => element.textContent);
    // console.log(`网页内容：${content}`);

    // const startIndex = content.indexOf('前端收藏榜');
    // const endIndex = content.indexOf('营业执照');

    // if (startIndex !== -1 && endIndex !== -1) {
    //     const extractedData = content.substring(startIndex, endIndex);
    //     const lines = extractedData.split('\n').map((line) => line.trim()).filter((line) => line !== '');
    //     // 假设要舍弃前面2行和后面2行
    //     const startLineIndex = 2;
    //     const endLineIndex = lines.length - 2;

    //     const slicedLines = lines.slice(startLineIndex, endLineIndex);
    //     const filteredArray = slicedLines.filter((element) => isNaN(element) && element !== '点赞' && element !== '评论');
    //     console.log('分割后的数据长度2：');
    //     console.log(filteredArray.length)

    //     const jsonData = JSON.stringify(filteredArray, null, 2);

    // fs.writeFile('extracted_data.json', jsonData, (err) => {
    //     if (err) {
    //         console.error('保存JSON文件时出错：', err);
    //     } else {
    //         console.log('提取的数据已保存为extracted_data.json文件。');
    //     }
    // });
    // } else {
    //     console.log('找不到起始关键字符或结束关键字符。');
    // }
    // const liElements = await page.evaluate(() => {
    //     const liNodes = Array.from(document.querySelectorAll('li'));
    //     console.log('liNodes', liNodes);
    //     const liData = liNodes.map(li =>
    //         li.outerHTML
    //     );
    //     return liData;
    // });
    // console.log('List Items:');
    // console.log(liElements.length);
    // // 要查找的特定字符串
    // const searchString = 'data-growing-container';

    // // 使用 findIndex() 方法查找第一个元素的索引
    // const firstIndex = liElements.findIndex(item => item.includes(searchString));

    // // 根据索引截取成为一个新的数组
    // const newArray = liElements.slice(firstIndex, firstIndex + 80);

    // // console.log('New Array:');
    // // console.log(newArray[0]);
    // const jsonData = JSON.stringify(newArray, null, 2);
    // fs.writeFile('extracted_data2.json', jsonData, (err) => {
    //     if (err) {
    //         console.error('保存JSON文件时出错：', err);
    //     } else {
    //         console.log('提取的数据已保存为extracted_data.json文件。');
    //     }
    // });
    const liData = await page.$$eval('li[data-growing-container]', liElements => {
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

    console.log('Parsed Data:');
    console.log(liData[0]);
    console.log(liData.length);
    const jsonData = JSON.stringify(liData, null, 2);
    fs.writeFile('extracted_data.json', jsonData, (err) => {
        if (err) {
            console.error('保存JSON文件时出错：', err);
        } else {
            console.log('提取的数据已保存为extracted_data.json文件。');
        }
    });

    // 关闭浏览器
    await browser.close();
}

run();
