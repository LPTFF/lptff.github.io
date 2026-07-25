<!-- BEGIN vscode-context-mcp -->
## VS Code Context MCP — Available Tools

This project uses the **VS Code Smart Context MCP** extension, which runs an MCP server
inside VS Code and exposes 31 workspace-aware tools. Use these tools via MCP to interact
with the editor, file system, and language intelligence.

### File Tools
- `read_file` — Read file contents with optional line range
- `write_file` — Create or edit files in the workspace
- `list_directory` — List directory contents recursively
- `file_search` — Glob-based file search across the workspace
- `text_search` — Full-text / regex search in workspace files
- `get_changes` — Show uncommitted git changes (diff)

### Execute Tools
- `execute_command` — Run shell commands in the VS Code integrated terminal
- `terminal_last_command` — Retrieve the last terminal command and its output
- `terminal_selection` — Get the current terminal selection text

### Intelligence Tools
- `get_diagnostics` — Get compiler/linter errors and warnings
- `get_file_symbols` — List all symbols (functions, classes, variables) in a file
- `get_workspace_symbols` — Search symbols across the entire workspace
- `find_references` — Find all references to a symbol
- `find_symbol_definition` — Jump to a symbol's definition
- `find_symbol_references` — Find references to a symbol by name
- `go_to_definition` — Navigate to the definition of a symbol at a position
- `get_hover_info` — Get hover/tooltip information for a symbol
- `get_implementations` — Find all implementations of an interface or abstract method
- `get_call_hierarchy` — Get incoming/outgoing call hierarchy for a function
- `get_code_actions` — Get available code actions (quick fixes, refactors) at a position
- `rename_symbol` — Rename a symbol across the entire workspace
- `resolve_symbol` — Resolve a symbol to its full qualified name and location
- `get_codebase_graph` — Build a high-level graph of the codebase structure

### Editor Tools
- `get_active_file` — Get the currently active editor file path and content
- `get_selection` — Get the current text selection in the active editor
- `get_open_files` — List all currently open editor tabs
- `get_problems` — Get all problems/diagnostics from the Problems panel

### Todo Tools
- `todo_list` — List all todo items
- `todo_add` — Add a new todo item
- `todo_complete` — Mark a todo item as complete
- `todo_remove` — Remove a todo item

### Usage Notes

- The MCP server runs locally inside VS Code on a configurable port (default 3785).
- All file paths are relative to the workspace root unless specified otherwise.
- Intelligence tools leverage the VS Code LSP — results depend on language extensions being active.
- `execute_command` may require user approval depending on the extension settings.
<!-- END vscode-context-mcp -->
