// ============================================================================
// 模块名称：MayflyMods 智能翻译与 AI 中文图鉴服务 (Translation Service)
// 功能描述：负责 Mod 英文标题与详细介绍的中文本地化、结构化摘要提取与本地缓存
// 架构优势：免 API Key，国内网络稳定直连，支持长短文本自动分块与并发批量聚合
// ============================================================================

// ----------------------------------------------------------------------------
// 区域 1：常量与内存缓存池
// ----------------------------------------------------------------------------

/** Microsoft Edge 内置翻译接口端点 (英译中) */
const EDGE_TRANSLATE_ENDPOINT = 'https://edge.microsoft.com/translate/translatetext?to=zh-Hans&isEnterpriseClient=false';

/** Microsoft Edge 内置翻译接口端点 (中译英，用于智能搜索自动转英文) */
const EDGE_TRANSLATE_EN_ENDPOINT = 'https://edge.microsoft.com/translate/translatetext?to=en&isEnterpriseClient=false';

/** 内存中的翻译文本缓存池 (减少重复网络请求) */
const memoryTranslationCache = new Map();

/** 本地持久化缓存最大条数 */
const MAX_PERSISTED_TRANSLATION_ITEMS = 500;
const STORAGE_KEY_TRANSLATIONS = 'mayfly_translations_cache';

/**
 * 从本地持久化缓存恢复常用翻译词条
 */
function loadPersistedTranslations() {
  try {
    const data = uni.getStorageSync(STORAGE_KEY_TRANSLATIONS);
    if (data && typeof data === 'object') {
      Object.entries(data).forEach(([key, val]) => {
        if (typeof val === 'string' && val.trim()) {
          memoryTranslationCache.set(key, val.trim());
        }
      });
    }
  } catch (e) {
    console.warn('[MayflyTranslate] 加载本地翻译缓存失败:', e);
  }
}

/**
 * 将翻译条目保存到本地持久化存储
 */
function persistTranslations() {
  try {
    const obj = {};
    let count = 0;
    // 取最近的条目持久化
    for (const [key, val] of memoryTranslationCache.entries()) {
      if (count >= MAX_PERSISTED_TRANSLATION_ITEMS) break;
      obj[key] = val;
      count++;
    }
    uni.setStorageSync(STORAGE_KEY_TRANSLATIONS, obj);
  } catch (e) {
    console.warn('[MayflyTranslate] 持久化翻译缓存失败:', e);
  }
}

// 模块初始化时尝试恢复缓存
loadPersistedTranslations();

// ----------------------------------------------------------------------------
// 区域 1.5：Nexus 常用分类中英映射表 (毫秒级直出，零网络延迟)
// ----------------------------------------------------------------------------
export const CATEGORY_ZH_MAP = {
  'Armour': '护甲装备',
  'Weapons': '武器装备',
  'Weapons and Armour': '武器与护甲',
  'Weapons & Armour': '武器与护甲',
  'Models and Textures': '模型与材质',
  'Models & Textures': '模型与材质',
  'Patches': '补丁与修复',
  'Gameplay': '玩法与机制',
  'Gameplay Effects and Changes': '玩法机制改动',
  'Visuals': '画质与视觉',
  'Visuals & Graphics': '视觉与画质',
  'Audio': '音效与音乐',
  'Audio & Music': '音效与音乐',
  'Audio, Music & Sound': '音频音乐与音效',
  'Companions': '同伴随从',
  'Followers': '随从随行',
  'Followers & Companions': '随从与同伴',
  'Followers and Companions': '随从与同伴',
  'Overhauls': '大型全面重制',
  'User Interface': '用户界面',
  'User Interfaces': '用户界面与HUD',
  'UI': '界面 UI',
  'Quests': '任务与剧情',
  'Quests & Adventures': '任务与冒险剧情',
  'Locations': '地点与建筑',
  'Player homes': '玩家住宅房屋',
  'Player Homes': '玩家住宅房屋',
  'Utilities': '实用工具',
  'Animation': '动作与动画',
  'Animations': '动作与动画',
  'Magic': '魔法与法术',
  'Magic & Spells': '魔法与法术',
  'Skills & Leveling': '技能与升级系统',
  'Cheats': '作弊与辅助',
  'Bug Fixes': '问题修复',
  'Bug fixes': '问题修复补丁',
  'Clothing': '服饰服装',
  'Clothing & Accessories': '服饰与佩饰',
  'Hair and Face': '发型脸型捏脸',
  'Body, Face, and Hair': '身体脸型与发型',
  'Characters': '角色美化',
  'NPC': 'NPC人物角色',
  'NPCs': 'NPC人物角色',
  'Creatures & Mounts': '生物与坐骑',
  'Mounts & Animals': '坐骑与动物',
  'Dungeons - New': '全新地下城地牢',
  'Dungeons': '地下城地牢',
  'Environment': '环境与天气',
  'Vehicles': '载具与车辆',
  'Crafting': '打造与锻造',
  'Crafting & Materials': '打造与锻造材料',
  'Combat': '战斗系统',
  'Items': '物品道具',
  'Items & Objects': '物品道具与收藏',
  'Collectibles': '收集品与纪念物',
  'Immersion': '沉浸真实感体验',
  'Miscellaneous': '综合杂项',
  'Models/Meshes': '模型/网格',
  'Meshes': '模型网格',
  'Models': '模型资产',
  'Textures': '材质贴图',
  'Related to Movies/TV/Books/Other Games': '影视/书籍/其他联动',
  'Related to Movies, TV, Books, and Other Games': '影视/书籍/其他联动',
  'Translation': '汉化翻译',
  'English': '英文原版',
  'Armor': '护甲防具',
  'Weapons and Armor': '武器与护甲',
  'Poses': '动作姿势',
  'Audio - SFX': '音效补丁',
  'Audio - Music': '背景音乐',
  'Audio - Voice': '语音配音',
  'Guilds/Factions': '阵营与公会'
};

