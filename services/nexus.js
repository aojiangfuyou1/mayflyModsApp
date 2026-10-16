// ============================================================================
// 模块名称：NexusMods 模组聚合服务 (Mayfly Nexus Service)
// 功能描述：负责 N网 公开 GraphQL 接口检索、跨游戏 Mod 列表拉取、元数据洗练与远程安装信令投递
// 遵循规范：纯净零存储依赖，直接请求官方 GraphQL，N网有啥显示啥
// ============================================================================

// ----------------------------------------------------------------------------
// 区域 1：常量与默认配置
// ----------------------------------------------------------------------------

/** NexusMods 官方公开 GraphQL 接口端点 */
export const NEXUS_GRAPHQL_ENDPOINT = 'https://api-router.nexusmods.com/graphql';

/** 本地存储配对设备信息的 Key */
export const STORAGE_KEY_DESKTOP_CONFIG = 'mayfly_desktop_config';

/** 默认电脑端配置 */
export const DEFAULT_DESKTOP_CONFIG = {
  host: '192.168.1.100',
  port: 9876,
  deviceToken: 'MF-PC-8891',
  connected: false
};

// ----------------------------------------------------------------------------
// 游戏域名与中文简称映射字典 (防止英文游戏名过长导致移动端卡片换行挤爆)
// ----------------------------------------------------------------------------
export const GAME_ZH_MAP = {
  skyrim: '上古卷轴5',
  skyrimspecialedition: '上古卷轴5',
  skyrimse: '上古卷轴5',
  skyrimvr: '上古卷轴5 VR',
  fallout4: '辐射4',
  fallout4vr: '辐射4 VR',
  falloutnewvegas: '辐射:新维加斯',
  fallout3: '辐射3',
  blackmythwukong: '黑神话:悟空',
  cyberpunk2077: '赛博朋克 2077',
  eldenring: '艾尔登法环',
  baldursgate3: '博德之门3',
  stardewvalley: '星露谷物语',
  monsterhunterworld: '怪猎:世界',
  monsterhunterwilds: '怪猎:荒野',
  witcher3: '巫师3:狂猎',
  sekiro: '只狼',
  palworld: '幻兽帕鲁',
  starfield: '星空',
  mountandblade2bannerlord: '骑砍2:霸主',
  residentevil42023: '生化4重制版',
  dragonsdogma2: '龙之信条2',
  kingdomcomedeliverance: '天国:拯救',
  hogwartslegacy: '霍格沃茨之遗',
  gta5: 'GTA 5',
  grandtheftautov: 'GTA 5',
  forzahorizon5: '地平线5',
  watchdogs2: '看门狗2',
  titanfall2: '泰坦陨落2',
  moddingtools: '实用工具',
  site: '通用工具'
};

/**
 * 获取紧凑优雅的游戏中文短名（最多8-10个字符，杜绝换行挤压封面）
 * @param {string} domainName - N网域名
 * @param {string} [originalName=""] - 原始游戏全称
 * @returns {string} 紧凑中文短名
 */
export function getGameShortZhName(domainName, originalName = '') {
  if (!domainName && !originalName) return '通用游戏';
  const cleanDomain = String(domainName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  if (GAME_ZH_MAP[cleanDomain]) {
    return GAME_ZH_MAP[cleanDomain];
  }
  for (const [key, val] of Object.entries(GAME_ZH_MAP)) {
    if (cleanDomain.includes(key) || key.includes(cleanDomain)) {
      return val;
    }
  }
  const cleanOrig = String(originalName || '').trim();
  if (cleanOrig.length > 10) {
    return cleanOrig.slice(0, 9) + '..';
  }
  return cleanOrig || '精品模组';
}

/**
 * 格式化时间为友好相对时间 (如 "2 minutes ago", "3 hours ago", "5 days ago")
 */
export function formatTimeAgo(dateStr) {
  if (!dateStr) return '2 minutes ago';
  const time = new Date(dateStr).getTime();
  if (isNaN(time)) return 'recently';
  const diff = Date.now() - time;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} minutes ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}

