<template>
  <view class="pageContainer">
    <!-- ==================================================================== -->
    <!-- 区域 1：顶部状态导航栏与电脑配对状态 -->
    <!-- ==================================================================== -->
    <view class="headerNav">
      <view class="brandArea">
        <text class="brandLogo">MAYFLY</text>
        <text class="brandSub">MODS</text>
        <text class="sourceTag">NexusMods</text>
      </view>
      <view class="headerRightActions">
        <!-- 推送任务清单入口 -->
        <view class="historyBadge" @click="openHistoryModal">
          <text class="historyBadgeIcon">📋</text>
          <view class="historyCountDot" v-if="historyList.length > 0">
            <text class="historyCountText">{{ historyList.length }}</text>
          </view>
        </view>
        <!-- 中文图鉴切换按钮 -->
        <view
          class="zhToggleBadge"
          :class="{ active: enableAutoTranslate }"
          @click="toggleAutoTranslate"
        >
          <text class="zhToggleText">{{ enableAutoTranslate ? '🌐 译 中文' : '🌐 原 英文' }}</text>
        </view>
        <!-- 电脑连接状态胶囊 -->
        <view class="deviceBadge" @click="openDeviceModal">
          <view class="statusDot" :class="{ connected: desktopConfig.connected }"></view>
          <text class="statusText">{{ desktopConfig.connected ? '电脑已连' : '配对电脑' }}</text>
        </view>
      </view>
    </view>

    <!-- ==================================================================== -->
    <!-- 区域 2：搜索栏与排序过滤栏 -->
    <!-- ==================================================================== -->
    <view class="controlSection">
      <!-- 搜索输入框 -->
      <view class="searchBar">
        <text class="searchIcon">🔍</text>
        <input
          class="searchInput"
          v-model="searchText"
          placeholder="搜索 N网 任意 Mod 或游戏..."
          placeholder-class="searchPlaceholder"
          confirm-type="search"
          @confirm="onSearchConfirm"
        />
        <text v-if="searchText" class="clearIcon" @click="clearSearch">✕</text>
      </view>

      <!-- 快捷类型标签胶囊栏 (横向滚动) -->
      <scroll-view class="categoryScroll" scroll-x show-scrollbar="false">
        <view class="categoryCapsuleList">
          <view
            class="categoryCapsule"
            v-for="(cat, idx) in quickCategories"
            :key="idx"
            :class="{ active: selectedCategoryIndex === idx }"
            @click="selectQuickCategory(idx)"
          >
            <text class="categoryCapsuleText">{{ cat.label }}</text>
          </view>
        </view>
      </scroll-view>

      <!-- 排序切换胶囊 -->
      <view class="sortBar">
        <view
          class="sortItem"
          :class="{ active: currentSort === 'downloads' }"
          @click="changeSort('downloads')"
        >
          <text class="sortLabel">🔥 下载最多</text>
        </view>
        <view
          class="sortItem"
          :class="{ active: currentSort === 'updatedAt' }"
          @click="changeSort('updatedAt')"
        >
          <text class="sortLabel">⚡ 最近更新</text>
        </view>
        <view
          class="sortItem"
          :class="{ active: currentSort === 'createdAt' }"
          @click="changeSort('createdAt')"
        >
          <text class="sortLabel">🆕 最新发布</text>
        </view>
        <view
          class="sortItem"
          :class="{ active: currentSort === 'favorites' }"
          @click="changeSort('favorites')"
        >
          <text class="sortLabel">❤️ 心愿单{{ favoritesCount > 0 ? ` (${favoritesCount})` : '' }}</text>
        </view>
      </view>
    </view>

    <!-- ==================================================================== -->
    <!-- 区域 3：双列大图瀑布流卡片列表 (N网有啥显示啥) -->
    <!-- ==================================================================== -->
    <view class="modsWaterfallSection">
      <!-- 心愿单模式下的批量操作工具条 -->
      <view class="favBatchBar" v-if="currentSort === 'favorites' && favoritesList.length > 0">
        <view class="favSummaryText">
          <text class="favCountNum">❤️ 已收藏 {{ favoritesList.length }} 个模组</text>
          <text class="favTipText">点此一键将所有心仪 Mod 推送到电脑</text>
        </view>
        <button
          class="favBatchPushBtn"
          :disabled="isBatchPushing"
          @click="batchPushFavorites"
        >
          <text class="favBatchBtnText">
            {{ isBatchPushing ? '批量投递中...' : `🚀 全部推送到电脑 (${favoritesList.length})` }}
          </text>
        </button>
      </view>

      <!-- 列表内容区 -->
      <view class="waterfallGrid" v-if="displayModList.length > 0">
        <view
          class="modCard"
          v-for="item in displayModList"
          :key="item.id"
          @click="openDetail(item)"
        >
          <!-- 封面大图与游戏角标 -->
          <view class="cardCoverWrapper">
            <image
              class="cardCover"
              :src="item.coverImageUrl || '/static/logo.png'"
              mode="aspectFill"
              lazy-load
            />
            <view class="gameTag">
              <text class="gameTagText">{{ item.game.name }}</text>
            </view>
            <!-- 收藏小红心按钮 -->
            <view class="favTagBtn" @click.stop="toggleCardFavorite(item)">
              <text class="favIcon">{{ favoriteIdMap[item.id] ? '❤️' : '🤍' }}</text>
            </view>
            <!-- 已推送到电脑标识 -->
            <view class="pushedTag" v-if="pushedIdMap[item.id]">
              <text class="pushedTagText">✓ 已推</text>
            </view>
          </view>

          <!-- 卡片信息主体 -->
          <view class="cardBody">
            <text class="modTitle">
              {{ enableAutoTranslate && zhTitleMap[item.id] ? zhTitleMap[item.id] : item.title }}
            </text>
            <text class="modSummary">{{ item.summary }}</text>

            <view class="modMetaRow">
              <text class="modAuthor">👤 {{ item.author }}</text>
              <text class="modDownloads">📥 {{ formatCount(item.downloads) }}</text>
            </view>

            <!-- 卡片快捷安装推送按钮 -->
            <button
              class="quickPushBtn"
              :disabled="pushingModId === item.id"
              @click.stop="quickPushToDesktop(item)"
            >
              <text class="pushBtnText">
                {{ pushingModId === item.id ? '推送中...' : '🚀 推送到电脑' }}
              </text>
            </button>
          </view>
        </view>
      </view>

      <!-- 加载中状态 -->
      <view class="loadingBox" v-if="loading && modList.length === 0">
        <view class="loadingSpinner"></view>
        <text class="loadingText">正在从 N网 检索全库模组...</text>
      </view>

      <!-- 空结果提示 -->
      <view class="emptyBox" v-if="!loading && modList.length === 0">
        <text class="emptyIcon">📭</text>
        <text class="emptyText">未找到相关 N网 模组</text>
        <button class="retryBtn" @click="resetAndLoad">刷新重试</button>
      </view>

      <!-- 触底提示 -->
      <view class="bottomNotice" v-if="modList.length > 0">
        <text class="bottomText" v-if="loadingMore">正在加载更多 Mod...</text>
        <text class="bottomText" v-else-if="!hasMore">已加载全部 N网 热门模组</text>
      </view>
    </view>

    <!-- ==================================================================== -->
    <!-- 区域 4：模组详细图鉴与远程安装弹窗 -->
    <!-- ==================================================================== -->
    <view class="modalOverlay" v-if="detailVisible" @click="closeDetail">
      <view class="detailModalContent" @click.stop>
        <!-- 弹窗关闭按钮 -->
        <view class="modalCloseBtn" @click="closeDetail">✕</view>

        <!-- 模组全景封面 -->
        <image
          class="detailHeroCover"
          :src="selectedMod?.coverImageUrl || '/static/logo.png'"
          mode="aspectFill"
        />

        <scroll-view scroll-y class="detailScrollBody">
          <!-- 游戏与分类胶囊 -->
          <view class="detailTagRow">
            <view class="detailGameBadge">
              <text class="detailGameName">🎮 {{ selectedMod?.game.name }}</text>
            </view>
            <text class="detailCategoryBadge">🏷️ {{ selectedMod?.category }}</text>
          </view>

          <!-- 标题与版本 -->
          <text class="detailTitle">{{ selectedMod?.title }}</text>

          <view class="detailMetaBar">
            <text class="detailAuthor">作者：{{ selectedMod?.author }}</text>
            <text class="detailVersion">版本：v{{ selectedMod?.version }}</text>
            <text class="detailDownloads">下载：{{ formatCount(selectedMod?.downloads) }}</text>
          </view>

          <!-- 模组介绍 -->
          <view class="detailDescSection">
            <text class="detailDescTitle">📝 模组简介说明</text>
            <text class="detailDescText">{{ selectedMod?.summary }}</text>
          </view>

          <!-- 原出处直达链接 -->
          <view class="websiteLinkRow" v-if="selectedMod?.website" @click="copyWebsite">
            <text class="websiteLabel">🔗 NexusMods 原帖链接 (点击复制)</text>
          </view>
        </scroll-view>

        <!-- 底部固定大按钮：一键推送到电脑 -->
        <view class="detailFooter">
          <button
            class="detailPushBigBtn"
            :disabled="pushingModId === selectedMod?.id"
            @click="quickPushToDesktop(selectedMod)"
          >
            <text class="bigBtnText">
              {{ pushingModId === selectedMod?.id ? '正在推送到电脑...' : '🚀 一键推送到电脑 Mayfly 安装' }}
            </text>
          </button>
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
              placeholder="默认 9876"
            />
          </view>

          <view class="formItem">
            <text class="formLabel">设备配对 Token</text>
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
            <text class="emptyTipText">暂无推送记录，去挑选心仪的 Mod 吧！</text>
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
// 脚本逻辑：首页数据流控制与交互
// ============================================================================
import {
  fetchNexusMods,
  pushModToDesktop,
  getDesktopConfig,
  saveDesktopConfig,
  testDesktopConnection
} from '../../services/nexus.js';
import { batchTranslateToZh } from '../../services/translate.js';
import { getPushHistory, clearPushHistory } from '../../services/history.js';
import { getFavorites, toggleFavorite } from '../../services/favorites.js';

