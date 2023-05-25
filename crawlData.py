import requests
import json

# 发起 GET 请求
headers = { 'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.111 Safari/537.36' }
# url1= 'https://api.juejin.cn/user_api/v1/author/recommend?aid=2608&uuid=7233584988409611833&spider=0&category_id=&cursor=0&limit=20'
# url2='https://www.runoob.com/try/ajax/json_demo.json' 
url='https://movie.douban.com/j/search_subjects?type=movie&tag=%E7%83%AD%E9%97%A8&page_limit=50&page_start=0'
response = requests.get(url, headers=headers)
print('response',response)
if response.status_code == 200:
    # 解析响应数据
    data = response.json()
    # 导出为 JSON 文件
    with open('./src/.vuepress/public/data/movie.json', 'w', encoding='utf-8') as file:
        json.dump(data, file, ensure_ascii=False, indent=4)
        # json.dump(data, file)
        print('数据导出成功')
else:
    print('请求失败')
