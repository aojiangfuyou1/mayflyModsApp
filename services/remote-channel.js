// ============================================================================
// 模块名称：MayflyMods 远程推送双通道中枢 (Remote Push Channel Service)
// 功能描述：规范化实现【局域网 HTTP 直接投递】与【外网免费 MQTT 发完即焚管道】双通道自适应调度
// 设计哲学：0 自建服务器存储、0 隐私泄露风险、随处遥控电脑安装
// ============================================================================

import { getDesktopConfig } from './nexus.js';
import { recordPushHistory } from './history.js';

// ----------------------------------------------------------------------------
// 区域 1：通道配置与常量定义
// ----------------------------------------------------------------------------

/** 全球公共免认证 MQTT Broker WebSocket 端点 (发完即焚) */
export const PUBLIC_MQTT_WS_ENDPOINT = 'wss://broker.emqx.io:8084/mqtt';

/** 公共 MQTT HTTP 发布网关 (部分平台不支持原生 WS 时的快速 HTTP 桥接) */
export const PUBLIC_MQTT_HTTP_BRIDGE = 'https://broker.emqx.io:8084/mqtt';

/**
 * 构建标准化 Mayfly 远程安装控制信令
 * @param {Object} modItem - 模组对象
 * @param {string} deviceToken - 目标电脑设备配对码
 * @returns {Object} 标准控制信令 JSON
 */
export function buildRemoteInstallPayload(modItem, deviceToken = 'MF-PC-8891') {
  const displayTitle = modItem.zhTitle || modItem.title || '未知模组';
  return {
    action: 'remote_install',
    deviceToken,
    gameId: modItem.game?.domainName || modItem.gameDomain || '',
    gameName: modItem.game?.name || modItem.gameName || '',
    sourceType: modItem.sourceType || 'nexus',
    sourceModId: String(modItem.modId || modItem.id),
    title: displayTitle,
    originalTitle: modItem.title || '',
    zhTitle: modItem.zhTitle || '',
    version: modItem.fileVersion || modItem.version || '1.0',
    coverImageUrl: modItem.coverImageUrl || '',
    downloadUrl: modItem.downloadUrl || '',
    fileId: modItem.fileId ? Number(modItem.fileId) : null,
    fileName: modItem.fileName || '',
    fileSize: modItem.fileSizeFormatted || modItem.fileSize || '',
    timestamp: Date.now()
  };
}

// ----------------------------------------------------------------------------
// 区域 2：通道 1 - 局域网 HTTP 直连推送 (首选模式：0 延迟、局域网安全)
// ----------------------------------------------------------------------------

/**
 * 通过同一 WiFi 局域网向电脑端 Mayfly 发送指令
 * @param {Object} payload - 控制信令
 * @param {string} host - 电脑 IP
 * @param {number} [port=28888] - 通信端口 (默认 28888)
 * @returns {Promise<{ success: boolean, message: string, channel?: string }>}
 */
export async function pushViaLanHttp(payload, host, port = 28888) {
  const cleanHost = String(host || '').trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  if (!cleanHost) {
    return { success: false, message: '电脑局域网 IP 地址未配置' };
  }

  const token = String(payload.deviceToken || payload.token || '').trim();

  // 1. 优先尝试电脑端原生 28888 助手端点 /api/action (无缝对接 Electron 内置副驾服务)
  const actionEndpoint = `http://${cleanHost}:${port}/api/action${token ? `?token=${encodeURIComponent(token)}` : ''}`;
  try {
    const res = await uni.request({
      url: actionEndpoint,
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'x-lan-token': token
      },
      data: {
        type: 'download-nexus-mod',
        action: 'remote_install',
        modId: payload.sourceModId || payload.modId,
        gameDomain: payload.gameId || payload.gameDomain,
        name: payload.title,
        ...payload
      },
      timeout: 3500
    });

    if (res.statusCode >= 200 && res.statusCode < 300) {
      const serverMsg = res.data && (res.data.message || res.data.msg);
      return {
        success: true,
        channel: 'LAN_HTTP',
        message: serverMsg || `《${payload.title}》已通过局域网直连投递至电脑 Mayfly 原生助手！`
      };
    }
  } catch (err) {
    // 降级尝试旧伴侣端点 /api/remote-install
  }

  // 2. 降级尝试伴侣端点 /api/remote-install
  const fallbackEndpoint = `http://${cleanHost}:${port}/api/remote-install`;
  try {
    const res = await uni.request({
      url: fallbackEndpoint,
      method: 'POST',
      header: {
        'Content-Type': 'application/json'
      },
      data: payload,
      timeout: 3000
    });

    if (res.statusCode >= 200 && res.statusCode < 300) {
      return {
        success: true,
        channel: 'LAN_HTTP',
        message: `《${payload.title}》已通过局域网秒级投递到电脑 Mayfly！`
      };
    }
  } catch (e) {}

  return {
    success: false,
    channel: 'LAN_HTTP',
    message: '局域网不可达或未在同一 WiFi 下'
  };
}

