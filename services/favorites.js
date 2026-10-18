// ============================================================================
// 模块名称：MayflyMods N网官方云端追踪模组服务 (Nexus Tracked Mods Service)
// 功能描述：负责 N网 官方 /v1/user/tracked_mods 接口拉取、云端同步追踪/取消追踪、多级缓存与展示洗练
// ============================================================================

import {
  getNexusApiKey,
  getGameShortZhName
} from './nexus.js';
import { batchTranslateModList } from './translate.js';

/** 本地持久化缓存 Key */
export const STORAGE_KEY_FAVORITES = 'mayfly_mod_favorites';
export const STORAGE_KEY_TRACKED_RAW = 'mayfly_nexus_tracked_raw';

// ----------------------------------------------------------------------------
// 区域 1：本地持久化缓存读写与状态判断
// ----------------------------------------------------------------------------

/**
 * 获取已追踪模组列表
 * 未登录 Nexus 账号时不展示任何伪造本地缓存，纯净返回空数组
 * @returns {Array<Object>} 模组数组
 */
export function getFavorites() {
  const key = getNexusApiKey();
  if (!key) {
    try {
      uni.removeStorageSync(STORAGE_KEY_FAVORITES);
      uni.removeStorageSync(STORAGE_KEY_TRACKED_RAW);
    } catch (e) {}
    return [];
  }

  try {
    const list = uni.getStorageSync(STORAGE_KEY_FAVORITES);
    if (Array.isArray(list)) {
      return list;
    }
  } catch (e) {
    console.warn('[MayflyFavorites] 读取追踪缓存失败:', e);
  }
  return [];
}

/**
 * 检查模组是否已被追踪/收藏
 * @param {string|number} modId - 模组 ID
 * @returns {boolean}
 */
export function isFavorited(modId) {
  if (!modId) return false;
  const targetId = String(modId);
  const list = getFavorites();
  return list.some((item) => String(item.id || item.modId) === targetId);
}

// ----------------------------------------------------------------------------
// 区域 2：调用 NexusMods 官方 REST API 读写追踪列表 (Tracked Mods)
// ----------------------------------------------------------------------------

/**
 * 调用 N网 官方接口获取当前登录用户全部已追踪的模组 ID 清单
 * 端点：GET https://api.nexusmods.com/v1/user/tracked_mods.json
 * @param {string} [apiKey] - N网 API Key (默认从本地存储拉取)
 * @returns {Promise<Array<{ mod_id: number, domain_name: string }>>}
 */
export async function fetchNexusTrackedMods(apiKey = '') {
  const key = apiKey || getNexusApiKey();
  if (!key) {
    return [];
  }

  try {
    const res = await uni.request({
      url: 'https://api.nexusmods.com/v1/user/tracked_mods.json',
      method: 'GET',
      header: {
        'apikey': key,
        'Application-Name': 'Mayfly Mod Manager',
        'Application-Version': '1.0.0'
      },
      timeout: 12000
    });

    if (res.statusCode === 200 && Array.isArray(res.data)) {
      // 持久化存储原始追踪快照
      try {
        uni.setStorageSync(STORAGE_KEY_TRACKED_RAW, res.data);
      } catch (e) {}
      return res.data;
    }
  } catch (err) {
    console.warn('[MayflyFavorites] 请求 N网 追踪列表异常:', err);
  }
  return [];
}

