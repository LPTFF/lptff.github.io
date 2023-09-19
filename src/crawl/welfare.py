# -*- coding: utf-8 -*-
import requests
import json
from datetime import datetime
from bs4 import BeautifulSoup
import time
import pytz

headers = {
    'Cookie': '__51vcke__JE7Z5d3HJavxuk1B=4473940b-0044-5073-9e5c-d7a7b1cc897c; __51vuft__JE7Z5d3HJavxuk1B=1686366558310; __51uvsct__JE7Z5d3HJavxuk1B=3; __51vcke__3F2LJ5KVIPove8YV=fe88d030-e814-5dec-a3e1-39ca0fffe6bd; __51vuft__3F2LJ5KVIPove8YV=1687786304381; __vtins__3F2LJ5KVIPove8YV=%7B%22sid%22%3A%20%22c3ea8f2a-9888-5b54-a7ae-f6c971aab8a1%22%2C%20%22vd%22%3A%201%2C%20%22stt%22%3A%200%2C%20%22dr%22%3A%200%2C%20%22expires%22%3A%201688970464783%2C%20%22ct%22%3A%201688968664783%7D; __51uvsct__3F2LJ5KVIPove8YV=6',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
}

def extract_data_from_hxm5(url):
    extracted_data = []
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()  # 检查请求是否成功
        print('线报引擎', response)
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, 'html.parser')
            box_div = soup.find('ul', class_='rk_ulist')
            if box_div:
                for li in box_div.find_all('li'):
                    a_element = li.find('a', class_='title_name')
                    if a_element:
                        link = 'https://www.hxm5.com' + a_element['href']
                        title = a_element['title']
                        
                        img_element = li.find('img', class_='lazyli user_head')
                        img_src = 'https:' + img_element['data-original'] if img_element else ''
                        
                        span_element = li.find('span', id='rktime')
                        if span_element:
                            data_value = span_element.get('data')
                            timestamp = int(data_value) * 1000
                            time = span_element.text.strip()
                        else:
                            timestamp = None
                            time = None
                        
                        extracted_data.append({
                            'link': link,
                            'title': title,
                            'img_src': img_src,
                            'time': time,
                            'timestamp': timestamp,
                            'website': 'hxm5'
                        })
        else:
            print('线报引擎请求失败')
    except requests.exceptions.RequestException as e:
        print('线报引擎请求异常:', e)
    except Exception as e:
        print('线报引擎发生异常:', e)
    
    return extracted_data

def extract_data_from_mutouxb(url):
    extracted_data = []
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()  # 检查请求是否成功
        print('86收线报', response)
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, 'html.parser')
            box_div = soup.find('main', class_='site-main', id='main')
            if box_div:
                for article in box_div.find_all('article'):
                    header = article.find('header')
                    entry_meta = article.find('div', class_='entry-meta')
                    a_element = header.find('a', class_='u-url url')
                    if a_element:
                        href = a_element['href']
                        text = a_element.text.strip()                 
                        time_element = entry_meta.find('time', class_='entry-date published dt-published')
                        if time_element:
                            datetime_str = time_element['datetime']
                            timestamp, formatted_time_str = format_datetime(datetime_str)
                        else:
                            timestamp = None
                            formatted_time_str = None

                        extracted_data.append({
                            'link': href,
                            'title': text,
                            'img_src': '',
                            'timestamp': timestamp,
                            'time': formatted_time_str,
                            'website': 'mutouxb'
                        })
        else:
            print('86收线报请求失败')
    except requests.exceptions.RequestException as e:
        print('86收线报请求异常:', e)
    except Exception as e:
        print('86收线报发生异常:', e)
    return extracted_data

