// ============================================================================
// 模块名称：MayflyMods 推送历史与任务清单中枢 (Push History Service)
// 功能描述：管理用户手机端推送安装的历史记录、状态追踪与去重标识
// ============================================================================

import { batchTranslateToZh } from './translate.js';

/** 本地持久化缓存 Key */
export const STORAGE_KEY_PUSH_HISTORY = 'mayfly_push_history';

/** 最大历史记录保留条数 */
const MAX_HISTORY_ITEMS = 100;

// ----------------------------------------------------------------------------
// 区域 1：本地推送历史数据基础 CRUD 操作
// ----------------------------------------------------------------------------

/**
 * 获取完整的推送历史清单
 * @returns {Array<Object>} 历史列表，按时间倒序排列
 */
export function getPushHistory() {
  try {
    const list = uni.getStorageSync(STORAGE_KEY_PUSH_HISTORY);
    if (Array.isArray(list)) {
      return list;
    }
  } catch (e) {
    console.warn('[MayflyHistory] 读取推送历史失败:', e);
  }
  return [];
}

/**
 * 记录一条新的推送记录 (最新项自动前置，默认状态为下载中)
 * @param {Object} item - 模组及推送元数据
 */
export function recordPushHistory(item) {
  if (!item || !item.id) return;

  try {
    const list = getPushHistory();
    // 移除已有相同 ID 的历史，实现去重置顶
    const filtered = list.filter((h) => h.id !== item.id && h.modId !== item.modId);

    const newItem = {
      id: String(item.id),
      modId: String(item.modId || item.id),
      title: item.title || '未知模组',
      zhTitle: item.zhTitle || '',
      coverImageUrl: item.coverImageUrl || '',
      gameName: item.gameName || '',
      gameDomain: item.gameDomain || '',
      channel: item.channel || 'LAN_HTTP',
      status: item.status || 'downloading', // 'downloading' | 'completed' | 'failed'
      statusMessage: item.statusMessage || '',
      timestamp: item.timestamp || Date.now()
    };

    const nextList = [newItem, ...filtered].slice(0, MAX_HISTORY_ITEMS);
    uni.setStorageSync(STORAGE_KEY_PUSH_HISTORY, nextList);
  } catch (e) {
    console.error('[MayflyHistory] 记录推送历史失败:', e);
  }
}

/**
 * 更新指定模组的历史记录字段 (如状态、中文标题)
 * @param {string|number} modId - 模组 ID
 * @param {Object} patch - 待合并更新的键值对
 * @returns {boolean} 是否更新成功
 */
export function updateHistoryItem(modId, patch) {
  if (!modId || !patch || typeof patch !== 'object') return false;
  try {
    const targetId = String(modId);
    const list = getPushHistory();
    let updated = false;

    const nextList = list.map((item) => {
      if (item.id === targetId || item.modId === targetId) {
        updated = true;
        return {
          ...item,
          ...patch
        };
      }
      return item;
    });

    if (updated) {
      uni.setStorageSync(STORAGE_KEY_PUSH_HISTORY, nextList);
    }
    return updated;
  } catch (e) {
    console.error('[MayflyHistory] 更新推送记录失败:', e);
    return false;
  }
}

/**
 * 检查指定 Mod 是否已经在历史中推送过
 * @param {string|number} modId - 模组 ID
 * @returns {boolean}
 */
export function isModPushed(modId) {
  if (!modId) return false;
  const targetId = String(modId);
  const list = getPushHistory();
  return list.some((item) => item.id === targetId || item.modId === targetId);
}

/**
 * 清空所有推送历史
 */
export function clearPushHistory() {
  try {
    uni.removeStorageSync(STORAGE_KEY_PUSH_HISTORY);
    return true;
  } catch (e) {
    return false;
  }
}

// ----------------------------------------------------------------------------
// 区域 2：与电脑端 Mayfly 任务状态双向同步中枢
// ----------------------------------------------------------------------------

/**
 * 轮询或按需拉取电脑端当前任务执行状态，与本地历史比对并标记完成
 * @param {Object} desktopConfig - 电脑端配置 { host, port, deviceToken }
 * @returns {Promise<Array<Object>>} 更新后的最新历史列表
 */
export async function syncHistoryWithDesktop(desktopConfig) {
  if (!desktopConfig || !desktopConfig.host) {
    return getPushHistory();
  }

  const cleanHost = String(desktopConfig.host).trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  const port = desktopConfig.port || 28888;
  const token = desktopConfig.deviceToken || desktopConfig.devicePin || '';

  try {
    const queryStr = token ? `?token=${encodeURIComponent(token)}` : '';
    const res = await uni.request({
      url: `http://${cleanHost}:${port}/api/tasks${queryStr}`,
      method: 'GET',
      header: token ? { 'x-lan-token': token } : {},
      timeout: 2500
    });

    if (res.statusCode === 200 && res.data && Array.isArray(res.data.tasks)) {
      const desktopTasks = res.data.tasks;
      const history = getPushHistory();
      let changed = false;

      const updatedHistory = history.map((item) => {
        // 匹配 modId 或 id
        const matched = desktopTasks.find(
          (t) => String(t.modId) === String(item.modId) || String(t.modId) === String(item.id)
        );

        if (matched && matched.status && matched.status !== item.status) {
          changed = true;
          return {
            ...item,
            status: matched.status,
            statusMessage: matched.message || ''
          };
        }
        return item;
      });

      if (changed) {
        uni.setStorageSync(STORAGE_KEY_PUSH_HISTORY, updatedHistory);
      }
      return updatedHistory;
    }
  } catch (e) {
    // 局域网不可达时不阻塞界面展示
  }

  return getPushHistory();
}

// ----------------------------------------------------------------------------
// 区域 3：推送历史标题智能批量中文化
// ----------------------------------------------------------------------------

/**
 * 扫描推送历史中缺少中文标题的条目，批量翻译并回写持久化存储
 * @param {Array<Object>} historyList - 当前推送历史数组
 * @returns {Promise<Array<Object>>} 补齐中文标题后的历史数组
 */
export async function autoTranslateHistoryList(historyList) {
  if (!Array.isArray(historyList) || historyList.length === 0) {
    return [];
  }

  // 筛选出缺少中文标题或中文标题与英文相同的条目
  const pendingItems = historyList.filter(
    (item) => !item.zhTitle || (item.zhTitle === item.title && /[a-zA-Z]{3,}/.test(item.title))
  );

  if (pendingItems.length === 0) {
    return historyList;
  }

  const titlesToTranslate = pendingItems.map((item) => item.title);

  try {
    const translationMap = await batchTranslateToZh(titlesToTranslate);
    let changed = false;

    const updatedList = historyList.map((item) => {
      if (translationMap.has(item.title)) {
        const translated = translationMap.get(item.title);
        if (translated && translated !== item.title) {
          changed = true;
          return {
            ...item,
            zhTitle: translated
          };
        }
      }
      return item;
    });

    if (changed) {
      uni.setStorageSync(STORAGE_KEY_PUSH_HISTORY, updatedList);
    }
    return updatedList;
  } catch (e) {
    console.warn('[MayflyHistory] 批量翻译历史标题异常:', e);
    return historyList;
  }
}

