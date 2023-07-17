import requests
import json

def save_response_to_file(index, response):
    file_path = f'./src/public/data/leetCode/leetCode_{index+1}.json'
    with open(file_path, 'w', encoding='utf-8') as file:
        json.dump(questionHandle, file, ensure_ascii=False, indent=4)
        print('LeetCode分析数据导出成功')

# 获取题目列表
def fetch_leetcode_data(skip):
    url = 'https://leetcode.cn/graphql/'
    headers = {
        'Content-Type':'application/json',
        'Cookie':'gr_user_id=e2d280c7-fc18-405e-83ce-e9fa8b68dde7; Hm_lvt_fa218a3ff7179639febdb15e372f411c=1658541834; csrftoken=pO69n3tBtMAGPmv0xlNwyslORirzzRK3kKwgUTtKb1yGu1tl30WXeaUdps7jVfUy; _bl_uid=gzlq0i8pss8bvFobpyyLrUagUqmk; Hm_lvt_f0faad39bcf8471e3ab3ef70125152c3=1686542211,1686618381,1687313761; a2873925c34ecbd2_gr_last_sent_cs1=tian-yi-15; _ga=GA1.2.605638667.1655560224; LEETCODE_SESSION=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJuZXh0X2FmdGVyX29hdXRoIjoiL3Byb2JsZW1zZXQvYWxsLz91dG1fc291cmNlPUxDVVMmdXRtX21lZGl1bT1pcF9yZWRpcmVjdCZ1dG1fY2FtcGFpZ249dHJhbnNmZXIyY2hpbmEiLCJfYXV0aF91c2VyX2lkIjoiNjk4NzgxIiwiX2F1dGhfdXNlcl9iYWNrZW5kIjoiZGphbmdvLmNvbnRyaWIuYXV0aC5iYWNrZW5kcy5Nb2RlbEJhY2tlbmQiLCJfYXV0aF91c2VyX2hhc2giOiJjNmVhMjI4OTM3YTg4NmFmZTUwNGMxMmM3ZTU0ZGRkYzBmNDU1NGQ0Yjk5MGNhNzc4MTJhNDgyZWJkNWI2MzIyIiwiaWQiOjY5ODc4MSwiZW1haWwiOiIiLCJ1c2VybmFtZSI6InRpYW4teWktMTUiLCJ1c2VyX3NsdWciOiJ0aWFuLXlpLTE1IiwiYXZhdGFyIjoiaHR0cHM6Ly9hc3NldHMubGVldGNvZGUuY24vYWxpeXVuLWxjLXVwbG9hZC91c2Vycy90aWFuLXlpLTE1L2F2YXRhcl8xNTY1NDg5ODI0LnBuZyIsInBob25lX3ZlcmlmaWVkIjpmYWxzZSwiX3RpbWVzdGFtcCI6MTY4NzMxNDI1NC43NDc0MDk4LCJleHBpcmVkX3RpbWVfIjoxNjg5ODc5NjAwLCJ2ZXJzaW9uX2tleV8iOjAsImxhdGVzdF90aW1lc3RhbXBfIjoxNjg3MzE0Mzk2fQ.Smk2BQdZJYtHQ5N6l7Nmn2kp4wUnkEbHI_Kb1U2iv_U; _ga_PDVPZYN3CW=GS1.1.1687337454.5.0.1687337454.0.0.0; NEW_PROBLEMLIST_PAGE=1; a2873925c34ecbd2_gr_session_id=09717eea-b121-4a1c-803c-4ae6a42df20b; a2873925c34ecbd2_gr_last_sent_sid_with_cs1=09717eea-b121-4a1c-803c-4ae6a42df20b; a2873925c34ecbd2_gr_cs1=tian-yi-15; a2873925c34ecbd2_gr_session_id_sent_vst=09717eea-b121-4a1c-803c-4ae6a42df20b',
        'Origin':'https://leetcode.cn',
        'Referer':'https://leetcode.cn/problemset/all/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
    }
    data_json = {
        'operationName': "problemsetQuestionList",
        'query': "\n    query problemsetQuestionList($categorySlug: String, $limit: Int, $skip: Int, $filters: QuestionListFilterInput) {\n  problemsetQuestionList(\n    categorySlug: $categorySlug\n    limit: $limit\n    skip: $skip\n    filters: $filters\n  ) {\n    hasMore\n    total\n    questions {\n      acRate\n      difficulty\n      freqBar\n      frontendQuestionId\n      isFavor\n      paidOnly\n      solutionNum\n      status\n      title\n      titleCn\n      titleSlug\n      topicTags {\n        name\n        nameTranslated\n        id\n        slug\n      }\n      extra {\n        hasVideoSolution\n        topCompanyTags {\n          imgUrl\n          slug\n          numSubscribed\n        }\n      }\n    }\n  }\n}\n    ",
        'variables': {'categorySlug': "", 'skip': skip, 'limit': 50, 'filters': {}}
    }
    
    try:
        response = requests.post(url, headers=headers, json=data_json)
        response.raise_for_status()  # 检查请求是否成功
        if skip % 500 == 0:
            print(f"LeetCode获取题目列表第{skip//50}次 response：{response}")
        if response.status_code == 200:
            # 解析响应数据
            data = response.json()
            questionList = data['data']['problemsetQuestionList']['questions']
            return questionList
        else:
            print(f"LeetCode获取题目列表第{skip//50}次 请求失败")
    except requests.exceptions.RequestException as e:
        print(f"LeetCode获取题目列表第{skip//50}次 请求异常: {e}")
    except Exception as e:
        print(f"LeetCode获取题目列表第{skip//50}次 发生异常：{e}")