/**
 * 调用 N网 官方接口将指定 Mod 加入云端追踪 (Track Mod)
 * 端点：POST https://api.nexusmods.com/v1/user/tracked_mods.json?domain_name={domain}
 * @param {string} domainName - 游戏域名 slug
 * @param {string|number} modId - 模组 ID
 * @param {string} [apiKey]
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export async function trackNexusMod(domainName, modId, apiKey = '') {
  const key = apiKey || getNexusApiKey();
  if (!key) {
    return { success: false, message: '请先登录 NexusMods 账号' };
  }

  const cleanDomain = String(domainName || '').trim();
  const cleanModId = String(modId || '').trim();

  try {
    const res = await uni.request({
      url: `https://api.nexusmods.com/v1/user/tracked_mods.json?domain_name=${encodeURIComponent(cleanDomain)}`,
      method: 'POST',
      header: {
        'apikey': key,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Application-Name': 'Mayfly Mod Manager',
        'Application-Version': '1.0.0'
      },
      data: `mod_id=${encodeURIComponent(cleanModId)}`,
      timeout: 10000
    });

    if (res.statusCode >= 200 && res.statusCode < 300) {
      return { success: true, message: '已加入 N网云端追踪' };
    } else {
      return { success: false, message: res.data?.message || `追踪请求失败 (HTTP ${res.statusCode})` };
    }
  } catch (e) {
    return { success: false, message: '网络异常，无法连接 N网 追踪服务' };
  }
}

/**
 * 调用 N网 官方接口将指定 Mod 从云端追踪中移除 (Untrack Mod)
 * 端点：DELETE https://api.nexusmods.com/v1/user/tracked_mods.json?domain_name={domain}
 * @param {string} domainName - 游戏域名 slug
 * @param {string|number} modId - 模组 ID
 * @param {string} [apiKey]
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export async function untrackNexusMod(domainName, modId, apiKey = '') {
  const key = apiKey || getNexusApiKey();
  if (!key) {
    return { success: false, message: '请先登录 NexusMods 账号' };
  }

  const cleanDomain = String(domainName || '').trim();
  const cleanModId = String(modId || '').trim();

  try {
    const res = await uni.request({
      url: `https://api.nexusmods.com/v1/user/tracked_mods.json?domain_name=${encodeURIComponent(cleanDomain)}`,
      method: 'DELETE',
      header: {
        'apikey': key,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Application-Name': 'Mayfly Mod Manager',
        'Application-Version': '1.0.0'
      },
      data: `mod_id=${encodeURIComponent(cleanModId)}`,
      timeout: 10000
    });

    if (res.statusCode >= 200 && res.statusCode < 300) {
      return { success: true, message: '已取消 N网云端追踪' };
    } else {
      return { success: false, message: res.data?.message || `取消追踪请求失败 (HTTP ${res.statusCode})` };
    }
  } catch (e) {
    return { success: false, message: '网络异常，无法连接 N网 服务' };
  }
}

// ----------------------------------------------------------------------------
// 区域 3：模组元数据实时拉取与全量云端双向同步中枢
// ----------------------------------------------------------------------------

/**
 * 调用 N网 官方接口按 domain 与 mod_id 拉取模组基础展示信息
 * 端点：GET https://api.nexusmods.com/v1/games/{domain}/mods/{mod_id}.json
 * @param {string} domainName
 * @param {string|number} modId
 * @param {string} [apiKey]
 * @returns {Promise<Object|null>}
 */
export async function fetchNexusModBasic(domainName, modId, apiKey = '') {
  const key = apiKey || getNexusApiKey();
  if (!domainName || !modId) return null;

  try {
    const header = {
      'Application-Name': 'Mayfly Mod Manager',
      'Application-Version': '1.0.0'
    };
    if (key) {
      header['apikey'] = key;
    }

    const res = await uni.request({
      url: `https://api.nexusmods.com/v1/games/${encodeURIComponent(domainName)}/mods/${encodeURIComponent(modId)}.json`,
      method: 'GET',
      header,
      timeout: 8000
    });

    if (res.statusCode === 200 && res.data) {
      const data = res.data;
      return {
        id: String(data.mod_id),
        modId: String(data.mod_id),
        title: data.name || `Mod #${data.mod_id}`,
        summary: data.summary || '暂无详细介绍说明',
        coverImageUrl: data.picture_url || '',
        version: data.version || '1.0',
        downloads: Number(data.endorsement_count || 0),
        likes: Number(data.endorsement_count || 0),
        category: data.category_name || '综合',
        game: {
          id: data.game_id || 0,
          domainName: data.domain_name || domainName,
          name: data.domain_name || domainName,
          shortZhName: getGameShortZhName(data.domain_name || domainName, '')
        },
        author: data.author || '未知作者',
        website: `https://www.nexusmods.com/${data.domain_name || domainName}/mods/${data.mod_id}`,
        favoriteTime: Date.now()
      };
    }
  } catch (err) {
    console.warn(`[MayflyFavorites] 拉取 Mod #${modId} 元数据异常:`, err);
  }
  return null;
}

/**
 * 从 N网 同步全量已追踪模组，并富化展示元数据
 * @param {string} [apiKey]
 * @returns {Promise<Array<Object>>} 完整的已追踪模组列表
 */
