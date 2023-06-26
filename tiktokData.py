import requests
import json
import datetime
import re
# 发起 get 请求
url = 'https://www.douyin.com/video/7033681032482147598'
headers = {
    'Cookie':'douyin.com; device_web_cpu_core=6; device_web_memory_size=8; webcast_local_quality=null; ttwid=1%7CzkD4RV1m3vxbpsGKnE3C3f74IUd5Jn_MMFm_gOrzPRc%7C1686790555%7Ca9abd5642d1239bac464f19dcb1ced337ad098fbb6c5d7fce3adfd98dadcd5b1; passport_csrf_token=48aad60343d13ca16e3579d7448be090; passport_csrf_token_default=48aad60343d13ca16e3579d7448be090; __bd_ticket_guard_local_probe=1686790566472; s_v_web_id=verify_liwfjva5_xiGxFoTB_VZqW_4YL1_9v2L_XzZPPW8NKhgr; strategyABtestKey=%221687757329.16%22; FORCE_LOGIN=%7B%22videoConsumedRemainSeconds%22%3A180%7D; n_mh=JN5zVYkoMLWFvMi4_lLSf88qoqrQVPCUVIUcqIg4CAs; VIDEO_FILTER_MEMO_SELECT=%7B%22expireTime%22%3A1688362167009%2C%22type%22%3Anull%7D; LOGIN_STATUS=1; store-region=cn-ah; store-region-src=uid; publish_badge_show_info=%220%2C0%2C0%2C1687757368522%22; __security_server_data_status=1; bd_ticket_guard_client_data=eyJiZC10aWNrZXQtZ3VhcmQtdmVyc2lvbiI6MiwiYmQtdGlja2V0LWd1YXJkLWl0ZXJhdGlvbi12ZXJzaW9uIjoxLCJiZC10aWNrZXQtZ3VhcmQtY2xpZW50LWNlcnQiOiItLS0tLUJFR0lOIENFUlRJRklDQVRFLS0tLS1cbk1JSUNGRENDQWJxZ0F3SUJBZ0lVRjJOTXB3WGp2a2ZlNTE4S0Yyd2VZWHZaNXBVd0NnWUlLb1pJemowRUF3SXdcbk1URUxNQWtHQTFVRUJoTUNRMDR4SWpBZ0JnTlZCQU1NR1hScFkydGxkRjluZFdGeVpGOWpZVjlsWTJSellWOHlcbk5UWXdIaGNOTWpNd05qSTJNRFV5T1RJMFdoY05Nek13TmpJMk1UTXlPVEkwV2pBbk1Rc3dDUVlEVlFRR0V3SkRcblRqRVlNQllHQTFVRUF3d1BZbVJmZEdsamEyVjBYMmQxWVhKa01Ga3dFd1lIS29aSXpqMENBUVlJS29aSXpqMERcbkFRY0RRZ0FFZm16L0VuRGtLRUVQZlI3cXIzdVRYNzNpZ3VqWmFCRXlPVzZWTnBpYisrZmJRVDhiV3RPZFM4SG9cbm5lS0dtTUlGSWtqbklJcVlDZlpEYTRwb2tjdWdRYU9CdVRDQnRqQU9CZ05WSFE4QkFmOEVCQU1DQmFBd01RWURcblZSMGxCQ293S0FZSUt3WUJCUVVIQXdFR0NDc0dBUVVGQndNQ0JnZ3JCZ0VGQlFjREF3WUlLd1lCQlFVSEF3UXdcbktRWURWUjBPQkNJRUlObUQyeE10WnNWRVk5dmlPVUxFOWRjQkNxWk5SSmdXK1VDejMzcmY4Si9XTUNzR0ExVWRcbkl3UWtNQ0tBSURLbForcU9aRWdTamN4T1RVQjdjeFNiUjIxVGVxVFJnTmQ1bEpkN0lrZURNQmtHQTFVZEVRUVNcbk1CQ0NEbmQzZHk1a2IzVjVhVzR1WTI5dE1Bb0dDQ3FHU000OUJBTUNBMGdBTUVVQ0lCWWNpcmRDbHlaL1VDTmpcblhJVlY1UlJKQjJmOWl4ZjkxYkFTV1dCSHRtQlNBaUVBbHhNZytMN1dhNXlZOTl6eTNzSHg3SXk4NE51UmQ5UHdcbk1tOTBGNldWaEowPVxuLS0tLS1FTkQgQ0VSVElGSUNBVEUtLS0tLVxuIn0=; d_ticket=8dfd75bd1eeea2b1dfb0a7b28b9fe07dc44ff; passport_assist_user=CkEVst8tG2F9ouUpsshraMSvLTLY2nJDCuTlCcCURja3P0bAD2Piaocy0FiI2OLz7_x8I3Nafpiu37PUd9AgwOL8TxpICjzbhmVlarwlIsloeSnM4FfA95AURrG_5NetvKplqYEmZF4w_Z8n5WAigdtwPFJ2vWVBGP527MZbZcXCE_oQ7u60DRiJr9ZUIgEDo85yew%3D%3D; sso_uid_tt=21d98f97f362746f7cf464b337827e5a; sso_uid_tt_ss=21d98f97f362746f7cf464b337827e5a; toutiao_sso_user=ca6dda98f5d35a5150283eee0048e45b; toutiao_sso_user_ss=ca6dda98f5d35a5150283eee0048e45b; sid_ucp_sso_v1=1.0.0-KDBjYTBmNDMxOTQyYjAwZDc2NTEwMzVhNzJjMWI1YmFiNzc5YmYyYWYKHwjIoZCxxfTeBRDwxeSkBhjvMSAMMJXGleoFOAZA9AcaAmxmIiBjYTZkZGE5OGY1ZDM1YTUxNTAyODNlZWUwMDQ4ZTQ1Yg; ssid_ucp_sso_v1=1.0.0-KDBjYTBmNDMxOTQyYjAwZDc2NTEwMzVhNzJjMWI1YmFiNzc5YmYyYWYKHwjIoZCxxfTeBRDwxeSkBhjvMSAMMJXGleoFOAZA9AcaAmxmIiBjYTZkZGE5OGY1ZDM1YTUxNTAyODNlZWUwMDQ4ZTQ1Yg; odin_tt=0670716102bb0bf1057fa26d0e4cf4280affad47a571136f7ab3a15d18d981d6aaa2eb6cf70d502038ca30f78e72abd1708a7ec3ef0fdf8a8efcfba6532d0fbb; passport_auth_status=931b7edc02c9c63d163665530a645c5d%2C6e64e31c3d94172e19a9a881d8721709; passport_auth_status_ss=931b7edc02c9c63d163665530a645c5d%2C6e64e31c3d94172e19a9a881d8721709; uid_tt=342fc0bd779d4a6b5b76339cc7238909; uid_tt_ss=342fc0bd779d4a6b5b76339cc7238909; sid_tt=e347c181e31481fc37b4fc949e30432d; sessionid=e347c181e31481fc37b4fc949e30432d; sessionid_ss=e347c181e31481fc37b4fc949e30432d; sid_guard=e347c181e31481fc37b4fc949e30432d%7C1687757556%7C5183999%7CFri%2C+25-Aug-2023+05%3A32%3A35+GMT; sid_ucp_v1=1.0.0-KGVhYzczNDA4Mzc5NTIxMGFlZjFkZTJhMjVjZmE1MDgxZWRlNGM0NjYKGwjIoZCxxfTeBRD0xeSkBhjvMSAMOAZA9AdIBBoCbGYiIGUzNDdjMTgxZTMxNDgxZmMzN2I0ZmM5NDllMzA0MzJk; ssid_ucp_v1=1.0.0-KGVhYzczNDA4Mzc5NTIxMGFlZjFkZTJhMjVjZmE1MDgxZWRlNGM0NjYKGwjIoZCxxfTeBRD0xeSkBhjvMSAMOAZA9AdIBBoCbGYiIGUzNDdjMTgxZTMxNDgxZmMzN2I0ZmM5NDllMzA0MzJk; bd_ticket_guard_server_data=; download_guide=%223%2F20230626%2F0%22; SEARCH_RESULT_LIST_TYPE=%22single%22; csrf_session_id=a3ac3f9f7072e09865160632a164ff43; pwa2=%220%7C0%7C3%7C1%22; __ac_nonce=064993a9000225ced193b; __ac_signature=_02B4Z6wo00f01TkFHpAAAIDAWg.e-t-vlHU5IRoAACrb6Zn3JKDRdaIdSfgp7JNyb-28uEGXOKrTgAceRFWdFwqFN-gdfK5HL.XhO1agVnJfmRy2p0LnIsKCqkPirA0FQt6bEa7VkZ52hWrL54; msToken=Mvex2ChMlK4VL6QJXyKAwGPat3msLYtqQl5CaiU3wQTokwX1yZmBlto4X0VqA_DLShK0tFlngA2d-8gaaNSxcd2mN3cszu1zxWTsHxy63OnxH9L9IpYwznLhYmoKNCRE; home_can_add_dy_2_desktop=%221%22; msToken=Lx49G4rCEqUp6DRMHUVXlDRh4aPaaA35aoeOdofu_I4jdePwuD2xIIP_hnQOiIeROKEJtQ7_Fz3xa2dpSFncPmGjaQXGjLcxvYr8kjZm4POLMfFmyadq-56w2EmUuhkI; tt_scid=FEZz3WrW.XL7CEl4Pn-BaXsj.pN93V.eUA63emBQc6XcyKlHYS1lRBaPqMsIqHwb45b2; passport_fe_beating_status=false',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
}
try:
    response = requests.get(url, headers=headers)
    response.raise_for_status()  # 检查请求是否成功
    print('Tik Tok', response)
    if response.status_code == 200:
        # 解析响应数据
        data = response.text
        html_data=re.findall('<script id="RENDER_DATA" type="application/json">(.*?)</script>',data)[0]#正则获取页面视频内容
        html_data=requests.utils.unquote(html_data)#内容decode
        json_data=json.loads(html_data)#转json格式
        last_value = json_data[list(json_data.keys())[-1]] #根据数据结构获取最后一个对象
        videoDetail=last_value['aweme']['detail'] #字典取值
        timestamp = videoDetail['requestTime']  # 时间戳
        # 将时间戳转换为datetime对象
        dt = datetime.datetime.fromtimestamp(timestamp / 1000)
        # 将datetime对象格式化为指定的日期字符串
        formatted_date = dt.strftime("%Y-%m-%d %H:%M:%S")
        new_entry = {
            "captionUrl": videoDetail['video']['coverUrlList'][0],
            "videoUrl": 'https:'+videoDetail['video']['bitRateList'][0]['playAddr'][0]['src'],
            "desc": videoDetail['desc'],
            "likeCount": videoDetail['stats']['diggCount'],
            "collectCount": videoDetail['stats']['collectCount'],
            "timestamp": timestamp,
            "time": formatted_date,
            "website": "tikTok"
        }
        with open('test1.json', 'w', encoding='utf-8') as file:
            json.dump(new_entry, file, ensure_ascii=False, indent=4)
            print('Tik Tok分析数据导出成功')
    else:
        print('请求失败')
except requests.exceptions.RequestException as e:
    print('请求异常:', e)
except Exception as e:
    print('发生异常:', e)
