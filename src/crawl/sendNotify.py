import requests
import argparse
QYWX_KEY = "cb675e27-35c5-4b6c-ae64-a7eaac2fdbae"


def send_post_request(key):
    # 替换为你的目标URL
    url = f'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key={QYWX_KEY}'
    payload = {
        "msgtype": "text",
        "text": {
            "content": "GitHub个人网站脚本刚更新了",
        }
    }
    try:
        # 发送POST请求并接收响应
        response = requests.post(url, json=payload)
    except Exception as e:
        print('发生异常:', e)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('--key')
    args = parser.parse_args()
    print(f'args: {args}')
    send_post_request(args.key)