export default {
  data() {
    return {
      // 模组列表状态
      modList: [],
      page: 1,
      pageSize: 20,
      totalCount: 0,
      hasMore: true,
      loading: false,
      loadingMore: false,

      // 智能翻译与双语图鉴
      enableAutoTranslate: false,
      zhTitleMap: {},

      // 心愿单收藏
      favoritesList: [],
      favoriteIdMap: {},

      // 搜索与排序
      searchText: '',
      currentSort: 'downloads', // 'downloads' | 'updatedAt' | 'createdAt' | 'favorites'

      // 快捷类型胶囊标签
      selectedCategoryIndex: 0,
      quickCategories: [
        { label: '🌟 全部', query: '' },
        { label: '👗 角色外观', query: 'outfit' },
        { label: '⚔️ 武器装备', query: 'weapon' },
        { label: '🎨 画质光影', query: 'reshade' },
        { label: '⚙️ 玩法增强', query: 'gameplay' },
        { label: '🖥️ UI界面', query: 'interface' },
        { label: '🏃 动作动画', query: 'animation' },
        { label: '🗺️ 地图扩展', query: 'location' },
        { label: '🛠️ 修复优化', query: 'patch' }
      ],

      // 详情弹窗
      detailVisible: false,
      selectedMod: null,
      pushingModId: null,

      // 推送历史与任务清单
      historyModalVisible: false,
      historyList: [],
      pushedIdMap: {},

      // 批量推送与剪贴板接力状态
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
    }
  },

  onLoad() {
    this.initDesktopConfig();
    this.refreshHistory();
    this.refreshFavorites();
    this.loadMods();
  },

  onShow() {
    this.refreshHistory();
    this.refreshFavorites();
    this.checkClipboardModShare();
  },

  onPullDownRefresh() {
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
    if (this.hasMore && !this.loading && !this.loadingMore) {
      this.loadMoreMods();
    }
  },

  methods: {
    // ------------------------------------------------------------------------
    // 数据拉取与列表生命周期
    // ------------------------------------------------------------------------

    /**
     * 计算当前生效的综合检索关键词 (整合手动搜索词与快捷分类标签)
     */
    effectiveSearchText() {
      const manual = (this.searchText || '').trim();
      const cat = this.quickCategories[this.selectedCategoryIndex];
      const catQuery = cat && cat.query ? cat.query.trim() : '';

      if (manual && catQuery) {
        return `${manual} ${catQuery}`;
      }
      return manual || catQuery;
    },

    /**
     * 选中快捷类型胶囊标签
     */
    selectQuickCategory(index) {
      if (this.selectedCategoryIndex === index) return;
      this.selectedCategoryIndex = index;
      if (this.currentSort === 'favorites') {
        this.currentSort = 'downloads';
      }
      this.resetAndLoad();
    },

    /**
     * 加载第一页 Nexus 模组列表
     */
    async loadMods() {
      if (this.loading) return;
      this.loading = true;
      this.page = 1;

      try {
        const result = await fetchNexusMods({
          page: 1,
          pageSize: this.pageSize,
          sort: this.currentSort,
          searchText: this.effectiveSearchText()
        });

        this.modList = result.items;
        this.totalCount = result.totalCount;
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
          sort: this.currentSort,
          searchText: this.effectiveSearchText()
        });

        this.modList = [...this.modList, ...result.items];
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

    // ------------------------------------------------------------------------
    // 筛选与排序交互
    // ------------------------------------------------------------------------

    /**
     * 切换排序维度或进入心愿单模式
     */
    changeSort(sortType) {
      if (this.currentSort === sortType) return;
      this.currentSort = sortType;
      if (sortType === 'favorites') {
        this.refreshFavorites();
      } else {
        this.resetAndLoad();
      }
    },

    /**
     * 同步刷新本地心愿单缓存
     */
    refreshFavorites() {
      const list = getFavorites();
      this.favoritesList = list;
      const map = {};
      list.forEach((item) => {
        map[item.id] = true;
        if (item.modId) map[item.modId] = true;
      });
      this.favoriteIdMap = map;
    },

    /**
     * 点击卡片红心切换收藏状态
     */
    toggleCardFavorite(item) {
      const nextStatus = toggleFavorite(item);
      this.refreshFavorites();
      uni.showToast({
        title: nextStatus ? '已加入心愿单 ❤️' : '已移出心愿单',
        icon: 'none'
      });
    },

    /**
     * 一键将心愿单里的全部模组批量推送到电脑端 Mayfly
     */
    async batchPushFavorites() {
      if (this.isBatchPushing || this.favoritesList.length === 0) return;

      uni.showModal({
        title: '确认批量推送 🚀',
        content: `确定要将心愿单中的全部 ${this.favoritesList.length} 个模组投递到电脑端 Mayfly 自动下载并安装吗？`,
        confirmText: '开始推送',
        success: async (res) => {
          if (!res.confirm) return;

          this.isBatchPushing = true;
          const total = this.favoritesList.length;
          let successCount = 0;

          uni.showLoading({
            title: `正在推送 (1/${total})...`
          });

          for (let i = 0; i < total; i++) {
            const item = this.favoritesList[i];
            uni.showLoading({
              title: `正在推送 (${i + 1}/${total})...`
            });

            try {
              const pushRes = await pushModToDesktop(item, this.desktopConfig);
              if (pushRes && pushRes.success) {
                successCount++;
              }
            } catch (e) {
              console.warn('[MayflyBatch] 单项推送异常:', e);
            }

            // 错开 120ms 避免网络瞬间并发拥堵
            if (i < total - 1) {
              await new Promise((r) => setTimeout(r, 120));
            }
          }

          uni.hideLoading();
          this.isBatchPushing = false;
          this.refreshHistory();

          uni.showModal({
            title: '批量推送完毕 🎉',
            content: `已成功将 ${successCount}/${total} 个模组投递给电脑端 Mayfly！家里的电脑已在后台启动下载并原生安装。`,
            showCancel: false
          });
        }
      });
    },

    /**
     * 自动探测剪贴板中的 N网 链接或好友分享口令
     */
    checkClipboardModShare() {
      uni.getClipboardData({
        success: (res) => {
          const text = String(res.data || '').trim();
          if (!text || text === this.lastHandledClipboard) return;

          // 匹配 NexusMods 模组链接：https://www.nexusmods.com/{domain}/mods/{id}
          const nexusMatch = text.match(/nexusmods\.com\/([a-zA-Z0-9_\-]+)\/mods\/(\d+)/i);
          if (nexusMatch) {
            this.lastHandledClipboard = text;
            const domainName = nexusMatch[1];
            const modId = nexusMatch[2];

            uni.showModal({
              title: '发现分享模组 🎁',
              content: `检测到剪贴板中的 N网 模组链接 (ID: ${modId})，是否立即查看中文图鉴与远程安装？`,
              confirmText: '立即查看',
              cancelText: '忽略',
              success: (modalRes) => {
                if (modalRes.confirm) {
                  this.openDetail({
                    id: modId,
                    modId,
                    title: `Nexus 模组 #${modId}`,
                    summary: '正在拉取详情中...',
                    coverImageUrl: '',
                    game: {
                      name: domainName,
                      domainName
                    },
                    website: `https://www.nexusmods.com/${domainName}/mods/${modId}`
                  });
                }
              }
            });
          }
        }
      });
    },

    /**
     * 搜索确认触发
     */
    onSearchConfirm() {
      this.resetAndLoad();
    },

    /**
     * 清除搜索关键字
     */
    clearSearch() {
      this.searchText = '';
      this.resetAndLoad();
    },

    // ------------------------------------------------------------------------
    // 详情交互与远程推送
    // ------------------------------------------------------------------------

    /**
     * 打开 Mod 详情页 (优先页面路由跳转，失败则回退为弹窗)
     */
    openDetail(item) {
      this.selectedMod = item;
      try {
        const payloadStr = encodeURIComponent(JSON.stringify(item));
        uni.navigateTo({
          url: `/pages/detail/detail?payload=${payloadStr}`,
          fail: () => {
            this.detailVisible = true;
          }
        });
      } catch (err) {
        this.detailVisible = true;
      }
    },

    /**
     * 关闭 Mod 详情模态框
     */
    closeDetail() {
      this.detailVisible = false;
      this.selectedMod = null;
    },

    /**
     * 切换中文图鉴/英文原标题模式
     */
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
          title: '已切换为英文原标题',
          icon: 'none'
        });
      }
    },

    /**
     * 批量翻译当前列表的 Mod 标题
     */
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
        console.warn('[MayflyIndex] 标题批量翻译异常:', e);
      }
    },

    /**
     * 扫一扫屏幕二维码自动配对电脑
     */
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

    /**
     * 解析二维码数据并自动填入表单测试连接
     */
    async parseAndApplyPairCode(rawText) {
      try {
        let host = '';
        let port = 9876;
        let token = '';

        if (rawText.startsWith('mayfly://pair')) {
          // 协议格式：mayfly://pair?host=192.168.1.100&port=9876&token=MF-PC-8891
          const query = rawText.split('?')[1] || '';
          const params = new URLSearchParams(query);
          host = params.get('host') || '';
          port = Number(params.get('port')) || 9876;
          token = params.get('token') || '';
        } else if (rawText.startsWith('{') && rawText.endsWith('}')) {
          // JSON 格式
          const parsed = JSON.parse(rawText);
          host = parsed.host || '';
          port = Number(parsed.port) || 9876;
          token = parsed.deviceToken || parsed.token || '';
        } else if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?$/.test(rawText.trim())) {
          // 纯 IP 格式
          const parts = rawText.trim().split(':');
          host = parts[0];
          if (parts[1]) port = Number(parts[1]) || 9876;
        }

        if (host) {
          this.deviceForm.host = host;
          this.deviceForm.port = port;
          if (token) this.deviceForm.deviceToken = token;

          uni.showToast({
            title: '二维码解析成功，正在连接...',
            icon: 'none'
          });
          await this.runTestConnection();
        } else {
          uni.showToast({
            title: '未识别出有效的 Mayfly 配对码',
            icon: 'none'
          });
        }
      } catch (e) {
        uni.showToast({
          title: '配对码解析失败',
          icon: 'none'
        });
      }
    },

    /**
     * 快捷推送到电脑安装
     */
    async quickPushToDesktop(modItem) {
      if (!modItem || this.pushingModId) return;
      this.pushingModId = modItem.id;

      uni.showLoading({
        title: '正在推送信令...'
      });

      try {
        const result = await pushModToDesktop(modItem, this.desktopConfig);
        uni.hideLoading();

        if (result.success) {
          this.refreshHistory();
          uni.showModal({
            title: '推送成功 🚀',
            content: result.message,
            showCancel: false
          });
        } else {
          uni.showModal({
            title: '推送未完成',
            content: result.message,
            confirmText: '去设置电脑',
            success: (res) => {
              if (res.confirm) {
                this.openDeviceModal();
              }
            }
          });
        }
      } catch (err) {
        uni.hideLoading();
        uni.showToast({
          title: '推送异常，请重试',
          icon: 'none'
        });
      } finally {
        this.pushingModId = null;
      }
    },

    // ------------------------------------------------------------------------
    // 推送任务清单与历史记录
    // ------------------------------------------------------------------------

    /**
     * 刷新本地推送历史与标记索引
     */
    refreshHistory() {
      const list = getPushHistory();
      this.historyList = list;
      const map = {};
      list.forEach((item) => {
        map[item.id] = true;
        if (item.modId) map[item.modId] = true;
      });
      this.pushedIdMap = map;
    },

    /**
     * 打开推送任务清单抽屉
     */
    openHistoryModal() {
      this.refreshHistory();
      this.historyModalVisible = true;
    },

    /**
     * 关闭推送任务清单抽屉
     */
    closeHistoryModal() {
      this.historyModalVisible = false;
    },

    /**
     * 清空历史记录
     */
    handleClearHistory() {
      uni.showModal({
        title: '确认清空',
        content: '确定要清空全部推送历史清单吗？',
        success: (res) => {
          if (res.confirm) {
            clearPushHistory();
            this.refreshHistory();
            uni.showToast({
              title: '历史已清空',
              icon: 'success'
            });
          }
        }
      });
    },

    /**
     * 重新推送历史中的模组
     */
    async rePushItem(item) {
      await this.quickPushToDesktop({
        id: item.id,
        modId: item.modId,
        title: item.title,
        coverImageUrl: item.coverImageUrl,
        game: {
          name: item.gameName,
          domainName: item.gameDomain
        }
      });
    },

    /**
     * 格式化历史时间显示
     */
    formatHistoryTime(ts) {
      if (!ts) return '';
      const date = new Date(ts);
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    },

    /**
     * 复制 N网 原帖链接
     */
    copyWebsite() {
      if (!this.selectedMod?.website) return;
      uni.setClipboardData({
        data: this.selectedMod.website,
        success: () => {
          uni.showToast({
            title: '链接已复制到剪贴板',
            icon: 'success'
          });
        }
      });
    },

    // ------------------------------------------------------------------------
    // 电脑端配对与连通性控制
    // ------------------------------------------------------------------------

    /**
     * 初始化电脑端连接配置
     */
    initDesktopConfig() {
      this.desktopConfig = getDesktopConfig();
      this.deviceForm = {
        host: this.desktopConfig.host,
        port: this.desktopConfig.port,
        deviceToken: this.desktopConfig.deviceToken
      };
    },

    /**
     * 打开电脑配对弹窗
     */
    openDeviceModal() {
      this.deviceForm = {
        host: this.desktopConfig.host,
        port: this.desktopConfig.port,
        deviceToken: this.desktopConfig.deviceToken
      };
      this.deviceModalVisible = true;
    },

    /**
     * 关闭电脑配对弹窗
     */
    closeDeviceModal() {
      this.deviceModalVisible = false;
    },

    /**
     * 测试电脑端连通性
     */
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
          content: '请确认电脑端 Mayfly 是否已启动且开启了远程伴侣监听，并确保手机与电脑连接同一 WiFi。',
          showCancel: false
        });
        this.desktopConfig.connected = false;
      }
    },

    /**
     * 保存设备配置
     */
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

    // ------------------------------------------------------------------------
    // 工具辅助方法
    // ------------------------------------------------------------------------

    /**
     * 格式化数量展示
     */
    formatCount(num) {
      const val = Number(num) || 0;
      if (val >= 1000000) {
        return (val / 1000000).toFixed(1) + 'M';
      }
      if (val >= 1000) {
        return (val / 1000).toFixed(1) + 'k';
      }
      return String(val);
    }
  }
};
</script>

