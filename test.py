import requests
import json
import time

# 发起 GET 请求
base_url = 'https://www.zhipin.com/wapi/zpgeek/search/joblist.json'
query_params = {
    'scene': '1',
    'query': '',
    'city': '101020100',
    'experience': '104,105',
    'payType': '',
    'partTime': '',
    'degree': '204,203',
    'industry': '',
    'scale': '',
    'stage': '',
    'position': '100901,100208',
    'jobType': '1901',
    'salary': '406',
    'multiBusinessDistrict': '',
    'multiSubway': '',
    'pageSize': '30'
}

headers = {
    'Cookie': 'lastCity=101020100; wd_guid=6f0da0ea-af8d-4809-bb26-45b0dc5fa1b3; historyState=state; _bl_uid=kLl7hjvRljs1gvnFjsmqjtar3jXb; wt2=DGVEpP7_MF9_HJRd-wie1FWbs9SrNN9L9q9ad1PUqWUUB56rCH4QOCSSYMoUIQXL29Ep_jHmYBRnjcnKMZBUjdA~~; wbg=0; __g=-; Hm_lvt_194df3105ad7148dcf2b98a91b5e727a=1688278838,1688616661,1689072844,1689127283; __l=l=%2Fwww.zhipin.com%2Fweb%2Fgeek%2Fjob%3Fcity%3D101020100%26experience%3D104%2C105%26degree%3D204%2C203%26position%3D100901%2C100208%26jobType%3D1901%26salary%3D406%26page%3D0&r=&g=&s=3&friend_source=0&s=3&friend_source=0; SERVERID=606144fb348bc19e48aededaa626f54e|1689153294|1689152811; Hm_lpvt_194df3105ad7148dcf2b98a91b5e727a=1689165082; __c=1689127280; __a=28995859.1688278840.1689072843.1689127280.49.4.17.49; __zp_stoken__=7398eZ3hbLwxidyE%2BcFEuLlJ7Hy8IEEhQXQZtBUgEUnEIFwwsTEtCegtndzwNBmA8fkx0exgcXxJmBn5bEk9vehQbfG9rQRlCExdmFCMjJwldKzARJDUDax90OHd0eRh3PHVGABw8XW9aR3o%3D; geek_zp_token=V1RN8hEuL43ltiVtRvxxQZLy625DnXwSk~',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
}

jobAllList = []  # 存储所有爬取到的数据
prev_jobList = None  # 上一次的职位列表
pageCount=0

while True :
    # 构建完整的URL
    query_params['page'] = str(query_params.get('page', 1))
    url = base_url + '?' + '&'.join([f"{k}={v}" for k, v in query_params.items()])
    try:
        # 发送 GET 请求
        response = requests.get(url, headers=headers)
        print(f'Boss直聘第{pageCount+1}次 response:', response)

        if response.status_code == 200:
            # 解析响应数据
            data = response.json()
            if data['code'] == 0:
                # 导出为 JSON 文件
                jobList = data['zpData']['jobList']
                for index, item in enumerate(jobList):
                    brandLogo=item['brandLogo']
                    brandName=item['brandName']
                    bossTitle=item['bossTitle']
                    brandIndustry=item['brandIndustry']
                    salaryDesc=item['salaryDesc']
                    skills=item['skills']
                    job_detail='https://www.zhipin.com/job_detail/'+item['encryptBrandId']+'.html?lid='+item['lid']+'&securityId='+item['securityId']+'&sessionId='
                    jobDesc=''
                    new_entry = {
                        "jobNum":index+1 ,
                        "brandLogo": brandLogo,
                        "brandName": brandName,
                        "bossTitle": bossTitle,
                        "brandIndustry": brandIndustry,
                        "salaryDesc": salaryDesc,
                        "skills": skills,
                        "job_detail": job_detail,
                        "jobDesc": jobDesc
                    }
                    jobAllList.append(new_entry)
            else:
                jobList = data
                print(f"Boss直聘第{pageCount+1}次数据请求异常",data)
            # 判断是否为第一次请求或最后一页
            if pageCount>100 or jobList == prev_jobList:
                break
            # 更新上一次的职位列表
            prev_jobList = jobList
            # 延时等待，避免频繁请求
            time.sleep(2)
            # 更新页数
            query_params['page'] = str(int(query_params['page']) + 1)
        else:
            print(f"Boss直聘第{pageCount+1}次请求失败")
            break
    except Exception as e:
        print(f"Boss直聘第{pageCount+1}次请求发生错误")
        break
    finally:
        pageCount += 1


# 将数据保存到文件
output_file = 'test2.json'
with open(output_file, 'w', encoding='utf-8') as file:
    json.dump(jobAllList, file, ensure_ascii=False, indent=4)
    print('Boss直聘数据导出成功')