export async function syncFavoritesFromNexus(apiKey = '') {
  const key = apiKey || getNexusApiKey();
  if (!key) {
    return getFavorites();
  }

  // 1. 获取 N网 官方云端追踪 ID 数组
  const rawTracked = await fetchNexusTrackedMods(key);
  if (!Array.isArray(rawTracked)) {
    return getFavorites();
  }

  // 构建当前有效追踪 ID 映射
  const existingList = getFavorites();
  const existingMap = new Map();
  existingList.forEach((m) => {
    existingMap.set(String(m.id || m.modId), m);
  });

  // 2. 补齐尚未有详情缓存的追踪项 (并发限制 4 个，防接口 429 限流)
  const pendingToFetch = rawTracked.filter((t) => !existingMap.has(String(t.mod_id)));
  const newlyFetched = [];

  const BATCH_SIZE = 4;
  for (let i = 0; i < pendingToFetch.length; i += BATCH_SIZE) {
    const chunk = pendingToFetch.slice(i, i + BATCH_SIZE);
    const promises = chunk.map((item) =>
      fetchNexusModBasic(item.domain_name, item.mod_id, key).catch(() => null)
    );
    const results = await Promise.all(promises);
    results.forEach((mod) => {
      if (mod) newlyFetched.push(mod);
    });
  }

  // 3. 合并全量数据并剔除在云端已被取消追踪的项
  const mergedMap = new Map(existingMap);
  newlyFetched.forEach((m) => {
    mergedMap.set(String(m.id), m);
  });

  const nextList = [];
  rawTracked.forEach((t) => {
    const id = String(t.mod_id);
    if (mergedMap.has(id)) {
      nextList.push(mergedMap.get(id));
    } else {
      // 降级占位，待后续进一步装载
      nextList.push({
        id,
        modId: id,
        title: `Mod #${id}`,
        summary: 'NexusMods 官方追踪模组',
        coverImageUrl: '',
        game: {
          domainName: t.domain_name,
          name: t.domain_name,
          shortZhName: getGameShortZhName(t.domain_name, '')
        },
        favoriteTime: Date.now()
      });
    }
  });

  // 4. 标题与简介全量自动汉化
  try {
    const unTranslatedMods = nextList.filter(
      (m) =>
        !m.zhTitle ||
        !m.zhSummary ||
        (m.zhTitle === m.title && /[a-zA-Z]{3,}/.test(m.title))
    );
    if (unTranslatedMods.length > 0) {
      const { zhTitleMap, zhSummaryMap } = await batchTranslateModList(unTranslatedMods);
      nextList.forEach((m) => {
        if (zhTitleMap[m.id]) m.zhTitle = zhTitleMap[m.id];
        if (zhSummaryMap[m.id]) m.zhSummary = zhSummaryMap[m.id];
      });
    }
  } catch (e) {
    console.warn('[MayflyFavorites] 同步追踪模组翻译异常:', e);
  }

  // 5. 保存到本地持久化缓存
  try {
    uni.setStorageSync(STORAGE_KEY_FAVORITES, nextList);
  } catch (e) {}

  return nextList;
}

// ----------------------------------------------------------------------------
// 区域 4：一键追踪 / 取消追踪 聚合入口 (同步操作 N网 云端 + 本地缓存)
// ----------------------------------------------------------------------------

/**
 * 切换收藏/追踪状态 (直接操作 NexusMods 官方云端接口)
 * @param {Object} modItem - 模组对象
 * @returns {Promise<{ favorited: boolean, success: boolean, message: string, needLogin?: boolean }>}
 */
export async function toggleFavorite(modItem) {
  if (!modItem || !modItem.id) {
    return { favorited: false, success: false, message: '无效模组数据' };
  }

  const apiKey = getNexusApiKey();
  if (!apiKey) {
    return {
      favorited: false,
      success: false,
      needLogin: true,
      message: '请先登录 NexusMods 账号以同步云端追踪历史'
    };
  }

  const targetId = String(modItem.modId || modItem.id);
  const domainName = modItem.game?.domainName || modItem.gameDomain || '';
  if (!domainName) {
    return { favorited: false, success: false, message: '无法识别模组所属游戏' };
  }

  const currentFavorited = isFavorited(targetId);

  if (currentFavorited) {
    // 1. 已追踪 -> 调用 N网 DELETE 移除云端追踪
    const untrackRes = await untrackNexusMod(domainName, targetId, apiKey);
    if (untrackRes.success) {
      const list = getFavorites().filter((m) => String(m.id || m.modId) !== targetId);
      try {
        uni.setStorageSync(STORAGE_KEY_FAVORITES, list);
      } catch (e) {}
      return { favorited: false, success: true, message: '已从 N网追踪列表 取消' };
    }
    return { favorited: true, success: false, message: untrackRes.message };
  } else {
    // 2. 未追踪 -> 调用 N网 POST 加入云端追踪
    const trackRes = await trackNexusMod(domainName, targetId, apiKey);
    if (trackRes.success) {
      const newEntry = {
        id: targetId,
        modId: targetId,
        title: modItem.title || '未知模组',
        zhTitle: modItem.zhTitle || '',
        summary: modItem.summary || '',
        coverImageUrl: modItem.coverImageUrl || '',
        version: modItem.version || '1.0',
        downloads: Number(modItem.downloads || 0),
        likes: Number(modItem.likes || 0),
        category: modItem.category || '综合',
        game: {
          id: modItem.game?.id || 0,
          name: modItem.game?.name || domainName,
          domainName: domainName,
          shortZhName: getGameShortZhName(domainName, modItem.game?.name)
        },
        author: modItem.author || '未知',
        website: modItem.website || `https://www.nexusmods.com/${domainName}/mods/${targetId}`,
        favoriteTime: Date.now()
      };
      const list = [newEntry, ...getFavorites().filter((m) => String(m.id || m.modId) !== targetId)];
      try {
        uni.setStorageSync(STORAGE_KEY_FAVORITES, list);
      } catch (e) {}
      return { favorited: true, success: true, message: '已加入 N网云端追踪' };
    }
    return { favorited: false, success: false, message: trackRes.message };
  }
}

/**
 * 清空所有收藏
 */
export function clearFavorites() {
  try {
    uni.removeStorageSync(STORAGE_KEY_FAVORITES);
    uni.removeStorageSync(STORAGE_KEY_TRACKED_RAW);
    return true;
  } catch (e) {
    return false;
  }
}

