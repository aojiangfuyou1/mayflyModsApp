<template>
  <!-- ======================================================================== -->
  <!-- 页面名称：推送任务清单 (History Page)                                     -->
  <!-- 功能描述：独立全屏展示已推送到电脑端的 Mod 历史任务，支持一键重推与清空  -->
  <!-- ======================================================================== -->
  <view class="historyPage">
    <!-- 1. 全局沉浸式顶栏 (一级 Tab 页面) -->
    <NexusHeader
      title="推送任务清单"
      :show-back="false"
      :show-search="false"
      :desktop-config="desktopConfig"
      :nexus-user="nexusUser"
      @drawer-click="drawerVisible = true"
      @pc-click="deviceModalVisible = true"
      @user-click="openNexusAuth"
    />

    <view class="historyContainer">
      <!-- 2. 紧凑型顶部操作栏 (告别粗笨大卡片，极简科技胶囊 + 优雅清空按钮) -->
      <view class="historyToolbar">
        <!-- 左侧：统计与状态胶囊 -->
        <view class="toolbarStatPill">
          <NexusIcon name="task" size="24rpx" color="#38bdf8" />
          <text class="statCountText">共 {{ historyList.length }} 个任务</text>
          <view class="liveDotWrap" v-if="desktopConfig && desktopConfig.connected">
            <view class="livePulseDot"></view>
            <text class="liveText">已联机</text>
          </view>
        </view>

        <!-- 右侧：同步与清空操作组 -->
        <view class="toolbarActions">
          <view
            class="actionChip syncChip"
            @click="handleManualSync"
            title="同步最新进度"
          >
            <NexusIcon name="refresh" size="20rpx" color="#94a3b8" :class="{ 'spinIcon': isSyncing }" />
            <text class="chipText">{{ isSyncing ? '同步中' : '刷新' }}</text>
          </view>
          <view
            class="actionChip clearChip"
            v-if="historyList.length > 0"
            @click="handleClearHistory"
            title="清空推送记录"
          >
            <NexusIcon name="trash" size="20rpx" color="#f87171" />
            <text class="chipText danger">清空</text>
          </view>
        </view>
      </view>

      <!-- 3. 历史任务列表 -->
      <view class="historyListWrap" v-if="historyList.length > 0">
        <view class="historyItem" v-for="item in historyList" :key="item.id">
          <!-- 黄金宽屏封面容器 -->
          <view class="thumbWrap">
            <image class="historyThumb" :src="item.coverImageUrl || '/static/logo.png'" mode="aspectFill" />
            <text class="channelBadge">{{ item.channel === 'LAN_HTTP' ? '局域网' : '云通道' }}</text>
          </view>

          <!-- 详情信息体 -->
          <view class="historyBody">
            <text class="historyTitle">{{ item.zhTitle || item.title }}</text>
            <text class="historyOriginalTitle" v-if="item.zhTitle && item.zhTitle !== item.title">{{ item.title }}</text>

            <view class="historyMeta">
              <text class="historyGame">{{ item.gameName || '通用游戏' }}</text>
              <text class="metaDivider">·</text>
              <text class="historyTime">{{ formatHistoryTime(item.timestamp) }}</text>
            </view>

            <!-- 详细状态回执提示 -->
            <view class="statusMessageRow" v-if="item.statusMessage">
              <text class="statusMessageText">{{ item.statusMessage }}</text>
            </view>
          </view>

          <!-- 右侧轻量状态与操作胶囊 (告别粗笨大方块按钮) -->
          <view class="historyActionCol">
            <!-- 状态 A: 已完成 -->
            <view
              class="statusPill isCompleted"
              v-if="item.status === 'completed'"
              @click.stop="rePushItem(item)"
              title="已下载完成，点击可重新投递"
            >
              <NexusIcon name="check" size="20rpx" color="#34d399" />
              <text class="statusPillText">已完成</text>
            </view>

            <!-- 状态 B: 电脑下载中 (流光青蓝 + 呼吸光点) -->
            <view
              class="statusPill isDownloading"
              v-else-if="item.status === 'downloading'"
            >
              <view class="downloadPulse"></view>
              <text class="statusPillText">下载中</text>
            </view>

            <!-- 状态 C: 失败 (绯红醒目 + 点击重试) -->
            <view
              class="statusPill isFailed"
              v-else-if="item.status === 'failed'"
              @click.stop="rePushItem(item)"
              title="点击重试投递"
            >
              <NexusIcon name="refresh" size="18rpx" color="#f87171" />
              <text class="statusPillText">重试</text>
            </view>

            <!-- 状态 D: 已推送 (暖橙色) -->
            <view
              class="statusPill isPushed"
              v-else
              @click.stop="rePushItem(item)"
              title="点击再次投递"
            >
              <text class="statusPillText">重推</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 空记录提示 (优雅大尺寸清单矢量图标) -->
      <view class="emptyHistoryBox" v-else>
        <NexusIcon name="task" size="84rpx" color="#475569" style="margin-bottom: 16rpx;" />
        <text class="emptyTitle">暂无推送任务记录</text>
        <text class="emptySub">在模组流中挑选心仪的 Mod，点击「推送到电脑」即可体验无感落盘安装！</text>
        <button class="goExploreBtn" @click="handleNavBack">
          <text class="goExploreBtnText">去挑选模组 ›</text>
        </button>
      </view>
    </view>

    <!-- 4. 全局抽屉组件 -->
    <NexusDrawer
      :visible="drawerVisible"
      :nexus-user="nexusUser"
      :desktop-config="desktopConfig"
      :history-count="historyList.length"
      @close="drawerVisible = false"
      @nav="handleDrawerNav"
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
      active-tab="history"
      :favorites-count="favoritesCount"
      :history-count="historyList.length"
      :desktop-connected="desktopConfig && desktopConfig.connected"
      :nexus-user="nexusUser"
      @tab-refresh="refreshHistory"
    />
  </view>
