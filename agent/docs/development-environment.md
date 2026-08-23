# 开发环境与远程数据服务

本文档记录本项目本地开发环境与家庭服务器之间的运行时关系，避免将前端代码、Vite 代理和远程数据文件的路径混为一谈。

## 架构概览

```text
浏览器
  │
  └─ http://localhost:8090
       │ Vite 开发服务器
       │ /data/* 代理
       ▼
家庭服务器 192.168.1.100:5000
       │ http-server 工作目录：/root/Test
       └─ /data/fundHoldData.json
```

- 本地前端由 Vite 严格固定在 `8090` 端口提供，启动命令是 `npm run serve`；端口被占用时会直接启动失败，不会自动切换到 `8091`、`8092` 等端口。
- Live2D 模型包由 devDependencies 和锁文件管理。`npm install` 只需安装依赖；Vite 在开发时直接从 `node_modules` 提供模型，在生产构建时写入 `dist/live2dw/models/`，不维护 `project-support/public/live2dw/models/` 缓存，也没有安装后或启动前准备脚本。`npm run serve` 只启动 Vite；面试 Markdown 和投资脱敏快照同样由 Vite 直接读取唯一源文件。导航图标直连目标站点的官方 favicon 或官方 CDN，失败时显示首字符色块。
- Vite 开发服务器在 `vite.config.ts` 中将 `/data` 请求代理到 `http://192.168.1.100:5000`。
- 远程 HTTP 服务的工作目录是 `/root/Test`，因此 URL `/data/fundHoldData.json` 对应服务器文件 `/root/Test/data/fundHoldData.json`。
- 例如，基金持仓页面 [src/views/Message/FundHoldInfo.vue](../../src/views/Message/FundHoldInfo.vue) 使用 `fetch('/data/fundHoldData.json?...')`，开发时应通过 Vite 代理访问，不要在组件中写入远程绝对地址。

## 当前开发地址

| 用途 | 地址或路径 |
| --- | --- |
| 本地站点 | `http://localhost:8090` |
| 本地数据请求 | `http://localhost:8090/data/fundHoldData.json` |
| 远程数据服务 | `http://192.168.1.100:5000` |
| 远程基金数据文件 | `/root/Test/data/fundHoldData.json` |
| Vite 配置 | [`vite.config.ts`](../../vite.config.ts) 的 `server.proxy['/data']` |

`http://106.15.131.89:60080` 不属于当前本地开发环境的数据代理目标；修改代理目标时必须同步检查本文档和 [项目上下文](../context/project-context.md)。

## SSH 运维入口

经授权的家庭服务器 SSH 连接信息如下：

- 主机：`192.168.1.100`
- 端口：`22`
- 用户：`root`
- 远程数据目录：`/root/Test/data`

示例命令：

```bash
ssh -p 22 root@192.168.1.100
```

密码不写入仓库、源码、脚本、项目上下文、迭代日志或命令示例；实际凭据只能通过本地安全凭据管理方式提供。不要把密码提交到 Git，也不要在公开 issue、日志或聊天记录中重复传播。

## 排查顺序

1. 确认家庭服务器与当前开发机处于可互通的局域网，并确认 `192.168.1.100:5000` 可访问。
2. 直接检查 `http://192.168.1.100:5000/data/fundHoldData.json` 是否返回 JSON。
3. 启动或重启本地 `npm run serve`，使 Vite 重新加载 `vite.config.ts`。
4. 在浏览器开发者工具中检查 `/data/fundHoldData.json` 请求；页面代码应继续使用 `/data/...` 相对路径。
5. 若远程文件位置变化，同时更新远程 `http-server` 的工作目录、Vite 代理目标和本文档，并运行 `git diff --check`。

## 边界与注意事项

- 该远程服务是本地开发依赖，不等同于 GitHub Pages 的生产静态发布链路。
- `npm run build` 生成的静态站点不会自动携带家庭服务器上的数据文件；部署前必须明确数据文件的发布位置和访问策略。
- 不要为了绕过代理而把局域网地址硬编码到 Vue 页面组件中；统一通过 `/data` 代理保持开发环境可替换。
- 修改家庭服务器文件或服务进程前，先确认目标路径和当前服务状态；本次文档只记录架构，不执行远程文件修改或服务重启。
