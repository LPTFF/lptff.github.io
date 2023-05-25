#!/usr/bin/env sh

# 确保脚本抛出遇到的错误
set -e
# 检查当前操作系统
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

else
    # 其他操作系统
    echo "Unsupported OS"
    # exit 1

fi

# 验证安装是否成功
python_version=$(python --version 2>&1)
if [[ "$python_version" == *"Python"* ]]; then
    echo "Python installation successful"
else
    echo "Python installation failed"
fi
# python 环境集成
pip install requests
# 运行Python脚本
python crawlData.py
# 打包生成静态文件
npm run build
