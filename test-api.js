/**
 * API测试脚本
 * 用于测试MCP Client API Server的各个接口
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3000';

// 测试健康检查
async function testHealth() {
  console.log('\n=== 测试健康检查接口 ===');
  try {
    const response = await axios.get(`${API_BASE}/health`);
    console.log('✅ 健康检查成功:', response.data);
  } catch (error) {
    console.error('❌ 健康检查失败:', error.response?.data || error.message);
  }
}

// 测试服务状态
async function testStatus() {
  console.log('\n=== 测试服务状态接口 ===');
  try {
    const response = await axios.get(`${API_BASE}/status`);
    console.log('✅ 服务状态获取成功:', response.data);
  } catch (error) {
    console.error('❌ 服务状态获取失败:', error.response?.data || error.message);
  }
}

// 测试单个查询
async function testQuery() {
  console.log('\n=== 测试单个查询接口 ===');
  try {
    const response = await axios.post(`${API_BASE}/query`, {
      query: '请帮我查询数据库中标题包含"大豆"的文献，返回前5条记录的pmid'
    });
    console.log('✅ 查询成功:');
    console.log('查询:', response.data.query);
    console.log('回复:', response.data.response);
    console.log('处理时间:', response.data.processingTime + 'ms');
  } catch (error) {
    console.error('❌ 查询失败:', error.response?.data || error.message);
  }
}

// 测试批量查询
async function testBatchQuery() {
  console.log('\n=== 测试批量查询接口 ===');
  try {
    const response = await axios.post(`${API_BASE}/batch-query`, {
      queries: [
        '查询数据库中有多少条文献记录',
        '查询最新发表的5篇文献的pmid',
        '查询作者包含"Zhang"的文献数量'
      ]
    });
    console.log('✅ 批量查询成功:');
    console.log('总查询数:', response.data.totalQueries);
    console.log('处理时间:', response.data.processingTime + 'ms');
    response.data.results.forEach((result, index) => {
      console.log(`\n查询 ${index + 1}:`, result.query);
      if (result.success) {
        console.log('回复:', result.response);
      } else {
        console.log('错误:', result.error);
      }
    });
  } catch (error) {
    console.error('❌ 批量查询失败:', error.response?.data || error.message);
  }
}

// 运行所有测试
async function runAllTests() {
  console.log('开始测试 MCP Client API Server...');
  
  await testHealth();
  await testStatus();
  
  // 等待一下，确保MCP客户端完全初始化
  console.log('\n等待2秒，确保MCP客户端完全初始化...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  await testQuery();
  await testBatchQuery();
  
  console.log('\n=== 测试完成 ===');
}

// 如果直接运行此脚本
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testHealth,
  testStatus,
  testQuery,
  testBatchQuery,
  runAllTests
};