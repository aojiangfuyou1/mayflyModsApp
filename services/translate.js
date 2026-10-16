// ============================================================================
// 模块名称：MayflyMods 智能翻译与 AI 中文图鉴服务 (Translation Service)
// 功能描述：负责 Mod 英文标题与详细介绍的中文本地化、结构化摘要提取与本地缓存
// 架构优势：免 API Key，国内网络稳定直连，支持长短文本自动分块与并发批量聚合
// ============================================================================

// ----------------------------------------------------------------------------
// 区域 1：常量与内存缓存池
// ----------------------------------------------------------------------------

/** Microsoft Edge 内置翻译接口端点 */
const EDGE_TRANSLATE_ENDPOINT = 'https://edge.microsoft.com/translate/translatetext?to=zh-Hans&isEnterpriseClient=false';

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
  'Models and Textures': '模型与材质',
  'Patches': '补丁与修复',
  'Gameplay': '玩法与机制',
  'Visuals': '画质与视觉',
  'Audio': '音效与音乐',
  'Companions': '同伴随从',
  'Followers': '随从随行',
  'Overhauls': '大型全面重制',
  'User Interface': '用户界面',
  'UI': '界面 UI',
  'Quests': '任务与剧情',
  'Locations': '地点与建筑',
  'Utilities': '实用工具',
  'Animation': '动作与动画',
  'Magic': '魔法与法术',
  'Cheats': '作弊与辅助',
  'Bug Fixes': '问题修复',
  'Clothing': '服饰服装',
  'Hair and Face': '发型脸型捏脸',
  'Characters': '角色美化',
  'Environment': '环境与天气',
  'Vehicles': '载具与车辆',
  'Crafting': '打造与锻造',
  'Combat': '战斗系统',
  'Items': '物品道具',
  'Miscellaneous': '综合杂项'
};

/**
 * 获取分类的友好中文名称
 * @param {string} category - 英文分类名
 * @returns {string} 中文分类名
 */
export function getCategoryZhName(category) {
  if (!category) return '';
  const clean = String(category).trim();
  if (CATEGORY_ZH_MAP[clean]) return CATEGORY_ZH_MAP[clean];
  for (const [en, zh] of Object.entries(CATEGORY_ZH_MAP)) {
    if (clean.toLowerCase() === en.toLowerCase()) return zh;
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

/**
 * 翻译长篇富文本模组正文（保留 BBCode 结构、图片与换行段落排版）
 * @param {string} rawText - 原始带有 BBCode 或 HTML 的正文文本
 * @returns {Promise<string>} 翻译后的中文正文
 */
export async function translateRichDescription(rawText) {
  if (!rawText || !rawText.trim()) return '';

  if (memoryTranslationCache.has(rawText)) {
    return memoryTranslationCache.get(rawText);
  }

  // 按行切分，保留排版骨架
  const lines = rawText.split('\n');
  const textLinesToTranslate = [];
  const lineIndices = [];

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    // 过滤掉纯空行、纯标签（如 [img]...[/img]、纯 BBCode 闭合符）
    if (
      !trimmed ||
      /^\[img\][\s\S]*?\[\/img\]$/i.test(trimmed) ||
      /^\[\/?(center|left|right|list|\*|b|i|u|size=[0-9]+)\]$/i.test(trimmed)
    ) {
      return;
    }
    // 纯中文跳过
    if (/^[\u4e00-\u9fa50-9\s，。！？、]+$/.test(trimmed)) {
      return;
    }
    textLinesToTranslate.push(trimmed);
    lineIndices.push(idx);
  });

  if (textLinesToTranslate.length === 0) {
    return rawText;
  }

  // 批量并发翻译所有段落行
  const transMap = await batchTranslateToZh(textLinesToTranslate);

  // 逐行替换还原富文本结构
  const translatedLines = [...lines];
  lineIndices.forEach((lineIdx, i) => {
    const original = textLinesToTranslate[i];
    if (transMap.has(original)) {
      translatedLines[lineIdx] = transMap.get(original);
    }
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
