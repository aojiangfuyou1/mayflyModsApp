// ============================================================================
// 模块名称：MayflyMods 推送历史与任务清单中枢 (Push History Service)
// 功能描述：管理用户手机端推送安装的历史记录、状态追踪与去重标识
// ============================================================================

/** 本地持久化缓存 Key */
export const STORAGE_KEY_PUSH_HISTORY = 'mayfly_push_history';

/** 最大历史记录保留条数 */
const MAX_HISTORY_ITEMS = 100;

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
 * 记录一条新的推送记录 (最新项自动前置)
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
      coverImageUrl: item.coverImageUrl || '',
      gameName: item.gameName || '',
      gameDomain: item.gameDomain || '',
      channel: item.channel || 'LAN_HTTP',
      timestamp: item.timestamp || Date.now()
    };

    const nextList = [newItem, ...filtered].slice(0, MAX_HISTORY_ITEMS);
    uni.setStorageSync(STORAGE_KEY_PUSH_HISTORY, nextList);
  } catch (e) {
    console.error('[MayflyHistory] 记录推送历史失败:', e);
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