/**
 * 格式化为 Nexus 官方标准日期 (如 "16 Oct 2026")
 */
export function formatNexusDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return String(dateStr).slice(0, 10);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

/**
 * NexusMods 核心热门游戏专区配置 (100% 对标 N网 手机版 2 列竖版封面展示)
 */
export const NEXUS_POPULAR_GAMES = [
  {
    id: 'skyrimspecialedition',
    domain: 'skyrimspecialedition',
    title: 'Skyrim Special Edition',
    zhTitle: '上古卷轴5: 天际特别版',
    coverUrl: 'https://cdn.akamai.steamstatic.com/steam/apps/489830/library_600x900.jpg',
    stats: { mods: '142k', tracking: '4.8k', downloads: '13.4b' },
    bookmarked: false
  },
  {
    id: 'fallout4',
    domain: 'fallout4',
    title: 'Fallout 4',
    zhTitle: '辐射 4',
    coverUrl: 'https://cdn.akamai.steamstatic.com/steam/apps/377160/library_600x900.jpg',
    stats: { mods: '77.3k', tracking: '2.2k', downloads: '2.4b' },
    bookmarked: false
  },
  {
    id: 'skyrim',
    domain: 'skyrim',
    title: 'The Elder Scrolls V: Skyrim',
    zhTitle: '上古卷轴5: 原版',
    coverUrl: 'https://cdn.akamai.steamstatic.com/steam/apps/72850/library_600x900.jpg',
    stats: { mods: '72.1k', tracking: '1.9k', downloads: '2.1b' },
    bookmarked: false
  },
  {
    id: 'cyberpunk2077',
    domain: 'cyberpunk2077',
    title: 'Cyberpunk 2077',
    zhTitle: '赛博朋克 2077',
    coverUrl: 'https://cdn.akamai.steamstatic.com/steam/apps/1091500/library_600x900.jpg',
    stats: { mods: '18.9k', tracking: '1.4k', downloads: '590m' },
    bookmarked: true
  },
  {
    id: 'blackmythwukong',
    domain: 'blackmythwukong',
    title: 'Black Myth: Wukong',
    zhTitle: '黑神话：悟空',
    coverUrl: 'https://cdn.akamai.steamstatic.com/steam/apps/2358720/library_600x900.jpg',
    stats: { mods: '4.8k', tracking: '380', downloads: '52m' },
    bookmarked: false
  },
  {
    id: 'baldursgate3',
    domain: 'baldursgate3',
    title: "Baldur's Gate 3",
    zhTitle: '博德之门 3',
    coverUrl: 'https://cdn.akamai.steamstatic.com/steam/apps/1086940/library_600x900.jpg',
    stats: { mods: '13.4k', tracking: '920', downloads: '340m' },
    bookmarked: false
  },
  {
    id: 'eldenring',
    domain: 'eldenring',
    title: 'Elden Ring',
    zhTitle: '艾尔登法环',
    coverUrl: 'https://cdn.akamai.steamstatic.com/steam/apps/1245620/library_600x900.jpg',
    stats: { mods: '16.2k', tracking: '1.1k', downloads: '220m' },
    bookmarked: false
  },
  {
    id: 'stardewvalley',
    domain: 'stardewvalley',
    title: 'Stardew Valley',
    zhTitle: '星露谷物语',
    coverUrl: 'https://cdn.akamai.steamstatic.com/steam/apps/413150/library_600x900.jpg',
    stats: { mods: '23.1k', tracking: '1.6k', downloads: '430m' },
    bookmarked: false
  }
];

// ----------------------------------------------------------------------------
// 区域 2：本地设备配置与配对持久化
// ----------------------------------------------------------------------------

/**
 * 获取本地保存的电脑端连接配置
 * @returns {Object} 电脑端连接配置
 */
