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
        if ("text" in data && data["text"].length == 1 && !data["text"][0].includes("margin") && !(/^[0-9]+$/.test(data["text"][0]))) {
            result.push({ text: data["text"] });
        }
        if ("href" in data && data["href"].includes("https://juejin.cn/post")) {
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
async function run() {

    const url = "https://juejin.cn/frontend/JavaScript";
    const keyDom = ['li[data-growing-container]']
    const liData = (await crawlPage(url, keyDom))[0]
    console.log('第一次请求列表页面');
    // 第一次过滤
    const filterFirst = []
    for (let index = 0; index < liData.length; index++) {
        const element = extractTextAndHref(liData[index]);
        filterFirst.push(element)
    }
    // 第二次过滤
    const filterSecond = []
    for (let index = 0; index < filterFirst.length; index++) {
        console.log('第二次过滤', index);
        //掘金网站需要先获取第一个列表页面的url和desc
        let hrefLastIndex = '';
        for (let i = filterFirst[index].length - 1; i >= 0; i--) {
            if (filterFirst[index][i].hasOwnProperty('href')) {
                hrefLastIndex = i;
                break;
            }
        }
        let urlWeb = filterFirst[index][hrefLastIndex].href;
        let descWeb = filterFirst[index][hrefLastIndex + 1].text[0];
        //获取time、timestamp、title、image字段
        const keyDomTitle = ['.article-title', '.author-info-block', '.article-hero']
        const secondPageTitle = await crawlPage(urlWeb, keyDomTitle);
        // console.log('secondPageTitle[0]', secondPageTitle[0]);
        // console.log('secondPageTitle[1]', secondPageTitle[1]);
        // console.log('secondPageTitle[2]', secondPageTitle[2]);
        const title = secondPageTitle[0][0].text[0];
        const timeOrigin = secondPageTitle[1][0].text[1];
        //转换为时间戳
        const datePattern = /(\d{4})年(\d{2})月(\d{2})日 (\d{2}):(\d{2})/;
        const [, year, month, day, hours, minutes] = datePattern.exec(timeOrigin);
        const date = new Date(year, parseInt(month) - 1, day, hours, minutes);// 构建日期对象
        const timestamp = date.getTime();
        const dateShow = new Date(timestamp);
        const yearShow = dateShow.getFullYear();
        let monthShow = dateShow.getMonth() + 1; // 月份从 0 到 11
        monthShow > 9 ? monthShow = monthShow : monthShow = '0' + monthShow;
        let dayShow = dateShow.getDate();
        dayShow > 9 ? dayShow = dayShow : dayShow = '0' + dayShow;
        let hourShow = dateShow.getHours();
        hourShow > 9 ? hourShow = hourShow : hourShow = '0' + hourShow;
        let minuteShow = dateShow.getMinutes();
        minuteShow > 9 ? minuteShow = minuteShow : minuteShow = '0' + minuteShow;
        let secondShow = dateShow.getSeconds();
        secondShow > 9 ? secondShow = secondShow : secondShow = '0' + secondShow;
        const timeShow = `${yearShow}-${monthShow}-${dayShow} ${hourShow}:${minuteShow}:${secondShow}`;
        const image = secondPageTitle[2][0] ? secondPageTitle[2][0].imgSrc : '';
        filterSecond.push({ url: urlWeb, desc: descWeb, time: timeShow, timestamp: timestamp, image: image, website: 'juejin', title: title })
    }
    console.log('filterSecond', filterSecond);
    if (filterSecond.length > 0) {
        const jsonData = JSON.stringify(filterSecond, null, 2);
        fs.writeFile('./src/.vuepress/public/data/juejin.json', jsonData, (err) => {
            if (err) {
                console.error('保存JSON文件时出错：', err);
            } else {
                console.log('提取的数据已保存成功。');
            }
        });
    }
}

run();