<style scoped>
/* ============================================================================ */
/* 样式体系：现代暗黑电竞科技风 (Mayfly Cyber Dark) */
/* ============================================================================ */

.pageContainer {
  min-height: 100vh;
  background-color: #0f1117;
  color: #e5e7eb;
  padding: 24rpx 20rpx 40rpx;
  box-sizing: border-box;
}

/* 区域 1：头部品牌与状态栏 */
.headerNav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
  padding: 8rpx 6rpx;
}

.brandArea {
  display: flex;
  align-items: baseline;
  gap: 10rpx;
}

.brandLogo {
  font-size: 40rpx;
  font-weight: 900;
  letter-spacing: 2rpx;
  background: linear-gradient(135deg, #38bdf8, #818cf8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.brandSub {
  font-size: 26rpx;
  font-weight: 700;
  color: #94a3b8;
}

.sourceTag {
  font-size: 20rpx;
  background-color: rgba(245, 158, 11, 0.15);
  color: #fbbf24;
  padding: 4rpx 14rpx;
  border-radius: 12rpx;
  font-weight: 600;
  margin-left: 8rpx;
}

.headerRightActions {
  display: flex;
  align-items: center;
  gap: 14rpx;
}

.zhToggleBadge {
  background-color: #1e293b;
  border: 1rpx solid #334155;
  padding: 10rpx 18rpx;
  border-radius: 30rpx;
  transition: all 0.2s;
}

.zhToggleBadge.active {
  background: linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(129, 140, 248, 0.25));
  border-color: #38bdf8;
}

