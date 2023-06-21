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
# 运行爬虫脚本
python crawlData.py
python juejinData.py
node v2exData.js
# 打包生成静态文件
npm run build
