import requests
import json
import datetime
import time
# 发起 GET 请求
headers = { 'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.111 Safari/537.36' }
# url1= 'https://api.juejin.cn/user_api/v1/author/recommend?aid=2608&uuid=7233584988409611833&spider=0&category_id=&cursor=0&limit=20'
# url2='https://www.runoob.com/try/ajax/json_demo.json' 
url='https://www.infzm.com/hot_contents?format=json'
response = requests.get(url, headers=headers)
print('response',response)
if response.status_code == 200:
    # 解析响应数据
    data = response.json()
    # 导出为 JSON 文件
    handleData=[]
    for item in data['data']['hot_contents']:
        # 将字符串转换为datetime对象
        date_string = item['publish_time']
        datetime_obj = datetime.datetime.strptime(date_string, '%Y-%m-%d %H:%M:%S')
        # 将datetime对象转换为时间戳
        timestamp = int(datetime_obj.timestamp())*1000
        img='' 
        if len(item['covers']) == 0 :
            img='' 
        else: 
            img=item['covers'][0]['file_path']
        person = {'time':item['publish_time'],'timestamp':timestamp,'title': item['subject'],'desc':item['introtext'],'image':img,'url':item['id'],'website':'infzm'}
        handleData.append(person)
    print('handleData',handleData)
    handleData.sort(key=lambda x: x['timestamp'],reverse=True)
    with open('./src/.vuepress/public/data/news.json', 'w', encoding='utf-8') as file:
        json.dump(data, file, ensure_ascii=False, indent=4)
        # json.dump(data, file)
        print('源头数据导出成功')
    with open('./src/.vuepress/public/data/newsHandle.json', 'w', encoding='utf-8') as file:
        json.dump(handleData, file, ensure_ascii=False, indent=4)
        # json.dump(data, file)
        print('分析数据导出成功')
else:
    print('请求失败')