export function getDesktopConfig() {
  try {
    const data = uni.getStorageSync(STORAGE_KEY_DESKTOP_CONFIG);
    if (data && typeof data === 'object') {
      return { ...DEFAULT_DESKTOP_CONFIG, ...data };
    }
  } catch (e) {
    console.warn('[MayflyNexus] 读取电脑配置失败:', e);
  }
  return { ...DEFAULT_DESKTOP_CONFIG };
}

/**
 * 保存电脑端连接配置
 * @param {Object} config - 配置参数对象
 */
export function saveDesktopConfig(config) {
  try {
    uni.setStorageSync(STORAGE_KEY_DESKTOP_CONFIG, config);
    return true;
  } catch (e) {
    console.error('[MayflyNexus] 保存电脑配置失败:', e);
    return false;
  }
}

// ----------------------------------------------------------------------------
// 区域 3：NexusMods 官方 GraphQL 请求核心方法
// ----------------------------------------------------------------------------

/**
 * 跨游戏检索 NexusMods 模组列表（N网有啥显示啥）
 * @param {Object} options - 查询选项
 * @param {number} [options.page=1] - 当前页码
 * @param {number} [options.pageSize=20] - 每页数量
 * @param {string} [options.sort="downloads"] - 排序方式: "downloads" | "updatedAt" | "createdAt"
 * @param {string} [options.searchText=""] - 搜索关键字
 * @param {string} [options.gameDomain=""] - 指定游戏域名 (可选，留空则全网聚合)
 * @returns {Promise<{ items: Array, totalCount: number, page: number, hasMore: boolean }>}
 */