// ----------------------------------------------------------------------------
// 区域 3：通道 2 - 外网 MQTT 管道推送 (移动蜂窝模式：发完即焚、随处遥控)
// ----------------------------------------------------------------------------

/**
 * 通过公共 MQTT 通信管道发布发完即焚信令
 * @param {Object} payload - 控制信令
 * @param {string} deviceToken - 目标电脑设备配对码
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export async function pushViaPublicMqtt(payload, deviceToken) {
  const token = String(deviceToken || '').trim() || 'MF-PC-8891';
  const topic = `mayfly/push/${token}`;

  // 构造简易 MQTT 消息体（纯 JSON 广播）
  const messageStr = JSON.stringify(payload);

  return new Promise((resolve) => {
    // 采用 Uni-app 原生 WebSocket 连接公共 MQTT Broker 进行秒级广播
    let isSettled = false;
    let socketTask = null;

    const timeoutTimer = setTimeout(() => {
      if (!isSettled) {
        isSettled = true;
        try { socketTask?.close(); } catch (e) {}
        resolve({
          success: false,
          channel: 'PUBLIC_MQTT',
          message: '外网云通道连接超时，请检查手机网络'
        });
      }
    }, 6000);

    try {
      socketTask = uni.connectSocket({
        url: PUBLIC_MQTT_WS_ENDPOINT,
        protocols: ['mqtt'],
        complete: () => {}
      });

      socketTask.onOpen(() => {
        // 构建简易 MQTT 协议报文或直接通过管道发送
        // 简易 MQTT 报文封装 (MQTT 3.1.1 CONNECT + PUBLISH)
        const clientId = 'mf_app_' + Math.random().toString(16).slice(2, 8);
        const connectPkt = buildMqttConnectPacket(clientId);
        const publishPkt = buildMqttPublishPacket(topic, messageStr);

        socketTask.send({
          data: connectPkt,
          success: () => {
            // 稍作延迟发送 PUBLISH 包确保服务端建连完毕
            setTimeout(() => {
              socketTask.send({
                data: publishPkt,
                success: () => {
                  if (!isSettled) {
                    isSettled = true;
                    clearTimeout(timeoutTimer);
                    // 广播完成，发完即焚，优雅关闭连接
                    setTimeout(() => {
                      try { socketTask.close(); } catch (e) {}
                    }, 500);

                    resolve({
                      success: true,
                      channel: 'PUBLIC_MQTT',
                      message: `《${payload.title}》已通过外网公共云管道投递！电脑收到后将自动静默安装。`
                    });
                  }
                },
                fail: () => {
                  if (!isSettled) {
                    isSettled = true;
                    clearTimeout(timeoutTimer);
                    resolve({
                      success: false,
                      channel: 'PUBLIC_MQTT',
                      message: '云通道消息投递失败'
                    });
                  }
                }
              });
            }, 200);
          },
          fail: () => {
            if (!isSettled) {
              isSettled = true;
              clearTimeout(timeoutTimer);
              resolve({
                success: false,
                channel: 'PUBLIC_MQTT',
                message: '无法与公共 MQTT 通道建立连接'
              });
            }
          }
        });
      });

      socketTask.onError((e) => {
        if (!isSettled) {
          isSettled = true;
          clearTimeout(timeoutTimer);
          resolve({
            success: false,
            channel: 'PUBLIC_MQTT',
            message: '公共通道连接异常: ' + (e?.errMsg || '未知错误')
          });
        }
      });
    } catch (err) {
      if (!isSettled) {
        isSettled = true;
        clearTimeout(timeoutTimer);
        resolve({
          success: false,
          channel: 'PUBLIC_MQTT',
          message: '创建网络通道异常: ' + (err?.message || '网络错误')
        });
      }
    }
  });
}

// ----------------------------------------------------------------------------
// 区域 4：双通道自适应智能调度主入口 (核心调度器)
// ----------------------------------------------------------------------------

/**
 * 自适应智能推送主入口：
 * 1. 优先尝试局域网 WiFi 0 延迟秒推；
 * 2. 若局域网超时或未在同一 WiFi，自动静默无缝降级为外网公共 MQTT 管道推送；
 * 3. 记录本地推送历史清单。
 *
 * @param {Object} modItem - 模组对象
 * @param {Object} [customConfig] - 临时覆盖配置
 * @returns {Promise<{ success: boolean, channel: string, message: string }>}
 */
