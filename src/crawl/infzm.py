import requests
import json
import datetime
import time
# 发起 GET 请求
url='https://www.infzm.com/hot_contents?format=json'
headers = {
    'Cookie': 'UM_distinctid=188acaeced772d-0ee7a2a58afdd2-26031d51-1fa400-188acaeced8f68; machine_id=4cebaf2621c68f500f9713ac495334a1; acw_tc=2f6a1faa16889747912638417e4ea062cd24c30ae1cd9bb08920692d08623b; CNZZDATA1277810324=1219089927-1686523598-https%253A%252F%252Flptff.github.io%252F%7C1688973170; passport_u=1688974855_4308849_7aaa8886002a8dfd36384a09a05678d5; __ACCOUNT__={%22id%22:4308849%2C%22old_uid%22:null%2C%22username%22:%22%E5%A4%A9%E4%B8%80%22%2C%22phone%22:%2218956974566%22%2C%22email%22:%221688974826_wechato5sg9uN9Ei_QuAwnnAi5q19FRBGo@infzm.com%22%2C%22created_at%22:%222023-07-10%2015:40:26%22%2C%22updated_at%22:%222023-07-10%2015:40:51%22%2C%22loginname%22:%2218956974566%22%2C%22from%22:%22api%22%2C%22regip%22:%22%22%2C%22regdate%22:1688974826%2C%22phone_prefix%22:%2286%22%2C%22avatar_url%22:%22http://avatar.infzm.com/users/default.gif%22%2C%22regplatform%22:%22web%22%2C%22snsplatform%22:%22wechat%22%2C%22avatar%22:%22http://avatar.infzm.com/users/default.gif%22%2C%22member_type%22:2%2C%22expire_time%22:null}; XSRF-TOKEN=eyJpdiI6IkZKMmNjdHZnblFxcDdHKzFQR1J6aGc9PSIsInZhbHVlIjoic1ZRQ3FkeVVrTjVuSVZObGxqSHpmQXBCMTVsT2tVbVhnbEtsZFZyMXJ6a09JcTFjclwvMHNVMlMwNnQrNmpoOFgiLCJtYWMiOiI0MzZkZDE0Y2RkOGEwNjZjMzU5NzcyZTcxYjliYWIyNDMyMjAyYzY3NWU4NDIzMjc2NzI5MTc2ODZhYjRhYWE3In0%3D; passport_session=eyJpdiI6IlFjbTYzaUF3YkxTa0FFcjliOGttRGc9PSIsInZhbHVlIjoibzJzVVNJUjJrbm8xM1A2cGF0SmpLRktHUVF0QzhUVlk3SlkzcVNMT0d4UWtcLzRMTllOa2NNbG5oVWN4N2x5VzUiLCJtYWMiOiJkMmExODIwZGFlMTUzZjI1YTQ0ZTRjYmY0OWQxODMwNzM0ZDdhNjk5NmIxYTE0NzA3MjJjYzY4NTdiYjA1ZGM0In0%3D',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
}
response = requests.get(url, headers=headers)
print('南方周末response',response)
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
    handleData.sort(key=lambda x: x['timestamp'],reverse=True)
    with open('./src/public/data/infzm.json', 'w', encoding='utf-8') as file:
        json.dump(handleData, file, ensure_ascii=False, indent=4)
        # json.dump(data, file)
        print('南方周末过滤数据导出成功')
else:
    print('南方周末请求失败')