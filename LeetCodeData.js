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
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 600000 });
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

//处理数据第一次过滤方法
function extractTextAndHref(data) {
    let result = [];
    if (typeof data === "object" && data !== null) {
        if ("text" in data && data["text"].length > 0) {
            result.push({ text: data["text"] });
        }
        if ("href" in data) {
            result.push({ href: data["href"] });
        }
        for (let key in data) {
            result = result.concat(extractTextAndHref(data[key]));
        }
    } else if (Array.isArray(data)) {
        data.forEach((item) => {
            result = result.concat(extractTextAndHref(item));
        });
    }

    return result;
}
// 函数去重
function deepUniqueArray(array) {
    const seen = new Set();
    return array.filter((item) => {
        if (typeof item === 'object' && item !== null) {
            const itemString = JSON.stringify(item);
            if (seen.has(itemString)) {
                return false;
            }
            seen.add(itemString);
            return true;
        } else {
            if (seen.has(item)) {
                return false;
            }
            seen.add(item);
            return true;
        }
    });
}
async function run() {
    const url = "https://leetcode.cn/problemset/all/";
    const keyDom = ['div[role]']//根据页面标签属性获取内容
    const liData = (await crawlPage(url, keyDom))[0]
    console.log('第一次请求列表页面');
    // 第一次过滤
    const filterFirst = []
    for (let index = 0; index < liData.length; index++) {
        const element = extractTextAndHref(liData[index]);
        filterFirst.push(element)
    }
    //函数去重
    const uniqueArray = deepUniqueArray(filterFirst[0]);
    let array = uniqueArray.slice(17);
    const solutionFilter = [];
    for (let i = 0; i < array.length; i++) {
        if (array[i].href && array[i].href.includes("/solution")) {
            const lastIndex = array[i - 4].text[0].lastIndexOf("%");
            const hardRate = array[i - 4].text[0].substring(lastIndex + 1);
            solutionFilter.push({
                passRate: array[i + 1].text[0],//通过率
                problemsName: array[i - 3].text[0],//题目
                problemsUrl: array[i - 2].href,//题目链接
                solutionsUrl: array[i].href,//题解答案链接
                hardRate: hardRate//题目难度
            });
        }
    }
    console.log('新数组', solutionFilter);
    if (solutionFilter.length > 0) {
        const jsonData = JSON.stringify(solutionFilter, null, 2);
        fs.writeFile('./src/.vuepress/public/data/leetCode.json', jsonData, (err) => {
            if (err) {
                console.error('保存JSON文件时出错：', err);
            } else {
                console.log('提取的数据已保存成功。');
            }
        });
    }

}

run();
