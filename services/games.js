// ============================================================================
// 模块名称：MayflyMods 我的游戏专区与书签标记服务 (Nexus My Games Service)
// 功能描述：负责 N网 官方「我的游戏 (My games)」GraphQL 同步、本地书签标记持久化与跨页面状态分发
// 对应 N网：100% 对标 NexusMods 首页顶栏「🎮 My games」与游戏详情页书签标记 🔖
// ============================================================================

import {
  NEXUS_GRAPHQL_ENDPOINT,
  getNexusApiKey,
  getGameFullZhName,
  getGameShortZhName,
  formatNexusMetric
} from './nexus.js';

/** 本地持久化缓存 Key */
export const STORAGE_KEY_MY_GAMES = 'mayfly_my_games';

/**
 * N网常见经典大作预置库 (对标图 1 与图 3，保障初次离线也能拥有充实体验)
 */
export const DEFAULT_MY_GAMES_PRESETS = [
  {
    id: 3474,
    name: "Baldur's Gate 3",
    domain: 'baldursgate3',
    modCount: 15200,
    downloadCount: 228000000,
    collectionCount: 18000
  },
  {
    id: 6132,
    name: 'Black Myth: Wukong',
    domain: 'blackmythwukong',
    modCount: 3200,
    downloadCount: 35000000,
    collectionCount: 4200
  },
  {
    id: 4333,
    name: 'Elden Ring',
    domain: 'eldenring',
    modCount: 7800,
    downloadCount: 88000000,
    collectionCount: 9500
  },
  {
    id: 3333,
    name: 'Cyberpunk 2077',
    domain: 'cyberpunk2077',
    modCount: 24900,
    downloadCount: 290000000,
    collectionCount: 28000
  },
  {
    id: 1151,
    name: 'Fallout 4',
    domain: 'fallout4',
    modCount: 77400,
    downloadCount: 2500000000,
    collectionCount: 32000
  },
  {
    id: 1704,
    name: 'Skyrim Special Edition',
    domain: 'skyrimspecialedition',
    modCount: 142200,
    downloadCount: 13500000000,
    collectionCount: 48000
  },
  {
    id: 2531,
    name: 'Monster Hunter: World',
    domain: 'monsterhunterworld',
    modCount: 8200,
    downloadCount: 98000000,
    collectionCount: 7600
  },
  {
    id: 5120,
    name: 'Hogwarts Legacy',
    domain: 'hogwartslegacy',
    modCount: 3500,
    downloadCount: 42000000,
    collectionCount: 3800
  },
  {
    id: 2763,
    name: 'Sekiro: Shadows Die Twice',
    domain: 'sekiro',
    modCount: 2400,
    downloadCount: 28000000,
    collectionCount: 2900
  },
  {
    id: 1303,
    name: 'Stardew Valley',
    domain: 'stardewvalley',
    modCount: 18400,
    downloadCount: 190000000,
    collectionCount: 12000
  }
];

/**
 * 格式化单个原始 Game 节点为标准化应用模型
 */
export function formatGameItem(node) {
  if (!node) return null;
  const id = node.id || node.gameId || 0;
  const domain = (node.domainName || node.domain || '').toLowerCase().trim();
  const name = node.name || domain || '未知游戏';
  const modCount = Number(node.modCount) || 0;
  const downloadCount = Number(node.downloadCount) || 0;
  const collectionCount = Number(node.collectionCount) || 0;

  return {
    id,
    name,
    domain,
    modCount,
    downloadCount,
    collectionCount,
    tileUrl: `https://images.nexusmods.com/images/games/v2/${id}/tile.jpg`,
    heroUrl: `https://images.nexusmods.com/images/games/v2/${id}/hero.jpg`,
    zhName: getGameFullZhName(domain, name),
    shortZhName: getGameShortZhName(domain, name),
    stats: {
      mods: formatNexusMetric(modCount),
      tracking: formatNexusMetric(collectionCount),
      downloads: formatNexusMetric(downloadCount)
    },
    bookmarkedAt: node.bookmarkedAt || Date.now()
  };
}

// ----------------------------------------------------------------------------
// 区域 1：本地书签标记持久化与高速检索
// ----------------------------------------------------------------------------

/**
 * 获取本地缓存的「我的游戏」列表
 * @returns {Array<Object>} 游戏对象数组
 */
export function getMyGames() {
  try {
    const cached = uni.getStorageSync(STORAGE_KEY_MY_GAMES);
    if (Array.isArray(cached) && cached.length > 0) {
      return cached;
    }
  } catch (e) {
    console.warn('[MayflyGames] 读取我的游戏失败:', e);
  }

  // 若为空，使用预置库初始化，保证用户初次进入就有丰富的体验
  const initial = DEFAULT_MY_GAMES_PRESETS.map((p) => formatGameItem(p)).filter(Boolean);
  saveMyGames(initial);
  return initial;
}

/**
 * 保存「我的游戏」列表至本地存储
 * @param {Array<Object>} list
 */
export function saveMyGames(list) {
  try {
    uni.setStorageSync(STORAGE_KEY_MY_GAMES, Array.isArray(list) ? list : []);
    uni.$emit('mayfly-games-updated', list);
  } catch (e) {
    console.warn('[MayflyGames] 写入我的游戏失败:', e);
  }
}

/**
 * 校验某款游戏是否已被标记为「我的游戏」
 * @param {string|number} idOrDomain - 游戏 ID 或域名 Slug
 * @returns {boolean}
 */
