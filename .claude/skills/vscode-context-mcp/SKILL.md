# VS Code 上下文 MCP 技能

该技能说明 VS Code Smart Context MCP 扩展提供的 31 个 MCP 工具。
MCP 服务在 VS Code 内运行，提供面向工作区的智能分析、文件操作、编辑器上下文和命令执行能力。

### 文件工具
- `read_file` — 读取文件内容，可指定行范围
- `write_file` — 在工作区创建或编辑文件
- `list_directory` — 递归列出目录内容
- `file_search` — 在工作区按 glob 模式搜索文件
- `text_search` — 在工作区进行文本或正则表达式搜索
- `get_changes` — 显示未提交的 Git 变更（差异）

### 执行工具
- `execute_command` — 在 VS Code 集成终端中运行 Shell 命令
- `terminal_last_command` — 获取上一次终端命令及其输出
- `terminal_selection` — 获取当前终端选中的文本

### 智能分析工具
- `get_diagnostics` — 获取编译器、检查器和警告信息
- `get_file_symbols` — 列出文件中的所有符号（函数、类和变量）
- `get_workspace_symbols` — 搜索整个工作区中的符号
- `find_references` — 查找符号的所有引用
- `find_symbol_definition` — 跳转到符号定义
- `find_symbol_references` — 按符号名称查找引用
- `go_to_definition` — 跳转到当前符号的定义位置
- `get_hover_info` — 获取符号的悬停提示、类型信息和文档
- `get_implementations` — 查找接口或抽象方法的所有实现
- `get_call_hierarchy` — 获取符号的调用层级关系
- `get_code_actions` — 获取指定位置可用的代码操作、快速修复和重构
- `rename_symbol` — 在整个工作区重命名符号
- `resolve_symbol` — 解析符号的完整限定名称和位置
- `get_codebase_graph` — 构建代码库的高层结构图

### 编辑器工具
- `get_active_file` — 获取当前活动编辑器中的文件路径和完整内容
- `get_selection` — 获取当前编辑器中的文本选区
- `get_open_files` — 列出当前在 VS Code 中打开的文件标签页
- `get_problems` — 获取“问题”面板中的全部诊断信息

### 待办工具
- `todo_list` — 列出待办事项
- `todo_add` — 添加持久化的工作区待办事项
- `todo_complete` — 将工作区待办事项标记为已完成
- `todo_remove` — 移除工作区待办事项

## 使用时机

- 需要读取、写入、搜索或浏览工作区文件时，使用文件工具。
- 需要 LSP 分析（定义、引用、符号或诊断）时，使用智能分析工具。
- 需要运行 Shell 命令或查看终端状态时，使用执行工具。
- 需要了解用户当前编辑上下文时，使用编辑器工具。
- 需要管理任务列表时，使用待办工具。

## 注意事项

- 服务地址为 `http://127.0.0.1:<端口>/mcp`，默认端口为 3785。
- 智能分析工具要求相关语言扩展已在 VS Code 中启用。
- `execute_command` 可能需要用户批准后才能执行。
