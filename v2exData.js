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
//处理数据第一次过滤方法
function extractTextAndHref(data) {
    let result = [];
    if (typeof data === "object" && data !== null) {
        if ("text" in data) {
            result.push({ text: data["text"] });
        }
        if ("href" in data) {
            result.push({ href: data["href"] });
        }
        if ("imgSrc" in data) {
            result.push({ imgSrc: data["imgSrc"] });
        }
        if ("span" in data) {
            result.push({ span: data["span"] });
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
async function run() {

    const url = "https://www.v2ex.com/";
    const keyDom = ['#TopicsHot']//根据页面id获取内容
    const liData = (await crawlPage(url, keyDom))[0][0]
    // 第一次过滤
    const filterFirst = []
    for (let index = 0; index < liData.children.length; index++) {
        const element = extractTextAndHref(liData.children[index]);
        filterFirst.push(element)
    }
    filterFirst.shift();
    console.log('第一次过滤', filterFirst.length);
    const filterSecond = []
    for (let index = 0; index < filterFirst.length; index++) {
        console.log('第二次过滤', index);
        //v2ex网站需要先获取第一个列表页面的url
        const length = filterFirst[index].length
        const href = filterFirst[index][length - 1].href
        console.log('第二次过滤href', href);
        const keyDomSecond = ['.header', '.topic_content']//根据页面class类选择器获取内容
        const secondPageData = (await crawlPage(href, keyDomSecond));
        // 第三次过滤
        const filterThird = []
        if (secondPageData[0][0] && secondPageData[0][0].children) {
            for (let index = 0; index < secondPageData[0][0].children.length; index++) {
                const element = extractTextAndHref(secondPageData[0][0].children[index]);
                filterThird.push(element)
            }
        } else {
            continue
        }
        const filterThirdExternal = []
        if (secondPageData[1][0] && secondPageData[1][0].children) {
            for (let index = 0; index < secondPageData[1][0].children.length; index++) {
                const element = extractTextAndHref(secondPageData[1][0].children[index]);
                filterThirdExternal.push(element)
            }
        } else {
            continue
        }
        //获取time、timestamp、title、desc、image字段
        const title = filterThird[filterThird.length - 3][0].text[0];
        const image = filterThird[0][filterThird[0].length - 1].imgSrc;
        const timeOrigin = filterThird[filterThird.length - 1][filterThird[filterThird.length - 1].length - 1].span;
        const timeShow = timeOrigin.slice(0, 19);
        const timestamp = Date.parse(timeOrigin);
        const desc = secondPageData[1][0].children ? filterThirdExternal[0][0].text[0] : secondPageData[1][0].text[0];
        filterSecond.push({ url: href, desc: desc, time: timeShow, timestamp: timestamp, image: image, website: 'v2ex', title: title })

    }
    console.log('filterSecond', filterSecond);
    if (filterSecond.length > 0) {
        const jsonData = JSON.stringify(filterSecond, null, 2);
        fs.writeFile('./src/.vuepress/public/data/v2ex.json', jsonData, (err) => {
            if (err) {
                console.error('保存JSON文件时出错：', err);
            } else {
                console.log('提取的数据已保存成功。');
            }
        });
    }
}

run();
