<template>
  <!-- ======================================================================== -->
  <!-- 页面名称：我的游戏专区 (My Games Library)                                  -->
  <!-- 功能描述：100% 对标 N网官方「我的游戏 (My games)」板块与书签标记 🔖 功能  -->
  <!--           支持「我的游戏」与「发现全网游戏」双视窗，支持点击书签即时增删   -->
  <!-- ======================================================================== -->
  <view class="gamesPage">
    <!-- ==================================================================== -->
    <!-- 区域 1：手机沉浸式纯黑状态栏安全占位 (告别全屏叠加与遮挡)             -->
    <!-- ==================================================================== -->
    <view class="safeStatusBarSpacer"></view>

    <!-- ==================================================================== -->
    <!-- 区域 2：搜索扩展栏 (支持中英文双语即时过滤游戏)                      -->
    <!-- ==================================================================== -->
    <view class="searchExpandSection" v-if="searchExpanded || searchText">
      <view class="searchBarBox">
        <NexusIcon name="search" size="30rpx" color="#94a3b8" style="margin-right: 12rpx;" />
        <input
          class="searchInput"
          v-model="searchText"
          placeholder="搜索游戏名称 (支持中英文)..."
          placeholder-class="searchPlaceholder"
        />
        <text v-if="searchText" class="clearIcon" @click="searchText = ''">✕</text>
      </view>
    </view>

    <!-- ==================================================================== -->
    <!-- 区域 3：主容器与板块切换控制栏                                        -->
    <!-- ==================================================================== -->
    <view class="gamesContainer">
      <!-- 双 Tab 切换：我的游戏 (My Games) vs 发现全网游戏 (Explore All) -->
      <view class="gamesSegmentTabs">
        <view
          class="segmentTab"
          :class="{ active: activeTab === 'my' }"
          @click="activeTab = 'my'"
        >
          <NexusIcon name="gamepad" size="30rpx" :color="activeTab === 'my' ? '#da6b17' : '#94a3b8'" />
          <text class="segmentTabText">我的游戏</text>
          <text class="segmentCountBadge">{{ myGamesList.length }}</text>
        </view>

        <view
          class="segmentTab"
          :class="{ active: activeTab === 'all' }"
          @click="switchToAllGamesTab"
        >
          <NexusIcon name="globe" size="30rpx" :color="activeTab === 'all' ? '#da6b17' : '#94a3b8'" />
          <text class="segmentTabText">发现全网游戏</text>
          <text class="segmentCountBadge">{{ allGamesTotalCount || allGamesList.length || 'N网' }}</text>
        </view>

        <!-- 搜索触发微按钮 -->
        <view class="segmentSearchBtn" :class="{ active: searchExpanded || searchText }" @click="toggleSearch">
          <NexusIcon name="search" size="28rpx" :color="searchExpanded || searchText ? '#da6b17' : '#94a3b8'" />
        </view>
      </view>

      <!-- ------------------------------------------------------------------ -->
      <!-- 视窗 A：我的游戏 (My Games 核心板块，100% 对标 N网首屏我的游戏流)   -->
      <!-- ------------------------------------------------------------------ -->
      <view class="myGamesSection" v-if="activeTab === 'my'">
        <!-- 统计与操作标题行 -->
        <view class="gamesHeaderRow">
          <view class="gamesHeaderLeft">
            <text class="sectionBadgeIcon">🔖</text>
            <text class="gamesTitle">我的收藏游戏</text>
            <text class="gamesCountSub">({{ filteredMyGames.length }} 款已标记)</text>
          </view>
          <view class="syncCloudBtn" v-if="nexusUser" @click="handleSyncCloud">
            <text class="syncCloudText">{{ syncingCloud ? '同步中...' : '☁️ 云端同步' }}</text>
          </view>
        </view>

        <!-- 我的游戏海报网格 (第 1 张为 "+ 添加新游戏" 卡片，深度对标 N网原版设计) -->
        <view class="gamesGrid">
          <!-- 「+ 添加新游戏」虚线导流卡片 -->
          <view class="addGameCard" @click="switchToAllGamesTab">
            <view class="addGamePlusBox">
              <text class="addGamePlusIcon">+</text>
            </view>
            <text class="addGameCardTitle">添加新游戏</text>
            <text class="addGameCardSub">从全网游戏库中探索并标记</text>
          </view>

          <!-- 已标记为「我的游戏」卡片列表 -->
          <view
            class="gamePosterCard"
            v-for="game in filteredMyGames"
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
              <!-- 专属已标记金光书签 (点击触发移出确认) -->
              <view
                class="gameBookmarkBadge isBookmarked"
                title="已加入我的游戏，点击取消标记"
                @click.stop="promptRemoveBookmark(game)"
              >
                <text class="bookmarkIcon">🔖</text>
              </view>
            </view>

            <!-- 游戏主标题 (中文名优先) -->
            <text class="gameTitleText">{{ getGameDisplayTitle(game) }}</text>
            <!-- 英文原名副标 -->
            <text class="gameOriginalNameText" v-if="getGameDisplayTitle(game) !== game.name">{{ game.name }}</text>

            <!-- 统计指标行 (对标 N网: ◆ 模组数  ▤ 收藏数  ⬇ 下载量) -->
            <view class="gameStatsRow">
              <view class="statMetricItem">
                <text class="statGlyph">◆</text>
                <text class="statMetricVal">{{ game.stats ? game.stats.mods : game.modCount }}</text>
              </view>
              <view class="statMetricItem">
                <text class="statGlyph">▤</text>
                <text class="statMetricVal">{{ game.stats ? game.stats.tracking : game.collectionCount }}</text>
              </view>
              <view class="statMetricItem">
                <text class="statGlyph">⬇</text>
                <text class="statMetricVal">{{ game.stats ? game.stats.downloads : game.downloadCount }}</text>
              </view>
            </view>
          </view>
        </view>

        <!-- 空态提示：当搜索后无匹配项 -->
        <view class="emptyBox" v-if="filteredMyGames.length === 0 && searchText">
          <text class="emptyEmoji">🔍</text>
          <text class="emptyTitle">未找到匹配的收藏游戏</text>
          <text class="emptySub">可在搜索框清除关键词，或切换至「发现全网游戏」查找</text>
        </view>
      </view>

      <!-- ------------------------------------------------------------------ -->
      <!-- 视窗 B：发现全网游戏 (探索与即时书签标记 🔖)                         -->
      <!-- ------------------------------------------------------------------ -->
      <view class="allGamesSection" v-else>
        <!-- 头部标题行 -->
        <view class="gamesHeaderRow">
          <view class="gamesHeaderLeft">
            <NexusIcon name="globe" size="32rpx" color="#da6b17" style="margin-right: 8rpx;" />
            <text class="gamesTitle">全网热门游戏库</text>
            <text class="gamesCountSub">({{ filteredAllGames.length }} 款)</text>
          </view>
          <text class="gamesViewAllLink" @click="goToModsStream">浏览精选模组 ›</text>
        </view>

        <!-- 加载动画 (mayflymods 专属品牌呼吸徽标与光环) -->
        <view class="loadingBox" v-if="loadingAllGames && allGamesList.length === 0">
          <view class="brandLoadingBox">
            <image class="brandLoadingLogo" src="/static/logo.png" mode="aspectFit" />
            <view class="brandLoadingRing"></view>
          </view>
          <text class="loadingText">正在从 NexusMods 动态抓取热门游戏数据...</text>
        </view>

        <!-- 全网游戏海报网格 (支持点击书签直接加入「我的游戏」) -->
        <view class="gamesGrid" v-else>
          <view
            class="gamePosterCard"
            v-for="game in filteredAllGames"
            :key="game.id"
            @click="selectGame(game)"
          >
            <!-- 竖版封面 (2:3比例) + 动态书签角标 -->
            <view class="gameCoverBox">
              <image
                class="gameCoverImg"
                :src="game.tileUrl"
                mode="aspectFill"
                lazy-load
              />
              <!-- 书签角标：已加入显金，未加入显灰透，点击一键标记/解标 -->
              <view
                class="gameBookmarkBadge"
                :class="{ isBookmarked: isGameBookmarked(game) }"
                :title="isGameBookmarked(game) ? '已在我的游戏' : '点击标记为我的游戏'"
                @click.stop="handleToggleBookmark(game)"
              >
                <text class="bookmarkIcon">🔖</text>
              </view>
            </view>

            <!-- 游戏主标题 (中文名优先) -->
            <text class="gameTitleText">{{ getGameDisplayTitle(game) }}</text>
            <!-- 英文原名副标 -->
            <text class="gameOriginalNameText" v-if="getGameDisplayTitle(game) !== game.name">{{ game.name }}</text>

            <!-- 统计指标行 -->
            <view class="gameStatsRow">
              <view class="statMetricItem">
                <text class="statGlyph">◆</text>
                <text class="statMetricVal">{{ game.stats ? game.stats.mods : game.modCount }}</text>
              </view>
              <view class="statMetricItem">
                <text class="statGlyph">▤</text>
                <text class="statMetricVal">{{ game.stats ? game.stats.tracking : game.collectionCount }}</text>
              </view>
              <view class="statMetricItem">
                <text class="statGlyph">⬇</text>
                <text class="statMetricVal">{{ game.stats ? game.stats.downloads : game.downloadCount }}</text>
              </view>
            </view>
          </view>
        </view>

        <!-- 空态提示：全网未检索到 -->
        <view class="emptyBox" v-if="!loadingAllGames && filteredAllGames.length === 0">
          <text class="emptyEmoji">🎮</text>
          <text class="emptyTitle">未找到匹配游戏</text>
          <text class="emptySub">换个中英文关键词再试试吧</text>
        </view>
      </view>
    </view>

    <!-- ==================================================================== -->
    <!-- 区域 4：暗黑高定对话框 NexusModal (移出「我的游戏」确认)              -->
    <!-- ==================================================================== -->
    <NexusModal
      :visible="unbookmarkModalVisible"
      title="移出「我的游戏」"
      :content="unbookmarkModalContent"
      type="warning"
      icon="alert"
      confirm-text="确认移出"
      cancel-text="保留"
      @confirm="confirmRemoveBookmark"
      @cancel="unbookmarkModalVisible = false"
    />

    <!-- ==================================================================== -->
    <!-- 区域 5：全局抽屉、配对、授权与底部导航栏                            -->
    <!-- ==================================================================== -->
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

    <NexusTabBar
      active-tab="games"
      :favorites-count="favoritesCount"
      :history-count="historyCount"
      :desktop-connected="desktopConfig && desktopConfig.connected"
      :nexus-user="nexusUser"
      @tab-refresh="handleTabBarRefresh"
    />
  </view>
