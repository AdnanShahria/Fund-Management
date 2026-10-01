---
name: codebase-memory-mcp
description: "High-performance code intelligence engine that indexes the codebase into a persistent structural knowledge graph (tree-sitter). Provides search_graph, trace_path, get_code_snippet, query_graph, get_architecture, detect_changes, and manage_adr."
---

# Codebase Memory MCP Skill

Use this skill to navigate, query, and trace the codebase using `codebase-memory-mcp`.

## MCP Tools & CLI Equivalent

When MCP tools are directly available in the agent's toolset, call them directly. If MCP tool invocation is pending a session reload, execute via the single binary CLI:
`C:\Users\Adnan\.local\bin\codebase-memory-mcp.exe cli <tool_name> [flags]`

Project identifier for this repository:
`C-Users-Adnan-Desktop-Orbit-SaaS-0.-Customer-Aurelia-Ribbi`

### 1. `get_architecture`
Get a structural architectural summary:
```bash
codebase-memory-mcp cli get_architecture --project C-Users-Adnan-Desktop-Orbit-SaaS-0.-Customer-Aurelia-Ribbi
```

### 2. `search_graph`
Search symbols (functions, classes, routes, components) by regex or name:
```bash
codebase-memory-mcp cli search_graph --project C-Users-Adnan-Desktop-Orbit-SaaS-0.-Customer-Aurelia-Ribbi --name-pattern ".*Auth.*"
```

### 3. `trace_path`
Trace inbound or outbound call chains:
```bash
codebase-memory-mcp cli trace_path --project C-Users-Adnan-Desktop-Orbit-SaaS-0.-Customer-Aurelia-Ribbi --function-name <FuncName> --direction inbound
```

### 4. `get_code_snippet`
Fetch the exact lines and implementation for any symbol:
```bash
codebase-memory-mcp cli get_code_snippet --project C-Users-Adnan-Desktop-Orbit-SaaS-0.-Customer-Aurelia-Ribbi --qualified-name <SymbolName>
```

### 5. `query_graph`
Run custom Cypher queries:
```bash
codebase-memory-mcp cli query_graph --project C-Users-Adnan-Desktop-Orbit-SaaS-0.-Customer-Aurelia-Ribbi --query "MATCH (f:Function) RETURN f.name LIMIT 10"
```

### 6. `detect_changes`
Perform impact analysis on unstaged/uncommitted files:
```bash
codebase-memory-mcp cli detect_changes --project C-Users-Adnan-Desktop-Orbit-SaaS-0.-Customer-Aurelia-Ribbi
```

### 7. `index_repository`
Force re-indexing:
```bash
codebase-memory-mcp cli index_repository --repo-path "C:/Users/Adnan/Desktop/Orbit SaaS/0. Customer/Aurelia-Ribbi"
```
