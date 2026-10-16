// ============================================================================
// 模块名称：MayflyMods 心愿单与收藏夹服务 (Favorites Service)
// 功能描述：管理用户收藏的 Mod 清单，支持离线持久化、批量推送与分享
// ============================================================================

export const STORAGE_KEY_FAVORITES = 'mayfly_mod_favorites';

/**
 * 获取收藏夹列表
 * @returns {Array<Object>} 收藏模组数组
 */
export function getFavorites() {
  try {
    const list = uni.getStorageSync(STORAGE_KEY_FAVORITES);
    if (Array.isArray(list)) {
      return list;
    }
  } catch (e) {
    console.warn('[MayflyFavorites] 读取心愿单失败:', e);
  }
  return [];
}

/**
 * 检查模组是否已被收藏
 * @param {string|number} modId - 模组 ID
 * @returns {boolean}
 */
export function isFavorited(modId) {
  if (!modId) return false;
  const targetId = String(modId);
  const list = getFavorites();
  return list.some((item) => String(item.id || item.modId) === targetId);
}

/**
 * 切换收藏状态 (已收藏则取消，未收藏则加入)
 * @param {Object} modItem - 模组对象
 * @returns {boolean} 操作后的收藏状态 (true 为已收藏, false 为已取消)
 */
export function toggleFavorite(modItem) {
  if (!modItem || !modItem.id) return false;
  const targetId = String(modItem.modId || modItem.id);
  const list = getFavorites();

  const existsIndex = list.findIndex((item) => String(item.id || item.modId) === targetId);
  let nextList;
  let favorited = false;

  if (existsIndex >= 0) {
    // 已经收藏，执行移除
    nextList = list.filter((_, idx) => idx !== existsIndex);
    favorited = false;
  } else {
    // 未收藏，执行追加置顶
    const newEntry = {
      id: targetId,
      modId: targetId,
      title: modItem.title,
      summary: modItem.summary,
      coverImageUrl: modItem.coverImageUrl,
      version: modItem.version || '1.0',
      downloads: Number(modItem.downloads) || 0,
      likes: Number(modItem.likes) || 0,
      category: modItem.category || '综合',
      game: {
        name: modItem.game?.name || '',
        domainName: modItem.game?.domainName || ''
      },
      author: modItem.author || '未知',
      website: modItem.website || '',
      favoriteTime: Date.now()
    };
    nextList = [newEntry, ...list];
    favorited = true;
  }

  try {
    uni.setStorageSync(STORAGE_KEY_FAVORITES, nextList);
  } catch (e) {
    console.error('[MayflyFavorites] 保存心愿单失败:', e);
  }

  return favorited;
}

/**
 * 清空所有收藏
 */
export function clearFavorites() {
  try {
    uni.removeStorageSync(STORAGE_KEY_FAVORITES);
    return true;
  } catch (e) {
    return false;
  }
}
