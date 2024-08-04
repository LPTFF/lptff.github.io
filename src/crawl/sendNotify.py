import requests
import argparse


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
        # 发送POST请求并接收响应
        response = requests.post(url, json=payload)
        print('消息推送提醒成功')
    except Exception as e:
        print('消息推送提醒发生异常:', e)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('--key')
    args = parser.parse_args()
    send_post_request(args.key)