/**
 * 获取分类或标签的友好中文名称 (支持复合词拆解与模糊匹配)
 * @param {string} category - 英文分类或标签名
 * @returns {string} 中文分类名
 */
export function getCategoryZhName(category) {
  if (!category) return '';
  const clean = String(category).trim();
  if (CATEGORY_ZH_MAP[clean]) return CATEGORY_ZH_MAP[clean];
  for (const [en, zh] of Object.entries(CATEGORY_ZH_MAP)) {
    if (clean.toLowerCase() === en.toLowerCase()) return zh;
  }
  // 针对包含 / 的标签智能拆解匹配 (如 Models/Meshes -> 模型/网格)
  if (clean.includes('/')) {
    const slashParts = clean.split('/').map(p => p.trim());
    if (slashParts.length >= 2) {
      const zhParts = slashParts.map(p => getCategoryZhName(p));
      return zhParts.join('/');
    }
  }
  // 针对包含 & 或 and 的复合短语智能分段匹配
  if (clean.includes('&') || clean.toLowerCase().includes(' and ')) {
    const parts = clean.split(/\s*(&|\band\b)\s*/i).filter(p => p && p !== '&' && p.toLowerCase() !== 'and');
    if (parts.length >= 2) {
      const zhParts = parts.map(p => getCategoryZhName(p.trim()));
      if (zhParts.every(z => z && z !== parts[0])) {
        return zhParts.join('与');
      }
    }
  }
  return clean;
}

// ----------------------------------------------------------------------------
// 区域 2：核心批量翻译与文本分块
// ----------------------------------------------------------------------------

/**
 * 批量翻译多条文本到简体中文
 * @param {string[]} texts - 待翻译的原文字符串数组
 * @returns {Promise<Map<string, string>>} 原文 -> 译文的映射 Map
 */