export async function fetchNexusMods({
  page = 1,
  pageSize = 20,
  sort = 'downloads',
  searchText = '',
  gameDomain = ''
} = {}) {
  const safePage = Math.max(1, Number(page) || 1);
  const safePageSize = Math.min(40, Math.max(1, Number(pageSize) || 20));
  const offset = (safePage - 1) * safePageSize;

  // 1. 构建 GraphQL 排序变量
  const sortKey = sort === 'updatedAt' ? 'updatedAt' : sort === 'createdAt' ? 'createdAt' : 'downloads';
  const sortVariable = [{ [sortKey]: { direction: 'DESC' } }];

  // 2. 构建过滤条件 (若有指定游戏或搜索词)
  const filter = { op: 'AND' };
  const filterRules = [];

  if (gameDomain && gameDomain.trim()) {
    filterRules.push({
      op: 'EQUALS',
      field: 'gameDomainName',
      value: gameDomain.trim()
    });
  }

  if (searchText && searchText.trim()) {
    const trimmed = searchText.trim();
    filterRules.push({
      op: 'OR',
      name: [{
        op: 'WILDCARD',
        value: trimmed.includes('*') ? trimmed : `*${trimmed}*`
      }],
      description: [{
        op: 'MATCHES',
        value: trimmed
      }]
    });
  }

  // 3. 构建 GraphQL 查询语句（包含封面、所属游戏名称、下载量与简介）
  const gqlQuery = `
    query ModsListing($count: Int = 20, $offset: Int = 0, $sort: [ModsSort!], $filter: ModsFilter) {
      mods(count: $count, offset: $offset, sort: $sort, filter: $filter, viewUserBlockedContent: false) {
        totalCount
        nodes {
          modId
          name
          summary
          thumbnailUrl
          pictureUrl
          version
          downloads
          endorsements
          createdAt
          updatedAt
          game {
            id
            domainName
            name
          }
          uploader {
            name
            avatar
          }
          modCategory {
            name
          }
        }
      }
    }
  `;

  const requestVariables = {
    count: safePageSize,
    offset,
    sort: sortVariable
  };

  if (filterRules.length > 0) {
    requestVariables.filter = filter;
  }

  try {
    const res = await uni.request({
      url: NEXUS_GRAPHQL_ENDPOINT,
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      data: JSON.stringify({
        query: gqlQuery,
        variables: requestVariables
      }),
      timeout: 15000
    });

    if (res.statusCode !== 200 || !res.data) {
      throw new Error(`Nexus 接口响应异常 (HTTP ${res.statusCode || '未知'})`);
    }

    const payload = res.data;
    if (payload.errors && payload.errors.length > 0) {
      console.warn('[MayflyNexus] GraphQL 返回警告:', payload.errors[0]?.message);
    }

    const modData = payload?.data?.mods;
    const rawNodes = modData?.nodes || [];
    const totalCount = Number(modData?.totalCount) || 0;

    // 4. 标准化映射为 Mayfly 统一 Mod 数据契约
    const items = rawNodes.map((item) => {
      // 提取最佳封面预览图
      const cover = item.pictureUrl || item.thumbnailUrl || '';
      return {
        id: String(item.modId),
        modId: String(item.modId),
        title: item.name || '未命名模组',
        summary: item.summary || '暂无简介说明',
        coverImageUrl: cover,
        version: item.version || '1.0',
        downloads: Number(item.downloads) || 0,
        likes: Number(item.endorsements) || 0,
        category: item.modCategory?.name || '综合',
        createdAt: item.createdAt || '',
        updatedAt: item.updatedAt || item.createdAt || '',
        timeAgo: formatTimeAgo(item.updatedAt || item.createdAt),
        formattedDate: formatNexusDate(item.createdAt),
        formattedUpdateDate: formatNexusDate(item.updatedAt || item.createdAt),
        game: {
          id: item.game?.id || 0,
          domainName: item.game?.domainName || '',
          name: item.game?.name || '未知游戏',
          shortZhName: getGameShortZhName(item.game?.domainName, item.game?.name)
        },
        author: item.uploader?.name || '未知作者',
        authorAvatar: item.uploader?.avatar || '',
        sourceType: 'nexus',
        website: item.game?.domainName && item.modId
          ? `https://www.nexusmods.com/${item.game.domainName}/mods/${item.modId}`
          : ''
      };
    });

    return {
      items,
      totalCount,
      page: safePage,
      hasMore: offset + items.length < totalCount
    };
  } catch (error) {
    console.error('[MayflyNexus] 抓取模组列表失败:', error);
    throw error;
  }
}

// ----------------------------------------------------------------------------
// 区域 4：推送到电脑端 Mayfly 安装信令服务 (接入双通道自适应调度)
// ----------------------------------------------------------------------------

import { pushModAdaptive } from './remote-channel.js';

/**
 * 远程推送信令到电脑端 Mayfly 自动下载并原生安装 (支持局域网 WiFi + 外网公共云通道自适应)
 * @param {Object} modItem - 要推送安装的模组信息
 * @param {Object} [overrideConfig] - 临时覆盖的电脑端网络配置
 * @returns {Promise<{ success: boolean, message: string, channel?: string }>}
 */
export async function pushModToDesktop(modItem, overrideConfig = null) {
  return pushModAdaptive(modItem, overrideConfig);
}