# 获取具体题目描述
def fetch_leetcode_desc(titleSlug,index):
    url = 'https://leetcode.cn/graphql/'
    headers = {
        'Content-Type':'application/json',
        'Cookie':'gr_user_id=e2d280c7-fc18-405e-83ce-e9fa8b68dde7; Hm_lvt_fa218a3ff7179639febdb15e372f411c=1658541834; csrftoken=pO69n3tBtMAGPmv0xlNwyslORirzzRK3kKwgUTtKb1yGu1tl30WXeaUdps7jVfUy; _bl_uid=gzlq0i8pss8bvFobpyyLrUagUqmk; Hm_lvt_f0faad39bcf8471e3ab3ef70125152c3=1686542211,1686618381,1687313761; a2873925c34ecbd2_gr_last_sent_cs1=tian-yi-15; _ga=GA1.2.605638667.1655560224; LEETCODE_SESSION=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJuZXh0X2FmdGVyX29hdXRoIjoiL3Byb2JsZW1zZXQvYWxsLz91dG1fc291cmNlPUxDVVMmdXRtX21lZGl1bT1pcF9yZWRpcmVjdCZ1dG1fY2FtcGFpZ249dHJhbnNmZXIyY2hpbmEiLCJfYXV0aF91c2VyX2lkIjoiNjk4NzgxIiwiX2F1dGhfdXNlcl9iYWNrZW5kIjoiZGphbmdvLmNvbnRyaWIuYXV0aC5iYWNrZW5kcy5Nb2RlbEJhY2tlbmQiLCJfYXV0aF91c2VyX2hhc2giOiJjNmVhMjI4OTM3YTg4NmFmZTUwNGMxMmM3ZTU0ZGRkYzBmNDU1NGQ0Yjk5MGNhNzc4MTJhNDgyZWJkNWI2MzIyIiwiaWQiOjY5ODc4MSwiZW1haWwiOiIiLCJ1c2VybmFtZSI6InRpYW4teWktMTUiLCJ1c2VyX3NsdWciOiJ0aWFuLXlpLTE1IiwiYXZhdGFyIjoiaHR0cHM6Ly9hc3NldHMubGVldGNvZGUuY24vYWxpeXVuLWxjLXVwbG9hZC91c2Vycy90aWFuLXlpLTE1L2F2YXRhcl8xNTY1NDg5ODI0LnBuZyIsInBob25lX3ZlcmlmaWVkIjpmYWxzZSwiX3RpbWVzdGFtcCI6MTY4NzMxNDI1NC43NDc0MDk4LCJleHBpcmVkX3RpbWVfIjoxNjg5ODc5NjAwLCJ2ZXJzaW9uX2tleV8iOjAsImxhdGVzdF90aW1lc3RhbXBfIjoxNjg3MzE0Mzk2fQ.Smk2BQdZJYtHQ5N6l7Nmn2kp4wUnkEbHI_Kb1U2iv_U; _ga_PDVPZYN3CW=GS1.1.1687337454.5.0.1687337454.0.0.0; NEW_PROBLEMLIST_PAGE=1; a2873925c34ecbd2_gr_session_id=09717eea-b121-4a1c-803c-4ae6a42df20b; a2873925c34ecbd2_gr_last_sent_sid_with_cs1=09717eea-b121-4a1c-803c-4ae6a42df20b; a2873925c34ecbd2_gr_cs1=tian-yi-15; a2873925c34ecbd2_gr_session_id_sent_vst=09717eea-b121-4a1c-803c-4ae6a42df20b',
        'Origin':'https://leetcode.cn',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
    }
    data_json = {
        'operationName': "questionData",
        'query': "query questionData($titleSlug: String!) {\n  question(titleSlug: $titleSlug) {\n    questionId\n    questionFrontendId\n    categoryTitle\n    boundTopicId\n    title\n    titleSlug\n    content\n    translatedTitle\n    translatedContent\n    isPaidOnly\n    difficulty\n    likes\n    dislikes\n    isLiked\n    similarQuestions\n    contributors {\n      username\n      profileUrl\n      avatarUrl\n      __typename\n    }\n    langToValidPlayground\n    topicTags {\n      name\n      slug\n      translatedName\n      __typename\n    }\n    companyTagStats\n    codeSnippets {\n      lang\n      langSlug\n      code\n      __typename\n    }\n    stats\n    hints\n    solution {\n      id\n      canSeeDetail\n      __typename\n    }\n    status\n    sampleTestCase\n    metaData\n    judgerAvailable\n    judgeType\n    mysqlSchemas\n    enableRunCode\n    envInfo\n    book {\n      id\n      bookName\n      pressName\n      source\n      shortDescription\n      fullDescription\n      bookImgUrl\n      pressImgUrl\n      productUrl\n      __typename\n    }\n    isSubscribed\n    isDailyQuestion\n    dailyRecordStatus\n    editorType\n    ugcQuestionId\n    style\n    exampleTestcases\n    jsonExampleTestcases\n    __typename\n  }\n}\n",
        'variables': {'titleSlug': titleSlug}
    }   
    try:
        response = requests.post(url, headers=headers, json=data_json)
        response.raise_for_status()  # 检查请求是否成功
        if index % 1000 == 0:
            print(f"LeetCode获取具体题目描述第{index}次 response：{response}")
        if response.status_code == 200:
            # 解析响应数据
            data = response.json()
            questionList = data['data']['question']['translatedContent']
            return questionList
        else:
            print('获取具体题目描述请求失败')
    except requests.exceptions.RequestException as e:
        print(f"LeetCode获取具体题目描述第{index}次 请求异常: {e}")
    except Exception as e:
        print(f"LeetCode获取具体题目描述第{index}次 请求异常: {e}")