export async function batchTranslateToZh(texts) {
  const result = new Map();
  if (!Array.isArray(texts) || texts.length === 0) return result;

  // 1. 过滤已缓存条目与纯中文/空字符
  const pendingTexts = [];
  texts.forEach((text) => {
    const clean = String(text || '').trim();
    if (!clean) return;

    // 检查缓存
    if (memoryTranslationCache.has(clean)) {
      result.set(clean, memoryTranslationCache.get(clean));
      return;
    }

    // 若已经是纯中文文本，直接复用
    if (/^[\u4e00-\u9fa50-9\s，。！？、]+$/.test(clean)) {
      result.set(clean, clean);
      return;
    }

    if (!pendingTexts.includes(clean)) {
      pendingTexts.push(clean);
    }
  });

  if (pendingTexts.length === 0) {
    return result;
  }

  // 2. 将待翻译文本分批（每批最多 15 条，防止单次 Payload 过大）
  const BATCH_SIZE = 15;
  for (let i = 0; i < pendingTexts.length; i += BATCH_SIZE) {
    const chunk = pendingTexts.slice(i, i + BATCH_SIZE);

    try {
      const response = await uni.request({
        url: EDGE_TRANSLATE_ENDPOINT,
        method: 'POST',
        header: {
          'Content-Type': 'application/json'
        },
        data: JSON.stringify(chunk),
        timeout: 10000
      });

      if (response.statusCode === 200 && Array.isArray(response.data)) {
        const payload = response.data;
        chunk.forEach((originalText, index) => {
          const trans = payload[index]?.translations?.[0]?.text?.trim();
          if (trans) {
            memoryTranslationCache.set(originalText, trans);
            result.set(originalText, trans);
          } else {
            result.set(originalText, originalText);
          }
        });
      } else {
        // 请求失败兜底原文本
        chunk.forEach((txt) => result.set(txt, txt));
      }
    } catch (err) {
      console.warn('[MayflyTranslate] 分批翻译请求异常:', err);
      chunk.forEach((txt) => result.set(txt, txt));
    }
  }

  // 异步持久化更新
  setTimeout(persistTranslations, 1000);
  return result;
}

/**
 * 翻译单条文本（如模组长篇简介或标题）
 * @param {string} text - 待翻译的原文字符串
 * @returns {Promise<string>} 翻译后的中文文本
 */
export async function translateTextToZh(text) {
  const clean = String(text || '').trim();
  if (!clean) return '';

  if (memoryTranslationCache.has(clean)) {
    return memoryTranslationCache.get(clean);
  }

  const map = await batchTranslateToZh([clean]);
  return map.get(clean) || clean;
}

// ----------------------------------------------------------------------------
// 区域 2.5：中文智能转英文搜索 (支持常用模组关键词秒级命中 + 微软云端智能翻译)
// ----------------------------------------------------------------------------

/** 常用模组检索中文 -> 英文关键词高速直出映射字典 (零网络延迟秒出) */
export const COMMON_MOD_KEYWORDS_ZH_TO_EN = {
  '护甲': 'armor',
  '盔甲': 'armor',
  '防具': 'armor',
  '服装': 'outfit',
  '衣服': 'clothing',
  '装备': 'equipment',
  '武器': 'weapon',
  '剑': 'sword',
  '大剑': 'greatsword',
  '双手剑': 'greatsword',
  '匕首': 'dagger',
  '弓': 'bow',
  '枪': 'gun',
  '法杖': 'staff',
  '随从': 'follower',
  '同伴': 'companion',
  '美化': 'beauty',
  '发型': 'hair',
  '头发': 'hair',
  '捏脸': 'preset',
  '皮肤': 'skin',
  '身形': 'body',
  '动作': 'animation',
  '动画': 'animation',
  '姿势': 'pose',
  '房屋': 'house',
  '住宅': 'home',
  '地点': 'location',
  '地图': 'map',
  '魔法': 'magic',
  '法术': 'spell',
  '补丁': 'patch',
  '修复': 'fix',
  '重制': 'overhaul',
  '大修': 'overhaul',
  '界面': 'ui',
  '天气': 'weather',
  '环境': 'environment',
  '材质': 'texture',
  '纹理': 'texture',
  '光影': 'lighting',
  '作弊': 'cheat',
  '音效': 'sound',
  '音乐': 'music',
  '汉化': 'chinese'
};

/**
 * 智能将中文搜索词自动翻译为英文检索词 (用于向 NexusMods GraphQL 发起精确检索)
 * 1. 纯英文输入直接放行
 * 2. 模组高频词典 0ms 直出
 * 3. 微软 Edge 云端智能翻译
 * @param {string} text - 用户输入的原始搜索词
 * @returns {Promise<string>} 转换后的英文检索词
 */