export async function testDesktopConnection(host, port = 9876) {
  const cleanHost = String(host || '').trim().replace(/^http:\/\//, '');
  if (!cleanHost) return false;

  // 1. 优先尝试伴侣端点 /api/ping
  const pingUrl = `http://${cleanHost}:${port}/api/ping`;
  try {
    const res = await uni.request({
      url: pingUrl,
      method: 'GET',
      timeout: 2500
    });
    if (res.statusCode === 200) return true;
  } catch (err) {
    // 静默降级尝试下一个端点
  }

  // 2. 尝试电脑端原生内置助手状态端点 /api/status
  const statusUrl = `http://${cleanHost}:${port}/api/status`;
  try {
    const res = await uni.request({
      url: statusUrl,
      method: 'GET',
      timeout: 2500
    });
    return res.statusCode === 200;
  } catch (err) {
    return false;
  }
}

// ----------------------------------------------------------------------------
// 区域 5：模组前置依赖与避坑排查检测
// ----------------------------------------------------------------------------

/**
 * 查询模组所需的前置依赖与底层 Loader 要求
 * @param {string|number} modId - 模组 ID
 * @param {string|number} gameId - 游戏 ID
 * @returns {Promise<Array<{ name: string, notes: string, url: string }>>}
 */
export async function fetchModRequirements(modId, gameId) {
  if (!modId || !gameId) return [];

  const gqlQuery = `
    query ModRequirements($modId: ID!, $gameId: ID!) {
      mod(modId: $modId, gameId: $gameId) {
        modRequirements {
          nexusRequirements {
            nodes {
              modName
              notes
              url
              externalRequirement
            }
          }
        }
      }
    }
  `;

  try {
    const res = await uni.request({
      url: NEXUS_GRAPHQL_ENDPOINT,
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      data: JSON.stringify({
        query: gqlQuery,
        variables: {
          modId: String(modId),
          gameId: String(gameId)
        }
      }),
      timeout: 8000
    });

    if (res.statusCode === 200 && res.data) {
      const rawNodes = res.data?.data?.mod?.modRequirements?.nexusRequirements?.nodes || [];
      return rawNodes.map((n) => ({
        name: n.modName || '未知前置',
        notes: n.notes || '',
        url: n.url || '',
        external: Boolean(n.externalRequirement)
      }));
    }
  } catch (e) {
    console.warn('[MayflyNexus] 拉取前置依赖异常:', e);
  }

  return [];
}

// ----------------------------------------------------------------------------
// 区域 6：模组物理文件列表 (Files) 查询与格式化
// ----------------------------------------------------------------------------

/**
 * 格式化字节大小为人类友好的可读字符串
 * @param {number|string} bytes - 字节数
 * @returns {string} 格式化后的文件大小 (如 "12.5 MB")
 */
export function formatFileSize(bytes) {
  const num = Number(bytes);
  if (isNaN(num) || num <= 0) return '未知大小';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = num;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

/**
 * 查询模组关联的全部物理文件列表 (支持 Main, Optional, Update 等分流)
 * @param {string|number} modId - 模组 ID
 * @param {string|number} gameId - 游戏 ID
 * @returns {Promise<Array<{ fileId: number, name: string, version: string, category: string, sizeFormatted: string, sizeInBytes: number, description: string, isPrimary: boolean, date: number }>>}
 */
export async function fetchModFiles(modId, gameId) {
  if (!modId || !gameId) return [];

  const gqlQuery = `
    query ModFilesListing($modId: ID!, $gameId: ID!) {
      modFiles(modId: $modId, gameId: $gameId) {
        fileId
        name
        version
        category
        size
        sizeInBytes
        description
        date
        primary
      }
    }
  `;

  try {
    const res = await uni.request({
      url: NEXUS_GRAPHQL_ENDPOINT,
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      data: JSON.stringify({
        query: gqlQuery,
        variables: {
          modId: String(modId),
          gameId: String(gameId)
        }
      }),
      timeout: 10000
    });

    if (res.statusCode === 200 && res.data) {
      const rawFiles = res.data?.data?.modFiles || [];
      return rawFiles.map((file) => {
        const rawBytes = Number(file.sizeInBytes) || (Number(file.size) * 1024) || 0;
        return {
          fileId: Number(file.fileId),
          name: file.name || '未命名文件',
          version: file.version || '1.0',
          category: file.category || 'MAIN',
          sizeFormatted: formatFileSize(rawBytes),
          sizeInBytes: rawBytes,
          description: (file.description || '').replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').trim(),
          isPrimary: Boolean(file.primary),
          date: Number(file.date) || 0
        };
      });
    }
  } catch (err) {
    console.warn('[MayflyNexus] 获取 Mod 文件列表异常:', err);
  }

  return [];
}

