import requests
import json
import datetime
import time
# 发起 GET 请求
url='https://movie.douban.com/j/search_subjects?type=movie&tag=%E7%83%AD%E9%97%A8&page_limit=50&page_start=0'
headers = {
    'Cookie': 'gr_user_id=49befbe4-6db8-4b7a-8af7-188e6f9a2b37; douban-fav-remind=1; douban-profile-remind=1; _ga=GA1.2.1624945807.1557663726; __utmv=30149280.20914; _vwo_uuid_v2=D23B4E9722D2DAED4B53563307F963B61|554d18daecba03ead3a8196ba7844051; ll="118254"; bid=b7WKXCThmOk; viewed="35479545_35335514_33440205_5442971_35422209_35200649_35523099_1148282"; _pk_id.100001.4cf6=4d6baf98ba3fe65d.1686230904.; dbcl2="209148937:5bWXUzT8h/A"; push_doumail_num=0; push_noty_num=0; __utmz=30149280.1688784084.405.77.utmcsr=google|utmccn=(organic)|utmcmd=organic|utmctr=(not%20provided); __utmz=223695111.1688784084.373.97.utmcsr=google|utmccn=(organic)|utmcmd=organic|utmctr=(not%20provided); ck=QjhG; __utma=30149280.1624945807.1557663726.1688784084.1688973402.406; __utmb=30149280.0.10.1688973402; __utmc=30149280; __utma=223695111.708827224.1557663726.1688784084.1688973402.374; __utmb=223695111.0.10.1688973402; __utmc=223695111; _pk_ref.100001.4cf6=%5B%22%22%2C%22%22%2C1688973402%2C%22https%3A%2F%2Flove-tff.gitee.io%2F%22%5D; _pk_ses.100001.4cf6=1; ap_v=0,6.0',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
}
response = requests.get(url, headers=headers)
print('豆瓣response',response)
if response.status_code == 200:
    # 解析响应数据
    data = response.json()
    # 导出为 JSON 文件
    with open('./src/public/data/movie.json', 'w', encoding='utf-8') as file:
        json.dump(data, file, ensure_ascii=False, indent=4)
        print('豆瓣数据导出成功')
else:
    print('豆瓣请求失败')