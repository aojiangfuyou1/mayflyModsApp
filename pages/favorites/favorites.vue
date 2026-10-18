<template>
  <!-- ======================================================================== -->
  <!-- 页面名称：装机心愿单 (Wishlist Page)                                     -->
  <!-- 功能描述：独立全屏展示与管理本地收藏的 Mod，支持批量导出与一键安装到电脑 -->
  <!-- ======================================================================== -->
  <view class="favoritesPage">
    <view class="favContainer">
      <!-- 2. 紧凑型筛选与操作控制区 (吸顶固定控制台) -->
      <view class="favControlsArea">
        <!-- 紧凑工具操作行 (游戏筛选下拉 + 排序筛选下拉 + 同步 + 多选切换) -->
        <view class="favFilterBar">
          <!-- 左侧双下拉选择器组合 (游戏专区 + 排序方式) -->
          <view class="favBarLeftSelects">
            <!-- 1. 所属游戏专区下拉筛选 (替代原本粗笨的横向胶囊) -->
            <NexusSelect
              :options="gameSelectOptions"
              :value="currentSelectedGameDomain"
              title="按游戏筛选"
              mode="dropdown"
              dropdown-width="320rpx"
              @change="onGameFilterChange"
            >
              <view class="favSortSelect gameSelect" :class="{ active: currentSelectedGameDomain !== 'all' }">
                <NexusIcon name="game" size="24rpx" :color="currentSelectedGameDomain !== 'all' ? '#da6b17' : '#94a3b8'" style="margin-right: 6rpx;" />
                <text class="favSortLabel favGameSelectLabel">{{ currentSelectedGameLabel }}</text>
                <text class="favSortArrow">⌄</text>
              </view>
            </NexusSelect>

            <!-- 中间极简细分割线 -->
            <view class="favFilterDivider"></view>

            <!-- 2. 排序维度切换 (自研暗黑风格下拉选择器) -->
            <NexusSelect
              :options="sortOptions"
              :value="sortIndex"
              title="选择排序方式"
              mode="dropdown"
              dropdown-width="260rpx"
              @change="onSortChange"
            >
              <view class="favSortSelect sortSelect" :class="{ active: sortIndex !== 0 }">
                <NexusIcon name="trending" size="24rpx" :color="sortIndex !== 0 ? '#da6b17' : '#cbd5e1'" style="margin-right: 6rpx;" />
                <text class="favSortLabel">{{ sortOptions[sortIndex] }}</text>
                <text class="favSortArrow">⌄</text>
              </view>
            </NexusSelect>
          </view>

          <!-- 右侧极简按钮组 (同步 + 多选) -->
          <view class="favBarRightActions">
            <!-- 极简同步按钮 -->
            <view class="miniSyncBtn" @click="syncTrackedFromNexus(true)" title="同步 N网">
              <NexusIcon name="refresh" size="22rpx" color="#38bdf8" :class="{ 'spin-icon': isSyncingTracked }" />
              <text class="miniSyncText">{{ isSyncingTracked ? '同步中' : '同步' }}</text>
            </view>

            <!-- 多选管理入口 -->
            <button
              class="multiSelectBtn"
              :class="{ active: isMultiSelectMode }"
              @click="toggleMultiSelectMode"
              v-if="processedFavoritesList.length > 0"
            >
              <text class="multiSelectText">{{ isMultiSelectMode ? '完成' : '多选' }}</text>
            </button>
          </view>
        </view>
      </view>

      <!-- 3. 模组网格列表 -->
      <view class="modsGrid" v-if="processedFavoritesList.length > 0">
        <ModCard
          v-for="item in processedFavoritesList"
          :key="item.id"
          :item="item"
          :selected-game-domain="selectedGameDomain"
          :enable-auto-translate="enableAutoTranslate"
          :zh-title="zhTitleMap[item.id] || item.zhTitle"
          :zh-summary="zhSummaryMap[item.id] || item.zhSummary"
          :is-favorited="true"
          :is-pushing="pushingModId === item.id"
          :selectable="isMultiSelectMode"
          :is-selected="Boolean(selectedModIdMap[item.id])"
          @click="openDetail(item)"
          @select="toggleCardSelect(item)"
          @favorite="toggleCardFavorite(item)"
          @push="quickPushToDesktop(item)"
        />
      </view>

      <!-- 空状态提示 (区分是否登录以及筛选无结果) -->
      <view class="emptyFavBox" v-else>
        <NexusIcon name="heart" size="84rpx" color="#475569" style="margin-bottom: 16rpx;" />
        <block v-if="!nexusApiKey">
          <text class="emptyFavTitle">登录同步 N网 追踪历史</text>
          <text class="emptyFavSub">模组收藏已对接 NexusMods 官方云端追踪，登录后将自动拉取您在 N网 追踪收藏的所有模组</text>
          <button class="goExploreBtn" style="background: linear-gradient(135deg, #da6b17, #f97316);" @click="openNexusAuth">
            <text class="goExploreBtnText">🔑 登录 NexusMods 账号 ›</text>
          </button>
        </block>
        <block v-else-if="favoritesList.length === 0">
          <text class="emptyFavTitle">暂无追踪的模组</text>
          <text class="emptyFavSub">在模组流中点击卡片右上角的心形图标即可加入 N网 官方云端追踪</text>
          <button class="goExploreBtn" @click="handleNavBack">
            <text class="goExploreBtnText">去发现精彩 Mod ›</text>
          </button>
        </block>
        <block v-else>
          <text class="emptyFavTitle">当前筛选无模组</text>
          <text class="emptyFavSub">在选中的游戏分类或排序维度下暂无追踪模组</text>
          <button class="goExploreBtn" @click="selectGameFilter('all')">
            <text class="goExploreBtnText">查看全部游戏模组 ›</text>
          </button>
        </block>
      </view>

      <!-- 4. 浮动批量多选操作底栏 (进入多选模式时在页面底部升起) -->
      <view class="floatingMultiActionBar" v-if="isMultiSelectMode">
        <view class="batchSelectLeft" @click="toggleSelectAll">
          <view class="batchCheckbox" :class="{ checked: isAllSelected }">
            <text class="batchCheckmark" v-if="isAllSelected">✓</text>
          </view>
          <text class="batchSelectLabel">全选 (已选 {{ selectedCount }}/{{ processedFavoritesList.length }})</text>
        </view>

        <view class="batchActionButtons">
          <button
            class="batchPushActionButton"
            :disabled="selectedCount === 0 || isBatchPushing"
            @click="pushSelectedFavorites"
          >
            <text class="batchPushActionText">
              {{ isBatchPushing ? '正在投递...' : `推送到电脑 (${selectedCount})` }}
            </text>
          </button>
        </view>
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

    <!-- 6. 全局手机 App 底部导航栏 -->
    <NexusTabBar
      active-tab="favorites"
      :favorites-count="favoritesList.length"
      :history-count="historyCount"
      :desktop-connected="desktopConfig && desktopConfig.connected"
      :nexus-user="nexusUser"
      @tab-refresh="refreshFavorites"
    />

    <!-- 7. 自研暗黑对话框 / 确认弹窗组件 (完全替代原生白色 uni.showModal) -->
    <NexusModal
      :visible="confirmModal.visible"
      :title="confirmModal.title"
      :content="confirmModal.content"
      :type="confirmModal.type"
      :icon="confirmModal.icon"
      :confirm-text="confirmModal.confirmText"
      :cancel-text="confirmModal.cancelText"
      :show-cancel="confirmModal.showCancel"
      @confirm="onConfirmModalAction"
      @cancel="confirmModal.visible = false"
      @close="confirmModal.visible = false"
    />
  </view>
