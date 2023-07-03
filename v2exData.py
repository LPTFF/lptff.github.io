import requests
import json
from datetime import datetime
import re
from bs4 import BeautifulSoup
import pytz
# 发起 get 请求
url = 'https://www.v2ex.com/'
headers = {
    'Cookie':'_ga=GA1.2.76386796.1560325128; PB3_SESSION="2|1:0|10:1687756453|11:PB3_SESSION|36:djJleDozNy4xMjguMjQ2LjY0OjcyNjY3MDU2|2f77a26aa4f0eccaea6c5ca4034f6b0c376e7eb87bf76a0590acd4700eb4db32"; _gid=GA1.2.1994471857.1687756456; V2EX_LANG=zhcn; _gat=1',
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
                if markdown_body_div:
                    # 提取内容
                    desc = markdown_body_div.get_text(strip=True)
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
                'image': avatar_src,
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