export async function pushModAdaptive(modItem, customConfig = null) {
  const config = customConfig || getDesktopConfig();
  const payload = buildRemoteInstallPayload(modItem, config.deviceToken);

  let result = null;

  // 1. 优先尝试局域网直连
  if (config.host) {
    result = await pushViaLanHttp(payload, config.host, config.port || 28888);
  }

  // 2. 如果局域网失败，无缝转为外网 MQTT 公共管道推送
  if (!result || !result.success) {
    const mqttResult = await pushViaPublicMqtt(payload, config.deviceToken);
    if (mqttResult.success) {
      result = mqttResult;
    } else if (!result) {
      result = mqttResult;
    }
  }

  // 3. 记录推送历史 (包含中文译名与初始下载状态)
  if (result && result.success) {
    recordPushHistory({
      id: String(modItem.modId || modItem.id),
      modId: String(modItem.modId || modItem.id),
      title: modItem.title || '未知模组',
      zhTitle: modItem.zhTitle || '',
      fileName: modItem.fileName || '',
      fileVersion: modItem.fileVersion || modItem.version || '',
      coverImageUrl: modItem.coverImageUrl,
      gameName: modItem.game?.name || '',
      gameDomain: modItem.game?.domainName || '',
      channel: result.channel,
      status: 'downloading',
      timestamp: Date.now()
    });
  }

  return result;
}

// ----------------------------------------------------------------------------
// 区域 5：底层极简 MQTT 二进制报文序列化工具 (零外部依赖)
// ----------------------------------------------------------------------------

/**
 * 构造 MQTT 3.1.1 CONNECT 报文二进制 Buffer
 */
function buildMqttConnectPacket(clientId) {
  const protoName = 'MQTT';
  const protoLevel = 4; // 3.1.1
  const connectFlags = 0x02; // Clean Session
  const keepAlive = 60;

  const vHeader = [
    0x00, protoName.length, ...stringToUtf8Bytes(protoName),
    protoLevel,
    connectFlags,
    (keepAlive >> 8) & 0xff, keepAlive & 0xff
  ];

  const payload = [
    0x00, clientId.length, ...stringToUtf8Bytes(clientId)
  ];

  const remainingLen = vHeader.length + payload.length;
  const fixedHeader = [0x10, ...encodeMqttLength(remainingLen)];

  return new Uint8Array([...fixedHeader, ...vHeader, ...payload]).buffer;
}

/**
 * 构造 MQTT 3.1.1 PUBLISH 报文二进制 Buffer (QoS 0)
 */
function buildMqttPublishPacket(topic, message) {
  const topicBytes = stringToUtf8Bytes(topic);
  const msgBytes = stringToUtf8Bytes(message);

  const vHeader = [
    (topicBytes.length >> 8) & 0xff,
    topicBytes.length & 0xff,
    ...topicBytes
  ];

  const remainingLen = vHeader.length + msgBytes.length;
  const fixedHeader = [0x30, ...encodeMqttLength(remainingLen)];

  return new Uint8Array([...fixedHeader, ...vHeader, ...msgBytes]).buffer;
}

/**
 * UTF-8 字符串转字节数组
 */
function stringToUtf8Bytes(str) {
  const utf8 = [];
  for (let i = 0; i < str.length; i++) {
    let charcode = str.charCodeAt(i);
    if (charcode < 0x80) utf8.push(charcode);
    else if (charcode < 0x800) {
      utf8.push(0xc0 | (charcode >> 6), 0x80 | (charcode & 0x3f));
    } else if (charcode < 0xd800 || charcode >= 0xe000) {
      utf8.push(0xe0 | (charcode >> 12), 0x80 | ((charcode >> 6) & 0x3f), 0x80 | (charcode & 0x3f));
    } else {
      i++;
      charcode = 0x10000 + (((charcode & 0x3ff) << 10) | (str.charCodeAt(i) & 0x3ff));
      utf8.push(
        0xf0 | (charcode >> 18),
        0x80 | ((charcode >> 12) & 0x3f),
        0x80 | ((charcode >> 6) & 0x3f),
        0x80 | (charcode & 0x3f)
      );
    }
  }
  return utf8;
}

/**
 * MQTT 动态变长字节编码
 */
function encodeMqttLength(length) {
  const bytes = [];
  let x = length;
  do {
    let encodedByte = x % 128;
    x = Math.floor(x / 128);
    if (x > 0) {
      encodedByte = encodedByte | 128;
    }
    bytes.push(encodedByte);
  } while (x > 0);
  return bytes;
}
