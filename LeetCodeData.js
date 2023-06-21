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
// 循环网页爬取数据
async function forEachGetPage() {
    const baseUrl = 'https://leetcode.cn/problemset/all/?page=';
    const keyDom = ['div[role]']; //根据页面标签属性获取内容
    let currentPage = 1;
    let prevResult = null;
    const allSolutions = [];
    while (true) {
        const url = baseUrl + currentPage;
        const liData = (await crawlPage(url, keyDom))[0];
        console.log('LeetCode请求列表页面:', url);

        // 第一次过滤
        const filterFirst = [];
        for (let index = 0; index < liData.length; index++) {
            const element = extractTextAndHref(liData[index]);
            filterFirst.push(element);
        }
        console.log('LeetCode循环网页爬取:', currentPage);//调试可以控制该参数，一般建议调试改为currentPage == 4
        if ((prevResult && JSON.stringify(prevResult) === JSON.stringify(filterFirst)) || currentPage == 400) {
            console.log('LeetCode循环请求结束');
            break;
        }
        //函数去重
        const uniqueArray = deepUniqueArray(filterFirst[0]);
        prevResult = filterFirst;
        allSolutions.push(...uniqueArray);
        currentPage++;

    }
    console.log('LeetCode循环网页爬取结果:', allSolutions.length);
    return allSolutions
}
async function run() {
    const originData = await forEachGetPage();
    console.log('LeetCode初始结果', originData.length);
    // const jsonData = JSON.stringify(originData, null, 2);
    // fs.writeFile('test1.json', jsonData, (err) => {
    //     if (err) {
    //         console.error('保存JSON文件时出错：', err);
    //     } else {
    //         console.log('提取的数据已保存成功。');
    //     }
    // });
    // 处理JSON数据
    //舍弃第一个问题，保持数组的完整性
    const targetString = "/solution";
    let foundIndex = null;
    for (let i = 0; i < originData.length; i++) {
        const obj = originData[i];
        if ("href" in obj && obj.href.includes(targetString)) {
            foundIndex = i;
            break;
        }
    }
    const handleData = originData.slice(foundIndex + 2);
    const foundIndices = [];
    const solutionFilter = [];//定位href中包含字符串solution
    for (let i = 0; i < handleData.length; i++) {
        const obj = handleData[i];
        if (typeof obj === 'object') {
            for (const key in obj) {
                if (obj.hasOwnProperty("href") && obj[key].includes('/solution')) {
                    foundIndices.push(i);
                    let problemsName, problemsUrl, allInfo
                    for (let urlIndex = 1; urlIndex < 4; urlIndex++) {
                        if (handleData[i - urlIndex].href) {
                            problemsUrl = handleData[i - urlIndex].href;
                            problemsName = handleData[i - urlIndex - 1].text[0];
                            allInfo = handleData[i - urlIndex - 2].text[0];
                        }
                    }
                    const lastIndex = allInfo.lastIndexOf("%");
                    const hardRate = allInfo.substring(lastIndex + 1);
                    const passRateIndex = allInfo.lastIndexOf(".");
                    const passRate = allInfo.substring(passRateIndex - 2, lastIndex + 1);
                    solutionFilter.push({
                        passRate: passRate,//通过率
                        problemsName: problemsName,//题目
                        problemsUrl: problemsUrl,//题目链接
                        solutionsUrl: handleData[i].href,//题解答案链接
                        hardRate: hardRate//题目难度
                    });
                    break;
                }
            }
        }
    }
    console.log("LeetCode的solutionFilter:", solutionFilter.length);
    if (foundIndices.length > 0) {
        const jsonData = JSON.stringify(solutionFilter, null, 2);
        fs.writeFile('./src/.vuepress/public/data/leetCode.json', jsonData, (err) => {
            if (err) {
                console.error('LeetCode保存JSON文件时出错：', err);
            } else {
                console.log('LeetCode提取的数据已保存成功。');
            }
        });
    } else {
        console.log("LeetCode未找到符合条件的对象");
    }
    // 读取本地JSON文件
    // fs.readFile('test1.json', 'utf8', (err, data) => {
    //     if (err) {
    //         console.error('读取文件时发生错误:', err);
    //         return;
    //     }
    //     try {

    //     } catch (err) {
    //         console.error('解析JSON时发生错误:', err);
    //     }
    // });
}
run();
