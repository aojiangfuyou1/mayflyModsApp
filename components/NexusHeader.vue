<template>
  <!-- ======================================================================== -->
  <!-- NexusHeader：统一全局标准顶栏组件 (抽屉/返回 + 橙标 + 搜索/分享 + 设备 + 用户) -->
  <!-- ======================================================================== -->
  <view class="nexusHeaderWrapper">
    <!-- 手机原生状态栏全黑安全占位区 (解决全屏与手机顶部时间电量叠加问题) -->
    <view class="statusBarSpacer"></view>

    <!-- 顶栏主体 (纯黑高定底色) -->
    <view class="nexusHeader">
      <!-- 左侧区域：抽屉按钮 或 返回按钮 (仅在指定显示或二级返回时呈现) -->
      <view class="headerBtn" v-if="showBack || showDrawer" @click="handleLeftBtnClick">
        <text class="headerIcon">{{ showBack ? '←' : '☰' }}</text>
      </view>

      <!-- 中间区域：mayflymods 官方品牌图标与标题 -->
      <view class="headerLogoArea" @click="$emit('logo-click')">
        <view class="nexusLogoBox">
          <image class="headerLogoImg" src="/static/logo.png" mode="aspectFit" />
        </view>
        <text class="headerPageTitle">{{ title || 'mayflymods' }}</text>
      </view>

      <!-- 右侧功能区：搜索 + 电脑端指示灯 + 官方用户头像 (默认隐藏防安卓全屏打孔遮挡) -->
      <view class="headerRightArea" v-if="showRightIcons">
        <view class="headerBtn" v-if="showSearch" @click="$emit('search-click')">
          <NexusIcon name="search" size="36rpx" color="#cbd5e1" />
        </view>
        <view class="headerBtn pcBtn" @click="$emit('pc-click')">
          <NexusIcon name="desktop" size="36rpx" :color="desktopConfig && desktopConfig.connected ? '#10b981' : '#94a3b8'" />
          <view class="onlineDot" :class="{ connected: desktopConfig && desktopConfig.connected }"></view>
        </view>
        <view class="headerBtn userBtn" @click="$emit('user-click')">
          <image
            v-if="nexusUser && nexusUser.avatar"
            class="headerAvatarImg"
            :src="nexusUser.avatar"
            mode="aspectFill"
          />
          <NexusIcon v-else name="user" size="36rpx" color="#cbd5e1" />
          <view v-if="nexusUser && nexusUser.isPremium" class="headerPremiumBadge">👑</view>
          <view v-else-if="!nexusUser" class="authNoticeDot"></view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
// ============================================================================
// NexusHeader 组件逻辑：沉浸式全局统一顶栏
// ============================================================================
import NexusIcon from './NexusIcon.vue';

export default {
  name: 'NexusHeader',
  components: {
    NexusIcon
  },
  props: {
    title: {
      type: String,
      default: ''
    },
    showBack: {
      type: Boolean,
      default: false
    },
    showDrawer: {
      type: Boolean,
      default: false
    },
    showSearch: {
      type: Boolean,
      default: true
    },
    showRightIcons: {
      type: Boolean,
      default: false
    },
    desktopConfig: {
      type: Object,
      default: () => ({ connected: false })
    },
    nexusUser: {
      type: Object,
      default: null
    }
  },

  methods: {
    handleLeftBtnClick() {
      if (this.showBack) {
        this.$emit('back-click');
      } else {
        this.$emit('drawer-click');
      }
    }
  }
};
</script>

<style scoped>
/* ============================================================================ */
/* NexusHeader 顶栏样式                                                         */
/* ============================================================================ */
.nexusHeaderWrapper {
  position: sticky;
  top: 0;
  z-index: 100;
  width: 100%;
  background-color: #000000;
}

/* 手机原生状态栏安全占位区 (纯黑底色，确保手机系统电量、时间清晰不遮挡) */
.statusBarSpacer {
  width: 100%;
  height: var(--status-bar-height);
  padding-top: env(safe-area-inset-top);
  background-color: #000000;
  box-sizing: content-box;
}

.nexusHeader {
  height: 96rpx;
  background-color: #000000;
  border-bottom: 1rpx solid #1a1a1a;
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
  gap: 14rpx;
  cursor: pointer;
}

.nexusLogoBox {
  width: 56rpx;
  height: 56rpx;
  border-radius: 14rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.headerLogoImg {
  width: 100%;
  height: 100%;
}

.headerPageTitle {
  font-size: 26rpx;
  font-weight: 700;
  color: #e5e7eb;
}

.headerRightArea {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.pcBtn,
.userBtn {
  position: relative;
}

.headerAvatarImg {
  width: 52rpx;
  height: 52rpx;
  border-radius: 50%;
  border: 2rpx solid #da6b17;
}

.headerPremiumBadge {
  position: absolute;
  top: -4rpx;
  right: -4rpx;
  font-size: 20rpx;
}

.authNoticeDot {
  position: absolute;
  top: 14rpx;
  right: 14rpx;
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  background-color: #da6b17;
}

.onlineDot {
  position: absolute;
  bottom: 12rpx;
  right: 12rpx;
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
</style>
