<template>
  <!-- ======================================================================== -->
  <!-- 推送任务清单与历史记录抽屉弹窗组件 (多页面复用)                         -->
  <!-- ======================================================================== -->
  <view class="modalOverlay" v-if="visible" @click="close">
    <view class="historyDrawerContent" @click.stop>
      <!-- 抽屉顶栏 -->
      <view class="drawerHeader">
        <view class="drawerTitleBox">
          <text class="drawerTitle">📋 推送任务清单</text>
          <text class="drawerSub">已推送到电脑 Mayfly 的模组</text>
        </view>
        <view class="drawerActions">
          <text class="clearHistoryText" v-if="historyList.length > 0" @click="handleClearHistory">清空</text>
          <view class="modalCloseBtn" @click="close">✕</view>
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
</template>

<script>
// ============================================================================
// PushHistoryModal 组件逻辑：展示与管理推送到电脑端的任务记录
// ============================================================================
export default {
  name: 'PushHistoryModal',
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

  methods: {
    /**
     * 关闭弹窗
     */
    close() {
      this.$emit('close');
    },

    /**
     * 清空历史记录
     */
    handleClearHistory() {
      uni.showModal({
        title: '清空历史任务？',
        content: '确定要清空当前的推送记录吗？不会影响电脑端已下载的模组。',
        success: (res) => {
          if (res.confirm) {
            this.$emit('clear');
          }
        }
      });
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
  border-bottom: 1rpx solid #232731;
}

.drawerTitleBox {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.drawerTitle {
  font-size: 30rpx;
  font-weight: 700;
  color: #ffffff;
}

.drawerSub {
  font-size: 20rpx;
  color: #9ca3af;
}

.drawerActions {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.clearHistoryText {
  font-size: 22rpx;
  color: #ef4444;
  cursor: pointer;
  padding: 6rpx 10rpx;
}

.modalCloseBtn {
  font-size: 32rpx;
  color: #9ca3af;
  padding: 8rpx;
  cursor: pointer;
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
  padding: 60rpx 20rpx;
  gap: 16rpx;
}

.emptyTipIcon {
  font-size: 64rpx;
}

.emptyTipText {
  font-size: 22rpx;
  color: #6b7280;
  text-align: center;
}

.historyItem {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 16rpx;
  background: #1f232b;
  border: 1rpx solid #2c3340;
  border-radius: 14rpx;
  margin-bottom: 14rpx;
}

.historyThumb {
  width: 90rpx;
  height: 90rpx;
  border-radius: 10rpx;
  flex-shrink: 0;
}

.historyBody {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
  overflow: hidden;
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
  gap: 10rpx;
}

.historyGame {
  font-size: 18rpx;
  color: #d4a373;
}

.historyChannelTag {
  font-size: 16rpx;
  background: #2a313d;
  color: #9ca3af;
  padding: 2rpx 8rpx;
  border-radius: 6rpx;
}

.historyTime {
  font-size: 18rpx;
  color: #6b7280;
}

.rePushBtn {
  background: rgba(218, 107, 23, 0.15);
  border: 1rpx solid rgba(218, 107, 23, 0.4);
  color: #da6b17;
  border-radius: 10rpx;
  padding: 10rpx 18rpx;
  margin: 0;
}

.rePushText {
  font-size: 20rpx;
  font-weight: 700;
  color: #da6b17;
}
</style>