# 爬取数据
skip = 0
new_question_list = []
while True:
    question_list = fetch_leetcode_data(skip)
    new_question_list.extend(question_list)
    # print('当前数据长度:', len(new_question_list))
    # print('当前数据skip:', skip)
    if len(question_list) < 50 or skip > 500000:
        print('获取题目列表结束')
        break
    skip += 50

# 数据提取逻辑
questionHandle = []
for index, question in enumerate(new_question_list):
    problemsName = f' {index+1}.'+ question['titleCn']
    hardRate = question['difficulty']
    paidOnly = question['paidOnly']#是否付费 true表示付费 false表示不付费
    passRate = "{:.2%}".format(question['acRate'])
    problemsUrl = 'https://leetcode.cn/problems/'+question['titleSlug']+'/'
    solutionsUrl = 'https://leetcode.cn/problems/'+question['titleSlug']+'/solution'
    problemsDesc = fetch_leetcode_desc(question['titleSlug'],index)
    newEntry = {
        "problemsName": problemsName,
        "hardRate": hardRate,
        "passRate": passRate,
        "problemsUrl": problemsUrl,
        "solutionsUrl": solutionsUrl,
        "problemsDesc": problemsDesc,
        "isPlus": paidOnly
    }
    questionHandle.append(newEntry)
    pageNum = 50 # 题目数量
    if (index+1) % pageNum == 0 and index>0:
        save_response_to_file(index//pageNum,questionHandle)
        questionHandle = []
        print(f"保存文件第{index//pageNum+1}次，整个数据长度{len(new_question_list)}")
        continue
    elif index  == len(new_question_list)-1 or index > 30050:
        save_response_to_file(index // pageNum,questionHandle)
        print('循环结束')
        break
    else:
        continue

