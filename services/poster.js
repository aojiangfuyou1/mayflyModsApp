// ============================================================================
// 模块名称：MayflyMods 装机清单与图鉴海报生成服务 (Poster Service)
// 功能描述：负责 Mod 提取口令短码 (MF-XXXX) 生成、剪贴板多格式口令提取与分享文案编排
// 设计规范：简洁科技风、易于跨平台社交分发、支持剪贴板无缝识别
// ============================================================================

// ----------------------------------------------------------------------------
// 区域 1：口令短码生成与解析
// ----------------------------------------------------------------------------

/**
 * 根据 Mod ID 或随机种子生成 6 位极简提取短码 (例如 MF-8821)
 * @param {string|number} [seed] - 模组唯一标识或随机因子
 * @returns {string} 提取短码，如 "MF-8821"
 */
export function generateShareCode(seed = '') {
  let hash = 0;
  const str = String(seed || Date.now());
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) & 0xffff;
  }
  const codeNum = 1000 + (Math.abs(hash) % 9000);
  return `MF-${codeNum}`;
}

/**
 * 从任意文本中解析出 Nexus 链接或 Mayfly 提取口令短码
 * @param {string} text - 待解析文本 (如剪贴板内容)
 * @returns {{ type: 'nexus_url'|'share_code'|null, domain?: string, modId?: string, code?: string }|null}
 */
export function parseShareClipboard(text) {
  if (!text || typeof text !== 'string') return null;
  const clean = text.trim();

  // 1. 优先匹配 NexusMods 标准链接：https://www.nexusmods.com/{domain}/mods/{id}
  const nexusMatch = clean.match(/nexusmods\.com\/([a-zA-Z0-9_\-]+)\/mods\/(\d+)/i);
  if (nexusMatch) {
    return {
      type: 'nexus_url',
      domain: nexusMatch[1],
      modId: nexusMatch[2]
    };
  }

  // 2. 匹配 Mayfly 专属口令：MF-1234
  const codeMatch = clean.match(/\b(MF-\d{4})\b/i);
  if (codeMatch) {
    return {
      type: 'share_code',
      code: codeMatch[1].toUpperCase()
    };
  }

  return null;
}

// ----------------------------------------------------------------------------
// 区域 2：格式化社交分享文案
// ----------------------------------------------------------------------------

/**
 * 组装单个 Mod 的标准分享口令文案
 * @param {Object} modInfo - 模组对象
 * @returns {string} 格式化口令文案
 */
export function formatModShareText(modInfo) {
  if (!modInfo) return '';
  const game = modInfo.game?.name || '热门游戏';
  const title = modInfo.title || '精选模组';
  const code = generateShareCode(modInfo.modId || modInfo.id);
  const url = modInfo.website || (modInfo.game?.domainName && modInfo.modId
    ? `https://www.nexusmods.com/${modInfo.game.domainName}/mods/${modInfo.modId}`
    : 'https://www.nexusmods.com');

  return [
    `【Mayfly Mod 极速装机口令】`,
    `🔑 口令短码：${code}`,
    `🎮 所属游戏：《${game}》`,
    `📦 模组名称：${title}`,
    `🔗 官方出处：${url}`,
    `⚡ 复制本段文字，打开 MayflyMods 手机端即可一键推送到电脑极速安装！`
  ].join('\n');
}

/**
 * 组装心愿单批量模组分享文案
 * @param {Array} favoritesList - 收藏模组列表
 * @returns {string} 格式化心愿单装机清单
 */
export function formatFavoritesShareText(favoritesList = []) {
  if (!favoritesList || favoritesList.length === 0) return '';
  const lines = [
    `【Mayfly 玩家专属心愿单 · 装机清单 (${favoritesList.length}款)】`,
    `----------------------------------------`
  ];

  favoritesList.slice(0, 15).forEach((item, index) => {
    const game = item.game?.name || '游戏';
    lines.push(`${index + 1}. [${game}] ${item.title}`);
  });

  if (favoritesList.length > 15) {
    lines.push(`... 等共计 ${favoritesList.length} 款模组`);
  }

  lines.push(`----------------------------------------`);
  lines.push(`💡 导入方式：复制此清单，打开 Mayfly 手机端一键批量推送到电脑！`);

  return lines.join('\n');
}
