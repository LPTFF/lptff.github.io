#!/usr/bin/env sh

# 确保脚本抛出遇到的错误
set -e

# 环境集成
npm i

# 生成静态文件
npm run build

# 进入生成的文件夹
cd src/.vuepress/dist

# 如果是发布到自定义域名
echo 'tangff.life' > CNAME

git init
git add -A
# 时间戳2023-05-16日15时02分13秒格式提交
git commit -m $(date +%F日%H时%M分%S秒)

# 发布
git push -f "https://gitee.com/love-tff/lptff.github.io.git" HEAD:gitee-pages