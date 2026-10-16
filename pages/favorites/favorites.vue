<template>
  <!-- ======================================================================== -->
  <!-- 页面名称：装机心愿单 (Wishlist Page)                                     -->
  <!-- 功能描述：独立全屏展示与管理本地收藏的 Mod，支持批量导出与一键安装到电脑 -->
  <!-- ======================================================================== -->
  <view class="favoritesPage">
    <!-- 1. 全局沉浸式顶栏 -->
    <NexusHeader
      title="装机心愿单"
      :show-back="true"
      :show-search="false"
      :desktop-config="desktopConfig"
      :nexus-user="nexusUser"
      @back-click="handleNavBack"
      @drawer-click="drawerVisible = true"
      @pc-click="deviceModalVisible = true"
      @user-click="openNexusAuth"
      @logo-click="handleNavBack"
    />

    <view class="favContainer">
      <!-- 2. 心愿单顶栏与批量操作区 -->
      <view class="favoritesHeaderCard">
        <view class="favScopeRow" v-if="selectedGameDomain">
          <view
            class="favScopeTab"
            :class="{ active: favoritesScope === 'current' }"
            @click="favoritesScope = 'current'"
          >
            <text class="favScopeText">🎮 {{ activeGameDisplayName || '当前游戏' }} ({{ currentGameFavCount }})</text>
          </view>
          <view
            class="favScopeTab"
            :class="{ active: favoritesScope === 'all' }"
            @click="favoritesScope = 'all'"
          >
            <text class="favScopeText">🌐 全部游戏 ({{ favoritesList.length }})</text>
          </view>
        </view>

        <view class="favSummaryText">
          <text class="favCountNum">❤️ 已收藏 {{ filteredFavoritesList.length }} 个模组</text>
          <text class="favTipText">{{ selectedGameDomain && favoritesScope === 'current' ? `当前仅展示 ${activeGameDisplayName} 模组` : '展示全游戏综合心愿单' }}</text>
        </view>

        <view class="favBatchActions" v-if="filteredFavoritesList.length > 0">
          <button class="favExportBtn" @click="exportFavoritesList">
            <text class="favExportBtnText">📋 导出分享</text>
          </button>
          <button
            class="favBatchPushBtn"
            :disabled="isBatchPushing"
            @click="batchPushFavorites"
          >
            <text class="favBatchBtnText">
              {{ isBatchPushing ? '投递中...' : `🚀 批量推送 (${filteredFavoritesList.length})` }}
            </text>
          </button>
        </view>
      </view>

      <!-- 3. 模组网格列表 -->
      <view class="modsGrid" v-if="filteredFavoritesList.length > 0">
        <ModCard
          v-for="item in filteredFavoritesList"
          :key="item.id"
          :item="item"
          :selected-game-domain="selectedGameDomain"
          :enable-auto-translate="enableAutoTranslate"
          :is-favorited="true"
          :is-pushing="pushingModId === item.id"
          @click="openDetail(item)"
          @favorite="toggleCardFavorite(item)"
          @push="quickPushToDesktop(item)"
        />
      </view>

      <!-- 空状态提示 -->
      <view class="emptyFavBox" v-else>
        <text class="emptyFavIcon">❤️</text>
        <text class="emptyFavTitle">心愿单空空如也</text>
        <text class="emptyFavSub">在模组流中点击卡片右上角的心形图标即可加入心愿单</text>
        <button class="goExploreBtn" @click="handleNavBack">
          <text class="goExploreBtnText">去发现精彩 Mod ›</text>
        </button>
      </view>
    </view>

    <!-- 4. 全局抽屉组件 -->
    <NexusDrawer
      :visible="drawerVisible"
      :nexus-user="nexusUser"
      :selected-game-domain="selectedGameDomain"
      :active-game-display-name="activeGameDisplayName"
      :desktop-config="desktopConfig"
      :enable-auto-translate="enableAutoTranslate"
      :favorites-count="favoritesList.length"
      @close="drawerVisible = false"
      @nav="handleDrawerNav"
      @toggle-translate="enableAutoTranslate = !enableAutoTranslate"
      @quick-test="runQuickTest"
    />

    <!-- 5. 弹窗组件 -->
    <DevicePairModal
      :visible="deviceModalVisible"
      :config="desktopConfig"
      @close="deviceModalVisible = false"
      @saved="desktopConfig = { ...$event }"
    />

    <NexusAuthModal
      :visible="nexusAuthModalVisible"
      :nexus-user="nexusUser"
      :desktop-config="desktopConfig"
      @close="nexusAuthModalVisible = false"
      @login-success="onNexusLoginSuccess"
      @logout="onNexusLogout"
    />
  </view>
