#!/usr/bin/env node
/**
 * MCP Client API Server
 *
 * 将MCP客户端封装成HTTP API服务器，提供POST接口来处理查询
 */
import express from 'express';
import cors from 'cors';
import { MCPClient } from './mcpClient.js';
import { validateEnv } from './utils/config.js';
import { clearLogs } from './utils/log.js';
const app = express();
const PORT = process.env.PORT || 3001;
// 全局MCP客户端实例
let mcpClient = null;
let isInitialized = false;
let initializationError = null;
// 中间件配置
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
// 请求日志中间件
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});
/**
 * 初始化MCP客户端
 */
async function initializeMCPClient() {
    try {
        console.log('正在初始化MCP客户端...');
        // 清空日志目录
        clearLogs();
        // 验证环境变量
        validateEnv();
        // 创建MCP客户端实例
        mcpClient = new MCPClient();
        // 连接到MCP服务器 - 使用默认配置
        const serverIdentifier = 'mongodb';
        const configPath = './mcp-servers.json';
        console.log(`正在连接到服务器: ${serverIdentifier} (使用配置文件: ${configPath})`);
        await mcpClient.connectToServer(serverIdentifier, configPath);
        isInitialized = true;
        initializationError = null;
        console.log('MCP客户端初始化成功！');
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        initializationError = errorMessage;
        isInitialized = false;
        console.error('MCP客户端初始化失败:', errorMessage);
        throw error;
    }
}
/**
 * 健康检查接口
 */
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        mcpClient: {
            initialized: isInitialized,
            error: initializationError
        }
    });
});
/**
 * 获取服务状态
 */
app.get('/status', (req, res) => {
    res.json({
        service: 'MCP Client API Server',
        version: '1.0.0',
        status: isInitialized ? 'ready' : 'initializing',
        mcpClient: {
            initialized: isInitialized,
            error: initializationError
        },
        timestamp: new Date().toISOString()
    });
});
/**
 * 重新初始化MCP客户端
 */
app.post('/reinitialize', async (req, res) => {
    try {
        // 清理现有客户端
        if (mcpClient) {
            await mcpClient.cleanup();
            mcpClient = null;
        }
        // 重新初始化
        await initializeMCPClient();
        res.json({
            success: true,
            message: 'MCP客户端重新初始化成功',
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        res.status(500).json({
            success: false,
            error: errorMessage,
            timestamp: new Date().toISOString()
        });
    }
});
/**
 * 主要的查询处理接口
 */
app.post('/query', async (req, res) => {
    try {
        // 检查MCP客户端是否已初始化
        if (!isInitialized || !mcpClient) {
            return res.status(503).json({
                success: false,
                error: 'MCP客户端未初始化或初始化失败',
                details: initializationError,
                timestamp: new Date().toISOString()
            });
        }
        // 获取查询内容
        const { query, message } = req.body;
        const queryText = query || message;
        if (!queryText || typeof queryText !== 'string') {
            return res.status(400).json({
                success: false,
                error: '请提供有效的查询内容（query 或 message 字段）',
                timestamp: new Date().toISOString()
            });
        }
        console.log(`收到查询: ${queryText}`);
        // 处理查询
        const startTime = Date.now();
        const response = await mcpClient.processQuery(queryText);
        const processingTime = Date.now() - startTime;
        console.log(`查询处理完成，耗时: ${processingTime}ms`);
        // 返回结果
        res.json({
            response: response
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('处理查询时出错:', errorMessage);
        res.status(500).json({
            success: false,
            error: '处理查询时出错',
            details: errorMessage,
            timestamp: new Date().toISOString()
        });
    }
});
/**
 * 批量查询接口
 */
app.post('/batch-query', async (req, res) => {
    try {
        // 检查MCP客户端是否已初始化
        if (!isInitialized || !mcpClient) {
            return res.status(503).json({
                success: false,
                error: 'MCP客户端未初始化或初始化失败',
                details: initializationError,
                timestamp: new Date().toISOString()
            });
        }
        const { queries } = req.body;
        if (!Array.isArray(queries) || queries.length === 0) {
            return res.status(400).json({
                success: false,
                error: '请提供有效的查询数组（queries 字段）',
                timestamp: new Date().toISOString()
            });
        }
        console.log(`收到批量查询，共 ${queries.length} 个查询`);
        const startTime = Date.now();
        const results = [];
        // 逐个处理查询
        for (let i = 0; i < queries.length; i++) {
            const query = queries[i];
            if (typeof query !== 'string') {
                results.push({
                    index: i,
                    query: query,
                    success: false,
                    error: '查询必须是字符串类型'
                });
                continue;
            }
            try {
                const response = await mcpClient.processQuery(query);
                results.push({
                    index: i,
                    query: query,
                    success: true,
                    response: response
                });
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                results.push({
                    index: i,
                    query: query,
                    success: false,
                    error: errorMessage
                });
            }
        }
        const processingTime = Date.now() - startTime;
        console.log(`批量查询处理完成，耗时: ${processingTime}ms`);
        res.json({
            success: true,
            totalQueries: queries.length,
            results: results,
            processingTime: processingTime,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('处理批量查询时出错:', errorMessage);
        res.status(500).json({
            success: false,
            error: '处理批量查询时出错',
            details: errorMessage,
            timestamp: new Date().toISOString()
        });
    }
});
/**
 * 错误处理中间件
 */
app.use((error, req, res, next) => {
    console.error('未处理的错误:', error);
    res.status(500).json({
        success: false,
        error: '服务器内部错误',
        timestamp: new Date().toISOString()
    });
});
/**
 * 404处理
 */
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: '接口不存在',
        path: req.originalUrl,
        timestamp: new Date().toISOString()
    });
});
/**
 * 优雅关闭处理
 */
process.on('SIGINT', async () => {
    console.log('\n收到关闭信号，正在清理资源...');
    if (mcpClient) {
        try {
            await mcpClient.cleanup();
            console.log('MCP客户端资源清理完成');
        }
        catch (error) {
            console.error('清理MCP客户端资源时出错:', error);
        }
    }
    process.exit(0);
});
/**
 * 启动服务器
 */
async function startServer() {
    try {
        // 初始化MCP客户端
        await initializeMCPClient();
        // 启动HTTP服务器
        app.listen(PORT, () => {
            console.log('\n===============================');
            console.log(`  MCP Client API Server 已启动!`);
            console.log(`  端口: ${PORT}`);
            console.log(`  健康检查: http://localhost:${PORT}/health`);
            console.log(`  服务状态: http://localhost:${PORT}/status`);
            console.log(`  查询接口: POST http://localhost:${PORT}/query`);
            console.log(`  批量查询: POST http://localhost:${PORT}/batch-query`);
            console.log('===============================\n');
        });
    }
    catch (error) {
        console.error('启动服务器失败:', error);
        process.exit(1);
    }
}
// 启动服务器
startServer();
