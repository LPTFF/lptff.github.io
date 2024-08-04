import requests
import argparse
import os


def send_post_request(key, msg):
    # 替换为你的目标URL
    url = f'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key={key}'
    payload = msg
    try:
        response = requests.post(url, json=payload)
        print('消息推送提醒成功')
    except Exception as e:
        print('消息推送提醒发生异常:', e)


if __name__ == "__main__":
    try:
        ACCESS_TOKEN = os.getenv('ACCESS_TOKEN')
        QYWX_KEY = os.getenv('QYWX_KEY')
        # QYWX_KEY = "" 此处填写测试变量
        msg = {
            "msgtype": "news",
            "news": {
                "articles": [
                    {
                        "title": "随风而逝",
                        "description": "GitHub个人网站更新了",
                        "url": "https://lptff.github.io/",
                        "picurl": "https://avatars.githubusercontent.com/u/31006738?v=4"
                    }
                ]
            }
        }
        send_post_request(QYWX_KEY, msg)
    except Exception as e:
        print('os.getenv Exception:', e)