def extract_data_from_yqhd8(url):
    extracted_data = []
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()  # 检查请求是否成功
        print('实时线报', response)
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, 'html.parser')
            box_div = soup.find('div', class_='li-t')
            # with open('./soup.html', 'w', encoding='utf-8') as f:
            #     f.write(soup.prettify())
            # with open('./box_div.html', 'w', encoding='utf-8') as f:
            #     f.write(box_div.prettify())
            if box_div:
                for article in box_div.find_all('li'):
                    a_element = article.find('a', class_='top-five copy')
                    if a_element:
                        href = 'https://www.yqhd8.com'+a_element['href']
                        title = a_element.find('p', class_='today-tittle').get_text().strip()
                        # # 创建北京时区对象
                        # beijing_tz = pytz.timezone('Asia/Shanghai')
                        # time_desc = str(a_element.find('p', class_='today-time').get_text().strip())
                        # # 获取当前日期
                        # today = datetime.now(beijing_tz).strftime('%Y-%m-%d')
                        # time_desc = str(a_element.find('p', class_='today-time').get_text().strip())
                        # today = datetime.today().strftime('%Y-%m-%d')
                        # dt = datetime.strptime(f'{today} {time_desc}:00', '%Y-%m-%d %H:%M:%S')
                        # # print("dt",dt)
                        # timestamp = int(dt.timestamp()*1000)
                        # print("timestamp",timestamp)
                        # 创建北京时区对象
                        beijing_tz = pytz.timezone('Asia/Shanghai')
                        # 获取当前日期
                        today = datetime.now(beijing_tz).strftime('%Y-%m-%d')
                        # 假设time_desc是您要处理的时间字符串
                        time_desc = str(a_element.find('p', class_='today-time').get_text().strip())
                        # 创建带有北京时区信息的日期时间对象
                        dt = beijing_tz.localize(datetime.strptime(f'{today} {time_desc}:00', '%Y-%m-%d %H:%M:%S'))
                        # 转换为时间戳（毫秒）
                        timestamp = int(dt.timestamp() * 1000)
                        extracted_data.append({
                            'link': href,
                            'title': title,
                            'img_src': '',
                            'timestamp':timestamp,
                            'time': str(dt),
                            'website': 'yqhd8',
                            'time_desc':time_desc
                        })
        else:
            print('实时线报状态请求异常')
    except requests.exceptions.RequestException as e:
        print('实时线报请求报错:', e)
    except Exception as e:
        print('实时线报报错:', e)
    return extracted_data


def format_datetime(datetime_str):
    datetime_obj = datetime.strptime(datetime_str, '%Y-%m-%dT%H:%M:%S%z')
    timestamp_ms = int(datetime_obj.timestamp() * 1000)
    formatted_time_str = datetime_obj.strftime('%Y-%m-%d %H:%M:%S')
    return timestamp_ms, formatted_time_str


url1 = 'https://www.hxm5.com/'
extracted_data1 = extract_data_from_hxm5(url1)
url2 = 'http://www.mutouxb.com/'
extracted_data2 = extract_data_from_mutouxb(url2)
url3 = 'https://www.yqhd8.com/xb'
extracted_data3 = extract_data_from_yqhd8(url3)
extracted_data = extracted_data1 + extracted_data2+extracted_data3
remove_duplicates_data = {}
exist_item=None
for item in extracted_data:
    title = item['title']
    if title not in remove_duplicates_data:
        remove_duplicates_data[title] = item
    else:
        exist_item = remove_duplicates_data[title]
        if item['website'] == 'hxm5':
            remove_duplicates_data[title] = item 
        elif item['website'] == 'mutouxb' and exist_item['website'] == 'yqhd8':
            remove_duplicates_data[title] = item
removed_data = list(remove_duplicates_data.values())
sorted_data = sorted(removed_data, key=lambda x: -x['timestamp'])
json_data = json.dumps(sorted_data, ensure_ascii=False, indent=4)
with open('./src/public/data/welfare.json', 'w', encoding='utf-8') as file:
    file.write(json_data)

print('羊毛分析数据导出成功')
