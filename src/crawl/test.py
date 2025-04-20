import requests
import json
import time

# 发起 GET 请求
base_url = 'https://fund.eastmoney.com/data/rankhandler.aspx'
query_params = {
    'op': 'ph',
    'dt': 'kf',
    'ft': 'all',
    'rs': '',
    'gs': '0',
    'sc': 'rzdf',
    'st': 'desc',
    'sd': '2021-10-14',
    'ed': '2022-10-14',
    'qdii': '',
    'tabSubtype': ',,,,,',
    'pi': '1',
    'pn': '50',
    'dx': '1',
    'v': '0.03864667064776106',
}
Cookie='qgqp_b_id=52bc11abb7da424c7c6c0245632fabf8; st_si=45944932726295; st_asi=delete; ASP.NET_SessionId=qzew05z1l0nkdvmkxfu1i5sr; EMFUND1=null; EMFUND2=null; EMFUND3=null; EMFUND4=null; EMFUND5=null; EMFUND6=null; EMFUND7=null; EMFUND8=null; EMFUND0=null; EMFUND9=01-02 21:07:57@#$%u5609%u5B9E%u65B0%u8D22%u5BCC%u6DF7%u5408A@%23%24002211; st_pvi=83672209965611; st_sp=2024-02-26%2013%3A56%3A55; st_inirUrl=https%3A%2F%2Fquote.eastmoney.com%2Fzs399001.html; st_sn=2; st_psi=20250102210756787-112200305282-4285915888'
headers = {
    'Cookie': Cookie,
    'host':'fund.eastmoney.com',
    'referer':'https://fund.eastmoney.com/data/fundranking.html',
    'sec-ch-ua':'"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
    'sec-ch-ua-mobile':'?0',
    'sec-ch-ua-platform':'"Windows"',
    'sec-fetch-dest':'script',
    'sec-fetch-mode':'no-cors',
    'sec-fetch-site':'same-origin',
    'user-agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
}
# 构建完整的URL
query_params['page'] = str(query_params.get('page', 1))
url = base_url + '?' + '&'.join([f"{k}={v}" for k, v in query_params.items()])
try:
    # 发送 GET 请求
    print(f'url:', url)
    response = requests.get(url, headers=headers)
    print(f'response1:', response)
    if response.status_code == 200:
        # 解析响应数据
        print(f'Response Text: {response.text[:500]}')
    else:
        print(f"请求失败")
except Exception as e:
    print(f"请求发生错误：{e}")


