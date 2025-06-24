# MCP Client API Server 使用说明

本项目基于ConardLi的mcp-client-nodejs进行了二次开发，它将原有的命令行MCP客户端封装成了HTTP API服务。


## 快速开始

### 1. 克隆仓库

```bash
git clone
cd mcp-client-nodejs
```

### 2. 安装依赖

```bash
npm install
```

### 3. 构建项目

```bash
npm run build
```

### 4. 配置环境变量


复制示例环境变量文件并设置您的 LLM API 密钥：

```bash
cp .env.example .env
```

然后编辑 `.env` 文件，填入您的 LLM API 密钥、模型提供商 API 地址、以及模型名称：

```
OPENAI_API_KEY=your_api_key_here
MODEL_NAME=xxx
BASE_URL=xxx

确保 `.env` 文件包含必要的配置：

```env
OPENAI_API_KEY=your_api_key_here
MODEL_NAME=gpt-4
BASE_URL=https://api.openai.com/v1
```

### 5. 配置MCP服务器连接

复制mcp-servers.example.json并编辑 `mcp-servers.json` 文件，填入您的MCP服务器连接信息：

```json
{
  "mcpServers": {
    "mongodb": {
      "command": "npx",
      "args": [
        "mcp-mongo-server",
        "mongodb://localhost:27017/studentManagement?authSource=admin"
      ]
    }
  },
  "defaultServer": "mongodb",
  "system": "这里填写系统提示词"
}
```

### 6. 启动API服务器

```bash
npm run api
```

服务器将在端口 3000 启动（可通过环境变量 `PORT` 修改）。

## API 接口

### 健康检查

**GET** `/health`

检查服务器和MCP客户端的状态。

**响应示例：**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "mcpClient": {
    "initialized": true,
    "error": null
  }
}
```

### 服务状态

**GET** `/status`

获取详细的服务状态信息。

**响应示例：**
```json
{
  "service": "MCP Client API Server",
  "version": "1.0.0",
  "status": "ready",
  "mcpClient": {
    "initialized": true,
    "error": null
  },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### 单个查询

**POST** `/query`

处理单个查询请求。

**请求体：**
```json
{
  "query": "你的查询内容"
}
```

或者：
```json
{
  "message": "你的查询内容"
}
```

**响应示例：**
```json
{
  "response": "AI助手的回复内容"
}
```

### 批量查询

**POST** `/batch-query`

处理多个查询请求。

**请求体：**
```json
{
  "queries": [
    "第一个查询",
    "第二个查询",
    "第三个查询"
  ]
}
```

**响应示例：**
```json
{
  "success": true,
  "totalQueries": 3,
  "results": [
    {
      "index": 0,
      "query": "第一个查询",
      "success": true,
      "response": "第一个回复"
    },
    {
      "index": 1,
      "query": "第二个查询",
      "success": true,
      "response": "第二个回复"
    },
    {
      "index": 2,
      "query": "第三个查询",
      "success": false,
      "error": "处理错误信息"
    }
  ],
  "processingTime": 3000,
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### 重新初始化

**POST** `/reinitialize`

重新初始化MCP客户端连接。

**响应示例：**
```json
{
  "success": true,
  "message": "MCP客户端重新初始化成功",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## 使用示例

### 使用 curl

```bash
# 健康检查
curl http://localhost:3000/health

# 发送查询
curl -X POST http://localhost:3000/query \
  -H "Content-Type: application/json" \
  -d '{"query": "帮我查询数据库中的信息"}'

# 批量查询
curl -X POST http://localhost:3000/batch-query \
  -H "Content-Type: application/json" \
  -d '{"queries": ["查询1", "查询2", "查询3"]}'
```

### 使用 JavaScript/Node.js

```javascript
const axios = require('axios');

const API_BASE = 'http://localhost:3000';

// 单个查询
async function sendQuery(query) {
  try {
    const response = await axios.post(`${API_BASE}/query`, {
      query: query
    });
    console.log('回复:', response.data.response);
    return response.data;
  } catch (error) {
    console.error('查询失败:', error.response?.data || error.message);
  }
}

// 批量查询
async function sendBatchQuery(queries) {
  try {
    const response = await axios.post(`${API_BASE}/batch-query`, {
      queries: queries
    });
    console.log('批量查询结果:', response.data.results);
    return response.data;
  } catch (error) {
    console.error('批量查询失败:', error.response?.data || error.message);
  }
}

// 使用示例
sendQuery('帮我查询数据库中的大豆相关文献');
sendBatchQuery([
  '查询标题包含"大豆"的文献',
  '查询2024年发表的文献',
  '查询作者包含"Zhang"的文献'
]);
```

### 使用 Python

```python
import requests
import json

API_BASE = 'http://localhost:3000'

def send_query(query):
    try:
        response = requests.post(f'{API_BASE}/query', 
                               json={'query': query})
        response.raise_for_status()
        data = response.json()
        print('回复:', data['response'])
        return data
    except requests.exceptions.RequestException as e:
        print('查询失败:', e)

def send_batch_query(queries):
    try:
        response = requests.post(f'{API_BASE}/batch-query', 
                               json={'queries': queries})
        response.raise_for_status()
        data = response.json()
        print('批量查询结果:', data['results'])
        return data
    except requests.exceptions.RequestException as e:
        print('批量查询失败:', e)

# 使用示例
send_query('帮我查询数据库中的大豆相关文献')
send_batch_query([
    '查询标题包含"大豆"的文献',
    '查询2024年发表的文献',
    '查询作者包含"Zhang"的文献'
])
```

## 错误处理

所有API接口都会返回统一格式的错误响应：

```json
{
  "success": false,
  "error": "错误描述",
  "details": "详细错误信息（可选）",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

常见错误码：
- `400`: 请求参数错误
- `503`: MCP客户端未初始化或初始化失败
- `500`: 服务器内部错误

## 配置说明

API服务器会自动读取 `mcp-servers.json` 配置文件，并连接到 `mongodb` 服务器。如需修改配置，请编辑该文件。

## 日志

服务器运行时会在控制台输出详细的日志信息，包括：
- 请求日志
- MCP客户端初始化状态
- 查询处理时间
- 错误信息

## 注意事项

1. 确保MongoDB服务正在运行，且连接字符串正确
2. 确保环境变量配置正确
3. API服务器启动时会自动初始化MCP客户端，如果初始化失败，可以使用 `/reinitialize` 接口重新初始化
4. 服务器支持优雅关闭，使用 Ctrl+C 可以正确清理资源