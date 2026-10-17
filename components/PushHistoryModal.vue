<template>
  <!-- ======================================================================== -->
  <!-- 推送任务清单与历史记录抽屉弹窗组件 (多页面复用)                         -->
  <!-- ======================================================================== -->
  <view class="modalOverlay" v-if="visible" @click="close">
    <view class="historyDrawerContent" @click.stop>
      <!-- 抽屉顶栏 -->
      <view class="drawerHeader">
        <view class="drawerTitleBox">
          <view class="drawerTitleRow">
            <NexusIcon name="task" size="26rpx" color="#38bdf8" />
            <text class="drawerTitle">推送任务清单 ({{ historyList.length }})</text>
          </view>
          <text class="drawerSub">已推送到电脑 Mayfly 的模组</text>
        </view>
        <view class="drawerActions">
          <view class="modalClearChip" v-if="historyList.length > 0" @click="handleClearHistory">
            <NexusIcon name="trash" size="20rpx" color="#f87171" />
            <text class="modalClearText">清空</text>
          </view>
          <view class="modalCloseBtn" @click="close">✕</view>
        </view>
      </view>

      <!-- 历史清单滚动列表 -->
      <scroll-view scroll-y class="historyScrollList">
        <view class="historyEmpty" v-if="historyList.length === 0">
          <NexusIcon name="task" size="64rpx" color="#475569" style="margin-bottom: 8rpx;" />
          <text class="emptyTipText">暂无推送记录，挑选心仪的 Mod 体验一键推送吧！</text>
        </view>

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
      </scroll-view>
    </view>

    <!-- 自研暗黑对话框 / 确认弹窗组件 (替代原生 uni.showModal) -->
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
// PushHistoryModal 组件逻辑：展示与管理推送到电脑端的任务记录
// ============================================================================
import {
  syncHistoryWithDesktop,
  autoTranslateHistoryList
} from '../services/history.js';
import { getDesktopConfig } from '../services/nexus.js';
import NexusIcon from './NexusIcon.vue';
import NexusModal from './NexusModal.vue';

