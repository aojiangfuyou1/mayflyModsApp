<template>
  <!-- ======================================================================== -->
  <!-- 页面名称：热门游戏专区 (Games Library)                                   -->
  <!-- 功能描述：独立全屏展示 Nexus 热门游戏海报库 (100% 对标图 1 竖版海报双列流) -->
  <!-- ======================================================================== -->
  <view class="gamesPage">
    <!-- 1. 全局沉浸式顶栏 -->
    <NexusHeader
      title="热门游戏专区"
      :show-back="true"
      :show-search="true"
      :desktop-config="desktopConfig"
      :nexus-user="nexusUser"
      @back-click="handleNavBack"
      @drawer-click="drawerVisible = true"
      @search-click="toggleSearch"
      @pc-click="deviceModalVisible = true"
      @user-click="openNexusAuth"
      @logo-click="handleNavBack"
    />

    <!-- 搜索展开栏 -->
    <view class="searchExpandSection" v-if="searchExpanded || searchText">
      <view class="searchBarBox">
        <text class="searchIcon">🔍</text>
        <input
          class="searchInput"
          v-model="searchText"
          placeholder="搜索游戏名称 (中英文)..."
          placeholder-class="searchPlaceholder"
        />
        <text v-if="searchText" class="clearIcon" @click="searchText = ''">✕</text>
      </view>
    </view>

    <!-- 2. 页面标题统计行 -->
    <view class="gamesContainer">
      <view class="gamesHeaderRow">
        <view class="gamesHeaderLeft">
          <text class="gamesIcon">🎮</text>
          <text class="gamesTitle">{{ enableAutoTranslate ? '热门游戏专区' : 'Games' }}</text>
        </view>
        <text class="gamesViewAllLink" @click="goToModsStream">{{ enableAutoTranslate ? '全网模组库 ›' : 'View all mods' }}</text>
      </view>

      <!-- 加载状态 -->
      <view class="loadingBox" v-if="loading && gamesList.length === 0">
        <view class="loadingSpinner"></view>
        <text class="loadingText">正在从 N网 动态加载热门游戏库...</text>
      </view>

      <!-- 双列竖版游戏海报网格 (对标图 1: Skyrim SE, Fallout 4 等) -->
      <view class="gamesGrid" v-else>
        <view
          class="gamePosterCard"
          v-for="game in filteredGames"
          :key="game.id"
          @click="selectGame(game)"
        >
          <!-- 竖版封面 (2:3比例) + 书签角标 -->
          <view class="gameCoverBox">
            <image
              class="gameCoverImg"
              :src="game.tileUrl"
              mode="aspectFill"
              lazy-load
            />
            <view class="gameBookmarkBadge">
              <text class="bookmarkIcon">🔖</text>
            </view>
          </view>

          <!-- 游戏标题 (优先展示友好中文名，白字加粗) -->
          <text class="gameTitleText">{{ getGameDisplayTitle(game) }}</text>
          <!-- 英文原名副标 (灰字紧凑小字) -->
          <text class="gameOriginalNameText" v-if="getGameDisplayTitle(game) !== game.name">{{ game.name }}</text>

          <!-- 统计指标行 (对标图 1: ◆ 142k  ▤ 4.8k  ⬇ 13.4b) -->
          <view class="gameStatsRow">
            <view class="statMetricItem">
              <text class="statGlyph">◆</text>
              <text class="statMetricVal">{{ game.stats.mods }}</text>
            </view>
            <view class="statMetricItem">
              <text class="statGlyph">▤</text>
              <text class="statMetricVal">{{ game.stats.tracking }}</text>
            </view>
            <view class="statMetricItem">
              <text class="statGlyph">⬇</text>
              <text class="statMetricVal">{{ game.stats.downloads }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 3. 全局侧边抽屉菜单组件 -->
    <NexusDrawer
      :visible="drawerVisible"
      :nexus-user="nexusUser"
      :desktop-config="desktopConfig"
      :enable-auto-translate="enableAutoTranslate"
      @close="drawerVisible = false"
      @nav="handleDrawerNav"
      @toggle-translate="enableAutoTranslate = !enableAutoTranslate"
      @quick-test="runQuickTest"
    />

    <!-- 4. 电脑端连接配对弹窗组件 -->
    <DevicePairModal
      :visible="deviceModalVisible"
      :config="desktopConfig"
      @close="deviceModalVisible = false"
      @saved="desktopConfig = { ...$event }"
    />

    <!-- 5. Nexus 官方账户授权弹窗组件 -->
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
// 页面脚本：热门游戏专区动态数据流与专区直达
// ============================================================================
import {
  fetchNexusGames,
  getDesktopConfig,
  saveDesktopConfig,
  testDesktopConnection,
  getNexusUser,
  getNexusApiKey
} from '../../services/nexus.js';
import { batchTranslateToZh } from '../../services/translate.js';
import NexusHeader from '../../components/NexusHeader.vue';
import NexusDrawer from '../../components/NexusDrawer.vue';
import DevicePairModal from '../../components/DevicePairModal.vue';
import NexusAuthModal from '../../components/NexusAuthModal.vue';

export default {
  components: {
    NexusHeader,
    NexusDrawer,
    DevicePairModal,
    NexusAuthModal
  },

  data() {
    return {
      gamesList: [],
      loading: false,
      searchText: '',
      searchExpanded: false,
      drawerVisible: false,
      deviceModalVisible: false,
      nexusAuthModalVisible: false,
      enableAutoTranslate: true,
      zhGameNameMap: {},
      desktopConfig: { host: '192.168.1.100', port: 9876, connected: false },
      nexusUser: null,
      nexusApiKey: ''
    };
  },

  computed: {
    filteredGames() {
      if (!this.searchText.trim()) return this.gamesList;
      const kw = this.searchText.trim().toLowerCase();
      return this.gamesList.filter((g) => {
        const en = (g.name || '').toLowerCase();
        const zh = (this.zhGameNameMap[g.id] || g.zhName || '').toLowerCase();
        return en.includes(kw) || zh.includes(kw);
      });
    }
  },

  mounted() {
    this.desktopConfig = getDesktopConfig();
    this.nexusUser = getNexusUser();
    this.nexusApiKey = getNexusApiKey();
    this.loadGames();
  },

  methods: {
    async loadGames() {
      this.loading = true;
      try {
        const games = await fetchNexusGames();
        this.gamesList = games;
        if (this.enableAutoTranslate) {
          this.autoTranslateGameNames(games);
        }
      } catch (err) {
        uni.showToast({ title: '加载游戏库失败', icon: 'none' });
      } finally {
        this.loading = false;
      }
    },

    async autoTranslateGameNames(games) {
      if (!Array.isArray(games) || games.length === 0) return;
      const unmapped = games.filter(
        (g) => (!g.zhName || g.zhName === g.name) && !this.zhGameNameMap[g.id]
      );
      if (unmapped.length === 0) return;
      try {
        const names = unmapped.map((g) => g.name);
        const map = await batchTranslateToZh(names);
        const nextMap = { ...this.zhGameNameMap };
        unmapped.forEach((g) => {
          if (map.has(g.name)) nextMap[g.id] = map.get(g.name);
        });
        this.zhGameNameMap = nextMap;
      } catch (e) {}
    },

    getGameDisplayTitle(game) {
      if (this.enableAutoTranslate) {
        return this.zhGameNameMap[game.id] || game.zhName || game.name;
      }
      return game.name;
    },

    selectGame(game) {
      const zh = this.getGameDisplayTitle(game);
      uni.reLaunch({
        url: `/pages/index/index?domain=${game.domain}&name=${encodeURIComponent(game.name)}&zhName=${encodeURIComponent(zh)}&tileUrl=${encodeURIComponent(game.tileUrl || '')}`
      });
    },

    goToModsStream() {
      uni.reLaunch({ url: '/pages/index/index?view=mods' });
    },

    handleNavBack() {
      uni.navigateBack({
        fail: () => {
          uni.reLaunch({ url: '/pages/index/index' });
        }
      });
    },

    toggleSearch() {
      this.searchExpanded = !this.searchExpanded;
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
        uni.showToast({ title: '请先在配对设置中填写电脑 IP', icon: 'none' });
        return;
      }
      uni.showLoading({ title: '测试连接中...' });
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
      } else if (target === 'favorites') {
        uni.navigateTo({ url: '/pages/favorites/favorites' });
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
/* Games 页面样式                                                              */
/* ============================================================================ */
.gamesPage {
  min-height: 100vh;
  background-color: #121212;
  color: #e5e7eb;
  padding-bottom: 80rpx;
  box-sizing: border-box;
}

.searchExpandSection {
  padding: 16rpx 24rpx 10rpx;
  background-color: #161616;
  border-bottom: 1rpx solid #232323;
}

.searchBarBox {
  display: flex;
  align-items: center;
  background: #1f2125;
  border: 1rpx solid #373b43;
  border-radius: 12rpx;
  padding: 14rpx 20rpx;
}

.searchIcon {
  font-size: 28rpx;
  margin-right: 12rpx;
}

.searchInput {
  flex: 1;
  font-size: 26rpx;
  color: #ffffff;
}

.searchPlaceholder {
  color: #6b7280;
  font-size: 24rpx;
}

.clearIcon {
  font-size: 28rpx;
  color: #9ca3af;
  padding: 4rpx;
}

.gamesContainer {
  padding: 24rpx;
}

.gamesHeaderRow {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.gamesHeaderLeft {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.gamesIcon {
  font-size: 32rpx;
}

.gamesTitle {
  font-size: 30rpx;
  font-weight: 800;
  color: #ffffff;
}

.gamesViewAllLink {
  font-size: 24rpx;
  color: #da6b17;
  font-weight: 600;
  cursor: pointer;
}

.loadingBox {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80rpx 0;
  gap: 20rpx;
}

.loadingSpinner {
  width: 50rpx;
  height: 50rpx;
  border: 4rpx solid #282828;
  border-top-color: #da6b17;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loadingText {
  font-size: 24rpx;
  color: #9ca3af;
}

.gamesGrid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
}

.gamePosterCard {
  background-color: #191b1f;
  border-radius: 16rpx;
  overflow: hidden;
  border: 1rpx solid #232731;
  display: flex;
  flex-direction: column;
  padding-bottom: 14rpx;
}

.gameCoverBox {
  position: relative;
  width: 100%;
  padding-top: 150%; /* 2:3 纵向海报 */
  background-color: #121316;
  overflow: hidden;
}

.gameCoverImg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.gameBookmarkBadge {
  position: absolute;
  top: 12rpx;
  right: 12rpx;
  width: 44rpx;
  height: 44rpx;
  background-color: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(4px);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bookmarkIcon {
  font-size: 22rpx;
  line-height: 1;
}

.gameTitleText {
  font-size: 24rpx;
  font-weight: 700;
  color: #ffffff;
  padding: 14rpx 14rpx 2rpx 14rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.gameOriginalNameText {
  font-size: 19rpx;
  color: #838a96;
  padding: 0 14rpx 8rpx 14rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.gameStatsRow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8rpx 14rpx 0 14rpx;
  border-top: 1rpx solid #232731;
}

.statMetricItem {
  display: flex;
  align-items: center;
  gap: 4rpx;
}

.statGlyph {
  font-size: 18rpx;
  color: #9ca3af;
}

.statMetricVal {
  font-size: 19rpx;
  color: #d1d5db;
  font-weight: 600;
}
</style>
