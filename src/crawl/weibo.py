import requests
import json
import datetime
import time
import urllib.parse
# 发起 GET 请求
url='https://weibo.com/ajax/side/hotSearch'
headers = {
    'Cookie':'SINAGLOBAL=3238169644400.8457.1557491943080; UOR=,,www.google.com; _s_tentry=passport.weibo.com; Apache=5332797249312.629.1689311836236; ULV=1689311836245:29:1:1:5332797249312.629.1689311836236:1663770116590; XSRF-TOKEN=f4thszCFwugbzWWrKQiSNqce; login_sid_t=955b0bd60e50c05cff69f31c955bccde; cross_origin_proto=SSL; wb_view_log=1920*10801; SCF=Avd9w65H14BjedL78YEjstYo2FqbdXqhkGpKuFaGMkCbEAef6u55NCs_JtvSIwepL3sYUW_1VXH6az-CPMVeuSM.; SUB=_2A25JtJVDDeRhGeBN71AY8ijIyDiIHXVqw4GLrDV8PUNbmtAbLUz6kW9NRHtGT1gseeOL1GzuT14i13JVPl6kBCoO; SUBP=0033WrSXqPxfM725Ws9jqgMF55529P9D9W5OzKRDuwVQLyzg8gnZUVjy5JpX5KzhUgL.Foq0Shz4eoqXe0B2dJLoIp7LxKML1KBLBKnLxKqL1hnLBoMce0BE1KzcSheX; ALF=1720850577; SSOLoginState=1689314579; WBPSESS=x5plewmnehsORp7c0yGIB5E8XyIYTvyCJIW7U5gf8lrT7pb0ipi9KJCI91PpePuyBGVB3mlzxFE2ZXzuRemA_-48J0ycrjCNIQGesAjNiq1a6NY1H77f7Zs131H4DPCt',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
}
try:
    response = requests.get(url, headers=headers)
    print('微博response',response)
    if response.status_code == 200:
        # 解析响应数据
        data = response.json()
        hotList=data['data']['realtime']
        handleList=[]
        for index, item in enumerate(hotList):
            if item.get('ad_type'):
                continue
            topic_title=item['note']
            urlItem='https://s.weibo.com/weibo?q='+ urllib.parse.quote(item['word_scheme'], safe='')
            timestamp=item.get('onboard_time','')
            dt = datetime.datetime.fromtimestamp(timestamp)
            originTime = dt.strftime("%Y-%m-%d %H:%M:%S")
            image={"small_icon_desc": item.get('small_icon_desc', ''), "small_icon_desc_color": item.get('small_icon_desc_color', '')}
            new_entry = {
                'url': urlItem,
                'desc': '',
                'time': originTime,
                'timestamp': timestamp*1000,
                'image': image,
                'website': 'weibo',
                'title': topic_title,
            }
            handleList.append(new_entry)
        # 导出为 JSON 文件
        sorted_data = sorted(handleList, key=lambda x: -x['timestamp'])
        with open('./src/public/data/weibo.json', 'w', encoding='utf-8') as file:
            json.dump(handleList, file, ensure_ascii=False, indent=4)
            print('微博数据导出成功')
    else:
        print('微博请求失败')

except Exception as e:
    print('微博请求报错:', str(e))