<template>
  <!-- ======================================================================== -->
  <!-- 页面名称：推送任务清单 (History Page)                                     -->
  <!-- 功能描述：独立全屏展示已推送到电脑端的 Mod 历史任务，支持一键重推与清空  -->
  <!-- ======================================================================== -->
  <view class="historyPage">
    <!-- 1. 全局沉浸式顶栏 -->
    <NexusHeader
      title="推送任务清单"
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

    <view class="historyContainer">
      <!-- 2. 清单概览栏 -->
      <view class="historyHeaderCard">
        <view class="historyHeaderTop">
          <view class="historyTitleCol">
            <text class="historyCountText">📋 共 {{ historyList.length }} 个推送任务</text>
            <text class="historySubTip">已通过局域网或云端信令投递到电脑端 Mayfly</text>
          </view>
          <text class="clearAllBtn" v-if="historyList.length > 0" @click="handleClearHistory">清空记录</text>
        </view>
      </view>

      <!-- 3. 历史任务列表 -->
      <view class="historyListWrap" v-if="historyList.length > 0">
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
      </view>

      <!-- 空记录提示 -->
      <view class="emptyHistoryBox" v-else>
        <text class="emptyIcon">📦</text>
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
  </view>
</template>

<script>
// ============================================================================
// 页面脚本：推送任务历史记录查询与重投
// ============================================================================
import { getPushHistory, clearPushHistory } from '../../services/history.js';
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

export default {
  components: {
    NexusHeader,
    NexusDrawer,
    DevicePairModal,
    NexusAuthModal
  },

  data() {
    return {
      historyList: [],
      drawerVisible: false,
      deviceModalVisible: false,
      nexusAuthModalVisible: false,
      desktopConfig: { host: '192.168.1.100', port: 9876, connected: false },
      nexusUser: null,
      nexusApiKey: ''
    };
  },

  onShow() {
    this.refreshHistory();
    this.desktopConfig = getDesktopConfig();
    this.nexusUser = getNexusUser();
    this.nexusApiKey = getNexusApiKey();
  },

  methods: {
    refreshHistory() {
      this.historyList = getPushHistory();
    },

    async rePushItem(item) {
      uni.showLoading({ title: '正在重新投递...' });
      try {
        const res = await pushModToDesktop(item, this.desktopConfig);
        uni.hideLoading();
        if (res.success) {
          uni.showToast({ title: '重推成功！', icon: 'success' });
          this.refreshHistory();
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
        uni.navigateTo({ url: '/pages/games/games' });
      } else if (target === 'favorites') {
        uni.navigateTo({ url: '/pages/favorites/favorites' });
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
  padding-bottom: 80rpx;
  box-sizing: border-box;
}

.historyContainer {
  padding: 24rpx;
}

.historyHeaderCard {
  background: #181a1f;
  border: 1rpx solid #292e3a;
  border-radius: 18rpx;
  padding: 20rpx;
  margin-bottom: 24rpx;
}

.historyHeaderTop {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.historyTitleCol {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.historyCountText {
  font-size: 26rpx;
  font-weight: 700;
  color: #ffffff;
}

.historySubTip {
  font-size: 19rpx;
  color: #828a99;
}

.clearAllBtn {
  font-size: 22rpx;
  color: #ef4444;
  cursor: pointer;
  padding: 8rpx 14rpx;
}

.historyListWrap {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.historyItem {
  display: flex;
  align-items: center;
  gap: 18rpx;
  padding: 20rpx;
  background: #191b20;
  border: 1rpx solid #282e39;
  border-radius: 16rpx;
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
  gap: 8rpx;
  overflow: hidden;
}

.historyTitle {
  font-size: 26rpx;
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

.historyGame {
  font-size: 20rpx;
  color: #d4a373;
}

.historyChannelTag {
  font-size: 18rpx;
  background: #232731;
  color: #9ca3af;
  padding: 2rpx 10rpx;
  border-radius: 6rpx;
}

.historyTime {
  font-size: 20rpx;
  color: #64748b;
}

.rePushBtn {
  background: rgba(218, 107, 23, 0.15);
  border: 1rpx solid rgba(218, 107, 23, 0.4);
  color: #da6b17;
  border-radius: 10rpx;
  padding: 12rpx 24rpx;
  margin: 0;
}

.rePushText {
  font-size: 22rpx;
  font-weight: 700;
  color: #da6b17;
}

.emptyHistoryBox {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 40rpx;
  gap: 20rpx;
}

.emptyIcon {
  font-size: 80rpx;
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