export default {
  name: 'PushHistoryModal',
  components: {
    NexusIcon,
    NexusModal
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    historyList: {
      type: Array,
      default: () => []
    }
  },

  data() {
    return {
      statusTimer: null,
      confirmModal: {
        visible: false,
        title: '清空历史任务？',
        content: '',
        type: 'danger',
        icon: 'trash',
        confirmText: '清空',
        cancelText: '取消',
        showCancel: true,
        onConfirm: null
      }
    };
  },

  watch: {
    visible(newVal) {
      if (newVal) {
        this.syncAndTranslate();
        this.startPollingStatus();
      } else {
        this.stopPollingStatus();
      }
    }
  },

  beforeDestroy() {
    this.stopPollingStatus();
  },

  methods: {
    /**
     * 关闭弹窗
     */
    close() {
      this.stopPollingStatus();
      this.$emit('close');
    },

    /**
     * 同步电脑端真实下载/安装状态，并对未翻译标题进行自动汉化
     */
    async syncAndTranslate() {
      const desktopConfig = getDesktopConfig();
      if (desktopConfig && desktopConfig.host) {
        await syncHistoryWithDesktop(desktopConfig);
        this.$emit('refresh');
      }
      await autoTranslateHistoryList(this.historyList);
      this.$emit('refresh');
    },

    /**
     * 开启轻量轮询
     */
    startPollingStatus() {
      this.stopPollingStatus();
      this.statusTimer = setInterval(async () => {
        const desktopConfig = getDesktopConfig();
        if (!desktopConfig || !desktopConfig.host) return;
        const hasDownloading = this.historyList.some(
          (i) => i.status === 'downloading' || !i.status
        );
        if (hasDownloading) {
          await syncHistoryWithDesktop(desktopConfig);
          this.$emit('refresh');
        }
      }, 3000);
    },

    /**
     * 停止轮询
     */
    stopPollingStatus() {
      if (this.statusTimer) {
        clearInterval(this.statusTimer);
        this.statusTimer = null;
      }
    },

    /**
     * 自研暗黑对话框确认操作
     */
    onConfirmModalAction() {
      this.confirmModal.visible = false;
      if (typeof this.confirmModal.onConfirm === 'function') {
        this.confirmModal.onConfirm();
      }
    },

    /**
     * 清空历史记录 (使用自研暗黑微光 NexusModal 组件)
     */
    handleClearHistory() {
      this.confirmModal = {
        visible: true,
        title: '清空历史任务？',
        content: '确定要清空当前的推送记录吗？不会影响电脑端已下载的模组。',
        type: 'danger',
        icon: 'trash',
        confirmText: '清空',
        cancelText: '取消',
        showCancel: true,
        onConfirm: () => {
          this.$emit('clear');
        }
      };
    },

    /**
     * 重新推送
     */
    rePushItem(item) {
      this.$emit('repush', item);
    },

    /**
     * 友好时间格式化
     */
    formatHistoryTime(ts) {
      if (!ts) return '';
      const now = Date.now();
      const diff = Math.floor((now - Number(ts)) / 1000);
      if (diff < 60) return '刚刚';
      if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`;
      if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`;
      const d = new Date(Number(ts));
      return `${d.getMonth() + 1}-${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    }
  }
};
</script>

<style scoped>
/* ============================================================================ */
/* PushHistoryModal 弹窗样式                                                    */
/* ============================================================================ */
.modalOverlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(8px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32rpx;
  box-sizing: border-box;
}

.historyDrawerContent {
  width: 100%;
  max-width: 680rpx;
  max-height: 80vh;
  background: #181a1f;
  border: 1rpx solid #2d3340;
  border-radius: 24rpx;
  padding: 32rpx;
  box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.8);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  animation: modalIn 0.25s ease-out;
}

@keyframes modalIn {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(20rpx);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.drawerHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
  padding-bottom: 16rpx;
  border-bottom: 1rpx solid rgba(255, 255, 255, 0.08);
}

.drawerTitleBox {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.drawerTitleRow {
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.drawerTitle {
  font-size: 28rpx;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: 0.5rpx;
}

.drawerSub {
  font-size: 20rpx;
  color: #94a3b8;
}

.drawerActions {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

/* 顶部清空微胶囊 */
.modalClearChip {
  display: inline-flex;
  align-items: center;
  gap: 8rpx;
  background: rgba(239, 68, 68, 0.1);
  border: 1rpx solid rgba(239, 68, 68, 0.25);
  border-radius: 20rpx;
  padding: 8rpx 18rpx;
  cursor: pointer;
  transition: all 0.2s ease;
}

.modalClearChip:active {
  background: rgba(239, 68, 68, 0.2);
  transform: scale(0.95);
}

.modalClearText {
  font-size: 20rpx;
  color: #f87171;
  font-weight: 600;
}

.modalCloseBtn {
  font-size: 32rpx;
  color: #94a3b8;
  padding: 6rpx 10rpx;
  cursor: pointer;
  line-height: 1;
  transition: color 0.2s ease;
}

.modalCloseBtn:active {
  color: #ffffff;
}

.historyScrollList {
  flex: 1;
  max-height: 60vh;
}

.historyEmpty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80rpx 20rpx;
  gap: 16rpx;
}

.emptyTipText {
  font-size: 22rpx;
  color: #64748b;
  text-align: center;
  line-height: 1.4;
}

/* ============================================================================ */
/* 任务项卡片与微光渐变                                                         */
/* ============================================================================ */
.historyItem {
  display: flex;
  align-items: center;
  gap: 18rpx;
  padding: 16rpx;
  background: linear-gradient(145deg, #1f232b 0%, #171a20 100%);
  border: 1rpx solid rgba(255, 255, 255, 0.07);
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.25);
  border-radius: 16rpx;
  margin-bottom: 14rpx;
  transition: all 0.2s ease;
}

.historyItem:active {
  transform: scale(0.99);
  border-color: rgba(255, 255, 255, 0.12);
}

/* 黄金比例封面缩略图 */
.thumbWrap {
  position: relative;
  width: 120rpx;
  height: 84rpx;
  border-radius: 10rpx;
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
  bottom: 2rpx;
  right: 2rpx;
  background: rgba(0, 0, 0, 0.78);
  backdrop-filter: blur(4px);
  color: #94a3b8;
  font-size: 14rpx;
  font-weight: 600;
  padding: 1rpx 4rpx;
  border-radius: 4rpx;
  line-height: 1.2;
}

.historyBody {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
  overflow: hidden;
}

.historyTitle {
  font-size: 24rpx;
  font-weight: 700;
  color: #ffffff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.3;
}

.historyOriginalTitle {
  font-size: 18rpx;
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
  font-size: 18rpx;
  color: #64748b;
  line-height: 1.2;
}

.historyGame {
  color: #f59e0b;
  font-weight: 600;
  max-width: 180rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.metaDivider {
  color: #475569;
}

.historyTime {
  color: #64748b;
  font-size: 18rpx;
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
/* 右侧精致微胶囊状态与操作 (告别粗笨大方块按钮)                                   */
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
</style>
