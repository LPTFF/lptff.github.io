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
    'Cookie': '_ga=GA1.2.76386796.1560325128; V2EX_REFERRER="2|1:0|10:1688803282|13:V2EX_REFERRER|12:aWxvdmV5b3U=|bc1qltcqakz08kyx2htzkzx0f7xzp63vkq6r23d0sga26998c88b2c76b6cd6e16"; PB3_SESSION="2|1:0|10:1688803282|11:PB3_SESSION|36:djJleDoxLjE2Mi45Mi4yNDY6MzczNDk2NDY=|84532bc1qltcqakz08kyx2htzkzx0f7xzp63vkq6r23d0sg3f4fa7d41dd1b7890"; _gid=GA1.2.1868043241.1688910338; V2EX_LANG=zhcn; A2="2|1:0|10:1688975957|2:A2|48:OWJkNGM5YTTrEPCPrqR3YziyHVBJnibzUcQvxyeVaz7lMmFk|ea2f32bc1qltcqakz08kyx2htzkzx0f7xzp63vkq6r23d0sg549f91a6b1294ef1"; V2EX_TAB="2|1:0|10:1688975962|8:V2EX_TAB|8:dGVjaA==|dabc1qltcqakz08kyx2htzkzx0f7xzp63vkq6r23d0sge3f94c8a23062b1bcab6"',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
    'Accept-Encoding': 'utf-8'
}
webSiteName = '天天线报网'
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
        # 找到第一个 <div class="filter-sift"> 元素
        filter_sift_div = soup.find('div', class_='filter-sift')
        # 找到该 div 元素前面的所有 <article> 元素
        box_div = filter_sift_div.find_all_previous('article')
        # 反转列表，因为find_all_previous返回的是从最后一个匹配元素到第一个匹配元素的顺序
        box_div.reverse()
        for article in box_div:
            # print('tmpArticle',tmpArticle)
            # print(article.prettify())
            title = article.find('a')['title'].strip()
            href = 'http://www.daydayzhuan.com' + article.find('a')['href']
            beijing_tz = pytz.timezone('Asia/Shanghai')
            todayNowDt = datetime.now(beijing_tz).strftime('%Y-%m-%d %H:%M:%S')
            todayNowTimestamp = int(datetime.now(
                beijing_tz).timestamp() * 1000)
            extracted_data.append({
                'link': href,
                'title': title,
                'img_src': '',
                'time': todayNowDt,
                'timestamp': todayNowTimestamp,
                'website': 'daydayzhuan',
                'isTop': '1',
            })
        # 转化为JSON格式
        json_data = json.dumps(extracted_data, ensure_ascii=False, indent=4)
        # 保存为JSON文件
        with open('./src/public/data/welfare/daydayzhuanTop.json', 'w', encoding='utf-8') as file:
            file.write(json_data)
            print(f'{webSiteName}分析数据导出成功')
    else:
        print(f'{webSiteName}请求失败001')
except requests.exceptions.RequestException as e:
    print(f'{webSiteName}请求异常002:', e)
except Exception as e:
    print(f'{webSiteName}发生异常003:', e)