</template>

<script>
// ============================================================================
// 页面脚本：装机心愿单独立管理与批量推送
// ============================================================================
import {
  getFavorites,
  toggleFavorite
} from '../../services/favorites.js';
import {
  pushModToDesktop,
  getDesktopConfig,
  saveDesktopConfig,
  testDesktopConnection,
  getNexusUser,
  getNexusApiKey
} from '../../services/nexus.js';
import { formatFavoritesShareText } from '../../services/poster.js';
import NexusHeader from '../../components/NexusHeader.vue';
import NexusDrawer from '../../components/NexusDrawer.vue';
import ModCard from '../../components/ModCard.vue';
import DevicePairModal from '../../components/DevicePairModal.vue';
import NexusAuthModal from '../../components/NexusAuthModal.vue';

export default {
  components: {
    NexusHeader,
    NexusDrawer,
    ModCard,
    DevicePairModal,
    NexusAuthModal
  },

  data() {
    return {
      favoritesList: [],
      favoritesScope: 'all', // 'current' | 'all'
      selectedGameDomain: '',
      activeGameDisplayName: '',
      enableAutoTranslate: true,
      drawerVisible: false,
      deviceModalVisible: false,
      nexusAuthModalVisible: false,
      pushingModId: null,
      isBatchPushing: false,
      desktopConfig: { host: '192.168.1.100', port: 9876, connected: false },
      nexusUser: null,
      nexusApiKey: ''
    };
  },

  computed: {
    currentGameFavCount() {
      if (!this.selectedGameDomain) return 0;
      return this.favoritesList.filter(
        (m) => m.game?.domainName === this.selectedGameDomain
      ).length;
    },

    filteredFavoritesList() {
      if (this.selectedGameDomain && this.favoritesScope === 'current') {
        return this.favoritesList.filter(
          (m) => m.game?.domainName === this.selectedGameDomain
        );
      }
      return this.favoritesList;
    }
  },

  onShow() {
    this.refreshFavorites();
    this.desktopConfig = getDesktopConfig();
    this.nexusUser = getNexusUser();
    this.nexusApiKey = getNexusApiKey();
  },

  onLoad(query) {
    if (query && query.domain) {
      this.selectedGameDomain = query.domain;
      this.activeGameDisplayName = decodeURIComponent(query.zhName || query.name || '');
      this.favoritesScope = 'current';
    }
  },

  methods: {
    refreshFavorites() {
      this.favoritesList = getFavorites();
    },

    toggleCardFavorite(modItem) {
      toggleFavorite(modItem);
      this.refreshFavorites();
      uni.showToast({ title: '已移出心愿单', icon: 'none' });
    },

    openDetail(item) {
      const gDomain = item.game?.domainName || this.selectedGameDomain || '';
      const mId = item.modId || item.id;
      uni.navigateTo({
        url: `/pages/detail/detail?modId=${mId}&gameDomain=${gDomain}`
      });
    },

    async quickPushToDesktop(item) {
      this.pushingModId = item.id;
      try {
        const res = await pushModToDesktop(item);
        if (res.success) {
          uni.showToast({ title: '已推送到电脑端安装', icon: 'success' });
        } else {
          uni.showModal({ title: '推送失败', content: res.message, showCancel: false });
        }
      } catch (err) {
        uni.showToast({ title: '网络异常', icon: 'none' });
      } finally {
        this.pushingModId = null;
      }
    },

    exportFavoritesList() {
      if (this.filteredFavoritesList.length === 0) return;
      const text = formatFavoritesShareText(this.filteredFavoritesList, this.activeGameDisplayName || '全游戏');
      uni.setClipboardData({
        data: text,
        success: () => {
          uni.showToast({ title: '心愿单分享口令已复制', icon: 'success' });
        }
      });
    },

    async batchPushFavorites() {
      const list = this.filteredFavoritesList;
      if (list.length === 0) return;
      this.isBatchPushing = true;
      let successCount = 0;
      for (const item of list) {
        try {
          const res = await pushModToDesktop(item);
          if (res.success) successCount++;
        } catch (e) {}
      }
      this.isBatchPushing = false;
      uni.showModal({
        title: '批量推送完成',
        content: `成功投递 ${successCount}/${list.length} 个模组到电脑端 Mayfly。`,
        showCancel: false
      });
    },

    handleNavBack() {
      uni.navigateBack({
        fail: () => {
          uni.reLaunch({ url: '/pages/index/index' });
        }
      });
    },

    openNexusAuth() {
      this.nexusUser = getNexusUser();
      this.nexusApiKey = getNexusApiKey();
      this.nexusAuthModalVisible = true;
    },

    onNexusLoginSuccess({ user, apiKey }) {
      this.nexusUser = user;
      this.nexusApiKey = apiKey;
    },

    onNexusLogout() {
      this.nexusUser = null;
      this.nexusApiKey = '';
    },

    async runQuickTest() {
      if (!this.desktopConfig.host) {
        uni.showToast({ title: '请先配置电脑 IP', icon: 'none' });
        return;
      }
      uni.showLoading({ title: '测试中...' });
      const ok = await testDesktopConnection(this.desktopConfig.host, this.desktopConfig.port);
      uni.hideLoading();
      this.desktopConfig.connected = ok;
      saveDesktopConfig(this.desktopConfig);
      uni.showToast({
        title: ok ? '电脑连接成功' : '电脑未响应',
        icon: ok ? 'success' : 'none'
      });
    },

    handleDrawerNav(target) {
      this.drawerVisible = false;
      if (target === 'home') {
        uni.reLaunch({ url: '/pages/index/index' });
      } else if (target === 'games') {
        uni.navigateTo({ url: '/pages/games/games' });
      } else if (target === 'history') {
        uni.navigateTo({ url: '/pages/history/history' });
      } else if (target === 'auth') {
        this.openNexusAuth();
      } else if (target === 'device') {
        this.deviceModalVisible = true;
      }
    }
  }
};
</script>

