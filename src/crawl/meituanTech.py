import requests
import json
from datetime import datetime
import re
from bs4 import BeautifulSoup
import pytz
import base64
# 发起 get 请求
url = 'https://tech.meituan.com/'
headers = {
    'Cookie':'_ga=GA1.2.76386796.1560325128; V2EX_REFERRER="2|1:0|10:1688803282|13:V2EX_REFERRER|12:aWxvdmV5b3U=|bc1qltcqakz08kyx2htzkzx0f7xzp63vkq6r23d0sga26998c88b2c76b6cd6e16"; PB3_SESSION="2|1:0|10:1688803282|11:PB3_SESSION|36:djJleDoxLjE2Mi45Mi4yNDY6MzczNDk2NDY=|84532bc1qltcqakz08kyx2htzkzx0f7xzp63vkq6r23d0sg3f4fa7d41dd1b7890"; _gid=GA1.2.1868043241.1688910338; V2EX_LANG=zhcn; A2="2|1:0|10:1688975957|2:A2|48:OWJkNGM5YTTrEPCPrqR3YziyHVBJnibzUcQvxyeVaz7lMmFk|ea2f32bc1qltcqakz08kyx2htzkzx0f7xzp63vkq6r23d0sg549f91a6b1294ef1"; V2EX_TAB="2|1:0|10:1688975962|8:V2EX_TAB|8:dGVjaA==|dabc1qltcqakz08kyx2htzkzx0f7xzp63vkq6r23d0sge3f94c8a23062b1bcab6"',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
    'Accept-Encoding': 'utf-8' 
}
try:
    response = requests.get(url, headers=headers)
    response.encoding = 'utf-8'
    response.raise_for_status()  # 检查请求是否成功
    print('meituan', response)
    extracted_data = []
    if response.status_code == 200:
        # 解析响应数据
        data = response.text
        # 解析HTML
        soup = BeautifulSoup(data, 'html.parser')
        box_div = soup.find('div', id='J_main-container')
        # with open('./soup.html', 'w', encoding='utf-8') as f:
        #     f.write(soup.prettify())
        # with open('./box_div.html', 'w', encoding='utf-8') as f:
        #     f.write(box_div.prettify())
        if box_div:
            for article in box_div.find_all('div',class_="row post-container-wrapper"):
                title = article.find('h2', class_='post-title').get_text().strip()
                hrefFather=article.find('h2', class_='post-title').find('a')
                href = hrefFather['href']
                desc=article.find('div', class_='post-content post-expect').get_text().strip()
                desc = desc.replace('\n阅读全文', '')
                time=article.find('div', class_='meta-box').find('span', class_='m-post-date').get_text().strip()
                # 使用datetime.strptime将日期字符串解析为datetime对象
                date_obj = datetime.strptime(time, "%Y年%m月%d日")
                # 使用timestamp()方法将datetime对象转换为时间戳
                timestamp = int(date_obj.timestamp() * 1000)
                extracted_data.append({
                    'url': href,
                    'desc': desc,
                    'time': time,
                    'timestamp': timestamp,
                    'image': '',
                    'website': 'meituan',
                    'title': title,
                })
        # 转化为JSON格式
        json_data = json.dumps(extracted_data, ensure_ascii=False, indent=4)
        # 保存为JSON文件
        with open('./src/public/data/techForum/meituanTech.json', 'w', encoding='utf-8') as file:
            file.write(json_data)
            print('美图技术分析数据导出成功')
    else:
        print('美图技术请求失败')
except requests.exceptions.RequestException as e:
    print('美图技术请求异常:', e)
except Exception as e:
    print('美图技术发生异常:', e)
