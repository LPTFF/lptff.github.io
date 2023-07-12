from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time
import json
import random

def common_to_job_detail(job_detail, options):
    navigate_to_job_driver = webdriver.Chrome(options=options)
    navigate_to_job_driver.get(job_detail)
    catchDescCss = '.job-sec-text'
    WebDriverWait(navigate_to_job_driver, 40).until(EC.presence_of_element_located((By.CSS_SELECTOR, catchDescCss)))
    jobDesc = navigate_to_job_driver.find_elements(By.CSS_SELECTOR, catchDescCss)[0].text
    navigate_to_job_driver.quit()
    return jobDesc

def retry_to_job_detail(job_detail, options, retry_count=3, wait_time=20):
    for _ in range(retry_count):
        try:
            jobDesc=common_to_job_detail(job_detail, options)
            return jobDesc
        except Exception as e:
            sleepTime=wait_time*(retry_count+1)
            print(f"导航到具体网页时发生错误,等待 {sleepTime} 秒后重新尝试导航")
            time.sleep(sleepTime)
    
    print(f"无法成功导航到具体网页")
    return []


def navigate_to_job_detail(job_detail, options):
    try:
        jobDesc = common_to_job_detail(job_detail, options)
        return jobDesc
    except Exception as e:
        print(f"导航到具体网页时发生错误")
        # 出现异常时重新尝试导航
        # jobDesc = retry_to_job_detail(job_detail, options)
        # return jobDesc
        return []



def simulate_scroll_to_bottom(driver):
    scroll_pause_time = 5  # 滚动间隔时间
    last_height = driver.execute_script("return document.documentElement.scrollHeight")  # 获取初始页面高度
    max_iterations = 100  # 最大循环次数
    iteration = 0  # 当前循环次数

    while True:
        print(f"Boss直聘第{iteration}次滚动")
        driver.execute_script("window.scrollTo(0, document.documentElement.scrollHeight);") # 模拟向下滚动到底部
        time.sleep(scroll_pause_time) # 等待页面加载
        new_height = driver.execute_script("return document.documentElement.scrollHeight") # 获取新的页面高度并与上次高度进行比较
        if new_height == last_height or iteration > max_iterations:
            # 页面高度未发生变化，已经滚动到底部
            print(f"Boss直聘滚动结束")
            break
        else:
            last_height = new_height
        # 更新循环计数器
        iteration += 1

def common_and_extract_data(url, options,page):
    navigate_and_extract_driver = webdriver.Chrome(options=options)
    jobList_handle = []
    navigate_and_extract_driver.get(url)# 导航到网页
    # 使用显式等待等待页面加载完成
    WebDriverWait(navigate_and_extract_driver, 40).until(EC.presence_of_element_located((By.CSS_SELECTOR, '.job-card-wrapper')))        
    # 模拟滚动到底部
    simulate_scroll_to_bottom(navigate_and_extract_driver)
    
    lis = navigate_and_extract_driver.find_elements(By.CSS_SELECTOR, '.job-card-wrapper')
    for index, li in enumerate(lis):
        brandUrlLogo = li.find_element(By.CSS_SELECTOR, '.company-logo')
        brandLogo = brandUrlLogo.find_elements(By.TAG_NAME, 'img')[0].get_attribute('src')
        brandName = li.find_element(By.CSS_SELECTOR, '.company-name').text
        bossTitle = li.find_element(By.CSS_SELECTOR, '.info-public em').text
        brandIndustry = li.find_element(By.CSS_SELECTOR, '.company-tag-list li').text
        salaryDesc = li.find_element(By.CSS_SELECTOR, '.job-info.clearfix span').text
        tagTmpList = li.find_element(By.CSS_SELECTOR, '.job-card-footer.clearfix ul')
        tagList = tagTmpList.find_elements(By.TAG_NAME, 'li')
        skills = [item.text for item in tagList]
        job_detail = li.find_element(By.CSS_SELECTOR, '.job-card-left').get_attribute('href')
        jobDesc = ''
        jobNum=index+page*30+1
        if jobNum % 20 == 0:
            print(f'第{jobNum}次导航到具体网页')
        wait_time = random.randint(5, 10)  # 生成随机的等待时间
        time.sleep(wait_time)    # 访问网站后随机时间内不再访问，不得低于5秒，最大不得超过20秒
        jobDesc = navigate_to_job_detail(job_detail, options)     
        new_entry = {
            "jobNum":jobNum ,
            "brandLogo": brandLogo,
            "brandName": brandName,
            "bossTitle": bossTitle,
            "brandIndustry": brandIndustry,
            "salaryDesc": salaryDesc,
            "skills": skills,
            "job_detail": job_detail,
            "jobDesc": jobDesc
        }
        jobList_handle.append(new_entry)
    navigate_and_extract_driver.quit()
    return jobList_handle

