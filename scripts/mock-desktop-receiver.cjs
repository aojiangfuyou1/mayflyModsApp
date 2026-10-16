// ============================================================================
// 模块名称：MayflyMods 电脑端极简信令接收伴侣服务 (Mock Desktop Receiver)
// 功能描述：模拟电脑端 Mayfly 监听 9876 端口与订阅 MQTT 管道，接收手机端的远程安装信令
// 用途：用于端到端通信自测与演示，验证“手机点菜、电脑做菜”闭环
// ============================================================================

const http = require('http');

const PORT = 9876;
const DEVICE_TOKEN = 'MF-PC-8891';

console.log('====================================================');
console.log('🚀 MayflyMods 电脑端远程安装接收服务已启动');
console.log(`📡 本地监听端口: ${PORT}`);
console.log(`🔑 设备配对 Token: ${DEVICE_TOKEN}`);
console.log(`🔗 局域网推送端点: http://127.0.0.1:${PORT}/api/remote-install`);
console.log('====================================================\n');

// 1. 创建本地 HTTP 监听服务
const server = http.createServer((req, res) => {
  // 设置 CORS 跨域响应头，方便各种前端与小程序调试
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // 连通性探测接口
  if (req.url === '/api/ping') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', device: 'MayflyDesktop', version: '1.5.1' }));
    return;
  }

  // 接收手机端远程安装控制信令
  if (req.url === '/api/remote-install' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        console.log('\n[💻 电脑 Mayfly 收到手机远程安装信令]');
        console.log('----------------------------------------------------');
        console.log(`🎮 目标游戏: ${payload.gameName || payload.gameId}`);
        console.log(`📦 模组名称: ${payload.title}`);
        console.log(`🆔 平台来源: ${payload.sourceType} (ID: ${payload.sourceModId})`);
        console.log(`🔑 配对Token: ${payload.deviceToken}`);
        console.log(`⏰ 投递时间: ${new Date(payload.timestamp).toLocaleString()}`);
        console.log('----------------------------------------------------');
        console.log('⚡ 触发底层动作: 调起 download-runner.ts 启动下载...');
        console.log('⚡ 触发底层动作: 调起 mod-install-runner.ts 准备解构与补齐前置...\n');

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          message: `已接收《${payload.title}》安装指令，下载任务已入列。`
        }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: '信令格式非法' }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end('Not Found');
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[HTTP] 局域网监听就绪，随时等待手机端投递信令...\n`);
});
