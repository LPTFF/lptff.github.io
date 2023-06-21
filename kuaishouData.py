import requests
import json
import datetime
# 发起 post 请求
url = 'https://www.kuaishou.com/graphql'
headers = {
    'Content-Type': 'application/json',
    'Cookie': 'kpf=PC_WEB; clientid=3; did=web_aa3a02146ca7e38d347cd365d9ec92a6; userId=1451924634; kuaishou.server.web_st=ChZrdWFpc2hvdS5zZXJ2ZXIud2ViLnN0EqABgQERyDI2_Pj2hpd9uvS5g3TEOw9omjL3gyIGCsqGxvPxK59rjpWTZAKeHvPt3rklsQVsxl-ekSJ7yIpmZxPzohcVcZ8aKLGqkSEvsPnnhfJXQdvhnArX-46JzROaaQC1ESA-Lkx6Qmwbi2GJH11wSlW_ns0KC0pYEsdT39OdhWZP4f0lYjwVbp578rtyin6teXidDIKsSCusn3URsDQ1GxoS8JByODRPv5hk-B95zTquvFHcIiC5RATG3ZaCG1XSCVZ3iCZwRFg8Uf8FTXckXo88ro9KfigFMAE; kuaishou.server.web_ph=d8b33da2bc303194f05609af0e211c487b15; kpn=KUAISHOU_VISION',
    'Host': 'www.kuaishou.com',
    'Origin': 'https://www.kuaishou.com',
    'Referer': 'https://www.kuaishou.com/profile/3x2fq6my5mmrvak',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
}

user_ids = ["3x2fq6my5mmrvak", "3xqrberfqg2r95g"]  # 要请求的用户ID列表
video_handle = []

for index, user_id in enumerate(user_ids):
    data_json = {
        'operationName': "visionProfilePhotoList",
        'query': "fragment photoContent on PhotoEntity {\n  id\n  duration\n  caption\n  originCaption\n  likeCount\n  viewCount\n  commentCount\n  realLikeCount\n  coverUrl\n  photoUrl\n  photoH265Url\n  manifest\n  manifestH265\n  videoResource\n  coverUrls {\n    url\n    __typename\n  }\n  timestamp\n  expTag\n  animatedCoverUrl\n  distance\n  videoRatio\n  liked\n  stereoType\n  profileUserTopPhoto\n  musicBlocked\n  __typename\n}\n\nfragment feedContent on Feed {\n  type\n  author {\n    id\n    name\n    headerUrl\n    following\n    headerUrls {\n      url\n      __typename\n    }\n    __typename\n  }\n  photo {\n    ...photoContent\n    __typename\n  }\n  canAddComment\n  llsid\n  status\n  currentPcursor\n  tags {\n    type\n    name\n    __typename\n  }\n  __typename\n}\n\nquery visionProfilePhotoList($pcursor: String, $userId: String, $page: String, $webPageArea: String) {\n  visionProfilePhotoList(pcursor: $pcursor, userId: $userId, page: $page, webPageArea: $webPageArea) {\n    result\n    llsid\n    webPageArea\n    feeds {\n      ...feedContent\n      __typename\n    }\n    hostName\n    pcursor\n    __typename\n  }\n}\n",
        'variables': {'userId': user_id, 'pcursor': "", 'page': "profile"}
    }

    try:
        response = requests.post(url, headers=headers, json=data_json)
        response.raise_for_status()  # 检查请求是否成功
        data = response.json()

        video_list = data.get("data", {}).get("visionProfilePhotoList", {}).get("feeds", [])
        for item in video_list:
            photo = item.get("photo", {})
            timestamp = photo.get('timestamp')  # 时间戳
            # 将时间戳转换为datetime对象
            dt = datetime.datetime.fromtimestamp(timestamp / 1000)
            # 将datetime对象格式化为指定的日期字符串
            formatted_date = dt.strftime("%Y-%m-%d %H:%M:%S")
            new_entry = {
                "captionUrl": photo.get('coverUrl'),
                "videoUrl": photo.get('photoUrl'),
                "originCaption": photo.get('originCaption'),
                "likeCount": photo.get('likeCount'),
                "viewCount": photo.get('viewCount'),
                "timestamp": timestamp,
                "time": formatted_date,
                "website": "kuaishou"
            }
            video_handle.append(new_entry)

    except requests.exceptions.RequestException as err:
        print(f"请求失败（用户ID：{user_id}，索引：{index}）:", err)

    except json.JSONDecodeError as err:
        print(f"解析数据失败（用户ID：{user_id}，索引：{index}）:", err)

    except Exception as err:
        print(f"发生错误（用户ID：{user_id}，索引：{index}）:", err)

# 保存数据到文件
video_handle.sort(key=lambda x: x['timestamp'],reverse=True)
with open('./src/.vuepress/public/data/kuaishouData.json', 'w', encoding='utf-8') as file:
    json.dump(video_handle, file, ensure_ascii=False, indent=4)
    print('分析数据导出成功')
