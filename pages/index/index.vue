<template>
  <view class="nexusPage">
    <!-- ==================================================================== -->
    <!-- 区域 1：Nexus 官方移动端标准顶栏 (☰ 抽屉 + ❖ 橙标 + 🔍 搜索 + 👤 电脑配对) -->
    <!-- ==================================================================== -->
    <view class="nexusHeader">
      <view class="headerBtn" @click="toggleDrawer">
        <text class="headerIcon">☰</text>
      </view>

      <view class="headerLogoArea" @click="switchView('mods')">
        <view class="nexusLogoBox">
          <text class="nexusLogoGlyph">❖</text>
        </view>
        <text class="nexusBrandText">MAYFLY</text>
        <text class="nexusBrandSub">NEXUS</text>
      </view>

      <view class="headerRightArea">
        <view class="headerBtn" @click="toggleSearchExpand">
          <text class="headerIcon">🔍</text>
        </view>
        <view class="headerBtn userBtn" @click="openDeviceModal">
          <text class="headerIcon">👤</text>
          <view class="onlineDot" :class="{ connected: desktopConfig.connected }"></view>
        </view>
      </view>
    </view>

    <!-- ==================================================================== -->
    <!-- 区域 1.5：平滑展开的搜索输入栏 -->
    <!-- ==================================================================== -->
    <view class="searchExpandSection" v-if="searchExpanded || searchText">
      <view class="searchBarBox">
        <text class="searchIcon">🔍</text>
        <input
          class="searchInput"
          v-model="searchText"
          placeholder="搜索 NexusMods 任意模组或游戏..."
          placeholder-class="searchPlaceholder"
          confirm-type="search"
          @confirm="onSearchConfirm"
        />
        <text v-if="searchText" class="clearIcon" @click="clearSearch">✕</text>
      </view>
    </view>

    <!-- ==================================================================== -->
    <!-- 区域 2：主副视角导航 (对标图 1 与图 2：Games 游戏专区 / Mods 模组流) -->
    <!-- ==================================================================== -->
    <view class="nexusNavSegment">
      <view
        class="segmentTab"
        :class="{ active: currentView === 'mods' }"
        @click="switchView('mods')"
      >
        <text class="segmentIcon">🔷</text>
        <text class="segmentText">Mods 模组发现</text>
      </view>
      <view
        class="segmentTab"
        :class="{ active: currentView === 'games' }"
        @click="switchView('games')"
      >
        <text class="segmentIcon">🎮</text>
        <text class="segmentText">Games 热门游戏</text>
      </view>
    </view>

    <!-- ==================================================================== -->
    <!-- 区域 3A：Games 视角 (100% 对标用户截图 1 的双列竖版海报风格，动态拉取) -->
    <!-- ==================================================================== -->
    <view class="gamesContainer" v-if="currentView === 'games'">
      <!-- 加载状态 -->
      <view class="loadingBox" v-if="gamesLoading && gamesList.length === 0">
        <view class="loadingSpinner"></view>
        <text class="loadingText">正在从 N网 动态加载热门游戏库...</text>
      </view>

      <!-- 双列竖版游戏海报网格 (对标图 1: Skyrim SE, Fallout 4 等) -->
      <view class="gamesGrid" v-else>
        <view
          class="gamePosterCard"
          v-for="game in gamesList"
          :key="game.id"
          @click="selectGameAndJumpMods(game)"
        >
          <!-- 竖版封面 (2:3比例) + 赛博朋克同款书签角标 -->
          <view class="gameCoverBox">
            <image
              class="gameCoverImg"
              :src="game.tileUrl"
              mode="aspectFill"
              lazy-load
            />
            <view class="gameBookmarkBadge" v-if="selectedGameDomain === game.domain">
              <text class="bookmarkIcon">✓ 选中</text>
            </view>
          </view>

          <!-- 游戏英文全名 (白字加粗) -->
          <text class="gameTitleText">{{ game.name }}</text>

          <!-- 统计指标行 (对标图 1: 🔷 142k  📦 4.8k  📥 13.4b) -->
          <view class="gameStatsRow">
            <view class="statMetricItem">
              <text class="statGlyph">🔷</text>
              <text class="statMetricVal">{{ game.stats.mods }}</text>
            </view>
            <view class="statMetricItem">
              <text class="statGlyph">📦</text>
              <text class="statMetricVal">{{ game.stats.tracking }}</text>
            </view>
            <view class="statMetricItem">
              <text class="statGlyph">📥</text>
              <text class="statMetricVal">{{ game.stats.downloads }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- ==================================================================== -->
    <!-- 区域 3B：Mods 视角 (100% 对标用户截图 2 的模组流风格，动态拉取) -->
    <!-- ==================================================================== -->
    <view class="modsContainer" v-else>
      <!-- 当前选中游戏过滤横幅提示 -->
      <view class="activeGameBanner" v-if="selectedGameDomain">
        <view class="activeGameInfo">
          <text class="activeGameIcon">🎮</text>
          <text class="activeGameTitle">当前专区: {{ activeGameDisplayName }}</text>
        </view>
        <view class="clearGameBtn" @click="clearGameFilter">
          <text class="clearGameText">✕ 查看全网</text>
        </view>
      </view>

      <!-- 模组区块标题行 (对标图 2: 🔷 Mods   View all) -->
      <view class="modsHeaderRow">
        <view class="modsHeaderLeft">
          <text class="modsIcon">🔷</text>
          <text class="modsTitle">Mods</text>
        </view>
        <text class="modsViewAllLink" @click="resetAndLoad">View all</text>
      </view>

      <!-- 排序与状态选项卡 (100% 对标图 2: ☀ New | ⟳ Updated | 📈 Trending | ★ Popular | ❤️ Favorites) -->
      <scroll-view class="filterPillsScroll" scroll-x show-scrollbar="false">
        <view class="filterPillsList">
          <!-- ☀ New (活跃态为白底黑字胶囊) -->
          <view
            class="filterPill"
            :class="{ active: currentSort === 'createdAt' }"
            @click="changeSort('createdAt')"
          >
            <text class="pillIcon">☀</text>
            <text class="pillLabel">New</text>
          </view>

          <!-- ⟳ Updated -->
          <view
            class="filterPill"
            :class="{ active: currentSort === 'updatedAt' }"
            @click="changeSort('updatedAt')"
          >
            <text class="pillIcon">⟳</text>
            <text class="pillLabel">Updated</text>
          </view>

          <!-- 📈 Trending -->
          <view
            class="filterPill"
            :class="{ active: currentSort === 'trending' }"
            @click="changeSort('trending')"
          >
            <text class="pillIcon">📈</text>
            <text class="pillLabel">Trending</text>
          </view>

          <!-- ★ Popular -->
          <view
            class="filterPill"
            :class="{ active: currentSort === 'downloads' }"
            @click="changeSort('downloads')"
          >
            <text class="pillIcon">★</text>
            <text class="pillLabel">Popular</text>
          </view>

          <!-- ❤️ Favorites (装机心愿单) -->
          <view
            class="filterPill"
            :class="{ active: currentSort === 'favorites' }"
            @click="changeSort('favorites')"
          >
            <text class="pillIcon">❤️</text>
            <text class="pillLabel">Favorites{{ favoritesCount > 0 ? ` (${favoritesCount})` : '' }}</text>
          </view>
        </view>
      </scroll-view>

      <!-- 时间范围下拉筛选行 (对标图 2: All time ↕) -->
      <view class="timeFilterRow">
        <picker :range="timeFilterOptions" :value="timeFilterIndex" @change="onTimeFilterChange">
          <view class="timeSelectBox">
            <text class="timeSelectLabel">{{ timeFilterOptions[timeFilterIndex] }}</text>
            <text class="timeSelectArrow">↕</text>
          </view>
        </picker>
      </view>

      <!-- 心愿单模式批量操作工具条 -->
      <view class="favBatchBar" v-if="currentSort === 'favorites' && favoritesList.length > 0">
        <view class="favSummaryText">
          <text class="favCountNum">❤️ 已收藏 {{ favoritesList.length }} 个模组</text>
          <text class="favTipText">一键将心愿单全部推送到电脑</text>
        </view>
        <view class="favBatchActions">
          <button class="favExportBtn" @click="exportFavoritesList">
            <text class="favExportBtnText">📋 导出</text>
          </button>
          <button
            class="favBatchPushBtn"
            :disabled="isBatchPushing"
            @click="batchPushFavorites"
          >
            <text class="favBatchBtnText">
              {{ isBatchPushing ? '投递中...' : `🚀 全部推送 (${favoritesList.length})` }}
            </text>
          </button>
        </view>
      </view>

      <!-- 双列模组卡片网格 (100% 对标图 2) -->
      <view class="modsGrid" v-if="streamModList.length > 0">
        <view
          class="modCard"
          v-for="item in streamModList"
          :key="item.id"
          @click="openDetail(item)"
        >
          <!-- 封面大图 (16:9) + 游戏短角标 + 右上角操作点 -->
          <view class="modCoverBox">
            <image
              class="modCoverImg"
              :src="item.coverImageUrl || '/static/logo.png'"
              mode="aspectFill"
              lazy-load
            />
            <view class="modGameBadge">
              <text class="modGameBadgeText">{{ item.game.shortZhName || item.game.name }}</text>
            </view>
            <view class="modActionBtn" @click.stop="toggleCardFavorite(item)">
              <text class="actionDotText">{{ favoriteIdMap[item.id] ? '❤️' : '···' }}</text>
            </view>
          </view>

          <!-- 卡片信息主体 (对标图 2) -->
          <view class="modBody">
            <!-- 标题 (白字加粗) -->
            <text class="modTitleText">
              {{ enableAutoTranslate && zhTitleMap[item.id] ? zhTitleMap[item.id] : item.title }}
            </text>

            <!-- 作者信息 (Nexus 经典暖金色 #d4a373) -->
            <view class="modAuthorRow">
              <text class="authorGlyph">👤</text>
              <text class="authorNameText">{{ item.author }}</text>
            </view>

            <!-- 模组类型 (对标图 2 Patches, Audio 等) -->
            <text class="modCategoryText">{{ item.category }}</text>

            <!-- 更新与创建时间 (对标图 2: ⟳ 2 minutes ago / ⬆ 16 Oct 2026) -->
            <view class="modTimeRow">
              <view class="timeCol">
                <text class="timeIcon">⟳</text>
                <text class="timeVal">{{ item.timeAgo || 'recently' }}</text>
              </view>
              <view class="timeCol" v-if="item.formattedDate">
                <text class="timeIcon">⬆</text>
                <text class="timeVal">{{ item.formattedDate }}</text>
              </view>
            </view>

            <!-- 简介摘要预览 (灰色两行) -->
            <text class="modSummaryText">{{ item.summary }}</text>

            <!-- 底部统计与推送 (对标图 2: 👍 0  📥 0  + Mayfly 独有推送到电脑) -->
            <view class="modFooterRow">
              <view class="modStatsLeft">
                <text class="footerMetric">👍 {{ item.likes }}</text>
                <text class="footerMetric">📥 {{ formatCount(item.downloads) }}</text>
              </view>
              <button
                class="nexusPushBtn"
                :disabled="pushingModId === item.id"
                @click.stop="quickPushToDesktop(item)"
              >
                <text class="nexusPushBtnText">
                  {{ pushingModId === item.id ? '推送中' : '🚀 推送' }}
                </text>
              </button>
            </view>
          </view>
        </view>
      </view>

      <!-- 加载与空结果提示 -->
      <view class="loadingBox" v-if="loading && modList.length === 0">
        <view class="loadingSpinner"></view>
        <text class="loadingText">正在从 NexusMods 检索模组...</text>
      </view>

      <view class="emptyBox" v-if="!loading && modList.length === 0">
        <text class="emptyIcon">📭</text>
        <text class="emptyText">未找到相关 N网 模组</text>
        <button class="retryBtn" @click="resetAndLoad">刷新重试</button>
      </view>

      <view class="bottomNotice" v-if="modList.length > 0">
        <text class="bottomText" v-if="loadingMore">正在加载更多 Nexus 模组...</text>
        <text class="bottomText" v-else-if="!hasMore">已加载全部热门 Nexus 模组</text>
      </view>
    </view>

    <!-- ==================================================================== -->
    <!-- 区域 4：侧边滑出抽屉导航 (点击顶部 ☰ 触发) -->
    <!-- ==================================================================== -->
    <view class="drawerMask" v-if="drawerVisible" @click="closeDrawer">
      <view class="drawerBody" @click.stop>
        <view class="drawerHeaderRow">
          <view class="drawerBrandBox">
            <text class="drawerLogo">❖</text>
            <text class="drawerBrandTitle">Mayfly Nexus 伴侣</text>
          </view>
          <view class="drawerCloseBtn" @click="closeDrawer">✕</view>
        </view>

        <!-- 电脑端连接卡片 -->
        <view class="drawerPcCard">
          <view class="pcCardTop">
            <text class="pcCardTitle">💻 电脑端连接状态</text>
            <view class="pcStatusBadge" :class="{ online: desktopConfig.connected }">
              <text class="pcStatusText">{{ desktopConfig.connected ? '已连接' : '未连接' }}</text>
            </view>
          </view>
          <text class="pcIpText">目标主机: {{ desktopConfig.host }}:{{ desktopConfig.port }}</text>
          <view class="pcActionsRow">
            <button class="pcActionBtn primary" @click="openDeviceModal">
              <text class="btnText">⚙️ 配对设置</text>
            </button>
            <button class="pcActionBtn" @click="runQuickTest">
              <text class="btnText">📶 测试连接</text>
            </button>
          </view>
        </view>

        <!-- 导航功能列表 -->
        <view class="drawerNavList">
          <view class="drawerNavItem" @click="switchView('mods'); closeDrawer()">
            <text class="itemIcon">🔷</text>
            <text class="itemText">全网模组发现 (Mods)</text>
          </view>
          <view class="drawerNavItem" @click="switchView('games'); closeDrawer()">
            <text class="itemIcon">🎮</text>
            <text class="itemText">热门游戏专区 (Games)</text>
          </view>
          <view class="drawerNavItem" @click="changeSort('favorites'); switchView('mods'); closeDrawer()">
            <text class="itemIcon">❤️</text>
            <text class="itemText">装机心愿单 (Wishlist)</text>
            <text class="itemBadge" v-if="favoritesCount > 0">{{ favoritesCount }}</text>
          </view>
          <view class="drawerNavItem" @click="openHistoryModal">
            <text class="itemIcon">🚀</text>
            <text class="itemText">推送历史任务</text>
            <text class="itemBadge" v-if="historyList.length > 0">{{ historyList.length }}</text>
          </view>
          <view class="drawerNavItem" @click="toggleAutoTranslate">
            <text class="itemIcon">🌐</text>
            <text class="itemText">AI 智能双语图鉴</text>
            <text class="itemSwitchTag" :class="{ on: enableAutoTranslate }">
              {{ enableAutoTranslate ? '已开启' : '原英文' }}
            </text>
          </view>
        </view>

        <view class="drawerFooter">
          <text class="footerVersion">NexusMods 官方公开 GraphQL 直连</text>
          <text class="footerSub">Mayfly Mod Manager Companion</text>
        </view>
      </view>
    </view>

    <!-- ==================================================================== -->
    <!-- 区域 5：电脑端连接与配对设置弹窗 -->
    <!-- ==================================================================== -->
    <view class="modalOverlay" v-if="deviceModalVisible" @click="closeDeviceModal">
      <view class="deviceModalContent" @click.stop>
        <view class="deviceModalHeader">
          <text class="modalTitle">💻 配对电脑端 Mayfly</text>
          <view class="modalCloseBtn" @click="closeDeviceModal">✕</view>
        </view>

        <view class="deviceForm">
          <!-- 扫码一键配对按钮 -->
          <button class="scanCodeBtn" @click="handleScanCodePair">
            <text class="scanCodeBtnText">📷 扫一扫屏幕二维码自动配对</text>
          </button>

          <view class="formDividerRow">
            <view class="dividerLine"></view>
            <text class="dividerText">或手动输入配置</text>
            <view class="dividerLine"></view>
          </view>

          <view class="formItem">
            <text class="formLabel">电脑局域网 IP 地址</text>
            <input
              class="formInput"
              v-model="deviceForm.host"
              placeholder="例如 192.168.1.100"
            />
          </view>

          <view class="formItem">
            <text class="formLabel">通信端口</text>
            <input
              class="formInput"
              type="number"
              v-model="deviceForm.port"
              placeholder="默认 28888 或 9876"
            />
          </view>

          <view class="formItem">
            <text class="formLabel">设备配对 Token / Pin</text>
            <input
              class="formInput"
              v-model="deviceForm.deviceToken"
              placeholder="例如 MF-PC-8891"
            />
          </view>

          <!-- 测试连接按钮 -->
          <button
            class="testConnBtn"
            :disabled="testingConnection"
            @click="runTestConnection"
          >
            <text class="testBtnText">{{ testingConnection ? '正在探测连通性...' : '⚡ 测试连接' }}</text>
          </button>

          <!-- 保存按钮 -->
          <button class="saveConfigBtn" @click="saveDeviceSettings">
            <text class="saveBtnText">保存配置</text>
          </button>
        </view>
      </view>
    </view>

    <!-- ==================================================================== -->
    <!-- 区域 6：推送任务清单与历史记录抽屉 -->
    <!-- ==================================================================== -->
    <view class="modalOverlay" v-if="historyModalVisible" @click="closeHistoryModal">
      <view class="historyDrawerContent" @click.stop>
        <view class="drawerHeader">
          <view class="drawerTitleBox">
            <text class="drawerTitle">📋 推送任务清单</text>
            <text class="drawerSub">已推送到电脑 Mayfly 的模组</text>
          </view>
          <view class="drawerActions">
            <text class="clearHistoryText" v-if="historyList.length > 0" @click="handleClearHistory">清空</text>
            <view class="modalCloseBtn" @click="closeHistoryModal">✕</view>
          </view>
        </view>

        <!-- 历史清单滚动列表 -->
        <scroll-view scroll-y class="historyScrollList">
          <view class="historyEmpty" v-if="historyList.length === 0">
            <text class="emptyTipIcon">📦</text>
            <text class="emptyTipText">暂无推送记录，挑选心仪的 Mod 体验一键推送吧！</text>
          </view>

          <view class="historyItem" v-for="item in historyList" :key="item.id">
            <image class="historyThumb" :src="item.coverImageUrl || '/static/logo.png'" mode="aspectFill" />
            <view class="historyBody">
              <text class="historyTitle">{{ item.title }}</text>
              <view class="historyMeta">
                <text class="historyGame">{{ item.gameName }}</text>
                <text class="historyChannelTag">{{ item.channel === 'LAN_HTTP' ? '局域网' : '云通道' }}</text>
                <text class="historyTime">{{ formatHistoryTime(item.timestamp) }}</text>
              </view>
            </view>
            <button class="rePushBtn" @click="rePushItem(item)">
              <text class="rePushText">重推</text>
            </button>
          </view>
        </scroll-view>
      </view>
    </view>
  </view>
</template>

<script>
// ============================================================================
// 脚本逻辑：首页 Nexus 动态数据流控制与交互
// ============================================================================
import {
  fetchNexusMods,
  fetchNexusGames,
  pushModToDesktop,
  getDesktopConfig,
  saveDesktopConfig,
  testDesktopConnection
} from '../../services/nexus.js';
import { batchTranslateToZh } from '../../services/translate.js';
import { getPushHistory, clearPushHistory } from '../../services/history.js';
import { getFavorites, toggleFavorite } from '../../services/favorites.js';
import { parseShareClipboard, formatFavoritesShareText } from '../../services/poster.js';

export default {
  data() {
    return {
      // 当前主视角: 'mods' (全网模组发现) | 'games' (热门游戏专区)
      currentView: 'mods',

      // 动态游戏列表数据 (100% 动态，来自 Nexus 官方 GraphQL，零硬编码)
      gamesList: [],
      gamesLoading: false,
      selectedGameDomain: '',
      selectedGameName: '',

      // 动态模组列表状态 (100% 动态，来自 Nexus 官方 GraphQL)
      modList: [],
      page: 1,
      pageSize: 20,
      totalCount: 0,
      hasMore: true,
      loading: false,
      loadingMore: false,

      // 排序维度: 'createdAt' (New) | 'updatedAt' (Updated) | 'trending' | 'downloads' (Popular) | 'favorites'
      currentSort: 'createdAt',
      timeFilterIndex: 0,
      timeFilterOptions: ['All time', 'Last 24 hours', 'Last 7 days', 'Last 14 days', 'Last 30 days', '1 year'],

      // 智能翻译与双语图鉴
      enableAutoTranslate: false,
      zhTitleMap: {},

      // 心愿单收藏
      favoritesList: [],
      favoriteIdMap: {},

      // 搜索控制
      searchText: '',
      searchExpanded: false,

      // 侧边抽屉与弹窗状态
      drawerVisible: false,
      pushingModId: null,

      // 推送历史与任务清单
      historyModalVisible: false,
      historyList: [],
      pushedIdMap: {},
      isBatchPushing: false,
      lastHandledClipboard: '',

      // 设备配对设置
      deviceModalVisible: false,
      desktopConfig: {
        host: '192.168.1.100',
        port: 9876,
        deviceToken: 'MF-PC-8891',
        connected: false
      },
      deviceForm: {
        host: '',
        port: 9876,
        deviceToken: ''
      },
      testingConnection: false
    };
  },

  computed: {
    /**
     * 实际渲染展示的 Mod 列表 (心愿单模式切为本地收藏列表)
     */
    displayModList() {
      if (this.currentSort === 'favorites') {
        return this.favoritesList;
      }
      return this.modList;
    },

    /**
     * 收藏总数
     */
    favoritesCount() {
      return this.favoritesList.length;
    },

    /**
     * 全网流水线瀑布流列表
     */
    streamModList() {
      if (this.currentSort === 'favorites') {
        return this.favoritesList;
      }
      return this.modList;
    },

    /**
     * 当前选中的游戏展示名称
     */
    activeGameDisplayName() {
      if (!this.selectedGameDomain) return '';
      if (this.selectedGameName) return this.selectedGameName;
      const match = this.gamesList.find((g) => g.domain === this.selectedGameDomain);
      return match ? match.name : this.selectedGameDomain;
    }
  },

  onLoad() {
    this.initDesktopConfig();
    this.refreshHistory();
    this.refreshFavorites();
    // 首次进入动态加载游戏列表与模组列表
    this.loadGames();
    this.loadMods();
  },

  onShow() {
    this.refreshHistory();
    this.refreshFavorites();
    this.checkClipboardModShare();
  },

  onPullDownRefresh() {
    if (this.currentView === 'games') {
      this.loadGames(() => {
        uni.stopPullDownRefresh();
      });
      return;
    }
    if (this.currentSort === 'favorites') {
      this.refreshFavorites();
      uni.stopPullDownRefresh();
      return;
    }
    this.resetAndLoad(() => {
      uni.stopPullDownRefresh();
    });
  },

  onReachBottom() {
    if (this.currentView === 'mods' && this.hasMore && !this.loading && !this.loadingMore) {
      this.loadMoreMods();
    }
  },

  methods: {
    // ------------------------------------------------------------------------
    // 视角切换与抽屉交互
    // ------------------------------------------------------------------------

    /**
     * 切换主视角 ('mods' | 'games')
     */
    switchView(viewName) {
      this.currentView = viewName;
      if (viewName === 'games' && this.gamesList.length === 0) {
        this.loadGames();
      }
    },

    /**
     * 开关侧边抽屉
     */
    toggleDrawer() {
      this.drawerVisible = !this.drawerVisible;
    },

    closeDrawer() {
      this.drawerVisible = false;
    },

    /**
     * 切换搜索条展开状态
     */
    toggleSearchExpand() {
      this.searchExpanded = !this.searchExpanded;
    },

    /**
     * 从 Games 视角选中某游戏并进入 Mods 列表筛选
     */
    selectGameAndJumpMods(game) {
      if (!game) return;
      this.selectedGameDomain = game.domain;
      this.selectedGameName = game.name;
      this.currentView = 'mods';
      uni.showToast({
        title: `已进入【${game.name}】模组库`,
        icon: 'none'
      });
      this.resetAndLoad();
    },

    /**
     * 清空游戏筛选，恢复全网模式
     */
    clearGameFilter() {
      this.selectedGameDomain = '';
      this.selectedGameName = '';
      this.resetAndLoad();
    },

    /**
     * 时间筛选下拉框触发
     */
    onTimeFilterChange(e) {
      this.timeFilterIndex = Number(e.detail?.value) || 0;
      this.resetAndLoad();
    },

    // ------------------------------------------------------------------------
    // 动态数据拉取 (100% 动态，零硬编码)
    // ------------------------------------------------------------------------

    /**
     * 从 Nexus 官方 GraphQL 动态抓取游戏列表 (对标图 1)
     */
    async loadGames(callback) {
      if (this.gamesLoading) return;
      this.gamesLoading = true;
      try {
        const res = await fetchNexusGames({
          count: 30,
          offset: 0,
          sort: 'downloads'
        });
        this.gamesList = res.games || [];
      } catch (e) {
        console.warn('[MayflyIndex] 动态加载游戏列表异常:', e);
      } finally {
        this.gamesLoading = false;
        if (typeof callback === 'function') callback();
      }
    },

    /**
     * 从 Nexus 官方 GraphQL 动态抓取模组列表 (对标图 2)
     */
    async loadMods() {
      if (this.loading) return;
      this.loading = true;
      this.page = 1;

      try {
        const result = await fetchNexusMods({
          page: 1,
          pageSize: this.pageSize,
          sort: this.currentSort === 'favorites' ? 'downloads' : this.currentSort,
          searchText: (this.searchText || '').trim(),
          gameDomain: this.selectedGameDomain || ''
        });

        this.modList = result.items || [];
        this.totalCount = result.totalCount || 0;
        this.hasMore = result.hasMore;

        if (this.enableAutoTranslate) {
          this.translateCurrentTitles(result.items);
        }
      } catch (err) {
        uni.showToast({
          title: '从 N网 加载失败，请检查网络',
          icon: 'none'
        });
      } finally {
        this.loading = false;
      }
    },

    /**
     * 上拉加载更多
     */
    async loadMoreMods() {
      if (this.loadingMore || !this.hasMore) return;
      this.loadingMore = true;
      const nextPage = this.page + 1;

      try {
        const result = await fetchNexusMods({
          page: nextPage,
          pageSize: this.pageSize,
          sort: this.currentSort === 'favorites' ? 'downloads' : this.currentSort,
          searchText: (this.searchText || '').trim(),
          gameDomain: this.selectedGameDomain || ''
        });

        this.modList = [...this.modList, ...(result.items || [])];
        this.page = nextPage;
        this.hasMore = result.hasMore;

        if (this.enableAutoTranslate) {
          this.translateCurrentTitles(result.items);
        }
      } catch (err) {
        uni.showToast({
          title: '加载下一页失败',
          icon: 'none'
        });
      } finally {
        this.loadingMore = false;
      }
    },

    /**
     * 重置状态并重新加载
     */
    async resetAndLoad(callback) {
      this.page = 1;
      this.hasMore = true;
      await this.loadMods();
      if (typeof callback === 'function') {
        callback();
      }
    },

    /**
     * 切换排序维度或进入心愿单模式 (对标图 2 选项卡)
     */
    changeSort(sortType) {
      if (this.currentSort === sortType) return;
      this.currentSort = sortType;
      if (sortType === 'favorites') {
        this.refreshFavorites();
        return;
      }
      this.resetAndLoad();
    },

    /**
     * 确认搜索
     */
    onSearchConfirm() {
      this.currentView = 'mods';
      this.resetAndLoad();
    },

    /**
     * 清空搜索词
     */
    clearSearch() {
      this.searchText = '';
      this.resetAndLoad();
    },

    // ------------------------------------------------------------------------
    // 收藏与心愿单
    // ------------------------------------------------------------------------

    refreshFavorites() {
      this.favoritesList = getFavorites();
      const map = {};
      this.favoritesList.forEach((item) => {
        map[item.id] = true;
      });
      this.favoriteIdMap = map;
    },

    toggleCardFavorite(item) {
      if (!item || !item.id) return;
      const nextStatus = toggleFavorite(item);
      this.refreshFavorites();
      uni.showToast({
        title: nextStatus ? '已加入装机心愿单' : '已移出心愿单',
        icon: 'none'
      });
    },

    exportFavoritesList() {
      if (this.favoritesList.length === 0) return;
      const text = formatFavoritesShareText(this.favoritesList);
      uni.setClipboardData({
        data: text,
        success: () => {
          uni.showToast({
            title: '心愿单口令已复制到剪贴板',
            icon: 'success'
          });
        }
      });
    },

    async batchPushFavorites() {
      if (this.isBatchPushing || this.favoritesList.length === 0) return;
      this.isBatchPushing = true;
      let okCount = 0;
      for (const mod of this.favoritesList) {
        try {
          const res = await pushModToDesktop(mod, this.desktopConfig);
          if (res.success) {
            okCount++;
            this.pushedIdMap[mod.id] = true;
          }
        } catch (e) {
          console.warn('[MayflyIndex] 批量推送异常:', e);
        }
      }
      this.isBatchPushing = false;
      uni.showModal({
        title: '批量推送完成',
        content: `成功投递 ${okCount} / ${this.favoritesList.length} 个模组到电脑端 Mayfly。`,
        showCancel: false
      });
      this.refreshHistory();
    },

    // ------------------------------------------------------------------------
    // 详情跳转与电脑远程安装推送
    // ------------------------------------------------------------------------

    /**
     * 跳转至模组全景图鉴详情页
     */
    openDetail(item) {
      if (!item || !item.id) return;
      const encoded = encodeURIComponent(JSON.stringify(item));
      uni.navigateTo({
        url: `/pages/detail/detail?modData=${encoded}`
      });
    },

    /**
     * 快捷一键推送到电脑端 Mayfly 安装
     */
    async quickPushToDesktop(item) {
      if (!item || !item.id) return;
      this.pushingModId = item.id;

      uni.showLoading({
        title: '正在投递信令...'
      });

      try {
        const res = await pushModToDesktop(item, this.desktopConfig);
        uni.hideLoading();

        if (res.success) {
          this.pushedIdMap[item.id] = true;
          this.refreshHistory();
          uni.showToast({
            title: '已成功推送到电脑 Mayfly 安装！',
            icon: 'success',
            duration: 2500
          });
        } else {
          uni.showModal({
            title: '推送未完成',
            content: res.message || '电脑端连接超时，请确认电脑已开启 Mayfly 并连接同一局域网。',
            confirmText: '去配对',
            cancelText: '取消',
            success: (mRes) => {
              if (mRes.confirm) {
                this.openDeviceModal();
              }
            }
          });
        }
      } catch (err) {
        uni.hideLoading();
        uni.showToast({
          title: '推送异常: ' + (err.message || '未知错误'),
          icon: 'none'
        });
      } finally {
        this.pushingModId = null;
      }
    },

    // ------------------------------------------------------------------------
    // 智能双语图鉴
    // ------------------------------------------------------------------------

    async toggleAutoTranslate() {
      this.enableAutoTranslate = !this.enableAutoTranslate;
      if (this.enableAutoTranslate) {
        uni.showToast({
          title: '已开启智能中文图鉴',
          icon: 'none'
        });
        await this.translateCurrentTitles(this.modList);
      } else {
        uni.showToast({
          title: '已切换为英文原版',
          icon: 'none'
        });
      }
    },

    async translateCurrentTitles(items) {
      if (!Array.isArray(items) || items.length === 0) return;
      const titles = items.map((m) => m.title).filter(Boolean);
      try {
        const resMap = await batchTranslateToZh(titles);
        const nextZhMap = { ...this.zhTitleMap };
        items.forEach((m) => {
          if (resMap.has(m.title)) {
            nextZhMap[m.id] = resMap.get(m.title);
          }
        });
        this.zhTitleMap = nextZhMap;
      } catch (e) {
        console.warn('[MayflyIndex] 标题翻译异常:', e);
      }
    },

    // ------------------------------------------------------------------------
    // 设备配对与抽屉快测
    // ------------------------------------------------------------------------

    initDesktopConfig() {
      this.desktopConfig = getDesktopConfig();
    },

    openDeviceModal() {
      this.deviceForm = {
        host: this.desktopConfig.host,
        port: this.desktopConfig.port,
        deviceToken: this.desktopConfig.deviceToken
      };
      this.deviceModalVisible = true;
    },

    closeDeviceModal() {
      this.deviceModalVisible = false;
    },

    async runTestConnection() {
      if (!this.deviceForm.host) {
        uni.showToast({
          title: '请先填写电脑局域网 IP',
          icon: 'none'
        });
        return;
      }
      this.testingConnection = true;
      const ok = await testDesktopConnection(this.deviceForm.host, this.deviceForm.port);
      this.testingConnection = false;

      if (ok) {
        uni.showToast({
          title: '连通成功！电脑 Mayfly 响应正常',
          icon: 'success'
        });
        this.desktopConfig.connected = true;
      } else {
        uni.showModal({
          title: '连接测试未成功',
          content: '请确认电脑端 Mayfly 是否已启动，并确保手机与电脑连接同一 WiFi。',
          showCancel: false
        });
        this.desktopConfig.connected = false;
      }
    },

    saveDeviceSettings() {
      this.desktopConfig = {
        ...this.desktopConfig,
        host: this.deviceForm.host.trim(),
        port: Number(this.deviceForm.port) || 9876,
        deviceToken: this.deviceForm.deviceToken.trim()
      };
      saveDesktopConfig(this.desktopConfig);
      this.closeDeviceModal();
      uni.showToast({
        title: '电脑配对配置已保存',
        icon: 'success'
      });
    },

    async runQuickTest() {
      if (!this.desktopConfig.host) {
        uni.showToast({
          title: '请先在配对设置中填写电脑 IP',
          icon: 'none'
        });
        return;
      }
      uni.showLoading({ title: '测试连接中...' });
      const ok = await testDesktopConnection(this.desktopConfig.host, this.desktopConfig.port);
      uni.hideLoading();
      this.desktopConfig.connected = ok;
      saveDesktopConfig(this.desktopConfig);
      uni.showToast({
        title: ok ? '电脑连接成功' : '电脑未响应，请检查 WiFi',
        icon: ok ? 'success' : 'none'
      });
    },

    handleScanCodePair() {
      // #ifdef MP-WEIXIN || APP-PLUS || MP-ALIPAY
      uni.scanCode({
        scanType: ['qrCode'],
        success: (res) => {
          const raw = res.result || '';
          this.parseAndApplyPairCode(raw);
        },
        fail: () => {
          uni.showToast({
            title: '扫码取消或未识别二维码',
            icon: 'none'
          });
        }
      });
      // #endif

      // #ifdef H5
      uni.showModal({
        title: 'H5 浏览器环境提示',
        content: '网页端可通过上方直接手动输入电脑 IP、端口与 Token 完成配对。',
        showCancel: false
      });
      // #endif
    },

    async parseAndApplyPairCode(rawText) {
      try {
        let host = '';
        let port = 9876;
        let token = '';

        if (rawText.startsWith('mayfly://pair')) {
          const query = rawText.split('?')[1] || '';
          const params = new URLSearchParams(query);
          host = params.get('host') || '';
          port = Number(params.get('port')) || 9876;
          token = params.get('token') || '';
        } else if (rawText.startsWith('http://') || rawText.startsWith('https://')) {
          const urlMatch = rawText.match(/^https?:\/\/([^:/]+)(?::(\d+))?.*?[?&](?:token|pin)=([^&]+)/i);
          if (urlMatch) {
            host = urlMatch[1];
            port = Number(urlMatch[2]) || 28888;
            token = decodeURIComponent(urlMatch[3] || '');
          } else {
            const simpleUrl = rawText.match(/^https?:\/\/([^:/]+)(?::(\d+))?/i);
            if (simpleUrl) {
              host = simpleUrl[1];
              port = Number(simpleUrl[2]) || 28888;
            }
          }
        }

        if (host) {
          this.deviceForm.host = host;
          this.deviceForm.port = port;
          if (token) this.deviceForm.deviceToken = token;
          await this.runTestConnection();
          if (this.desktopConfig.connected) {
            this.saveDeviceSettings();
          }
        }
      } catch (e) {
        console.warn('[MayflyIndex] 解析二维码失败:', e);
      }
    },

    // ------------------------------------------------------------------------
    // 推送历史与剪贴板接力
    // ------------------------------------------------------------------------

    refreshHistory() {
      this.historyList = getPushHistory();
    },

    openHistoryModal() {
      this.refreshHistory();
      this.historyModalVisible = true;
    },

    closeHistoryModal() {
      this.historyModalVisible = false;
    },

    handleClearHistory() {
      uni.showModal({
        title: '提示',
        content: '确定清空所有推送历史任务记录吗？',
        success: (res) => {
          if (res.confirm) {
            clearPushHistory();
            this.refreshHistory();
          }
        }
      });
    },

    async rePushItem(item) {
      if (!item) return;
      uni.showLoading({ title: '重新推送中...' });
      const res = await pushModToDesktop(
        {
          id: item.modId,
          modId: item.modId,
          title: item.title,
          game: { domainName: item.gameDomain, name: item.gameName }
        },
        this.desktopConfig
      );
      uni.hideLoading();
      if (res.success) {
        uni.showToast({ title: '重推成功！', icon: 'success' });
        this.refreshHistory();
      } else {
        uni.showToast({ title: res.message || '重推失败', icon: 'none' });
      }
    },

    checkClipboardModShare() {
      uni.getClipboardData({
        success: (res) => {
          const content = res.data;
          if (!content || content === this.lastHandledClipboard) return;
          const parsed = parseShareClipboard(content);
          if (parsed && parsed.modId) {
            this.lastHandledClipboard = content;
            uni.showModal({
              title: '发现 Mayfly 装机口令',
              content: `是否打开模组【${parsed.title || 'Nexus Mod #' + parsed.modId}】？`,
              confirmText: '立即打开',
              success: (mRes) => {
                if (mRes.confirm) {
                  this.openDetail({
                    id: parsed.modId,
                    modId: parsed.modId,
                    title: parsed.title,
                    game: { domainName: parsed.gameDomain, name: parsed.gameDomain }
                  });
                }
              }
            });
          }
        }
      });
    },

    // ------------------------------------------------------------------------
    // 工具辅助方法
    // ------------------------------------------------------------------------

    formatCount(num) {
      const val = Number(num) || 0;
      if (val >= 1000000000) {
        return (val / 1000000000).toFixed(1).replace(/\.0$/, '') + 'b';
      }
      if (val >= 1000000) {
        return (val / 1000000).toFixed(1).replace(/\.0$/, '') + 'm';
      }
      if (val >= 1000) {
        return (val / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
      }
      return String(val);
    },

    formatHistoryTime(timestamp) {
      if (!timestamp) return '';
      const d = new Date(timestamp);
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const h = String(d.getHours()).padStart(2, '0');
      const min = String(d.getMinutes()).padStart(2, '0');
      return `${m}-${day} ${h}:${min}`;
    }
  }
};
</script>

<style scoped>
/* ============================================================================ */
/* 样式体系：100% 对标 NexusMods 官方移动端纯粹暗黑风格 (Screenshot 1 & 2) */
/* ============================================================================ */

.nexusPage {
  min-height: 100vh;
  background-color: #121212;
  color: #e5e7eb;
  padding: 0 0 60rpx 0;
  box-sizing: border-box;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}

/* ---------------------------------------------------------------------------- */
/* 区域 1：Nexus 官方顶栏 (☰ + ❖ + 🔍 + 👤) */
/* ---------------------------------------------------------------------------- */
.nexusHeader {
  position: sticky;
  top: 0;
  z-index: 100;
  height: 96rpx;
  background-color: #161616;
  border-bottom: 1rpx solid #232323;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24rpx;
  box-sizing: border-box;
}

.headerBtn {
  width: 72rpx;
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.headerIcon {
  font-size: 38rpx;
  color: #e5e7eb;
}

.headerLogoArea {
  display: flex;
  align-items: center;
  gap: 12rpx;
  cursor: pointer;
}

.nexusLogoBox {
  width: 44rpx;
  height: 44rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nexusLogoGlyph {
  font-size: 38rpx;
  color: #da6b17; /* Nexus 经典橙色 */
}

.nexusBrandText {
  font-size: 32rpx;
  font-weight: 900;
  letter-spacing: 2rpx;
  color: #ffffff;
}

.nexusBrandSub {
  font-size: 24rpx;
  font-weight: 800;
  color: #da6b17;
  letter-spacing: 1rpx;
}

.headerRightArea {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.userBtn {
  position: relative;
}

.onlineDot {
  position: absolute;
  top: 14rpx;
  right: 14rpx;
  width: 14rpx;
  height: 14rpx;
  border-radius: 50%;
  background-color: #64748b;
  border: 2rpx solid #161616;
}

.onlineDot.connected {
  background-color: #10b981;
  box-shadow: 0 0 10rpx #10b981;
}

/* ---------------------------------------------------------------------------- */
/* 区域 1.5：平滑展开的搜索栏 */
/* ---------------------------------------------------------------------------- */
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

/* ---------------------------------------------------------------------------- */
/* 区域 2：主副视角导航 (Mods 与 Games) */
/* ---------------------------------------------------------------------------- */
.nexusNavSegment {
  display: flex;
  background-color: #141517;
  border-bottom: 1rpx solid #232323;
}

.segmentTab {
  flex: 1;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  border-bottom: 4rpx solid transparent;
  transition: all 0.2s ease;
  cursor: pointer;
}

.segmentTab.active {
  border-bottom-color: #da6b17;
  background: rgba(218, 107, 23, 0.08);
}

.segmentIcon {
  font-size: 28rpx;
}

.segmentText {
  font-size: 26rpx;
  font-weight: 700;
  color: #9ca3af;
}

.segmentTab.active .segmentText {
  color: #ffffff;
}

/* ---------------------------------------------------------------------------- */
/* 区域 3A：Games 视角 (100% 对标图 1 双列竖版海报) */
/* ---------------------------------------------------------------------------- */
.gamesContainer {
  padding: 24rpx;
}

.gamesGrid {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 24rpx 0;
}

.gamePosterCard {
  width: 48.2%;
  display: flex;
  flex-direction: column;
  cursor: pointer;
}

.gameCoverBox {
  position: relative;
  width: 100%;
  height: 440rpx;
  border-radius: 12rpx;
  overflow: hidden;
  background-color: #1b1b1b;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.5);
}

.gameCoverImg {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.gameBookmarkBadge {
  position: absolute;
  top: 12rpx;
  right: 12rpx;
  background: rgba(218, 107, 23, 0.95);
  border-radius: 8rpx;
  padding: 4rpx 12rpx;
}

.bookmarkIcon {
  font-size: 20rpx;
  font-weight: 800;
  color: #ffffff;
}

.gameTitleText {
  font-size: 26rpx;
  font-weight: 700;
  color: #ffffff;
  margin-top: 14rpx;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.gameStatsRow {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-top: 8rpx;
}

.statMetricItem {
  display: flex;
  align-items: center;
  gap: 6rpx;
}

.statGlyph {
  font-size: 20rpx;
  color: #8c8c8c;
}

.statMetricVal {
  font-size: 20rpx;
  color: #8c8c8c;
  font-weight: 600;
}

/* ---------------------------------------------------------------------------- */
/* 区域 3B：Mods 视角 (100% 对标图 2) */
/* ---------------------------------------------------------------------------- */
.modsContainer {
  padding: 24rpx;
}

.activeGameBanner {
  background: #1f2125;
  border: 1rpx solid #da6b17;
  border-radius: 12rpx;
  padding: 16rpx 20rpx;
  margin-bottom: 24rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.activeGameInfo {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.activeGameIcon {
  font-size: 28rpx;
}

.activeGameTitle {
  font-size: 24rpx;
  font-weight: 700;
  color: #ffffff;
}

.clearGameBtn {
  background-color: #2c2f38;
  padding: 6rpx 16rpx;
  border-radius: 8rpx;
}

.clearGameText {
  font-size: 20rpx;
  color: #da6b17;
  font-weight: 700;
}

/* Header Row: 🔷 Mods   View all (对标图 2) */
.modsHeaderRow {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.modsHeaderLeft {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.modsIcon {
  font-size: 32rpx;
  color: #ffffff;
}

.modsTitle {
  font-size: 36rpx;
  font-weight: 800;
  color: #ffffff;
}

.modsViewAllLink {
  font-size: 24rpx;
  font-weight: 700;
  color: #ffffff;
  text-decoration: underline;
  cursor: pointer;
}

/* Filter Pills: ☀ New | ⟳ Updated | 📈 Trending | ★ Popular (对标图 2) */
.filterPillsScroll {
  width: 100%;
  white-space: nowrap;
  margin-bottom: 20rpx;
}

.filterPillsList {
  display: inline-flex;
  gap: 16rpx;
  padding: 4rpx 0;
}

.filterPill {
  display: inline-flex;
  align-items: center;
  gap: 10rpx;
  background-color: #1f2125;
  border: 1rpx solid #373b43;
  border-radius: 40rpx;
  padding: 14rpx 32rpx;
  white-space: nowrap;
  flex-shrink: 0;
  cursor: pointer;
  transition: all 0.2s ease;
}

.filterPill.active {
  background-color: #ffffff;
  border-color: #ffffff;
}

.pillIcon {
  font-size: 24rpx;
  color: #ffffff;
}

.filterPill.active .pillIcon {
  color: #121212;
}

.pillLabel {
  font-size: 24rpx;
  font-weight: 700;
  color: #ffffff;
}

.filterPill.active .pillLabel {
  color: #121212;
  font-weight: 800;
}

/* Time Filter Dropdown: All time ↕ (对标图 2) */
.timeFilterRow {
  margin-bottom: 24rpx;
}

.timeSelectBox {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #1f2125;
  border: 1rpx solid #373b43;
  border-radius: 12rpx;
  padding: 16rpx 24rpx;
  box-sizing: border-box;
}

.timeSelectLabel {
  font-size: 24rpx;
  font-weight: 600;
  color: #ffffff;
}

.timeSelectArrow {
  font-size: 24rpx;
  color: #9ca3af;
}

/* 心愿单工具条 */
.favBatchBar {
  background: #1f2125;
  border: 1rpx solid #da6b17;
  border-radius: 12rpx;
  padding: 18rpx 20rpx;
  margin-bottom: 24rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.favSummaryText {
  display: flex;
  flex-direction: column;
}

.favCountNum {
  font-size: 24rpx;
  font-weight: 700;
  color: #da6b17;
}

.favTipText {
  font-size: 20rpx;
  color: #9ca3af;
  margin-top: 4rpx;
}

.favBatchActions {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.favExportBtn {
  background-color: #2a2e37;
  border: none;
  border-radius: 8rpx;
  padding: 10rpx 18rpx;
  margin: 0;
  line-height: 1.4;
}

.favExportBtnText {
  font-size: 22rpx;
  color: #ffffff;
}

.favBatchPushBtn {
  background: #da6b17;
  color: #ffffff;
  border-radius: 8rpx;
  border: none;
  padding: 10rpx 20rpx;
  margin: 0;
  line-height: 1.4;
}

.favBatchBtnText {
  font-size: 22rpx;
  font-weight: 700;
}

/* 双列 Mod 卡片网格 (对标图 2) */
.modsGrid {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 24rpx 0;
}

.modCard {
  width: 48.2%;
  background-color: #1f2125;
  border: 1rpx solid #2d3139;
  border-radius: 12rpx;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.4);
}

.modCoverBox {
  position: relative;
  width: 100%;
  height: 200rpx;
  background-color: #121212;
}

.modCoverImg {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.modGameBadge {
  position: absolute;
  top: 10rpx;
  left: 10rpx;
  background: rgba(18, 18, 18, 0.85);
  border: 1rpx solid rgba(255, 255, 255, 0.15);
  border-radius: 6rpx;
  padding: 2rpx 10rpx;
  max-width: 65%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.modGameBadgeText {
  font-size: 18rpx;
  font-weight: 700;
  color: #da6b17;
  white-space: nowrap;
}

.modActionBtn {
  position: absolute;
  top: 10rpx;
  right: 10rpx;
  width: 44rpx;
  height: 44rpx;
  border-radius: 50%;
  background: rgba(18, 18, 18, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
}

.actionDotText {
  font-size: 22rpx;
  color: #ffffff;
}

.modBody {
  padding: 16rpx;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.modTitleText {
  font-size: 26rpx;
  font-weight: 700;
  color: #ffffff;
  line-height: 1.35;
  height: 70rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.modAuthorRow {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-top: 8rpx;
}

.authorGlyph {
  font-size: 20rpx;
}

.authorNameText {
  font-size: 22rpx;
  font-weight: 600;
  color: #d4a373; /* Nexus 暖金色 */
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.modCategoryText {
  font-size: 20rpx;
  color: #8c9099;
  margin-top: 6rpx;
}

.modTimeRow {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
  margin-top: 8rpx;
}

.timeCol {
  display: flex;
  align-items: center;
  gap: 6rpx;
}

.timeIcon {
  font-size: 18rpx;
  color: #6b7280;
}

.timeVal {
  font-size: 18rpx;
  color: #6b7280;
}

.modSummaryText {
  font-size: 20rpx;
  color: #9ca3af;
  line-height: 1.3;
  height: 52rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  margin-top: 10rpx;
}

.modFooterRow {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1rpx solid #2a2e37;
  padding-top: 14rpx;
  margin-top: 14rpx;
}

.modStatsLeft {
  display: flex;
  align-items: center;
  gap: 14rpx;
}

.footerMetric {
  font-size: 20rpx;
  color: #9ca3af;
}

.nexusPushBtn {
  background-color: #da6b17;
  border-radius: 8rpx;
  padding: 6rpx 16rpx;
  line-height: 1.4;
  margin: 0;
  border: none;
}

.nexusPushBtnText {
  font-size: 20rpx;
  font-weight: 700;
  color: #ffffff;
}

/* 加载与空结果 */
.loadingBox {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80rpx 0;
  gap: 16rpx;
}

.loadingSpinner {
  width: 50rpx;
  height: 50rpx;
  border: 4rpx solid rgba(218, 107, 23, 0.2);
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

.emptyBox {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80rpx 0;
  gap: 16rpx;
}

.emptyIcon {
  font-size: 56rpx;
}

.emptyText {
  font-size: 24rpx;
  color: #9ca3af;
}

.retryBtn {
  background-color: #da6b17;
  color: #ffffff;
  border-radius: 8rpx;
  font-size: 22rpx;
  padding: 8rpx 24rpx;
  margin-top: 10rpx;
}

.bottomNotice {
  text-align: center;
  padding: 30rpx 0;
}

.bottomText {
  font-size: 22rpx;
  color: #6b7280;
}

/* ---------------------------------------------------------------------------- */
/* 区域 4：侧边滑出抽屉 (☰) */
/* ---------------------------------------------------------------------------- */
.drawerMask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  z-index: 999;
}

.drawerBody {
  width: 580rpx;
  height: 100%;
  background-color: #181a1e;
  border-right: 1rpx solid #2c2f38;
  padding: 40rpx 30rpx;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.drawerHeaderRow {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 24rpx;
  border-bottom: 1rpx solid #2c2f38;
}

.drawerBrandBox {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.drawerLogo {
  font-size: 38rpx;
  color: #da6b17;
}

.drawerBrandTitle {
  font-size: 30rpx;
  font-weight: 800;
  color: #ffffff;
}

.drawerCloseBtn {
  font-size: 32rpx;
  color: #9ca3af;
  padding: 8rpx;
  cursor: pointer;
}

.drawerPcCard {
  background-color: #121316;
  border: 1rpx solid #2c2f38;
  border-radius: 12rpx;
  padding: 20rpx;
  margin: 24rpx 0;
}

.pcCardTop {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pcCardTitle {
  font-size: 24rpx;
  font-weight: 700;
  color: #ffffff;
}

.pcStatusBadge {
  background-color: #374151;
  border-radius: 6rpx;
  padding: 2rpx 10rpx;
}

.pcStatusBadge.online {
  background-color: #065f46;
}

.pcStatusText {
  font-size: 18rpx;
  font-weight: 700;
  color: #ffffff;
}

.pcIpText {
  font-size: 20rpx;
  color: #9ca3af;
  margin-top: 8rpx;
}

.pcActionsRow {
  display: flex;
  gap: 12rpx;
  margin-top: 14rpx;
}

.pcActionBtn {
  flex: 1;
  background-color: #242832;
  border: 1rpx solid #373b43;
  border-radius: 8rpx;
  padding: 8rpx 0;
  margin: 0;
  line-height: 1.4;
}

.pcActionBtn.primary {
  background-color: #da6b17;
  border-color: #da6b17;
}

.pcActionBtn .btnText {
  font-size: 20rpx;
  color: #ffffff;
  font-weight: 600;
}

.drawerNavList {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  margin-top: 10rpx;
  flex: 1;
}

.drawerNavItem {
  display: flex;
  align-items: center;
  padding: 20rpx 16rpx;
  border-radius: 10rpx;
  background-color: #1e2127;
  gap: 16rpx;
  cursor: pointer;
}

.drawerNavItem .itemIcon {
  font-size: 28rpx;
}

.drawerNavItem .itemText {
  flex: 1;
  font-size: 24rpx;
  font-weight: 600;
  color: #e5e7eb;
}

.drawerNavItem .itemBadge {
  background-color: #da6b17;
  color: #ffffff;
  font-size: 18rpx;
  font-weight: 800;
  padding: 2rpx 10rpx;
  border-radius: 20rpx;
}

.drawerNavItem .itemSwitchTag {
  font-size: 20rpx;
  color: #9ca3af;
}

.drawerNavItem .itemSwitchTag.on {
  color: #10b981;
  font-weight: 700;
}

.drawerFooter {
  padding-top: 20rpx;
  border-top: 1rpx solid #2c2f38;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.footerVersion {
  font-size: 20rpx;
  color: #9ca3af;
}

.footerSub {
  font-size: 18rpx;
  color: #6b7280;
}

/* ---------------------------------------------------------------------------- */
/* 区域 5 & 6：设备弹窗与历史任务弹窗 */
/* ---------------------------------------------------------------------------- */
.modalOverlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.deviceModalContent,
.historyDrawerContent {
  width: 90%;
  max-width: 650rpx;
  background: #181a1e;
  border: 1rpx solid #2d3139;
  border-radius: 20rpx;
  padding: 32rpx;
  box-sizing: border-box;
}

.deviceModalHeader,
.drawerHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}

.modalTitle,
.drawerTitle {
  font-size: 30rpx;
  font-weight: 800;
  color: #ffffff;
}

.drawerSub {
  font-size: 20rpx;
  color: #9ca3af;
  margin-top: 4rpx;
}

.modalCloseBtn {
  font-size: 30rpx;
  color: #9ca3af;
  padding: 6rpx;
  cursor: pointer;
}

.scanCodeBtn {
  background: #242832;
  border: 1rpx solid #373b43;
  color: #ffffff;
  border-radius: 12rpx;
  font-size: 24rpx;
  padding: 16rpx 0;
  margin-bottom: 20rpx;
}

.scanCodeBtnText {
  color: #ffffff;
  font-weight: 600;
}

.formDividerRow {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin: 16rpx 0;
}

.dividerLine {
  flex: 1;
  height: 1rpx;
  background-color: #2c2f38;
}

.dividerText {
  font-size: 20rpx;
  color: #6b7280;
}

.formItem {
  margin-bottom: 18rpx;
}

.formLabel {
  font-size: 22rpx;
  color: #9ca3af;
  margin-bottom: 8rpx;
  display: block;
}

.formInput {
  background: #121316;
  border: 1rpx solid #2c2f38;
  border-radius: 10rpx;
  padding: 14rpx 18rpx;
  font-size: 24rpx;
  color: #ffffff;
}

.testConnBtn {
  background: #242832;
  border: 1rpx solid #373b43;
  color: #ffffff;
  border-radius: 10rpx;
  font-size: 24rpx;
  padding: 14rpx 0;
  margin-top: 14rpx;
}

.testBtnText {
  color: #ffffff;
}

.saveConfigBtn {
  background: #da6b17;
  color: #ffffff;
  border-radius: 10rpx;
  font-size: 24rpx;
  font-weight: 700;
  padding: 14rpx 0;
  margin-top: 14rpx;
}

.saveBtnText {
  color: #ffffff;
}

.historyScrollList {
  max-height: 600rpx;
}

.historyEmpty {
  text-align: center;
  padding: 60rpx 0;
}

.emptyTipIcon {
  font-size: 48rpx;
}

.emptyTipText {
  font-size: 22rpx;
  color: #9ca3af;
  margin-top: 8rpx;
  display: block;
}

.historyItem {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 16rpx 0;
  border-bottom: 1rpx solid #252830;
}

.historyThumb {
  width: 90rpx;
  height: 90rpx;
  border-radius: 8rpx;
  object-fit: cover;
  background-color: #121212;
}

.historyBody {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.historyTitle {
  font-size: 24rpx;
  font-weight: 700;
  color: #ffffff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.historyMeta {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.historyGame,
.historyChannelTag,
.historyTime {
  font-size: 18rpx;
  color: #9ca3af;
}

.rePushBtn {
  background: #da6b17;
  color: #ffffff;
  border-radius: 6rpx;
  padding: 6rpx 16rpx;
  margin: 0;
  line-height: 1.4;
  border: none;
}

.rePushText {
  font-size: 20rpx;
  font-weight: 700;
  color: #ffffff;
}

.clearHistoryText {
  font-size: 22rpx;
  color: #ef4444;
  margin-right: 16rpx;
  cursor: pointer;
}
</style>
