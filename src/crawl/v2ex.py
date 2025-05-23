import requests
import json
from datetime import datetime
import re
from bs4 import BeautifulSoup
import pytz
import base64
# 发起 get 请求
url = 'https://www.v2ex.com/'
headers = {
    'Cookie':'_ga=GA1.2.76386796.1560325128; V2EX_REFERRER="2|1:0|10:1688803282|13:V2EX_REFERRER|12:aWxvdmV5b3U=|be53695fd0925e76a68242e7d87d6590ad51464f0ba26998c88b2c76b6cd6e16"; PB3_SESSION="2|1:0|10:1688803282|11:PB3_SESSION|36:djJleDoxLjE2Mi45Mi4yNDY6MzczNDk2NDY=|8453216a399d986d703c128870bb69c522b5ec25c9201ca3f4fa7d41dd1b7890"; _gid=GA1.2.1868043241.1688910338; V2EX_LANG=zhcn; A2="2|1:0|10:1688975957|2:A2|48:OWJkNGM5YTUtNzM0MS00MmRhLWFhODgtYWNlZWRlYTJlMmFk|ea2f32107861922040ba3b154ce4d12f3519ec729cca79d4549f91a6b1294ef1"; V2EX_TAB="2|1:0|10:1688975962|8:V2EX_TAB|8:dGVjaA==|dabb7c4cfeb6eb936efa01271fecbc55b77d92bd64f2e3f94c8a23062b1bcab6"',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
}
try:
    response = requests.get(url, headers=headers)
    response.raise_for_status()  # 检查请求是否成功
    print('v2ex', response)
    if response.status_code == 200:
        # 解析响应数据
        data = response.text
        # 解析HTML
        soup = BeautifulSoup(data, 'html.parser')
        # 查找目标元素
        box_div = soup.find('div', class_='box', id='TopicsHot')
        # 提取子元素
        items = box_div.find_all('div', class_='cell')
        # 构造结果列表
        results = []
        for index, item in enumerate(items):
            # 控制调试循环
            if index >= 2000:
                break
            avatar_img = item.find('img', class_='avatar')
            avatar_src = avatar_img['src'] if avatar_img else None
            image_base64 = None  # 默认设为 None
            if avatar_src:
                response = requests.get(avatar_src)
                if response.status_code == 200:
                    image_content = response.content
                    image_base64 = base64.b64encode(image_content).decode('utf-8')
            topic_title_elem = item.find('span', class_='item_hot_topic_title')
            topic_title = topic_title_elem.text.strip() if topic_title_elem else None
            # 过滤空的 topic_title
            if not topic_title:
                continue
            topic_links = []
            link_list = item.find_all('a', href=True)
            if link_list:
                for link_elem in link_list:
                    topic_links.append(link_elem['href'])
            urlItem='https://www.v2ex.com'+topic_links[1]
            responseItem = requests.get(urlItem, headers=headers)
            responseItem.raise_for_status()  # 检查请求是否成功
            originTime = ""
            desc = ""
            if responseItem.status_code == 200:
                # 解析响应数据
                dataItem = responseItem.text
                soup = BeautifulSoup(dataItem, 'html.parser')
                # 查找目标元素
                markdown_body_div = soup.find('div', class_='markdown_body')
                topic_content_div = soup.find('div', class_='topic_content')
                if markdown_body_div :
                    # 提取内容
                    desc = markdown_body_div.get_text(strip=True)
                elif topic_content_div :
                    # 提取内容
                    desc = topic_content_div.get_text(strip=True)
                else:
                    print('未找到目标元素',urlItem,index)
                # 查找<small class="gray"></small>标签
                small_gray = soup.find('small', class_='gray')
                if small_gray:
                    # 查找内部的<span>标签
                    span_tag = small_gray.find('span')
                    if span_tag and 'title' in span_tag.attrs:
                        originTime = span_tag['title']
                else:
                    print('未找到<small class="gray"></small>标签',urlItem,index)
            else:
                print('v2ex item请求失败',urlItem,index)
            # 解析时间字符串为datetime对象
            datetime_obj = datetime.strptime(originTime, "%Y-%m-%d %H:%M:%S %z")
            # 转换为UTC时间
            datetime_utc = datetime_obj.astimezone(pytz.UTC)
            # 将UTC时间转换为时间戳（以毫秒为单位）
            timestamp = int(datetime_utc.timestamp()*1000)
            result = {
                'url': urlItem,
                'desc': desc,
                'time': originTime[:19],
                'timestamp': timestamp,
                'image': 'data:image/png;base64,'+image_base64,
                'website': 'v2ex',
                'title': topic_title,
            }
            results.append(result)
        # 转化为JSON格式
        json_data = json.dumps(results, ensure_ascii=False, indent=4)
        # 保存为JSON文件
        with open('./src/public/data/v2ex.json', 'w', encoding='utf-8') as file:
            file.write(json_data)
            print('v2ex分析数据导出成功')
    else:
        print('v2ex请求失败')
except requests.exceptions.RequestException as e:
    print('v2ex请求异常:', e)
except Exception as e:
    print('v2ex发生异常:', e)
