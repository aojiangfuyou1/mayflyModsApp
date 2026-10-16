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
        game: {
          id: item.game?.id || 0,
          domainName: item.game?.domainName || '',
          name: item.game?.name || '未知游戏'
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

/**
 * 测试与电脑端 Mayfly 的网络连通性
 * @param {string} host - 电脑主机 IP
 * @param {number|string} port - 电脑端口
 * @returns {Promise<boolean>}
 */
export async function testDesktopConnection(host, port = 9876) {
  const cleanHost = String(host || '').trim().replace(/^http:\/\//, '');
  if (!cleanHost) return false;
  const targetUrl = `http://${cleanHost}:${port}/api/ping`;

  try {
    const res = await uni.request({
      url: targetUrl,
      method: 'GET',
      timeout: 3000
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