export async function translateZhToEn(text) {
  const clean = String(text || '').trim();
  if (!clean) return '';

  // 1. 若纯英文/数字/符号不含中文，直接返回无需转换
  if (!/[\u4e00-\u9fa5]/.test(clean)) {
    return clean;
  }

  // 2. 本地高频模组词典匹配
  if (COMMON_MOD_KEYWORDS_ZH_TO_EN[clean]) {
    return COMMON_MOD_KEYWORDS_ZH_TO_EN[clean];
  }

  // 3. 部分词匹配
  for (const [zh, en] of Object.entries(COMMON_MOD_KEYWORDS_ZH_TO_EN)) {
    if (clean === zh) {
      return en;
    }
  }

  // 4. 调用 Microsoft Edge 官方中译英端点
  try {
    const res = await uni.request({
      url: EDGE_TRANSLATE_EN_ENDPOINT,
      method: 'POST',
      header: {
        'Content-Type': 'application/json'
      },
      data: JSON.stringify([clean]),
      timeout: 6000
    });

    if (res.statusCode === 200 && Array.isArray(res.data)) {
      const translated = res.data[0]?.translations?.[0]?.text?.trim();
      if (translated) {
        return translated.toLowerCase();
      }
    }
  } catch (err) {
    console.warn('[MayflyTranslate] 中译英网络异常，启用原词检索:', err);
  }

  return clean;
}

/**
 * 翻译长篇富文本模组正文（保留 BBCode 结构、图片与换行段落排版，杜绝标签被误翻为中文）
 * @param {string} rawText - 原始带有 BBCode 或 HTML 的正文文本
 * @returns {Promise<string>} 翻译后的中文正文
 */