def retry_to_extract_data(url, options,page, retry_count=3, wait_time=20):
    for _ in range(retry_count):
        try:
            jobList_handle=common_and_extract_data(url, options,page)
            return jobList_handle
        except Exception as e:
            sleepTime=wait_time*(retry_count+1)
            print(f"导航到列表网页时发生错误,等待 {sleepTime} 秒后重新尝试导航")
            time.sleep(sleepTime)
    print(f"无法成功导航到列表网页")
    return []

def navigate_and_extract_data(url, options,page):
    try:
        jobList_handle=common_and_extract_data(url, options,page)
        return jobList_handle
    except Exception as e:
        print(f"导航到网页时发生错误")
        # 出现异常时关闭网页并等待20秒后重新访问
        # jobList_handle = retry_to_extract_data(url, options,page)
        # return jobList_handle
        return []

# proxy_list = [
#     'http://36.134.91.82',
#     'http://183.247.221.119',
#     'http://61.216.156.222',
#     'http://112.14.47.6'
# ]
# proxy = random.choice(proxy_list)
# print(f"Boss直聘选中的代理IP{proxy}")
options = webdriver.ChromeOptions()
options.add_argument('--ignore-ssl-errors=yes')
options.add_argument('--ignore-certificate-errors')
options.add_argument("--headless")  # 启用无头模式
# options.add_argument('--proxy-server=' + proxy)   # 使用选中的代理IP
# 设置自定义请求头
options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36")

# 调用 navigate_and_extract_data 函数，传入导航的网页链接
base_url = 'https://www.zhipin.com/web/geek/job'
query_params = {
    'city': '101020100',
    'experience': '104,105',
    'degree': '204,203',
    'position': '100901,100208',
    'jobType': '1901',
    'salary': '406'
}
page = 0
max_pages = 400
jobAllList = []
print(f"Boss直聘访问列表开始")
jobTmpAll = []  # 添加此行定义 jobTmpAll 变量
while page < max_pages: 
    prev_jobList_len = len(jobTmpAll)  # 添加此行定义 prev_jobList_len 变量
    wait_time = random.randint(5, 20)  # 生成随机的等待时间
    time.sleep(wait_time)    # 访问网站后随机时间内不再访问，不得低于5秒，最大不得超过20秒
    query_params['page'] = str(page)
    url = base_url + '?' + '&'.join([f"{k}={v}" for k, v in query_params.items()])
    print(f"Boss直聘第{page}次访问列表")
    
    jobTmpAll = navigate_and_extract_data(url, options,page)
    jobAllList.extend(jobTmpAll)
    
    if len(jobTmpAll) == 0 or len(jobTmpAll) == prev_jobList_len:
        break
    
    prev_jobList_len = len(jobTmpAll)
    page += 1


with open('./src/public/data/zhipin.json', 'w', encoding='utf-8') as file:
    json.dump(jobAllList, file, ensure_ascii=False, indent=4)
    print('Boss直聘分析数据导出成功')