</template>

<script>
// ============================================================================
// 页面脚本：我的游戏专区 (Nexus My Games & Bookmark Synchronization)
// ============================================================================
import {
  fetchNexusGames,
  getDesktopConfig,
  saveDesktopConfig,
  testDesktopConnection,
  getNexusUser,
  getNexusApiKey
} from '../../services/nexus.js';
import {
  getMyGames,
  toggleGameBookmark,
  fetchNexusFavouriteGames
} from '../../services/games.js';
import { batchTranslateToZh } from '../../services/translate.js';
import { getFavorites } from '../../services/favorites.js';
import { getPushHistory } from '../../services/history.js';
import NexusHeader from '../../components/NexusHeader.vue';
import NexusDrawer from '../../components/NexusDrawer.vue';
import DevicePairModal from '../../components/DevicePairModal.vue';
import NexusAuthModal from '../../components/NexusAuthModal.vue';
import NexusTabBar from '../../components/NexusTabBar.vue';
import NexusIcon from '../../components/NexusIcon.vue';
import NexusModal from '../../components/NexusModal.vue';

export default {
  components: {
    NexusHeader,
    NexusDrawer,
    DevicePairModal,
    NexusAuthModal,
    NexusTabBar,
    NexusIcon,
    NexusModal
  },

  data() {
    return {
      // 当前激活的视图板块：'my' (我的游戏) | 'all' (发现全网游戏)
      activeTab: 'my',

      // 我的游戏列表 (从本地存储 + Nexus GraphQL 动态同步)
      myGamesList: [],

      // 全网游戏列表 (从 fetchNexusGames() 拉取)
      allGamesList: [],
      allGamesTotalCount: 0,
      loadingAllGames: false,

      // 云端同步中指示器
      syncingCloud: false,

      // 搜索状态
      searchText: '',
      searchExpanded: false,

      // 弹窗状态
      drawerVisible: false,
      deviceModalVisible: false,
      nexusAuthModalVisible: false,

      // 移出书签确认弹窗状态
      unbookmarkModalVisible: false,
      pendingRemoveGame: null,
      unbookmarkModalContent: '',

      // 自动转译与多语言
      enableAutoTranslate: true,
      zhGameNameMap: {},

      // 设备与账户凭据
      desktopConfig: { host: '10.204.160.22', port: 28888, connected: false },
      nexusUser: null,
      nexusApiKey: '',

      // 角标统计
      favoritesCount: 0,
      historyCount: 0
    };
  },

  computed: {
    /**
     * 快速检索 Map，用于 O(1) 判断某款游戏是否已被标记为「我的游戏」
     */
    myGamesMap() {
      const map = Object.create(null);
      this.myGamesList.forEach((g) => {
        if (g.id) map[String(g.id)] = true;
        if (g.domain) map[String(g.domain).toLowerCase()] = true;
      });
      return map;
    },

    /**
     * 过滤后的「我的游戏」列表
     */
    filteredMyGames() {
      if (!this.searchText.trim()) return this.myGamesList;
      const kw = this.searchText.trim().toLowerCase();
      return this.myGamesList.filter((g) => {
        const en = (g.name || '').toLowerCase();
        const zh = (this.zhGameNameMap[g.id] || g.zhName || '').toLowerCase();
        return en.includes(kw) || zh.includes(kw);
      });
    },

    /**
     * 过滤后的「全网游戏」列表
     */
    filteredAllGames() {
      if (!this.searchText.trim()) return this.allGamesList;
      const kw = this.searchText.trim().toLowerCase();
      return this.allGamesList.filter((g) => {
        const en = (g.name || '').toLowerCase();
        const zh = (this.zhGameNameMap[g.id] || g.zhName || '').toLowerCase();
        return en.includes(kw) || zh.includes(kw);
      });
    }
  },

  onLoad(query) {
    // 方案 A：游戏库与首页合二为一，统一重定向至首页游戏库流
    uni.reLaunch({
      url: '/pages/index/index?view=games'
    });
  },

  onShow() {
    this.refreshMeta();
    this.refreshMyGames();
  },

  mounted() {
    this.desktopConfig = getDesktopConfig();
    this.nexusUser = getNexusUser();
    this.nexusApiKey = getNexusApiKey();
    this.refreshMeta();
    this.refreshMyGames();

    // 跨页面双向通信监听：当其他页面更新「我的游戏」时实时刷新
    uni.$on('mayfly-games-updated', (list) => {
      if (Array.isArray(list)) {
        this.myGamesList = list;
      }
    });

    // 若用户已绑定 N网 Key，静默在后台同步一次云端收藏游戏
    if (this.nexusApiKey) {
      this.silentSyncCloud();
    }
  },

  methods: {
    // ------------------------------------------------------------------------
    // 区域 A：数据装载与「我的游戏」本地/云端状态同步
    // ------------------------------------------------------------------------

    /**
     * 刷新心愿单、任务历史角标与系统配置
     */
    refreshMeta() {
      const favs = getFavorites();
      this.favoritesCount = Array.isArray(favs) ? favs.length : 0;
      const hist = getPushHistory();
      this.historyCount = Array.isArray(hist) ? hist.length : 0;
      this.desktopConfig = getDesktopConfig();
      this.nexusUser = getNexusUser();
      this.nexusApiKey = getNexusApiKey();
    },

    /**
     * 本地高速读取「我的游戏」列表
     */
    refreshMyGames() {
      this.myGamesList = getMyGames();
      if (this.enableAutoTranslate) {
        this.autoTranslateGameNames(this.myGamesList);
      }
    },

    /**
     * 切换到「发现全网游戏」板块并按需加载数据
     */
    switchToAllGamesTab() {
      this.activeTab = 'all';
      if (this.allGamesList.length === 0) {
        this.loadAllGames();
      }
    },

    /**
     * 从 Nexus 官方 GraphQL 动态加载热门游戏库
     */
    async loadAllGames() {
      this.loadingAllGames = true;
      try {
        const res = await fetchNexusGames();
        // 正确解构 fetchNexusGames 返回的 { games, totalCount } 契约
        const list = Array.isArray(res) ? res : (res && res.games ? res.games : []);
        this.allGamesList = list;
        this.allGamesTotalCount = res && res.totalCount ? res.totalCount : list.length;

        if (this.enableAutoTranslate) {
          this.autoTranslateGameNames(list);
        }
      } catch (err) {
        uni.showToast({ title: '加载全网游戏库失败', icon: 'none' });
      } finally {
        this.loadingAllGames = false;
      }
    },

    /**
     * 静默后台与 NexusMods 官方 Favourite Games 云端同步
     */
    async silentSyncCloud() {
      if (!this.nexusApiKey) return;
      try {
        const cloudGames = await fetchNexusFavouriteGames(this.nexusApiKey);
        if (Array.isArray(cloudGames) && cloudGames.length > 0) {
          this.myGamesList = cloudGames;
        }
      } catch (e) {
        console.warn('[MayflyGames] 静默同步云端游戏异常:', e);
      }
    },

    /**
     * 手动触发云端同步「我的游戏」
     */
    async handleSyncCloud() {
      if (!this.nexusApiKey) {
        this.openNexusAuth();
        return;
      }
      this.syncingCloud = true;
      try {
        const list = await fetchNexusFavouriteGames(this.nexusApiKey);
        this.myGamesList = list;
        uni.showToast({
          title: `已与 N网 云端同步 (${list.length} 款)`,
          icon: 'success'
        });
      } catch (err) {
        uni.showToast({ title: '云端同步失败，请检查网络', icon: 'none' });
      } finally {
        this.syncingCloud = false;
      }
    },

    // ------------------------------------------------------------------------
    // 区域 B：书签标记 (Bookmark Ribbon) 交互处理
    // ------------------------------------------------------------------------

    /**
     * 判断指定游戏是否已被标记为「我的游戏」
     * @param {Object} game - 游戏对象
     * @returns {boolean}
     */
    isGameBookmarked(game) {
      if (!game) return false;
      const idKey = game.id ? String(game.id) : '';
      const domainKey = game.domain ? String(game.domain).toLowerCase() : '';
      return !!(this.myGamesMap[idKey] || this.myGamesMap[domainKey]);
    },

    /**
     * 点击书签图标切换标记状态
     * 100% 对标 N网游戏详情页书签 🔖 点击动作
     */
    async handleToggleBookmark(game) {
      if (!game) return;
      const isCurrentlyBookmarked = this.isGameBookmarked(game);

      // 如果当前是在「我的游戏」Tab 下且已标记，弹窗询问移出
      if (this.activeTab === 'my' && isCurrentlyBookmarked) {
        this.promptRemoveBookmark(game);
        return;
      }

      const res = await toggleGameBookmark(game, this.nexusApiKey);
      this.myGamesList = res.myGames;
      uni.showToast({
        title: res.message,
        icon: res.bookmarked ? 'success' : 'none'
      });
    },

    /**
     * 唤起移出「我的游戏」确认弹窗 (使用 NexusModal 替换原生丑陋弹窗)
     */
    promptRemoveBookmark(game) {
      this.pendingRemoveGame = game;
      const title = this.getGameDisplayTitle(game);
      this.unbookmarkModalContent = `确定将《${title}》从「我的游戏」中移除吗？移除后仍可在「发现全网游戏」中重新添加。`;
      this.unbookmarkModalVisible = true;
    },

    /**
     * 确认移出「我的游戏」
     */
    async confirmRemoveBookmark() {
      this.unbookmarkModalVisible = false;
      if (!this.pendingRemoveGame) return;
      const game = this.pendingRemoveGame;
      this.pendingRemoveGame = null;

      const res = await toggleGameBookmark(game, this.nexusApiKey);
      this.myGamesList = res.myGames;
      uni.showToast({
        title: `已移出「我的游戏」`,
        icon: 'none'
      });
    },

    // ------------------------------------------------------------------------
    // 区域 C：页面导航与快捷跳转
    // ------------------------------------------------------------------------

    /**
     * 选中并进入游戏专属模组专区
     */
    selectGame(game) {
      const zh = this.getGameDisplayTitle(game);
      uni.reLaunch({
        url: `/pages/index/index?domain=${game.domain}&name=${encodeURIComponent(game.name)}&zhName=${encodeURIComponent(zh)}&tileUrl=${encodeURIComponent(game.tileUrl || '')}`
      });
    },

    /**
     * 进入首页全网精选流
     */
    goToModsStream() {
      uni.reLaunch({ url: '/pages/index/index?view=mods' });
    },

    /**
     * 底部 Tab 刷新事件
     */
    handleTabBarRefresh() {
      if (this.activeTab === 'my') {
        this.refreshMyGames();
      } else {
        this.loadAllGames();
      }
    },

    /**
     * 展开/收起搜索框
     */
    toggleSearch() {
      this.searchExpanded = !this.searchExpanded;
    },

    // ------------------------------------------------------------------------
    // 区域 D：多语言转译辅助
    // ------------------------------------------------------------------------

    /**
     * 获取游戏的友好展示标题 (中文优先)
     */
    getGameDisplayTitle(game) {
      if (!game) return '';
      if (this.enableAutoTranslate) {
        return this.zhGameNameMap[game.id] || game.zhName || game.name;
      }
      return game.name;
    },

    /**
     * 批量自动将英文游戏名异步转译为中文名
     */
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

    // ------------------------------------------------------------------------
    // 区域 E：全局抽屉、账户与设备测试
    // ------------------------------------------------------------------------

    openNexusAuth() {
      this.nexusUser = getNexusUser();
      this.nexusApiKey = getNexusApiKey();
      this.nexusAuthModalVisible = true;
    },

    onNexusLoginSuccess({ user, apiKey }) {
      this.nexusUser = user;
      this.nexusApiKey = apiKey;
      this.silentSyncCloud();
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
      } else if (target === 'games') {
        // 当前已在 games 页面
      } else if (target === 'favorites') {
        uni.reLaunch({ url: '/pages/favorites/favorites' });
      } else if (target === 'history') {
        uni.reLaunch({ url: '/pages/history/history' });
      } else if (target === 'profile') {
        uni.reLaunch({ url: '/pages/profile/profile' });
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
/* Games 页面高定暗黑与玻璃拟态样式体系                                        */
/* ============================================================================ */
.gamesPage {
  min-height: 100vh;
  background-color: #121212;
  color: #e5e7eb;
  padding-bottom: 120rpx;
  box-sizing: border-box;
}

.safeStatusBarSpacer {
  width: 100%;
  height: var(--status-bar-height, 25px);
  background-color: #121212;
  box-sizing: border-box;
}

.segmentSearchBtn {
  width: 64rpx;
  height: 64rpx;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 8rpx;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.04);
  border: 1rpx solid rgba(255, 255, 255, 0.06);
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.segmentSearchBtn:active {
  transform: scale(0.96);
}

.segmentSearchBtn.active {
  background: rgba(218, 107, 23, 0.15);
  border-color: rgba(218, 107, 23, 0.5);
}

/* 搜索栏展开区 */
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

/* 主内容容器 */
.gamesContainer {
  padding: 24rpx 24rpx 160rpx 24rpx;
  box-sizing: border-box;
}

/* ============================================================================ */
/* 双 Segment Tab 控制栏 (我的游戏 vs 发现全网游戏)                             */
/* ============================================================================ */
.gamesSegmentTabs {
  display: flex;
  align-items: center;
  background: #181a1f;
  border-radius: 16rpx;
  padding: 8rpx;
  margin-bottom: 24rpx;
  border: 1rpx solid #282c35;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.4);
}

.segmentTab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 14rpx 0;
  border-radius: 12rpx;
  gap: 12rpx;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
}

.segmentTab.active {
  background: linear-gradient(135deg, #262933, #1f222b);
  border: 1rpx solid #3a3f4d;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.45);
}

.segmentTabText {
  font-size: 26rpx;
  font-weight: 600;
  color: #94a3b8;
}

.segmentTab.active .segmentTabText {
  color: #ffffff;
  font-weight: 700;
}

.segmentCountBadge {
  padding: 2rpx 12rpx;
  border-radius: 20rpx;
  background: #2a2e38;
  font-size: 20rpx;
  color: #9ca3af;
  font-weight: 600;
}

.segmentTab.active .segmentCountBadge {
  background: #da6b17;
  color: #ffffff;
  font-weight: 700;
}

/* ============================================================================ */
/* 标题统计与快捷操作行                                                        */
/* ============================================================================ */
.gamesHeaderRow {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 22rpx;
  padding: 0 4rpx;
}

.gamesHeaderLeft {
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.sectionBadgeIcon {
  font-size: 30rpx;
}

.gamesTitle {
  font-size: 30rpx;
  font-weight: 800;
  color: #ffffff;
}

.gamesCountSub {
  font-size: 22rpx;
  color: #848d9a;
  margin-left: 4rpx;
}

.syncCloudBtn {
  background: rgba(218, 107, 23, 0.12);
  border: 1rpx solid rgba(218, 107, 23, 0.35);
  border-radius: 20rpx;
  padding: 8rpx 18rpx;
}

.syncCloudText {
  font-size: 22rpx;
  color: #f59e0b;
  font-weight: 600;
}

.gamesViewAllLink {
  font-size: 24rpx;
  color: #da6b17;
  font-weight: 600;
  cursor: pointer;
}

/* ============================================================================ */
/* 游戏海报网格与卡片流 (2:3 纵向海报)                                          */
/* ============================================================================ */
.gamesGrid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
}

/* 「+ 添加新游戏」虚线导流卡片 (100% 对标 N网原版) */
.addGameCard {
  background: rgba(25, 27, 31, 0.6);
  border: 2rpx dashed #3a3f4e;
  border-radius: 16rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 480rpx;
  padding: 30rpx 20rpx;
  box-sizing: border-box;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.addGameCard:active {
  border-color: #da6b17;
  background: rgba(218, 107, 23, 0.08);
  transform: scale(0.98);
}

.addGamePlusBox {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background: #252830;
  border: 2rpx solid #474d5d;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20rpx;
}

.addGamePlusIcon {
  font-size: 48rpx;
  line-height: 1;
  color: #da6b17;
  font-weight: 300;
}

.addGameCardTitle {
  font-size: 26rpx;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 8rpx;
}

.addGameCardSub {
  font-size: 20rpx;
  color: #848d9a;
  text-align: center;
  line-height: 1.4;
  padding: 0 10rpx;
}

/* 游戏海报卡片 */
.gamePosterCard {
  background-color: #191b1f;
  border-radius: 16rpx;
  overflow: hidden;
  border: 1rpx solid #232731;
  display: flex;
  flex-direction: column;
  padding-bottom: 14rpx;
  transition: transform 0.2s ease, border-color 0.2s ease;
}

.gamePosterCard:active {
  transform: scale(0.98);
  border-color: #da6b17;
}

.gameCoverBox {
  position: relative;
  width: 100%;
  padding-top: 150%; /* 2:3 纵向海报比例 */
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

/* 书签角标 (Bookmark Badge) 按钮 */
.gameBookmarkBadge {
  position: absolute;
  top: 12rpx;
  right: 12rpx;
  width: 50rpx;
  height: 50rpx;
  background-color: rgba(18, 18, 20, 0.75);
  backdrop-filter: blur(8px);
  border: 1rpx solid rgba(255, 255, 255, 0.16);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 5;
}

.gameBookmarkBadge.isBookmarked {
  background: linear-gradient(135deg, rgba(218, 107, 23, 0.95), rgba(245, 158, 11, 0.95));
  border-color: #fbbf24;
  box-shadow: 0 4rpx 14rpx rgba(218, 107, 23, 0.45);
  transform: scale(1.05);
}

.gameBookmarkBadge:active {
  transform: scale(0.88);
}

.bookmarkIcon {
  font-size: 24rpx;
  line-height: 1;
}

/* 标题与副标 */
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

/* 统计数据行 */
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

/* 加载动画 (mayflymods 专属呼吸徽标与流光光环) */
.loadingBox {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80rpx 0;
  gap: 20rpx;
}

.brandLoadingBox {
  position: relative;
  width: 72rpx;
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.brandLoadingLogo {
  width: 56rpx;
  height: 56rpx;
  border-radius: 14rpx;
  animation: brandLogoPulse 1.5s ease-in-out infinite;
}

.brandLoadingRing {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: 4rpx solid rgba(218, 107, 23, 0.2);
  border-top-color: #da6b17;
  border-radius: 50%;
  box-sizing: border-box;
  animation: spin 0.9s linear infinite;
}

@keyframes brandLogoPulse {
  0%, 100% {
    transform: scale(0.92);
    opacity: 0.85;
  }
  50% {
    transform: scale(1.06);
    opacity: 1;
    filter: drop-shadow(0 0 12rpx rgba(218, 107, 23, 0.6));
  }
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

/* 空态样式 */
.emptyBox {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 90rpx 40rpx;
  text-align: center;
}

.emptyEmoji {
  font-size: 64rpx;
  margin-bottom: 16rpx;
}

.emptyTitle {
  font-size: 28rpx;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 8rpx;
}

.emptySub {
  font-size: 22rpx;
  color: #848d9a;
  line-height: 1.5;
}
</style>