.zhToggleText {
  font-size: 20rpx;
  font-weight: 700;
  color: #94a3b8;
}

.zhToggleBadge.active .zhToggleText {
  color: #38bdf8;
}

.deviceBadge {
  display: flex;
  align-items: center;
  background-color: #1e293b;
  padding: 10rpx 20rpx;
  border-radius: 30rpx;
  border: 1rpx solid #334155;
}

.statusDot {
  width: 14rpx;
  height: 14rpx;
  border-radius: 50%;
  background-color: #94a3b8;
  margin-right: 12rpx;
}

.statusDot.connected {
  background-color: #10b981;
  box-shadow: 0 0 10rpx #10b981;
}

.statusText {
  font-size: 22rpx;
  color: #cbd5e1;
}

/* 区域 2：搜索与排序 */
.controlSection {
  margin-bottom: 24rpx;
}

.searchBar {
  display: flex;
  align-items: center;
  background-color: #1a2234;
  border: 1rpx solid #2e3a52;
  border-radius: 20rpx;
  padding: 14rpx 20rpx;
  margin-bottom: 18rpx;
}

.searchIcon {
  font-size: 28rpx;
  margin-right: 12rpx;
}

.searchInput {
  flex: 1;
  font-size: 26rpx;
  color: #f8fafc;
}

