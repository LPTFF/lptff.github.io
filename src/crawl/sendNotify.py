import requests
import argparse
import os


def send_post_request(key):
    # 替换为你的目标URL
    url = f'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key={key}'
    payload = {
        "msgtype": "text",
        "text": {
            "content": "GitHub个人网站脚本刚更新了",
        }
    }
    try:
        response = requests.post(url, json=payload)
        print('消息推送提醒成功')
    except Exception as e:
        print('消息推送提醒发生异常:', e)


if __name__ == "__main__":
    try:
        ACCESS_TOKEN = os.getenv('ACCESS_TOKEN')
        QYWX_KEY = os.getenv('QYWX_KEY')
        print('ACCESS_TOKEN:', ACCESS_TOKEN)
        print('QYWX_KEY:', QYWX_KEY)
    except Exception as e:
        print('os.getenv Exception:', e)
    parser = argparse.ArgumentParser()
    parser.add_argument('--key')
    args = parser.parse_args()
    send_post_request(args.key)
