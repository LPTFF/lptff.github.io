import requests
import json
from datetime import datetime
import re
from bs4 import BeautifulSoup
import pytz
import base64
# 发起 get 请求
url = 'https://www.daydayzhuan.com/yangmao'
headers = {
    'Cookie':'_ga=GA1.2.76386796.1560325128; V2EX_REFERRER="2|1:0|10:1688803282|13:V2EX_REFERRER|12:aWxvdmV5b3U=|bc1qltcqakz08kyx2htzkzx0f7xzp63vkq6r23d0sga26998c88b2c76b6cd6e16"; PB3_SESSION="2|1:0|10:1688803282|11:PB3_SESSION|36:djJleDoxLjE2Mi45Mi4yNDY6MzczNDk2NDY=|84532bc1qltcqakz08kyx2htzkzx0f7xzp63vkq6r23d0sg3f4fa7d41dd1b7890"; _gid=GA1.2.1868043241.1688910338; V2EX_LANG=zhcn; A2="2|1:0|10:1688975957|2:A2|48:OWJkNGM5YTTrEPCPrqR3YziyHVBJnibzUcQvxyeVaz7lMmFk|ea2f32bc1qltcqakz08kyx2htzkzx0f7xzp63vkq6r23d0sg549f91a6b1294ef1"; V2EX_TAB="2|1:0|10:1688975962|8:V2EX_TAB|8:dGVjaA==|dabc1qltcqakz08kyx2htzkzx0f7xzp63vkq6r23d0sge3f94c8a23062b1bcab6"',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
    'Accept-Encoding': 'utf-8' 
}
webSiteName='天天线报网'
try:
    response = requests.get(url, headers=headers)
    response.encoding = 'utf-8'
    response.raise_for_status()  # 检查请求是否成功
    print(f'{webSiteName}', response)
    extracted_data = []
    if response.status_code == 200:
        # 解析响应数据
        data = response.text
        # 解析HTML
        soup = BeautifulSoup(data, 'html.parser')
        box_div = soup.find('div', class_='layui-card-body')
        with open('./soup.html', 'w', encoding='utf-8') as f:
            f.write(soup.prettify())
        with open('./box_div.html', 'w', encoding='utf-8') as f:
            f.write(box_div.prettify())
        if box_div:
            for article in box_div.find_all('article',class_="layui-row title-li"):
                if article.find('time', class_='date today'):
                    title = article.find('span').get_text().strip()
                    href = 'http://www.daydayzhuan.com' + article.find('a')['href']
                    time_origin = article.find('time').get_text().strip()
                    beijing_tz = pytz.timezone('Asia/Shanghai')
                    # 获取当前时间和当日凌晨的时间戳
                    todayStartDt = datetime.now(beijing_tz).replace(hour=0, minute=0, second=0, microsecond=0)
                    todayStartTimestamp = int(todayStartDt.timestamp() * 1000)
                    todayNowDt = datetime.now(beijing_tz)
                    todayNowTimestamp = int(todayNowDt.timestamp() * 1000)
                    # 转化资讯时间
                    match = re.search(r'\d+', time_origin)
                    infoTimestamp = todayNowTimestamp - int(match.group()) * 3600 * 1000
                    infoDate = datetime.fromtimestamp(infoTimestamp / 1000, beijing_tz).strftime('%Y-%m-%d %H:%M:%S')
                    if todayStartTimestamp<infoTimestamp:
                        # 过滤零点时间
                        extracted_data.append({
                            'link': href,
                            'title': title,
                            'img_src': '',
                            'time': infoDate,
                            'timestamp': infoTimestamp,
                            'website': 'daydayzhuan',
                            'isTop': '0',
                        })
        # 转化为JSON格式
        json_data = json.dumps(extracted_data, ensure_ascii=False, indent=4)
        # 保存为JSON文件
        with open('./src/public/data/welfare/daydayzhuan.json', 'w', encoding='utf-8') as file:
            file.write(json_data)
            print(f'{webSiteName}分析数据导出成功')
    else:
        print(f'{webSiteName}请求失败001')
except requests.exceptions.RequestException as e:
    print(f'{webSiteName}请求异常002:', e)
except Exception as e:
    print(f'{webSiteName}发生异常003:', e)