export async function translateRichDescription(rawText) {
  if (!rawText || !rawText.trim()) return '';

  // 检查内存缓存，如果缓存存在且不包含早期被污染的中文代码标签，直接复用
  if (memoryTranslationCache.has(rawText)) {
    const cached = memoryTranslationCache.get(rawText);
    if (!/\[(?:尺寸|大小|体型|颜色|图片)=/i.test(cached)) {
      return cached;
    }
    // 发现早期被污染的损坏翻译，主动失效重新计算
    memoryTranslationCache.delete(rawText);
  }

  // 1. 按行切分，保留原始行排版结构
  const lines = rawText.split('\n');
  const lineTasks = []; // { lineIdx, originalLine, maskedLine, tokenMap }

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    // 先测试剥离 HTML 标签、BBCode 标签以及 URL 后的纯文本内容
    const stripped = trimmed
      .replace(/\[img\][\s\S]*?\[\/img\]/gi, '')
      .replace(/\[\/?(?:[a-zA-Z0-9_*#]+)(?:=[^\]]*)?\]/g, '')
      .replace(/<[^>]+>/g, '')
      .replace(/https?:\/\/[^\s\]<]+/g, '')
      .trim();

    // 如果剥离后没有英文字母（说明全是标签、标点、数字或已是纯中文），完全不需要翻译！直接放行原样保留
    if (!/[a-zA-Z]/.test(stripped)) {
      return;
    }

    // 2. 对该行进行 BBCode、HTML 标签与 URL 的占位符掩码保护 (Tokenization)
    const tokenMap = new Map();
    let tokenIndex = 0;

    // 优先完整保护 [img]...[/img] 资产块
    let masked = trimmed.replace(/\[img\][\s\S]*?\[\/img\]/gi, (match) => {
      const token = `⟦IMG_${tokenIndex++}⟧`;
      tokenMap.set(token, match);
      return token;
    });

    // 保护所有 BBCode 标签（如 [size=4]、[/size]、[color=#abc]、[b]、[url=...] 等）
    masked = masked.replace(/\[\/?(?:[a-zA-Z0-9_*#]+)(?:=[^\]]*)?\]/g, (match) => {
      const token = `⟦TAG_${tokenIndex++}⟧`;
      tokenMap.set(token, match);
      return token;
    });

    // 保护所有 HTML 标签（如 <br />、<img ... /> 等）
    masked = masked.replace(/<[^>]+>/g, (match) => {
      const token = `⟦HTML_${tokenIndex++}⟧`;
      tokenMap.set(token, match);
      return token;
    });

    // 保护裸 URL
    masked = masked.replace(/https?:\/\/[^\s\]<]+/g, (match) => {
      const token = `⟦URL_${tokenIndex++}⟧`;
      tokenMap.set(token, match);
      return token;
    });

    // 再次检查掩码后的文本，若除占位符外已无英文正文内容，直接跳过
    const textOnly = masked.replace(/⟦[A-Z0-9_]+⟧/g, '').trim();
    if (!/[a-zA-Z]/.test(textOnly)) {
      return;
    }

    lineTasks.push({
      lineIdx: idx,
      originalLine: trimmed,
      maskedLine: masked,
      tokenMap
    });
  });

  if (lineTasks.length === 0) {
    return rawText;
  }

  // 3. 收集所有掩码后的文本行批量并发请求翻译
  const maskedTexts = lineTasks.map((t) => t.maskedLine);
  const transMap = await batchTranslateToZh(maskedTexts);

  // 4. 逐行还原占位符，拼接回原版富文本结构
  const translatedLines = [...lines];
  lineTasks.forEach((task) => {
    let trans = transMap.get(task.maskedLine) || task.maskedLine;
    // 精准还原所有 Token 占位符
    task.tokenMap.forEach((originalVal, token) => {
      const escapedToken = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      trans = trans.replace(new RegExp(escapedToken, 'g'), originalVal);
      // 容错防备机器翻译全角半角括号微调
      const innerName = token.replace(/^⟦|⟧$/g, '');
      const looseRegex = new RegExp(`[⟦\\[]\\s*${innerName}\\s*[\\]⟧]`, 'g');
      trans = trans.replace(looseRegex, originalVal);
    });
    translatedLines[task.lineIdx] = trans;
  });

  const finalResult = translatedLines.join('\n');
  memoryTranslationCache.set(rawText, finalResult);
  return finalResult;
}

/**
 * 批量为模组列表项目翻译标题、简介摘要与分类
 * @param {Array} items - 模组对象数组
 * @returns {Promise<{ zhTitleMap: Object, zhSummaryMap: Object, zhCategoryMap: Object }>}
 */
export async function batchTranslateModList(items) {
  const result = {
    zhTitleMap: {},
    zhSummaryMap: {},
    zhCategoryMap: {}
  };
  if (!Array.isArray(items) || items.length === 0) return result;

  const textSet = new Set();

  items.forEach((item) => {
    if (item.title) textSet.add(item.title);
    if (item.summary) textSet.add(item.summary);
    if (item.category) {
      const zhCat = getCategoryZhName(item.category);
      if (zhCat !== item.category) {
        result.zhCategoryMap[item.category] = zhCat;
      } else {
        textSet.add(item.category);
      }
    }
  });

  if (textSet.size === 0) return result;

  try {
    const translatedMap = await batchTranslateToZh(Array.from(textSet));
    items.forEach((item) => {
      if (item.title && translatedMap.has(item.title)) {
        result.zhTitleMap[item.id] = translatedMap.get(item.title);
      }
      if (item.summary && translatedMap.has(item.summary)) {
        result.zhSummaryMap[item.id] = translatedMap.get(item.summary);
      }
      if (item.category) {
        if (!result.zhCategoryMap[item.category] && translatedMap.has(item.category)) {
          result.zhCategoryMap[item.category] = translatedMap.get(item.category);
        }
      }
    });
  } catch (e) {
    console.warn('[MayflyTranslate] 批量翻译模组列表异常:', e);
  }

  return result;
}

// ----------------------------------------------------------------------------
// 区域 3：AI 中文图鉴要点提炼
// ----------------------------------------------------------------------------

/**
 * 将模组详细描述加工为 AI 风格的中文结构化摘要
 * @param {string} rawSummary - 原始英文简介
 * @param {string} [translatedSummary] - 已翻译的中文简介
 * @returns {{ oneSentence: string, highlights: string[] }}
 */
export function formatAiModSummary(rawSummary, translatedSummary = '') {
  const summaryText = translatedSummary || rawSummary || '暂无详细介绍说明';

  // 提取一句话速览（第一句或截取前 60 字）
  const sentences = summaryText.split(/[。！？\n]/).map((s) => s.trim()).filter(Boolean);
  const oneSentence = sentences[0] || summaryText.slice(0, 60);

  // 提取核心改动要点
  const highlights = [];
  if (sentences.length > 1) {
    for (let i = 1; i < Math.min(sentences.length, 4); i++) {
      if (sentences[i] && sentences[i].length > 4) {
        highlights.push(sentences[i]);
      }
    }
  }

  // 如果没有足够长句，生成规范指引项
  if (highlights.length === 0) {
    highlights.push('采用原生资产无损替换技术，即装即用');
    highlights.push('兼容最新游戏版本与主流核心组件');
  }

  return {
    oneSentence,
    highlights
  };
}
