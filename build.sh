#!/usr/bin/env sh

# 确保脚本抛出遇到的错误
set -e
# 检查当前操作系统
echo "OSTYPE  $OSTYPE"
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux 系统
    echo "Detected Linux OS"
    echo "Installing Python..."

    # 在此处添加适用于 Linux 系统的安装命令
    sudo apt-get update
    sudo apt-get install python3

elif [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS 系统
    echo "Detected macOS"
    echo "Installing Python..."

    # 在此处添加适用于 macOS 系统的安装命令
    brew update
    brew install python@3
elif [[ "$OSTYPE" == "msys"* ]]; then
    # win 系统
    echo "Unsupported Windows"
    # 在此处添加适用于 macOS 系统的安装命令
    exit 1
else
    # 其他操作系统
    echo "Detected deafault OS"
    echo "Installing Python..."

    # 在此处添加适用于 Linux 系统的安装命令
    sudo apt-get update
    sudo apt-get install python3
    # exit 1

fi

# 验证安装是否成功
python_version=$(python --version 2>&1)
echo "python_version  $python_version"
if [[ "$python_version" == *"Python"* ]]; then
    echo "Python installation successful"
else
    echo "Python installation failed"
fi
# python 环境集成
pip install requests
pip install cryptography
pip install pyOpenSSL
pip install certifi
pip install beautifulsoup4
pip install pytz
pip install selenium
# 运行爬虫脚本
# Function to display formatted time
display_time() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Function to run and time the script
run_script() {
    display_time "Running $1"
    start_time=$(date +%s)

    python "./src/crawl/$1"

    end_time=$(date +%s)
    elapsed_time=$((end_time - start_time))
    display_time "$1 finished in $elapsed_time seconds"
}

# Run the main scripts
run_script "welfare.py"
run_script "infzm.py"
run_script "juejin.py"
run_script "kuaishou.py"
run_script "weibo.py"
run_script "v2ex.py"
run_script "githubTrending.py"
# 获取当前时间的小时和时区
current_hour=$(TZ='Asia/Shanghai' date +"%H")
current_timezone=$(date +"%Z")

# 判断当前时间是否在指定的时间范围内（晚上10点至第二日凌晨4点）
if [ "$current_hour" -ge 22 ] || [ "$current_hour" -lt 4 ]; then
  echo "北京时间$current_hour，满足条件执行更新特殊脚本"
  run_script "douban.py"
  run_script "leetCode.py"
  run_script "zhipin.py"
else
  echo "北京时间$current_hour，不满足条件执行更新特殊脚本"
fi