.searchPlaceholder {
  color: #64748b;
  font-size: 24rpx;
}

.clearIcon {
  font-size: 26rpx;
  color: #94a3b8;
  padding: 6rpx;
}

/* 快捷类型标签胶囊滚动栏 */
.categoryScroll {
  width: 100%;
  white-space: nowrap;
  margin-bottom: 18rpx;
}

.categoryCapsuleList {
  display: inline-flex;
  gap: 14rpx;
  padding: 4rpx 2rpx;
}

.categoryCapsule {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background-color: #162133;
  border: 1rpx solid #23334d;
  border-radius: 24rpx;
  padding: 8rpx 22rpx;
  transition: all 0.2s ease;
}

.categoryCapsule.active {
  background: linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(129, 140, 248, 0.25));
  border-color: #38bdf8;
  box-shadow: 0 0 12rpx rgba(56, 189, 248, 0.25);
}

.categoryCapsuleText {
  font-size: 22rpx;
  color: #94a3b8;
  font-weight: 600;
}

.categoryCapsule.active .categoryCapsuleText {
  color: #38bdf8;
  font-weight: 700;
}

.sortBar {
  display: flex;
  gap: 16rpx;
}

.sortItem {
  flex: 1;
  text-align: center;
  padding: 14rpx 0;
  background-color: #1e293b;
  border-radius: 16rpx;
  border: 1rpx solid #334155;
  transition: all 0.2s;
}

