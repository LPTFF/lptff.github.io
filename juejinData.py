import requests
import json
import datetime
# 发起 post 请求
url = 'https://api.juejin.cn/recommend_api/v1/article/recommend_cate_feed?aid=2608&uuid=6898684445210232328&spider=0'
headers = {
    'Content-Type': 'application/json',
    'Cookie':'_ga=GA1.2.1946730532.1606225142; __tea_cookie_tokens_2608=%257B%2522web_id%2522%253A%25226898684445210232328%2522%252C%2522ssid%2522%253A%25220399d7f9-d16b-4e7d-9a66-6f264bb7a09d%2522%252C%2522user_unique_id%2522%253A%25226898684445210232328%2522%252C%2522timestamp%2522%253A1606225142293%257D; _tea_utm_cache_2608=undefined; csrf_session_id=a3ac3f9f7072e09865160632a164ff43; msToken=QqTM-PPRFuROVbWVcP6s-ERdZgtqx8S1Pa5ZXREYNi9ePpSLFtcxphYwpy9tkg1nHbqnJxkuuNF28c1DW8Sb6cytYC0T8kDLORb9aVr8ydRVas1nNRjFCnaVKIz6WJZT',
    'Origin':'https://juejin.cn',
    'Referer':'https://juejin.cn/',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
}
data_json = {
    'cate_id': "6809637767543259144",
    'cursor': "0",
    'id_type': 2,
    'limit': 20,
    'sort_type': 200
}

try:
    response = requests.post(url, headers=headers, json=data_json)
    response.raise_for_status()  # 检查请求是否成功
    print('掘金response', response)
    if response.status_code == 200:
        # 解析响应数据
        data = response.json()
        # print('data', data)
        dataList = data["data"]
        dataHandle = []
        for index, item in enumerate(dataList):
            #  "url": "https://juejin.cn/post/7243435843145678907",
            # "desc": "前言",
            # "time": "2023-06-12 09:24:00",
            # "timestamp": 1686533040000,
            # "image": "",
            # "website": "juejin",
            # "title": "纯前端导出多表头xlsx"
            if len(item) == 0:
                # 需要过滤
                continue
            else:
                tmpTime = int(item['article_info']['mtime'])
                date = datetime.datetime.fromtimestamp(tmpTime)
                formatted_date = date.strftime("%Y-%m-%d %H:%M:%S")
                newEntry = {
                    "url": 'https://juejin.cn/post/'+item['article_info']['article_id'],
                    "desc": item['article_info']['brief_content'],
                    "time": formatted_date,
                    "timestamp": int(item['article_info']['mtime']+ '000'),
                    "image": item['article_info']['cover_image'],
                    "title": item['article_info']['title'],
                    "website": "juejin"
                }
            dataHandle.append(newEntry)
        dataHandle.sort(key=lambda x: x['timestamp'],reverse=True)
        with open('./src/public/data/juejin.json', 'w', encoding='utf-8') as file:
            json.dump(dataHandle, file, ensure_ascii=False, indent=4)
            print('掘金分析数据导出成功')
    else:
        print('请求失败')
except requests.exceptions.RequestException as e:
    print('请求异常:', e)
except Exception as e:
    print('发生异常:', e)
