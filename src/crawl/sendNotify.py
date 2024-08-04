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
        msg = {
            "msgtype": "template_card",
            "template_card": {
                "card_type": "text_notice",
                "source": {
                    "icon_url": "https://avatars.githubusercontent.com/u/31006738?v=4",
                    "desc": "GitHub个人网站",
                    "desc_color": 0
                },
                "jump_list": [
                    {
                        "type": 1,
                        "url": "https://lptff.github.io/",
                        "title": "随风而逝"
                    },
                    {
                        "type": 1,
                        "url": "https://github.com/LPTFF",
                        "title": "GitHub地址"
                    }
                ],
            }
        }
        send_post_request(QYWX_KEY, msg)
    except Exception as e:
        print('os.getenv Exception:', e)