export function isGameBookmarked(idOrDomain) {
  if (!idOrDomain) return false;
  const target = String(idOrDomain).toLowerCase().trim();
  const list = getMyGames();
  return list.some((g) => {
    return String(g.id) === target || String(g.domain).toLowerCase() === target;
  });
}

// ----------------------------------------------------------------------------
// 区域 2：点击书签切换标记 (Bookmark Toggle) 与云端双向同步
// ----------------------------------------------------------------------------

/**
 * 切换游戏的标记状态 (加入或移出「我的游戏」)
 * 100% 对标 N网游戏详情页书签 🔖 点击动作
 * @param {Object} gameItem - 游戏对象
 * @param {string} [apiKey] - N网凭据
 * @returns {Promise<{ bookmarked: boolean, myGames: Array, message: string }>}
 */
export async function toggleGameBookmark(gameItem, apiKey = '') {
  if (!gameItem) {
    return { bookmarked: false, myGames: getMyGames(), message: '游戏参数无效' };
  }

  const list = [...getMyGames()];
  const targetId = String(gameItem.id || '');
  const targetDomain = String(gameItem.domain || gameItem.domainName || '').toLowerCase().trim();

  const existingIdx = list.findIndex(
    (g) => (targetId && String(g.id) === targetId) || (targetDomain && String(g.domain).toLowerCase() === targetDomain)
  );

  const key = apiKey || getNexusApiKey();
  let bookmarked = false;
  let message = '';

  if (existingIdx >= 0) {
    // 已经标记过 -> 移出「我的游戏」
    const removed = list.splice(existingIdx, 1)[0];
    saveMyGames(list);
    bookmarked = false;
    message = `已移出「我的游戏」`;

    // 后台静默调用 N网云端取消标记 (若用户已登录)
    if (key && removed && removed.id) {
      removeFavouriteGameFromNexus(removed.id, key).catch(() => {});
    }
  } else {
    // 未标记 -> 加入「我的游戏」
    const formatted = formatGameItem(gameItem);
    formatted.bookmarkedAt = Date.now();
    list.unshift(formatted);
    saveMyGames(list);
    bookmarked = true;
    message = `已成功标记为「我的游戏」🔖`;

    // 后台静默调用 N网云端添加标记 (若用户已登录)
    if (key && formatted && formatted.id) {
      addFavouriteGameToNexus(formatted.id, key).catch(() => {});
    }
  }

  return { bookmarked, myGames: list, message };
}

// ----------------------------------------------------------------------------
// 区域 3：调用 NexusMods 官方 GraphQL 读写 Favourite Games
// ----------------------------------------------------------------------------

/**
 * 从 Nexus 官方 GraphQL 拉取用户在网页端标记的 Favourite Games
 * 端点：POST https://api-router.nexusmods.com/graphql
 * @param {string} [apiKey]
 * @returns {Promise<Array<Object>>}
 */
export async function fetchNexusFavouriteGames(apiKey = '') {
  const key = apiKey || getNexusApiKey();
  if (!key) {
    return getMyGames();
  }

  const gqlQuery = `
    query UserFavouriteGames {
      favouriteGames {
        id
        name
        domainName
        modCount
        downloadCount
        collectionCount
      }
    }
  `;

  try {
    const res = await uni.request({
      url: NEXUS_GRAPHQL_ENDPOINT,
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'apikey': key,
        'Authorization': `Bearer ${key}`
      },
      data: JSON.stringify({
        query: gqlQuery
      }),
      timeout: 15000
    });

    if (res.statusCode === 200 && res.data?.data?.favouriteGames) {
      const rawGames = res.data.data.favouriteGames;
      if (Array.isArray(rawGames) && rawGames.length > 0) {
        const cloudGames = rawGames.map((node) => formatGameItem(node)).filter(Boolean);
        // 保存并与本地合并
        saveMyGames(cloudGames);
        return cloudGames;
      }
    }
  } catch (err) {
    console.warn('[MayflyGames] 从 N网拉取 Favourite Games 异常:', err);
  }

  return getMyGames();
}

/**
 * 远程调用 N网官方 GraphQL 将游戏加入收藏标记
 */
export async function addFavouriteGameToNexus(gameId, apiKey = '') {
  const key = apiKey || getNexusApiKey();
  if (!key || !gameId) return false;

  const mutation = `
    mutation AddFavouriteGame($gameId: ID!) {
      addFavouriteGame(gameId: $gameId) {
        success
      }
    }
  `;

  try {
    const res = await uni.request({
      url: NEXUS_GRAPHQL_ENDPOINT,
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'apikey': key,
        'Authorization': `Bearer ${key}`
      },
      data: JSON.stringify({
        query: mutation,
        variables: { gameId: Number(gameId) }
      }),
      timeout: 10000
    });
    return !!res.data?.data?.addFavouriteGame?.success;
  } catch (e) {
    return false;
  }
}

/**
 * 远程调用 N网官方 GraphQL 将游戏从收藏标记中移除
 */
export async function removeFavouriteGameFromNexus(gameId, apiKey = '') {
  const key = apiKey || getNexusApiKey();
  if (!key || !gameId) return false;

  const mutation = `
    mutation RemoveFavouriteGame($gameId: ID!) {
      removeFavouriteGame(gameId: $gameId) {
        success
      }
    }
  `;

  try {
    const res = await uni.request({
      url: NEXUS_GRAPHQL_ENDPOINT,
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'apikey': key,
        'Authorization': `Bearer ${key}`
      },
      data: JSON.stringify({
        query: mutation,
        variables: { gameId: Number(gameId) }
      }),
      timeout: 10000
    });
    return !!res.data?.data?.removeFavouriteGame?.success;
  } catch (e) {
    return false;
  }
}