</template>

<script>
// ============================================================================
// 页面脚本：推送任务历史记录查询与重投
// ============================================================================
import {
  getPushHistory,
  clearPushHistory,
  syncHistoryWithDesktop,
  autoTranslateHistoryList
} from '../../services/history.js';
import { getFavorites } from '../../services/favorites.js';
import {
  pushModToDesktop,
  getDesktopConfig,
  saveDesktopConfig,
  testDesktopConnection,
  getNexusUser,
  getNexusApiKey
} from '../../services/nexus.js';
import NexusHeader from '../../components/NexusHeader.vue';
import NexusDrawer from '../../components/NexusDrawer.vue';
import DevicePairModal from '../../components/DevicePairModal.vue';
import NexusAuthModal from '../../components/NexusAuthModal.vue';
import NexusTabBar from '../../components/NexusTabBar.vue';
import NexusIcon from '../../components/NexusIcon.vue';

export default {
  components: {
    NexusHeader,
    NexusDrawer,
    DevicePairModal,
    NexusAuthModal,
    NexusTabBar,
    NexusIcon
  },

  data() {
    return {
      historyList: [],
      drawerVisible: false,
      deviceModalVisible: false,
      nexusAuthModalVisible: false,
      desktopConfig: { host: '10.204.160.22', port: 28888, connected: false },
      nexusUser: null,
      nexusApiKey: '',
      favoritesCount: 0,
      statusTimer: null,
      isSyncing: false
    };
  },

  onShow() {
    this.refreshHistory();
    const favs = getFavorites();
    this.favoritesCount = Array.isArray(favs) ? favs.length : 0;
    this.desktopConfig = getDesktopConfig();
    this.nexusUser = getNexusUser();
    this.nexusApiKey = getNexusApiKey();

    // 页面呈现时立即执行双向状态对齐与标题汉化，并开启轻量轮询
    this.syncAndTranslateHistory();
    this.startPollingStatus();
  },

  onHide() {
    this.stopPollingStatus();
  },

  beforeDestroy() {
    this.stopPollingStatus();
  },

  methods: {
    refreshHistory() {
      this.historyList = getPushHistory();
    },

    /**
     * 手动触发双向同步最新状态
     */
    async handleManualSync() {
      if (this.isSyncing) return;
      this.isSyncing = true;
      try {
        await this.syncAndTranslateHistory();
        uni.showToast({ title: '已同步最新状态', icon: 'none' });
      } finally {
        setTimeout(() => {
          this.isSyncing = false;
        }, 600);
      }
    },

    /**
     * 与电脑端拉取最新任务状态，并对未翻译标题进行自动汉化
     */
    async syncAndTranslateHistory() {
      // 1. 同步电脑端真实下载状态
      if (this.desktopConfig && this.desktopConfig.host) {
        const synced = await syncHistoryWithDesktop(this.desktopConfig);
        this.historyList = synced;
      }
      // 2. 自动补充历史记录中缺失的中文标题
      const translated = await autoTranslateHistoryList(this.historyList);
      this.historyList = translated;
    },

    /**
     * 开启定时轻量轮询任务状态 (若有下载中的任务则每 3 秒刷新)
     */
    startPollingStatus() {
      this.stopPollingStatus();
      this.statusTimer = setInterval(async () => {
        if (!this.desktopConfig || !this.desktopConfig.host) return;
        const hasDownloading = this.historyList.some(
          (i) => i.status === 'downloading' || !i.status
        );
        if (hasDownloading) {
          const list = await syncHistoryWithDesktop(this.desktopConfig);
          this.historyList = list;
        }
      }, 3000);
    },

    /**
     * 停止轮询定时器
     */
    stopPollingStatus() {
      if (this.statusTimer) {
        clearInterval(this.statusTimer);
        this.statusTimer = null;
      }
    },

    async rePushItem(item) {
      uni.showLoading({ title: '正在重新投递...' });
      try {
        const pushItem = {
          ...item,
          zhTitle: item.zhTitle || ''
        };
        const res = await pushModToDesktop(pushItem, this.desktopConfig);
        uni.hideLoading();
        if (res.success) {
          uni.showToast({ title: '重推成功！', icon: 'success' });
          this.refreshHistory();
          this.syncAndTranslateHistory();
        } else {
          uni.showModal({ title: '重推未成功', content: res.message, showCancel: false });
        }
      } catch (err) {
        uni.hideLoading();
        uni.showToast({ title: '投递异常', icon: 'none' });
      }
    },

    handleClearHistory() {
      uni.showModal({
        title: '清空历史任务？',
        content: '确定要清空手机端记录吗？不会影响电脑端已下载落盘的文件。',
        confirmColor: '#ef4444',
        success: (res) => {
          if (res.confirm) {
            clearPushHistory();
            this.refreshHistory();
            uni.showToast({ title: '记录已清空', icon: 'none' });
          }
        }
      });
    },

    formatHistoryTime(ts) {
      if (!ts) return '';
      const now = Date.now();
      const diff = Math.floor((now - Number(ts)) / 1000);
      if (diff < 60) return '刚刚';
      if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`;
      if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`;
      const d = new Date(Number(ts));
      return `${d.getMonth() + 1}-${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
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
        uni.reLaunch({ url: '/pages/games/games' });
      } else if (target === 'favorites') {
        uni.reLaunch({ url: '/pages/favorites/favorites' });
      } else if (target === 'history') {
        // 当前已在 history 页面
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
/* History 页面样式                                                             */
/* ============================================================================ */
.historyPage {
  min-height: 100vh;
  background-color: #121212;
  color: #e5e7eb;
  padding-bottom: 160rpx;
  box-sizing: border-box;
}

.historyContainer {
  padding: 24rpx;
}

/* ============================================================================ */
/* 区域 1：顶部极简操作工具栏 (紧凑胶囊设计，告别粗苯大卡片)                      */
/* ============================================================================ */
.historyToolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24rpx;
  padding: 4rpx 4rpx;
}

.toolbarStatPill {
  display: inline-flex;
  align-items: center;
  gap: 12rpx;
  background: rgba(255, 255, 255, 0.05);
  border: 1rpx solid rgba(255, 255, 255, 0.09);
  border-radius: 30rpx;
  padding: 10rpx 20rpx;
}

.statCountText {
  font-size: 24rpx;
  font-weight: 700;
  color: #f1f5f9;
  letter-spacing: 0.3rpx;
}

.liveDotWrap {
  display: inline-flex;
  align-items: center;
  gap: 8rpx;
  margin-left: 6rpx;
  padding-left: 12rpx;
  border-left: 1rpx solid rgba(255, 255, 255, 0.12);
}

.livePulseDot {
  width: 10rpx;
  height: 10rpx;
  border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 8rpx #10b981;
  animation: pulse-glow 2s infinite ease-in-out;
}

@keyframes pulse-glow {
  0%, 100% { opacity: 0.5; transform: scale(0.9); }
  50% { opacity: 1; transform: scale(1.15); box-shadow: 0 0 12rpx #10b981; }
}

.liveText {
  font-size: 20rpx;
  color: #10b981;
  font-weight: 600;
}

.toolbarActions {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.actionChip {
  display: inline-flex;
  align-items: center;
  gap: 8rpx;
  padding: 10rpx 20rpx;
  border-radius: 28rpx;
  font-size: 22rpx;
  font-weight: 600;
  transition: all 0.2s ease;
  user-select: none;
  cursor: pointer;
}

.actionChip.syncChip {
  background: rgba(255, 255, 255, 0.05);
  border: 1rpx solid rgba(255, 255, 255, 0.09);
  color: #94a3b8;
}

.actionChip.syncChip:active {
  background: rgba(255, 255, 255, 0.1);
  transform: scale(0.96);
}

.actionChip.clearChip {
  background: rgba(239, 68, 68, 0.09);
  border: 1rpx solid rgba(239, 68, 68, 0.24);
  color: #f87171;
}

.actionChip.clearChip:active {
  background: rgba(239, 68, 68, 0.18);
  transform: scale(0.96);
}

.chipText {
  font-size: 22rpx;
  color: #94a3b8;
}

.chipText.danger {
  color: #f87171;
}

.spinIcon {
  animation: spin-loop 0.8s linear infinite;
}

@keyframes spin-loop {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* ============================================================================ */
/* 区域 2：任务列表与微光渐变卡片                                               */
/* ============================================================================ */
.historyListWrap {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.historyItem {
  display: flex;
  align-items: center;
  gap: 18rpx;
  padding: 18rpx 20rpx;
  background: linear-gradient(145deg, #181a21 0%, #12141a 100%);
  border: 1rpx solid rgba(255, 255, 255, 0.07);
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.25);
  border-radius: 18rpx;
  transition: all 0.2s ease;
}

.historyItem:active {
  transform: scale(0.99);
  border-color: rgba(255, 255, 255, 0.12);
}

.thumbWrap {
  position: relative;
  width: 136rpx;
  height: 94rpx;
  border-radius: 12rpx;
  overflow: hidden;
  flex-shrink: 0;
  background: #0f1115;
  border: 1rpx solid rgba(255, 255, 255, 0.08);
}

.historyThumb {
  width: 100%;
  height: 100%;
  display: block;
}

.channelBadge {
  position: absolute;
  bottom: 4rpx;
  right: 4rpx;
  background: rgba(0, 0, 0, 0.78);
  backdrop-filter: blur(4px);
  color: #94a3b8;
  font-size: 16rpx;
  font-weight: 600;
  padding: 1rpx 6rpx;
  border-radius: 4rpx;
  line-height: 1.2;
}

.historyBody {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
  overflow: hidden;
}

.historyTitle {
  font-size: 26rpx;
  font-weight: 700;
  color: #ffffff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.3;
}

.historyOriginalTitle {
  font-size: 19rpx;
  color: #64748b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.2;
}

.historyMeta {
  display: flex;
  align-items: center;
  gap: 8rpx;
  font-size: 20rpx;
  color: #64748b;
  line-height: 1.2;
}

.historyGame {
  color: #f59e0b;
  font-weight: 600;
  max-width: 220rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.metaDivider {
  color: #475569;
}

.historyTime {
  color: #64748b;
  font-size: 19rpx;
}

.statusMessageRow {
  margin-top: 2rpx;
}

.statusMessageText {
  font-size: 18rpx;
  color: #94a3b8;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: block;
}

/* ============================================================================ */
/* 区域 3：右侧精致微胶囊状态与操作 (告别粗笨大方块按钮)                           */
/* ============================================================================ */
.historyActionCol {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-shrink: 0;
}

.statusPill {
  display: inline-flex;
  align-items: center;
  gap: 6rpx;
  height: 44rpx;
  padding: 0 16rpx;
  border-radius: 22rpx;
  box-sizing: border-box;
  font-size: 20rpx;
  font-weight: 600;
  white-space: nowrap;
  user-select: none;
  transition: all 0.2s ease;
  cursor: pointer;
}

.statusPill:active {
  transform: scale(0.94);
}

.statusPill.isCompleted {
  background: rgba(16, 185, 129, 0.12);
  color: #34d399;
  border: 1rpx solid rgba(16, 185, 129, 0.28);
}

.statusPill.isDownloading {
  background: rgba(56, 189, 248, 0.12);
  color: #38bdf8;
  border: 1rpx solid rgba(56, 189, 248, 0.28);
}

.downloadPulse {
  width: 10rpx;
  height: 10rpx;
  border-radius: 50%;
  background: #38bdf8;
  box-shadow: 0 0 8rpx #38bdf8;
  animation: download-dot-glow 1.4s infinite ease-in-out;
}

@keyframes download-dot-glow {
  0%, 100% { opacity: 0.4; transform: scale(0.85); }
  50% { opacity: 1; transform: scale(1.25); box-shadow: 0 0 12rpx #38bdf8; }
}

.statusPill.isFailed {
  background: rgba(239, 68, 68, 0.12);
  color: #f87171;
  border: 1rpx solid rgba(239, 68, 68, 0.3);
}

.statusPill.isPushed {
  background: rgba(245, 158, 11, 0.12);
  color: #fbbf24;
  border: 1rpx solid rgba(245, 158, 11, 0.28);
}

.statusPillText {
  font-size: 20rpx;
  font-weight: 600;
  line-height: 1;
}

/* ============================================================================ */
/* 区域 4：空状态提示                                                           */
/* ============================================================================ */
.emptyHistoryBox {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 40rpx;
  gap: 20rpx;
}

.emptyTitle {
  font-size: 30rpx;
  font-weight: 700;
  color: #e5e7eb;
}

.emptySub {
  font-size: 22rpx;
  color: #6b7280;
  text-align: center;
  line-height: 1.4;
}

.goExploreBtn {
  margin-top: 20rpx;
  background: linear-gradient(135deg, #da6b17 0%, #b8540c 100%);
  border-radius: 30rpx;
  padding: 16rpx 48rpx;
  border: none;
  box-shadow: 0 4rpx 12rpx rgba(218, 107, 23, 0.3);
}

.goExploreBtnText {
  font-size: 24rpx;
  font-weight: 700;
  color: #ffffff;
}
</style>