</template>

<script>
// ============================================================================
// 页面脚本：装机心愿单独立管理与批量推送
// ============================================================================
import {
  getFavorites,
  toggleFavorite,
  syncFavoritesFromNexus
} from '../../services/favorites.js';
import { getPushHistory } from '../../services/history.js';
import {
  pushModToDesktop,
  getDesktopConfig,
  saveDesktopConfig,
  testDesktopConnection,
  getNexusUser,
  getNexusApiKey,
  syncNexusFromDesktop
} from '../../services/nexus.js';
import { batchTranslateModList } from '../../services/translate.js';
import { formatFavoritesShareText } from '../../services/poster.js';
import NexusHeader from '../../components/NexusHeader.vue';
import NexusDrawer from '../../components/NexusDrawer.vue';
import ModCard from '../../components/ModCard.vue';
import DevicePairModal from '../../components/DevicePairModal.vue';
import NexusAuthModal from '../../components/NexusAuthModal.vue';
import NexusTabBar from '../../components/NexusTabBar.vue';
import NexusIcon from '../../components/NexusIcon.vue';
import NexusSelect from '../../components/NexusSelect.vue';
import NexusModal from '../../components/NexusModal.vue';

export default {
  components: {
    NexusHeader,
    NexusDrawer,
    ModCard,
    DevicePairModal,
    NexusAuthModal,
    NexusTabBar,
    NexusIcon,
    NexusSelect,
    NexusModal
  },

  data() {
    return {
      favoritesList: [],
      selectedGameDomain: '',
      activeGameDisplayName: '',
      currentSelectedGameDomain: 'all',
      sortOptions: ['最新追踪', '热门下载', '最多点赞', '模组名称'],
      sortIndex: 0,
      isMultiSelectMode: false,
      selectedModIdMap: {},
      enableAutoTranslate: true,
      zhTitleMap: {},
      zhSummaryMap: {},
      drawerVisible: false,
      deviceModalVisible: false,
      nexusAuthModalVisible: false,
      pushingModId: null,
      isBatchPushing: false,
      isSyncingTracked: false,
      desktopConfig: { host: '10.204.160.22', port: 28888, connected: false },
      nexusUser: null,
      nexusApiKey: '',
      historyCount: 0,
      confirmModal: {
        visible: false,
        title: '提示',
        content: '',
        type: 'info',
        icon: '',
        confirmText: '确定',
        cancelText: '取消',
        showCancel: true,
        onConfirm: null
      }
    };
  },

  computed: {
    /**
     * 动态聚合已收藏模组归属的所有游戏分类
     * 按拥有模组数量从高到低排序，首项固定为“全部游戏”
     */
    gameFilterList() {
      const counts = {};
      const names = {};
      this.favoritesList.forEach((m) => {
        const domain = m.game?.domainName || 'unknown';
        const name = m.game?.shortZhName || m.game?.name || domain;
        counts[domain] = (counts[domain] || 0) + 1;
        names[domain] = name;
      });
      const list = [
        { domain: 'all', name: '全部游戏', count: this.favoritesList.length }
      ];
      const gameEntries = Object.keys(counts)
        .filter((d) => d !== 'unknown' && counts[d] > 0)
        .map((d) => ({
          domain: d,
          name: names[d] || d,
          count: counts[d]
        }))
        .sort((a, b) => b.count - a.count);

      return list.concat(gameEntries);
    },

    /**
     * 游戏下拉选择器规格化选项清单
     */
    gameSelectOptions() {
      return this.gameFilterList.map((g) => ({
        label: `${g.name} (${g.count})`,
        value: g.domain,
        icon: g.domain === 'all' ? 'mods' : 'game'
      }));
    },

    /**
     * 当前选中的游戏展示标签
     */
    currentSelectedGameLabel() {
      const target = this.gameFilterList.find((g) => g.domain === this.currentSelectedGameDomain);
      if (target) {
        return target.domain === 'all' ? `全部游戏 (${target.count})` : `${target.name} (${target.count})`;
      }
      return '全部游戏';
    },

    processedFavoritesList() {
      let list = [...this.favoritesList];

      // 1. 游戏专区分类筛选
      if (this.currentSelectedGameDomain && this.currentSelectedGameDomain !== 'all') {
        list = list.filter((m) => m.game?.domainName === this.currentSelectedGameDomain);
      }

      // 2. 排序筛选 (最新追踪、热门下载、最多点赞、模组名称)
      if (this.sortIndex === 0) {
        list.sort((a, b) => (b.favoriteTime || 0) - (a.favoriteTime || 0));
      } else if (this.sortIndex === 1) {
        list.sort((a, b) => (Number(b.downloads) || 0) - (Number(a.downloads) || 0));
      } else if (this.sortIndex === 2) {
        list.sort((a, b) => (Number(b.likes) || 0) - (Number(a.likes) || 0));
      } else if (this.sortIndex === 3) {
        list.sort((a, b) => (a.zhTitle || a.title || '').localeCompare(b.zhTitle || b.title || ''));
      }

      return list;
    },

    selectedCount() {
      return Object.keys(this.selectedModIdMap).length;
    },

    isAllSelected() {
      const list = this.processedFavoritesList;
      if (list.length === 0) return false;
      return list.every((m) => Boolean(this.selectedModIdMap[m.id]));
    }
  },

  async onShow() {
    this.refreshFavorites();
    const hist = getPushHistory();
    this.historyCount = Array.isArray(hist) ? hist.length : 0;
    this.desktopConfig = getDesktopConfig();
    this.nexusUser = getNexusUser();
    this.nexusApiKey = getNexusApiKey();

    // 未登录时若电脑端已连接，尝试静默同步 N网 会话
    if (!this.nexusApiKey && this.desktopConfig && this.desktopConfig.connected) {
      try {
        const synced = await syncNexusFromDesktop(this.desktopConfig);
        if (synced && synced.apiKey) {
          this.nexusApiKey = synced.apiKey;
          this.nexusUser = synced.user;
        }
      } catch (e) {}
    }

    // 已登录则后台轻量静默同步最新 N网 追踪列表
    if (this.nexusApiKey) {
      this.syncTrackedFromNexus(false);
    }
  },

  onLoad(query) {
    if (query && query.domain) {
      this.selectedGameDomain = query.domain;
      this.currentSelectedGameDomain = query.domain;
      this.activeGameDisplayName = decodeURIComponent(query.zhName || query.name || '');
    }
  },

  methods: {
    /**
     * 自研暗黑对话框操作确认响应
     */
    onConfirmModalAction() {
      this.confirmModal.visible = false;
      if (typeof this.confirmModal.onConfirm === 'function') {
        this.confirmModal.onConfirm();
      }
    },

    refreshFavorites() {
      this.favoritesList = getFavorites();
      if (this.enableAutoTranslate && this.favoritesList.length > 0) {
        this.autoTranslateFavorites(this.favoritesList);
      }
    },

    /**
     * 自动异步批量翻译已收藏的模组标题与简介
     * @param {Array<Object>} items
     */
    async autoTranslateFavorites(items) {
      if (!Array.isArray(items) || items.length === 0) return;
      try {
        const { zhTitleMap, zhSummaryMap } = await batchTranslateModList(items);
        this.zhTitleMap = { ...this.zhTitleMap, ...zhTitleMap };
        this.zhSummaryMap = { ...this.zhSummaryMap, ...zhSummaryMap };

        // 同步富化持久化存储，确保冷启动与离线秒出中文
        let updated = false;
        this.favoritesList.forEach((m) => {
          if (this.zhTitleMap[m.id] && m.zhTitle !== this.zhTitleMap[m.id]) {
            m.zhTitle = this.zhTitleMap[m.id];
            updated = true;
          }
          if (this.zhSummaryMap[m.id] && m.zhSummary !== this.zhSummaryMap[m.id]) {
            m.zhSummary = this.zhSummaryMap[m.id];
            updated = true;
          }
        });
        if (updated) {
          try {
            uni.setStorageSync('mayfly_mod_favorites', this.favoritesList);
          } catch (e) {}
        }
      } catch (e) {
        console.warn('[MayflyFavorites] 自动翻译模组异常:', e);
      }
    },

    /**
     * 主动从 N网 云端同步追踪列表
     * @param {boolean} showToast
     */
    async syncTrackedFromNexus(showToast = true) {
      if (this.isSyncingTracked) return;
      if (!this.nexusApiKey) {
        if (showToast) {
          this.confirmModal = {
            visible: true,
            title: '需要登录 NexusMods',
            content: '模组收藏与您的 N网 官方账号“追踪历史 (Tracked Mods)”直接云端同步。请先登录 N网 账号。',
            type: 'info',
            icon: 'user',
            confirmText: '去登录',
            cancelText: '取消',
            showCancel: true,
            onConfirm: () => {
              this.openNexusAuth();
            }
          };
        }
        return;
      }

      this.isSyncingTracked = true;
      if (showToast) {
        uni.showLoading({ title: '同步 N网 追踪中...' });
      }
      try {
        const list = await syncFavoritesFromNexus(this.nexusApiKey);
        this.favoritesList = list;
        if (this.enableAutoTranslate && this.favoritesList.length > 0) {
          this.autoTranslateFavorites(this.favoritesList);
        }
        if (showToast) {
          uni.showToast({
            title: `已同步 ${list.length} 个 N网追踪模组`,
            icon: 'none'
          });
        }
      } catch (err) {
        if (showToast) {
          uni.showToast({ title: '同步追踪异常', icon: 'none' });
        }
      } finally {
        this.isSyncingTracked = false;
        if (showToast) {
          uni.hideLoading();
        }
      }
    },

    async toggleCardFavorite(modItem) {
      const res = await toggleFavorite(modItem);
      if (res && res.needLogin) {
        this.confirmModal = {
          visible: true,
          title: '需要登录 NexusMods',
          content: '加入或移出收藏将直接与您的 N网 官方“追踪历史 (Tracked Mods)”云端双向同步，请先登录 N网 账号。',
          type: 'info',
          icon: 'user',
          confirmText: '去登录',
          cancelText: '取消',
          showCancel: true,
          onConfirm: () => {
            this.openNexusAuth();
          }
        };
        return;
      }
      this.refreshFavorites();
      uni.showToast({
        title: res.message || (res.favorited ? '已加入 N网追踪' : '已取消 N网追踪'),
        icon: 'none'
      });
    },

    /**
     * 打开模组完整详情页 (精准传递完整元数据与独立标识，杜绝串位)
     * @param {Object} item - 模组数据对象
     */
    openDetail(item) {
      if (!item || !item.id) return;

      // 1. 同步覆写当前选中的激活模组缓存
      try {
        uni.setStorageSync('mayfly_active_mod_cache', item);
      } catch (e) {}

      // 2. 序列化完整对象参数，与首页完全保持一致
      const encoded = encodeURIComponent(JSON.stringify(item));
      const modId = item.modId || item.id;
      const gameId = item.game?.id || '';
      const domain = item.game?.domainName || this.selectedGameDomain || '';

      // 3. 携带完整 query 路由参数跳转详情页
      uni.navigateTo({
        url: `/pages/detail/detail?payload=${encoded}&modData=${encoded}&modId=${modId}&gameId=${gameId}&gameDomain=${domain}`
      });
    },

    async quickPushToDesktop(item) {
      this.pushingModId = item.id;
      try {
        const pushItem = {
          ...item,
          zhTitle: item.zhTitle || ''
        };
        const res = await pushModToDesktop(pushItem, this.desktopConfig);
        if (res.success) {
          uni.showToast({ title: '已推送到电脑端安装', icon: 'success' });
          this.historyCount = getPushHistory().length;
        } else {
          this.confirmModal = {
            visible: true,
            title: '推送未成功',
            content: res.message || '电脑端未能成功响应本次投递，请检查电脑端连接状态。',
            type: 'warning',
            icon: 'warning',
            confirmText: '我知道了',
            cancelText: '',
            showCancel: false,
            onConfirm: null
          };
        }
      } catch (err) {
        uni.showToast({ title: '网络异常', icon: 'none' });
      } finally {
        this.pushingModId = null;
      }
    },

    /**
     * 设置当前选中的游戏筛选专区
     * @param {string} domain - 游戏域名标识 ('all' 为全部)
     */
    selectGameFilter(domain) {
      this.currentSelectedGameDomain = domain;
      this.selectedModIdMap = {};
    },

    /**
     * 响应所属游戏下拉选择事件
     * @param {Object} e - NexusSelect 抛出的选项数据
     */
    onGameFilterChange(e) {
      const domain = e.value !== undefined ? e.value : (this.gameSelectOptions[e.detail?.value]?.value || 'all');
      this.selectGameFilter(domain);
    },

    /**
     * 响应排序方式下拉选择事件
     * @param {Object} e - NexusSelect 抛出的排序变更事件
     */
    onSortChange(e) {
      this.sortIndex = Number(e.detail?.value !== undefined ? e.detail.value : e.index) || 0;
    },

    toggleMultiSelectMode() {
      this.isMultiSelectMode = !this.isMultiSelectMode;
      if (!this.isMultiSelectMode) {
        this.selectedModIdMap = {};
      }
    },

    toggleCardSelect(item) {
      const id = String(item.id || item.modId);
      const next = { ...this.selectedModIdMap };
      if (next[id]) {
        delete next[id];
      } else {
        next[id] = item;
      }
      this.selectedModIdMap = next;
    },

    toggleSelectAll() {
      const list = this.processedFavoritesList;
      if (this.isAllSelected) {
        this.selectedModIdMap = {};
      } else {
        const next = {};
        list.forEach((m) => {
          next[String(m.id || m.modId)] = m;
        });
        this.selectedModIdMap = next;
      }
    },

    async pushSelectedFavorites() {
      const selectedItems = Object.values(this.selectedModIdMap);
      if (selectedItems.length === 0) {
        uni.showToast({ title: '请先勾选模组', icon: 'none' });
        return;
      }

      this.isBatchPushing = true;
      let successCount = 0;
      for (const item of selectedItems) {
        try {
          const pushItem = {
            ...item,
            zhTitle: item.zhTitle || ''
          };
          const res = await pushModToDesktop(pushItem, this.desktopConfig);
          if (res.success) successCount++;
        } catch (e) {}
      }
      this.isBatchPushing = false;
      this.historyCount = getPushHistory().length;

      this.confirmModal = {
        visible: true,
        title: '批量推送完成',
        content: `成功投递 ${successCount}/${selectedItems.length} 个模组到电脑端 Mayfly。`,
        type: 'success',
        icon: 'check',
        confirmText: '太棒了',
        cancelText: '',
        showCancel: false,
        onConfirm: () => {
          this.isMultiSelectMode = false;
          this.selectedModIdMap = {};
        }
      };
    },

    exportFavoritesList() {
      const list = this.processedFavoritesList;
      if (list.length === 0) return;
      const text = formatFavoritesShareText(list, this.activeGameDisplayName || '全游戏');
      uni.setClipboardData({
        data: text,
        success: () => {
          uni.showToast({ title: '收藏分享口令已复制', icon: 'success' });
        }
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
      this.syncTrackedFromNexus(true);
    },

    onNexusLogout() {
      this.nexusUser = null;
      this.nexusApiKey = '';
      this.refreshFavorites();
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
        uni.reLaunch({ url: '/pages/games/games' });
      } else if (target === 'favorites') {
        // 当前已在 favorites 页面
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
/* Favorites 页面样式                                                           */
/* ============================================================================ */
.favoritesPage {
  min-height: 100vh;
  background-color: #121212;
  color: #e5e7eb;
  padding-bottom: 160rpx;
  box-sizing: border-box;
}

.safeStatusBarSpacer {
  width: 100%;
  height: var(--status-bar-height, 25px);
  background-color: #121212;
  box-sizing: border-box;
}

.favContainer {
  padding: 24rpx;
}

/* ---------------------------------------------------------------------------- */
/* 区域 2：吸顶固定控制台 (游戏专区下拉 + 排序维度 + 同步/多选)                   */
/* ---------------------------------------------------------------------------- */
.favControlsArea {
  position: sticky;
  top: 0;
  z-index: 95;
  background-color: rgba(18, 18, 18, 0.96);
  backdrop-filter: blur(20px);
  padding: calc(var(--status-bar-height, 0px) + 12rpx) 24rpx 14rpx 24rpx;
  margin: 0 -24rpx 20rpx -24rpx;
  border-bottom: 1rpx solid rgba(255, 255, 255, 0.06);
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.45);
}

/* 紧凑工具操作行 (游戏筛选 + 排序维度 + 同步/多选) */
.favFilterBar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #181a20;
  border: 1rpx solid #272d3b;
  border-radius: 12rpx;
  padding: 10rpx 16rpx;
}

/* 左侧双下拉选择器组合 (游戏分类 + 排序方式) */
.favBarLeftSelects {
  display: flex;
  align-items: center;
  gap: 12rpx;
  flex: 1;
  min-width: 0;
}

.favSortSelect {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 4rpx 6rpx;
  border-radius: 8rpx;
  transition: all 0.2s ease;
  min-width: 0;
}

.favSortSelect:active {
  background: rgba(255, 255, 255, 0.05);
}

.favSortSelect.active .favSortLabel {
  color: #da6b17;
  font-weight: 700;
}

.favSortLabel {
  font-size: 22rpx;
  color: #cbd5e1;
  font-weight: 600;
  white-space: nowrap;
}

.favGameSelectLabel {
  max-width: 170rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.favSortArrow {
  font-size: 20rpx;
  color: #94a3b8;
  margin-left: 4rpx;
  flex-shrink: 0;
}

/* 中间极简细分割线 */
.favFilterDivider {
  width: 1rpx;
  height: 24rpx;
  background-color: #2b3345;
  flex-shrink: 0;
}

.favBarRightActions {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.miniSyncBtn {
  display: flex;
  align-items: center;
  gap: 6rpx;
  background: #1e2638;
  border: 1rpx solid #333d52;
  border-radius: 8rpx;
  padding: 6rpx 14rpx;
  cursor: pointer;
}

.miniSyncText {
  font-size: 20rpx;
  color: #38bdf8;
  font-weight: 600;
}

.multiSelectBtn {
  background: #222938;
  border: 1rpx solid #3b455c;
  border-radius: 8rpx;
  padding: 6rpx 18rpx;
  margin: 0;
  line-height: 1.4;
}

.multiSelectBtn.active {
  background: #da6b17;
  border-color: #da6b17;
}

.multiSelectText {
  font-size: 20rpx;
  color: #cbd5e1;
  font-weight: 600;
}

.multiSelectBtn.active .multiSelectText {
  color: #ffffff;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.spin-icon {
  animation: spin 1s linear infinite;
}

/* ---------------------------------------------------------------------------- */
/* 区域 3：浮动多选操作底栏 (位于 TabBar 上方，固定贴底)                        */
/* ---------------------------------------------------------------------------- */
.floatingMultiActionBar {
  position: fixed;
  bottom: 120rpx;
  left: 24rpx;
  right: 24rpx;
  background: rgba(24, 26, 32, 0.95);
  backdrop-filter: blur(12px);
  border: 1rpx solid #3b4252;
  border-radius: 20rpx;
  padding: 16rpx 24rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 12rpx 36rpx rgba(0, 0, 0, 0.6);
  z-index: 99;
}

.batchSelectLeft {
  display: flex;
  align-items: center;
  gap: 12rpx;
  cursor: pointer;
}

.batchCheckbox {
  width: 38rpx;
  height: 38rpx;
  border-radius: 50%;
  border: 2rpx solid #94a3b8;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #121418;
}

.batchCheckbox.checked {
  background: #da6b17;
  border-color: #da6b17;
}

.batchCheckmark {
  font-size: 22rpx;
  color: #ffffff;
  font-weight: 900;
  line-height: 1;
}

.batchSelectLabel {
  font-size: 22rpx;
  color: #e5e7eb;
  font-weight: 600;
}

.batchActionButtons {
  display: flex;
  align-items: center;
}

.batchPushActionButton {
  background: #da6b17;
  border-radius: 12rpx;
  padding: 12rpx 28rpx;
  margin: 0;
  border: none;
  line-height: 1.4;
}

.batchPushActionButton[disabled] {
  opacity: 0.45;
}

.batchPushActionText {
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
