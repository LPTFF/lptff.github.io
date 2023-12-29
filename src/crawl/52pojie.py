import requests
import json
from datetime import datetime
import re
from bs4 import BeautifulSoup, NavigableString, Tag
import pytz
import base64
# 发起 get 请求
url = 'https://www.52pojie.cn/forum-65-1.html'
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
}
webSiteName='吾爱破解'
try:
    response = requests.get(url, headers=headers)
    response.encoding = 'gbk'
    response.raise_for_status()  # 检查请求是否成功
    print(f'{webSiteName}', response)
    extracted_data = []
    if response.status_code == 200:
        # 解析响应数据
        data = response.text
        # 解析HTML
        soup = BeautifulSoup(data, 'html.parser')
        box_div = soup.find('table', id='threadlisttableid')
        # with open('./soup.html', 'w', encoding='utf-8') as f:
        #     f.write(soup.prettify())
        # with open('./box_div.html', 'w', encoding='utf-8') as f:
        #     f.write(box_div.prettify())
        if box_div:
            separator = box_div.find('tbody', id='separatorline')
            for sibling in separator.next_siblings:
                if isinstance(sibling, Tag) and sibling.name == 'tbody':
                    if sibling.find('th',class_="new"):
                        article = sibling.find('th',class_="new")
                        title = article.find('a',class_="s xst").get_text().strip()
                        href = 'https://www.52pojie.cn/' + article.find('a',class_="s xst")['href']
                        time_origin=article.find('p',class_="res-ti").get_text().strip()
                        separator_index = time_origin.find('•')
                        date_time=''
                        if separator_index != -1:
                            date_time = time_origin[separator_index + 1:]
                        # print('title',title)
                        # print('href',href)
                        # print('date_time',date_time)
                        # 创建北京时区对象
                        beijing_tz = pytz.timezone('Asia/Shanghai')
                        # # 获取当前日期
                        # today = datetime.now(beijing_tz).strftime('%Y-%m-%d')
                        # 假设time_desc是您要处理的时间字符串
                        time_desc = str(date_time)
                        # 创建带有北京时区信息的日期时间对象
                        dt = beijing_tz.localize(datetime.strptime(f'{time_desc}:00', '%Y-%m-%d %H:%M:%S'))
                        # 转换为时间戳（毫秒）
                        timestamp = int(dt.timestamp() * 1000)
                        # print('timestamp',timestamp)
                        extracted_data.append({
                            "time": str(dt),
                            "timestamp": timestamp,
                            "title": title,
                            "desc": title,
                            "image": '',
                            "url": href,
                            "website": "52pojie"
                        })
        # 转化为JSON格式
        extracted_data.sort(key=lambda x: x['timestamp'],reverse=True)
        json_data = json.dumps(extracted_data, ensure_ascii=False, indent=4)
        # 保存为JSON文件
        with open('./src/public/data/52pojie.json', 'w', encoding='utf-8') as file:
            file.write(json_data)
            print(f'{webSiteName}分析数据导出成功')
    else:
        print(f'{webSiteName}请求失败001')
except requests.exceptions.RequestException as e:
    print(f'{webSiteName}请求异常002:', e)
except Exception as e:
    print(f'{webSiteName}发生异常003:', e)