<style scoped>
/* ============================================================================ */
/* Favorites 页面样式                                                           */
/* ============================================================================ */
.favoritesPage {
  min-height: 100vh;
  background-color: #121212;
  color: #e5e7eb;
  padding-bottom: 80rpx;
  box-sizing: border-box;
}

.favContainer {
  padding: 24rpx;
}

.favoritesHeaderCard {
  background: #181a1f;
  border: 1rpx solid #292e3a;
  border-radius: 18rpx;
  padding: 20rpx;
  margin-bottom: 24rpx;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.favScopeRow {
  display: flex;
  background: #121418;
  border-radius: 12rpx;
  padding: 4rpx;
  gap: 8rpx;
}

.favScopeTab {
  flex: 1;
  text-align: center;
  padding: 12rpx 0;
  border-radius: 8rpx;
  cursor: pointer;
  transition: all 0.2s ease;
}

.favScopeTab.active {
  background: #252a35;
}

.favScopeText {
  font-size: 22rpx;
  font-weight: 700;
  color: #9ca3af;
}

.favScopeTab.active .favScopeText {
  color: #ffffff;
}

.favSummaryText {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.favCountNum {
  font-size: 24rpx;
  font-weight: 700;
  color: #da6b17;
}

.favTipText {
  font-size: 20rpx;
  color: #64748b;
}

.favBatchActions {
  display: flex;
  align-items: center;
  gap: 14rpx;
  padding-top: 14rpx;
  border-top: 1rpx solid #232731;
}

.favExportBtn {
  background: #222630;
  border: 1rpx solid #363d4e;
  border-radius: 10rpx;
  padding: 12rpx 20rpx;
  margin: 0;
}

.favExportBtnText {
  font-size: 22rpx;
  color: #cbd5e1;
  font-weight: 600;
}

.favBatchPushBtn {
  flex: 1;
  background: #da6b17;
  border-radius: 10rpx;
  padding: 12rpx 0;
  margin: 0;
  border: none;
}

.favBatchBtnText {
  font-size: 22rpx;
  color: #ffffff;
  font-weight: 700;
}

.modsGrid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
}

.emptyFavBox {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 40rpx;
  gap: 20rpx;
}

.emptyFavIcon {
  font-size: 80rpx;
}

.emptyFavTitle {
  font-size: 30rpx;
  font-weight: 700;
  color: #e5e7eb;
}

.emptyFavSub {
  font-size: 22rpx;
  color: #6b7280;
  text-align: center;
  line-height: 1.4;
}

.goExploreBtn {
  margin-top: 20rpx;
  background: #da6b17;
  border-radius: 12rpx;
  padding: 16rpx 40rpx;
  border: none;
}

.goExploreBtnText {
  font-size: 24rpx;
  font-weight: 700;
  color: #ffffff;
}
</style>
