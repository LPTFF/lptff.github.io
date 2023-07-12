import requests
import json
import datetime
import time
from bs4 import BeautifulSoup
# 发起 GET 请求
url='https://www.zhipin.com/wapi/zpgeek/search/joblist.json?scene=1&query=&city=101020100&experience=104,105&payType=&partTime=&degree=204,203&industry=&scale=&stage=&position=100901,100208&jobType=1901&salary=406&multiBusinessDistrict=&multiSubway=&page=1&pageSize=30'
headers = {
    'Cookie': 'lastCity=101020100; wd_guid=6f0da0ea-af8d-4809-bb26-45b0dc5fa1b3; historyState=state; _bl_uid=kLl7hjvRljs1gvnFjsmqjtar3jXb; __g=-; Hm_lvt_194df3105ad7148dcf2b98a91b5e727a=1688278838,1688616661,1689072844; boss_login_mode=wechat; wt2=DGVEpP7_MF9_HJRd-wie1FWbs9SrNN9L9q9ad1PUqWUUB56rCH4QOCSSYMoUIQXL29Ep_jHmYBRnjcnKMZBUjdA~~; wbg=0; __l=l=%2Fwww.zhipin.com%2Fjob_detail%2F0e9b6a64fac4eb3b03x809-9F1U~.html%3Flid%3D3tmTuFSWnOs.search.2%26securityId%3DLtIf-54WU6rQC-U1BQzAwJRbOEFX80Il87xDZXdp9votRFd05woZIKGV96ZzBBccv0BMnA-3qjIpDqf92rzjMb-oknV6CTnQ9qRE_lTBYHFtRmU~%26sessionId%3D&r=&g=&s=3&friend_source=0&s=3&friend_source=0; Hm_lpvt_194df3105ad7148dcf2b98a91b5e727a=1689084143; __zp_stoken__=771deAB4VcFwCdBBJVmt6YFJhQ0wxE0N%2BDipmfXpkfF5fZBdtLkZzcnxEXFd5bU5lfiZ0HHF3HCtML3csADt8RmNlEF87ax0EKzwgYzhfazNeQTBwWhsuDholfgAjDjAuPB9GZ3V9bFxaYQc%3D; __c=1689072843; __a=28995859.1688278840.1688616662.1689072843.31.3.22.31; geek_zp_token=V1RN8hEuL43ltiVtRvxxQYIS-25D_SwiQ~; SERVERID=669c12b6205dadc4b25f7f10ddc9cc19|1689084147|1689083873',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
}
try: 
    requests.adapters.DEFAULT_RETRIES = 5 # 增加重连次数
    s = requests.session()
    s.keep_alive = False # 关闭多余连接
    response = s.get(url, headers=headers) # 你需要的网址
    print('Boss直聘response',response)
    if response.status_code == 200:
        # 解析响应数据
        data = response.json()
        print('Boss直聘 data',data['code'])
        if data['code']==0:
            jobList = data['zpData']['jobList']
            # 数据提取逻辑
            jobListHandle = []
            for index, item in enumerate(jobList):
                brandLogo = item['brandLogo']
                brandName = item['brandName']
                bossTitle = item['bossTitle']
                brandIndustry = item['brandIndustry']
                salaryDesc = item['salaryDesc']
                skills = item['skills']
                job_detail='https://www.zhipin.com/job_detail/'+item['encryptJobId']+'.html?lid='+item['lid']+'&securityId='+item['securityId']+'&sessionId='
                headers1 = {
                    'Cookie': 'lastCity=101020100; wd_guid=6f0da0ea-af8d-4809-bb26-45b0dc5fa1b3; historyState=state; _bl_uid=kLl7hjvRljs1gvnFjsmqjtar3jXb; __g=-; Hm_lvt_194df3105ad7148dcf2b98a91b5e727a=1688278838,1688616661,1689072844; boss_login_mode=wechat; wt2=DGVEpP7_MF9_HJRd-wie1FWbs9SrNN9L9q9ad1PUqWUUB56rCH4QOCSSYMoUIQXL29Ep_jHmYBRnjcnKMZBUjdA~~; wbg=0; __c=1689072843; __l=l=%2Fwww.zhipin.com%2Fjob_detail%2F0e9b6a64fac4eb3b03x809-9F1U~.html%3Flid%3D3tmTuFSWnOs.search.2%26securityId%3DLtIf-54WU6rQC-U1BQzAwJRbOEFX80Il87xDZXdp9votRFd05woZIKGV96ZzBBccv0BMnA-3qjIpDqf92rzjMb-oknV6CTnQ9qRE_lTBYHFtRmU~%26sessionId%3D&r=&g=&s=3&friend_source=0&s=3&friend_source=0; __a=28995859.1688278840.1688616662.1689072843.28.3.19.28; Hm_lpvt_194df3105ad7148dcf2b98a91b5e727a=1689080447; __zp_stoken__=771deADxwYi1nTHN1cjt%2FQCUqfG0wWRFBRCNiUAEof1xSdxBYMWN7ZF05BWNbIBxlfiZ0HHF3HFlEewksAjQtYjM6RS8ceBElJgElYzhfazNeQTAiFzkaV2cEaAgGETAuPB9GZ3V9bFxaYQc%3D; geek_zp_token=V1RN8hEuL43ltiVtRvxxQYISi06D3RwSU~',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
                }
                jobDesc=''
                if index==0:
                    try: 
                        requests.adapters.DEFAULT_RETRIES = 5 # 增加重连次数
                        s = requests.session()
                        s.keep_alive = False # 关闭多余连接
                        response = s.get(job_detail, headers=headers1) # 你需要的网址
                        print('Boss直聘详情response',response)
                        if response.status_code == 200:
                            # 解析响应数据
                            data = response.text
                            # 解析HTML
                            soup = BeautifulSoup(data, 'html.parser')
                            # print('Boss直聘数据导出成功 soup',soup)
                            # 打开文件并写入HTML内容
                            with open('output.html', 'w', encoding='utf-8') as file:
                                file.write(html)
                            print(f"HTML已保存为 {filename}")
                            # 查找目标元素
                            box_div = soup.find('div', class_='job-sec-text')
                            jobDesc = box_div.text.strip() if box_div else None
                            print('Boss直聘详情数据导出成功 jobDesc',jobDesc)
                        else:
                            print('Boss直聘详情请求失败')
                    except requests.exceptions.RequestException as e:
                        print('Boss直聘详情请求异常:', e)
                    except Exception as e:
                        print('Boss直聘详情发生异常:', e)
                newEntry = {
                    "brandLogo": brandLogo,
                    "brandName": brandName,
                    "bossTitle": bossTitle,
                    "brandIndustry": brandIndustry,
                    "salaryDesc": salaryDesc,
                    "skills": skills,
                    "job_detail": job_detail,
                    "jobDesc": jobDesc
                }
                jobListHandle.append(newEntry)
            # 导出为 JSON 文件
            with open('test1.json', 'w', encoding='utf-8') as file:
                json.dump(jobListHandle, file, ensure_ascii=False, indent=4)
                print('Boss直聘数据导出成功')
        else:
            print('Boss直聘请求数据异常')  
    else:
        print('Boss直聘请求失败')
except requests.exceptions.RequestException as e:
    print('Boss直聘请求异常:', e)
except Exception as e:
    print('Boss直聘发生异常:', e)
