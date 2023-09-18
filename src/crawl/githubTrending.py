# -*- coding: utf-8 -*-
import requests
import json
from datetime import datetime
from bs4 import BeautifulSoup
import time
import re

websiteDesc='githubTrending'
headers = {
    'Cookie': '__51vcke__JE7Z5d3HJavxuk1B=4473940b-0044-5073-9e5c-d7a7b1cc897c; __51vuft__JE7Z5d3HJavxuk1B=1686366558310; __51uvsct__JE7Z5d3HJavxuk1B=3; __51vcke__3F2LJ5KVIPove8YV=fe88d030-e814-5dec-a3e1-39ca0fffe6bd; __51vuft__3F2LJ5KVIPove8YV=1687786304381; __vtins__3F2LJ5KVIPove8YV=%7B%22sid%22%3A%20%22c3ea8f2a-9888-5b54-a7ae-f6c971aab8a1%22%2C%20%22vd%22%3A%201%2C%20%22stt%22%3A%200%2C%20%22dr%22%3A%200%2C%20%22expires%22%3A%201688970464783%2C%20%22ct%22%3A%201688968664783%7D; __51uvsct__3F2LJ5KVIPove8YV=6',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
}

def extract_data_from_githubTrending(url):
    
    extracted_data = []
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()  # 检查请求是否成功
        print('githubTrending', response)
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, 'html.parser')
            # with open('./soup.html', 'w', encoding='utf-8') as f:
            #     f.write(soup.prettify())
            box_div = soup.find_all('article', class_='Box-row')
            box_div_str = ""
            for div in box_div:
                box_div_str += div.prettify()
            # with open('./box_div.html', 'w', encoding='utf-8') as f:
            #     f.write(box_div_str)
            box_tmp_div=BeautifulSoup(box_div_str, 'html.parser')    
            if box_tmp_div:
                for item in box_tmp_div.find_all('article'):
                    href,title=None,None
                    a_element = item.find('p', class_='col-9 color-fg-muted my-1 pr-4')
                    desc = a_element.text.strip()
                    href_element_parent = item.find('h2', class_='h3 lh-condensed')
                    if href_element_parent:
                        href_element_son= href_element_parent.find('a', class_='Link')
                        href = 'https://github.com'+href_element_son['href']
                        title=href.split("/")[-1] 
                    # print("href",href)
                    img_element_parent = item.find('div', class_='f6 color-fg-muted mt-2')
                    if img_element_parent:
                        img_element_son= img_element_parent.find('span', class_='d-inline-block mr-3').find('a', class_='d-inline-block').find('img', class_='avatar mb-1 avatar-user')
                        img=img_element_son['src']
                    # 获取当前时间
                    current_time = datetime.now()
                    # 获取当前时间的时间戳（以毫秒为单位）
                    timestamp = current_time.timestamp() * 1000  # 转换为毫秒
                    # 格式化当前时间为指定格式
                    formatted_time = current_time.strftime("%Y-%m-%d %H:%M:%S")
                    extracted_data.append({
                        "time": formatted_time,
                        "timestamp": int(timestamp),
                        "title": desc,
                        "desc": desc,
                        "image": img,
                        "url": href,
                        "website": "githubTrending"
                    })
        else:
            print(f'{websiteDesc}请求失败')
    except requests.exceptions.RequestException as e:
        print(f'{websiteDesc}请求异常:', e)
    except Exception as e:
        print(f'{websiteDesc}发生异常:', e)
    
    return extracted_data


url = 'https://github.com/trending?spoken_language_code=zh'
extracted_data = extract_data_from_githubTrending(url)
sorted_data = sorted(extracted_data, key=lambda x: -x['timestamp'])
json_data = json.dumps(sorted_data, ensure_ascii=False, indent=4)
with open('./src/public/data/githubTrending.json', 'w', encoding='utf-8') as file:
    file.write(json_data)

print(f'{websiteDesc}数据导出成功')
