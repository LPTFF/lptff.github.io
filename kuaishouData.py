import requests
import json
import datetime
import time
# 发起 post 请求
url = 'https://www.kuaishou.com/graphql'
headers = {
    'Content-Type': 'application/json',
    'Cookie': 'kpf=PC_WEB; clientid=3; did=web_aa3a02146ca7e38d347cd365d9ec92a6; kpn=KUAISHOU_VISION',
    'Host': 'www.kuaishou.com',
    'Origin': 'https://www.kuaishou.com',
    'Referer': 'https://www.kuaishou.com/profile/3x2fq6my5mmrvak',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
}
data_json = {
    'operationName': "visionProfilePhotoList",
    'query': "fragment photoContent on PhotoEntity {\n  id\n  duration\n  caption\n  originCaption\n  likeCount\n  viewCount\n  commentCount\n  realLikeCount\n  coverUrl\n  photoUrl\n  photoH265Url\n  manifest\n  manifestH265\n  videoResource\n  coverUrls {\n    url\n    __typename\n  }\n  timestamp\n  expTag\n  animatedCoverUrl\n  distance\n  videoRatio\n  liked\n  stereoType\n  profileUserTopPhoto\n  musicBlocked\n  __typename\n}\n\nfragment feedContent on Feed {\n  type\n  author {\n    id\n    name\n    headerUrl\n    following\n    headerUrls {\n      url\n      __typename\n    }\n    __typename\n  }\n  photo {\n    ...photoContent\n    __typename\n  }\n  canAddComment\n  llsid\n  status\n  currentPcursor\n  tags {\n    type\n    name\n    __typename\n  }\n  __typename\n}\n\nquery visionProfilePhotoList($pcursor: String, $userId: String, $page: String, $webPageArea: String) {\n  visionProfilePhotoList(pcursor: $pcursor, userId: $userId, page: $page, webPageArea: $webPageArea) {\n    result\n    llsid\n    webPageArea\n    feeds {\n      ...feedContent\n      __typename\n    }\n    hostName\n    pcursor\n    __typename\n  }\n}\n",
    'variables': {'userId': "3x2fq6my5mmrvak", 'pcursor': "", 'page': "profile"}
}
response = requests.post(url, headers=headers, json=data_json)
print('response', response)
if response.status_code == 200:
    # 解析响应数据
    data = response.json()
    print('data', data)
    videoList = data["data"]["visionProfilePhotoList"]["feeds"]
    videoHandle = []
    for index, item in enumerate(videoList):
        # captionUrl = item["photo"]['coverUrl']
        # videoUrl = item["photo"]['photoUrl']
        # originCaption = item["photo"]['originCaption']
        # likeCount = item["photo"]['likeCount']
        # viewCount = item["photo"]['viewCount']
        newEntry = {
            "captionUrl": item["photo"]['coverUrl'],
            "videoUrl": item["photo"]['photoUrl'],
            "originCaption": item["photo"]['originCaption'],
            "likeCount": item["photo"]['likeCount'],
            "viewCount": item["photo"]['viewCount']
        }
        videoHandle.append(newEntry)
    # print('videoHandle', videoHandle.encode('gbk', errors='ignore'))
    with open('kuaishouData.json', 'w', encoding='utf-8') as file:
        json.dump(videoHandle, file, ensure_ascii=False, indent=4)
        # json.dump(data, file)
        print('分析数据导出成功')
else:
    print('请求失败')
