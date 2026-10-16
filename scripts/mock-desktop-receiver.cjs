// ============================================================================
// 模块名称：MayflyMods 电脑端极简信令接收伴侣服务 (Mock Desktop Receiver)
// 功能描述：模拟电脑端 Mayfly 监听 9876 端口与订阅 MQTT 管道，接收手机端的远程安装信令
// 用途：用于端到端通信自测与演示，验证“手机点菜、电脑做菜”闭环
// ============================================================================

const http = require('http');

const PORT = 9876;
const DEVICE_TOKEN = 'MF-PC-8891';
const MQTT_WS_URL = 'wss://broker.emqx.io:8084/mqtt';
const MQTT_TOPIC = `mayfly/push/${DEVICE_TOKEN}`;

console.log('====================================================');
console.log('🚀 MayflyMods 电脑端远程安装接收服务已启动');
console.log(`📡 局域网监听端口: ${PORT}`);
console.log(`🔑 设备配对 Token: ${DEVICE_TOKEN}`);
console.log(`☁️  外网云推订阅主题: ${MQTT_TOPIC}`);
console.log(`🔗 局域网推送端点: http://127.0.0.1:${PORT}/api/remote-install`);
console.log('====================================================\n');

/**
 * 打印收到的手机端信令
 */
function handleReceivedPayload(payload, channel) {
  console.log(`\n[💻 电脑 Mayfly 收到手机远程安装信令] (通道: ${channel})`);
  console.log('----------------------------------------------------');
  console.log(`🎮 目标游戏: ${payload.gameName || payload.gameId}`);
  console.log(`📦 模组名称: ${payload.title}`);
  if (payload.fileName) {
    console.log(`📄 指定文件: ${payload.fileName} (FileID: ${payload.fileId || '默认'}, 大小: ${payload.fileSize || '未知'})`);
  } else {
    console.log(`📄 指定文件: [未指定，默认调度主文件 MAIN]`);
  }
  console.log(`🆔 平台来源: ${payload.sourceType} (ID: ${payload.sourceModId})`);
  console.log(`🔑 配对Token: ${payload.deviceToken}`);
  console.log(`⏰ 投递时间: ${new Date(payload.timestamp || Date.now()).toLocaleString()}`);
  console.log('----------------------------------------------------');
  console.log('⚡ 触发底层动作: 调起 download-runner.ts 启动下载...');
  console.log('⚡ 触发底层动作: 调起 mod-install-runner.ts 准备解构与补齐前置...\n');
}

// ----------------------------------------------------------------------------
// 1. 创建本地 HTTP 监听服务 (局域网通道)
// ----------------------------------------------------------------------------
const server = http.createServer((req, res) => {
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
        handleReceivedPayload(payload, '局域网 HTTP');

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
  console.log(`[HTTP] 局域网监听就绪，同一 WiFi 下手机可秒级直连。`);
});

// ----------------------------------------------------------------------------
// 2. 连接公共 MQTT Broker 订阅外网云推通道 (发完即焚、随处遥控)
// ----------------------------------------------------------------------------
function startMqttSubscriber() {
  if (typeof globalThis.WebSocket === 'undefined') {
    console.log('[MQTT] 当前环境无原生 WebSocket，跳过外网云推订阅。');
    return;
  }

  try {
    const ws = new globalThis.WebSocket(MQTT_WS_URL, ['mqtt']);

    ws.onopen = () => {
      console.log(`[MQTT] 已连接外网公共云管道，正在订阅 ${MQTT_TOPIC}...`);
      // 发送 CONNECT
      const clientId = 'mf_pc_' + Math.random().toString(16).slice(2, 8);
      const connectPkt = buildMqttConnect(clientId);
      ws.send(connectPkt);

      // 发送 SUBSCRIBE
      setTimeout(() => {
        const subPkt = buildMqttSubscribe(MQTT_TOPIC);
        ws.send(subPkt);
        console.log(`[MQTT] ✓ 成功订阅云通道！手机在外网蜂窝网络下也可随处遥控安装。`);
      }, 300);
    };

    ws.onmessage = (event) => {
      try {
        const data = event.data;
        // 解析 MQTT PUBLISH 报文中的 JSON 载荷
        let text = '';
        if (typeof data === 'string') {
          text = data;
        } else if (data instanceof ArrayBuffer) {
          const uint8 = new Uint8Array(data);
          // 查找 JSON 起始位置
          const jsonStart = uint8.findIndex((b) => b === 0x7b /* '{' */);
          if (jsonStart >= 0) {
            text = new TextDecoder().decode(uint8.slice(jsonStart));
          }
        }

        if (text && text.includes('{') && text.includes('}')) {
          const cleanJson = text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1);
          const payload = JSON.parse(cleanJson);
          if (payload.action === 'remote_install') {
            handleReceivedPayload(payload, '外网公共云管道 (MQTT)');
          }
        }
      } catch (err) {
        // 忽略非目标格式数据包
      }
    };

    ws.onerror = (e) => {
      // 容错重连
    };

    ws.onclose = () => {
      // 10 秒后自动重连保持长连接
      setTimeout(startMqttSubscriber, 10000);
    };
  } catch (e) {
    console.warn('[MQTT] 初始化外网通道异常:', e.message);
  }
}

// 辅助二进制报文构造
function buildMqttConnect(clientId) {
  const pName = 'MQTT';
  const vHeader = [0, pName.length, ...Buffer.from(pName), 4, 0x02, 0, 60];
  const payload = [0, clientId.length, ...Buffer.from(clientId)];
  const remainingLen = vHeader.length + payload.length;
  return Buffer.from([0x10, ...encodeMqttLen(remainingLen), ...vHeader, ...payload]);
}

function buildMqttSubscribe(topic) {
  const topicBuf = Buffer.from(topic);
  const vHeader = [0, 1]; // Packet Identifier = 1
  const payload = [0, topicBuf.length, ...topicBuf, 0]; // QoS 0
  const remainingLen = vHeader.length + payload.length;
  return Buffer.from([0x82, ...encodeMqttLen(remainingLen), ...vHeader, ...payload]);
}

function encodeMqttLen(len) {
  const bytes = [];
  let x = len;
  do {
    let b = x % 128;
    x = Math.floor(x / 128);
    if (x > 0) b = b | 128;
    bytes.push(b);
  } while (x > 0);
  return bytes;
}

startMqttSubscriber();