.sortItem.active {
  background: linear-gradient(135deg, rgba(56, 189, 248, 0.15), rgba(129, 140, 248, 0.2));
  border-color: #38bdf8;
}

.sortLabel {
  font-size: 24rpx;
  font-weight: 600;
  color: #94a3b8;
}

.sortItem.active .sortLabel {
  color: #38bdf8;
}

/* 区域 3：双列大图瀑布流 */
.modsWaterfallSection {
  width: 100%;
}

/* 心愿单批量推送工具条 */
.favBatchBar {
  background: linear-gradient(135deg, rgba(2, 132, 199, 0.15), rgba(99, 102, 241, 0.2));
  border: 1rpx solid rgba(56, 189, 248, 0.4);
  border-radius: 20rpx;
  padding: 18rpx 20rpx;
  margin-bottom: 22rpx;
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
  color: #38bdf8;
}

.favTipText {
  font-size: 20rpx;
  color: #94a3b8;
  margin-top: 4rpx;
}

.favBatchPushBtn {
  background: linear-gradient(135deg, #0284c7, #6366f1);
  color: #ffffff;
  border-radius: 16rpx;
  border: none;
  padding: 12rpx 24rpx;
  line-height: 1.4;
  margin: 0;
}

.favBatchBtnText {
  font-size: 22rpx;
  font-weight: 700;
}

.waterfallGrid {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
}

.modCard {
  width: 48.5%;
  background-color: #182030;
  border: 1rpx solid #28354d;
  border-radius: 20rpx;
  overflow: hidden;
  margin-bottom: 22rpx;
  display: flex;
  flex-direction: column;
}

.cardCoverWrapper {
  position: relative;
  width: 100%;
  height: 240rpx;
  background-color: #0d131f;
}

.cardCover {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.gameTag {
  position: absolute;
  top: 12rpx;
  left: 12rpx;
  background: rgba(15, 23, 42, 0.85);
  backdrop-filter: blur(8px);
  padding: 4rpx 14rpx;
  border-radius: 10rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.15);
  max-width: 80%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.gameTagText {
  font-size: 20rpx;
  color: #38bdf8;
  font-weight: 600;
}

.favTagBtn {
  position: absolute;
  top: 10rpx;
  right: 10rpx;
  background: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(6px);
  width: 44rpx;
  height: 44rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1rpx solid rgba(255, 255, 255, 0.15);
  z-index: 5;
}

.favIcon {
  font-size: 20rpx;
}

.cardBody {
  padding: 16rpx 14rpx;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.modTitle {
  font-size: 26rpx;
  font-weight: 700;
  color: #f1f5f9;
  line-height: 1.35;
  margin-bottom: 8rpx;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  height: 70rpx;
}

.modSummary {
  font-size: 22rpx;
  color: #94a3b8;
  line-height: 1.3;
  margin-bottom: 14rpx;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  height: 58rpx;
}

.modMetaRow {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 20rpx;
  color: #64748b;
  margin-bottom: 14rpx;
}

.modAuthor {
  max-width: 60%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.quickPushBtn {
  background: linear-gradient(135deg, #0284c7, #4f46e5);
  color: #ffffff;
  border: none;
  border-radius: 14rpx;
  padding: 10rpx 0;
  line-height: 1.4;
  margin-top: auto;
}

.pushBtnText {
  font-size: 22rpx;
  font-weight: 600;
}

/* 加载与空提示 */
.loadingBox, .emptyBox {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80rpx 0;
}

.loadingSpinner {
  width: 50rpx;
  height: 50rpx;
  border: 4rpx solid #334155;
  border-top-color: #38bdf8;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 20rpx;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loadingText, .emptyText, .bottomText {
  font-size: 24rpx;
  color: #64748b;
}

.emptyIcon {
  font-size: 70rpx;
  margin-bottom: 16rpx;
}

.retryBtn {
  margin-top: 24rpx;
  background-color: #1e293b;
  color: #38bdf8;
  font-size: 24rpx;
  border-radius: 20rpx;
  padding: 10rpx 36rpx;
  border: 1rpx solid #334155;
}

.bottomNotice {
  text-align: center;
  padding: 30rpx 0 10rpx;
}

/* 区域 4：详情弹窗 */
.modalOverlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(6px);
  z-index: 999;
  display: flex;
  align-items: flex-end;
}

.detailModalContent {
  width: 100%;
  max-height: 86vh;
  background-color: #131b2a;
  border-top-left-radius: 36rpx;
  border-top-right-radius: 36rpx;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  box-shadow: 0 -10rpx 40rpx rgba(0, 0, 0, 0.6);
}

.modalCloseBtn {
  position: absolute;
  top: 20rpx;
  right: 24rpx;
  background: rgba(15, 23, 42, 0.7);
  color: #e2e8f0;
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  z-index: 10;
  border: 1rpx solid rgba(255, 255, 255, 0.2);
}

.detailHeroCover {
  width: 100%;
  height: 380rpx;
  background-color: #0b0f17;
}

.detailScrollBody {
  padding: 24rpx 28rpx;
  box-sizing: border-box;
  max-height: 48vh;
}

.detailTagRow {
  display: flex;
  gap: 16rpx;
  margin-bottom: 16rpx;
}

.detailGameBadge {
  background-color: rgba(56, 189, 248, 0.15);
  border: 1rpx solid rgba(56, 189, 248, 0.4);
  padding: 6rpx 18rpx;
  border-radius: 12rpx;
}

.detailGameName {
  font-size: 22rpx;
  color: #38bdf8;
  font-weight: 600;
}

.detailCategoryBadge {
  font-size: 22rpx;
  color: #94a3b8;
  background-color: #1e293b;
  padding: 6rpx 18rpx;
  border-radius: 12rpx;
}

.detailTitle {
  font-size: 34rpx;
  font-weight: 800;
  color: #ffffff;
  line-height: 1.4;
  margin-bottom: 16rpx;
  display: block;
}

.detailMetaBar {
  display: flex;
  gap: 24rpx;
  font-size: 22rpx;
  color: #94a3b8;
  margin-bottom: 24rpx;
  padding-bottom: 20rpx;
  border-bottom: 1rpx solid #243048;
}

.detailDescSection {
  margin-bottom: 24rpx;
}

.detailDescTitle {
  font-size: 26rpx;
  font-weight: 700;
  color: #cbd5e1;
  margin-bottom: 10rpx;
  display: block;
}

.detailDescText {
  font-size: 24rpx;
  color: #94a3b8;
  line-height: 1.6;
}

.websiteLinkRow {
  background-color: #1e293b;
  padding: 16rpx 20rpx;
  border-radius: 14rpx;
  margin-top: 16rpx;
  margin-bottom: 20rpx;
}

.websiteLabel {
  font-size: 22rpx;
  color: #38bdf8;
  text-decoration: underline;
}

.detailFooter {
  padding: 20rpx 28rpx 36rpx;
  background-color: #131b2a;
  border-top: 1rpx solid #243048;
}

.detailPushBigBtn {
  background: linear-gradient(135deg, #0284c7, #6366f1);
  color: #ffffff;
  border-radius: 20rpx;
  border: none;
  padding: 20rpx 0;
  line-height: 1.4;
}

.bigBtnText {
  font-size: 28rpx;
  font-weight: 700;
  letter-spacing: 1rpx;
}

/* 区域 5：设备配对设置弹窗 */
.deviceModalContent {
  width: 90%;
  margin: auto;
  background-color: #172133;
  border-radius: 28rpx;
  border: 1rpx solid #2d3b56;
  padding: 30rpx 26rpx;
  box-sizing: border-box;
}

.deviceModalHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}

.modalTitle {
  font-size: 30rpx;
  font-weight: 700;
  color: #f1f5f9;
}

.deviceForm {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.scanCodeBtn {
  background: linear-gradient(135deg, #0284c7, #38bdf8);
  border-radius: 16rpx;
  border: none;
  padding: 16rpx 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.scanCodeBtnText {
  font-size: 24rpx;
  color: #ffffff;
  font-weight: 700;
}

.formDividerRow {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin: 4rpx 0;
}

.dividerLine {
  flex: 1;
  height: 1rpx;
  background-color: #243048;
}

.dividerText {
  font-size: 20rpx;
  color: #64748b;
}

.formItem {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.formLabel {
  font-size: 22rpx;
  color: #94a3b8;
}

.formInput {
  background-color: #0f172a;
  border: 1rpx solid #334155;
  border-radius: 14rpx;
  padding: 14rpx 18rpx;
  font-size: 26rpx;
  color: #f8fafc;
}

.testConnBtn {
  background-color: #1e293b;
  border: 1rpx solid #38bdf8;
  border-radius: 16rpx;
  padding: 14rpx 0;
  margin-top: 10rpx;
}

.testBtnText {
  font-size: 24rpx;
  color: #38bdf8;
  font-weight: 600;
}

.saveConfigBtn {
  background: linear-gradient(135deg, #059669, #10b981);
  color: #ffffff;
  border-radius: 16rpx;
  border: none;
  padding: 18rpx 0;
  margin-top: 8rpx;
}

.saveBtnText {
  font-size: 26rpx;
  font-weight: 700;
}

/* 区域 6：推送任务清单与角标样式 */
.historyBadge {
  position: relative;
  background-color: #1e293b;
  border: 1rpx solid #334155;
  padding: 8rpx 14rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.historyBadgeIcon {
  font-size: 24rpx;
}

.historyCountDot {
  position: absolute;
  top: -8rpx;
  right: -8rpx;
  background-color: #ef4444;
  min-width: 28rpx;
  height: 28rpx;
  border-radius: 14rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4rpx;
  box-sizing: border-box;
}

.historyCountText {
  font-size: 18rpx;
  color: #ffffff;
  font-weight: 700;
}

.pushedTag {
  position: absolute;
  top: 12rpx;
  right: 12rpx;
  background: rgba(16, 185, 129, 0.9);
  padding: 4rpx 14rpx;
  border-radius: 10rpx;
  backdrop-filter: blur(4px);
}

.pushedTagText {
  font-size: 18rpx;
  color: #ffffff;
  font-weight: 700;
}

.historyDrawerContent {
  width: 100%;
  max-height: 80vh;
  background-color: #131b2a;
  border-top-left-radius: 36rpx;
  border-top-right-radius: 36rpx;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 -10rpx 40rpx rgba(0, 0, 0, 0.6);
  padding-bottom: 30rpx;
}

.drawerHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 28rpx 16rpx;
  border-bottom: 1rpx solid #243048;
}

.drawerTitleBox {
  display: flex;
  flex-direction: column;
}

.drawerTitle {
  font-size: 30rpx;
  font-weight: 800;
  color: #f1f5f9;
}

.drawerSub {
  font-size: 20rpx;
  color: #64748b;
  margin-top: 4rpx;
}

.drawerActions {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.clearHistoryText {
  font-size: 22rpx;
  color: #94a3b8;
}

.historyScrollList {
  max-height: 56vh;
  padding: 20rpx 28rpx;
  box-sizing: border-box;
}

.historyEmpty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80rpx 0;
}

.emptyTipIcon {
  font-size: 60rpx;
  margin-bottom: 14rpx;
}

.emptyTipText {
  font-size: 24rpx;
  color: #64748b;
}

.historyItem {
  display: flex;
  align-items: center;
  gap: 16rpx;
  background-color: #1a2334;
  border-radius: 18rpx;
  padding: 14rpx;
  margin-bottom: 16rpx;
  border: 1rpx solid #28354c;
}

.historyThumb {
  width: 100rpx;
  height: 100rpx;
  border-radius: 12rpx;
  flex-shrink: 0;
}

.historyBody {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.historyTitle {
  font-size: 24rpx;
  font-weight: 700;
  color: #f1f5f9;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 8rpx;
}

.historyMeta {
  display: flex;
  align-items: center;
  gap: 12rpx;
  font-size: 20rpx;
}

.historyGame {
  color: #38bdf8;
  max-width: 40%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.historyChannelTag {
  background-color: rgba(56, 189, 248, 0.15);
  color: #38bdf8;
  padding: 2rpx 8rpx;
  border-radius: 6rpx;
}

.historyTime {
  color: #64748b;
}

.rePushBtn {
  background-color: #243048;
  border: 1rpx solid #38bdf8;
  border-radius: 12rpx;
  padding: 8rpx 20rpx;
  line-height: 1.4;
  flex-shrink: 0;
}

.rePushText {
  font-size: 20rpx;
  color: #38bdf8;
  font-weight: 700;
}
</style>
