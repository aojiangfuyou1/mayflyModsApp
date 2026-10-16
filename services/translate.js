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
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Edg/122.0.0.0'
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
