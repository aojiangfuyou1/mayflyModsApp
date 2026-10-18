<template>
  <!-- ======================================================================== -->
  <!-- 组件名称：UpgradeModal 自动检测更新与下载进度弹窗组件                    -->
  <!-- 功能描述：提供暗黑毛玻璃风格的发现新版本通知、更新日志展示、平滑下载进度  -->
  <!--           与一键重启生效/唤起安装                                        -->
  <!-- ======================================================================== -->
  <view class="upgradeModalContainer" v-if="visible" @touchmove.stop.prevent>
    <!-- 1. 背景暗黑磨砂遮罩 -->
    <view class="upgradeBackdrop" @click="handleBackdropClick"></view>

    <!-- 2. 主体弹窗卡片 -->
    <view class="upgradeCard">
      <!-- 2.1 顶部主题插画微标与版本标签 -->
      <view class="upgradeHeader">
        <view class="upgradeIconBox">
          <NexusIcon name="sparkles" size="52rpx" color="#ffffff" />
        </view>
        <view class="upgradeTitleCol">
          <view class="titleRow">
            <text class="upgradeMainTitle">{{ updateInfo.title || '发现新版本' }}</text>
            <text class="upgradeTypeTag" :class="updateInfo.updateType === 'wgt' ? 'wgt' : 'apk'">
              {{ updateInfo.updateType === 'wgt' ? '⚡ 资源热更' : '📦 完整整包' }}
            </text>
          </view>
          <text class="upgradeVersionSub">最新版本: v{{ updateInfo.versionName }} {{ updateInfo.size ? `· ${updateInfo.size}` : '' }}</text>
        </view>
      </view>

      <!-- 2.2 更新日志列表 (支持平滑滚动) -->
      <view class="changelogWrap">
        <text class="changelogTitle">本次更新内容：</text>
        <scroll-view class="changelogScroll" scroll-y>
          <view class="changelogList">
            <view class="changelogItem" v-for="(log, idx) in formattedChangelog" :key="idx">
              <text class="logDot">✦</text>
              <text class="logText">{{ log }}</text>
            </view>
          </view>
        </scroll-view>
      </view>

      <!-- 2.3 下载进度展示区 (下载中时显示) -->
      <view class="progressSection" v-if="isDownloading || isInstalled">
        <view class="progressInfoRow">
          <text class="progressLabel">{{ isInstalled ? '已准备就绪' : '正在下载升级资源...' }}</text>
          <text class="progressPercent">{{ downloadPercent }}%</text>
        </view>
        <view class="progressBarTrack">
          <view class="progressBarFill" :style="{ width: downloadPercent + '%' }"></view>
        </view>
        <text class="progressTipText" v-if="isDownloading">请稍候，下载完成后将自动安装...</text>
      </view>

      <!-- 2.4 错误提示信息 -->
      <view class="errorRow" v-if="errorMessage">
        <text class="errorText">⚠️ {{ errorMessage }}</text>
      </view>

      <!-- 2.5 底部操作按钮组 -->
      <view class="upgradeActionsRow">
        <!-- 稍后再说按钮 (强制更新时不展示，下载中时禁用) -->
        <button
          class="upgradeCancelBtn"
          @click="handleClose"
          v-if="!updateInfo.isForce && !isDownloading && !isInstalled"
        >
          <text class="cancelBtnText">稍后再说</text>
        </button>

        <!-- 核心操作按钮 (立即升级 / 重启应用) -->
        <button
          class="upgradeConfirmBtn"
          :class="{ full: updateInfo.isForce || isDownloading || isInstalled }"
          :disabled="isDownloading"
          @click="handleActionClick"
        >
          <text class="confirmBtnText">
            {{ isInstalled ? '立即重启生效' : (isDownloading ? `正在下载 (${downloadPercent}%)` : '立即下载升级') }}
          </text>
        </button>
      </view>
    </view>
  </view>
</template>

<script>
// ============================================================================
// 脚本逻辑：升级弹窗状态控制与下载安装联动
// ============================================================================
import NexusIcon from './NexusIcon.vue';
import { downloadAndInstall } from '../services/upgrade.js';

export default {
  name: 'UpgradeModal',
  components: {
    NexusIcon
  },
  props: {
    // 弹窗可见性
    visible: {
      type: Boolean,
      default: false
    },
    // 云端更新元数据信息
    updateInfo: {
      type: Object,
      default: () => ({
        versionCode: 0,
        versionName: '1.0.0',
        updateType: 'wgt',
        downloadUrl: '',
        isForce: false,
        title: '发现新版本',
        changelog: [],
        size: ''
      })
    }
  },
  data() {
    return {
      isDownloading: false,
      downloadPercent: 0,
      isInstalled: false,
      errorMessage: ''
    };
  },
  computed: {
    formattedChangelog() {
      if (Array.isArray(this.updateInfo.changelog) && this.updateInfo.changelog.length > 0) {
        return this.updateInfo.changelog;
      }
      return ['常规功能稳定性提升与细节优化'];
    }
  },
  watch: {
    visible(val) {
      if (!val) {
        // 重置状态
        this.isDownloading = false;
        this.downloadPercent = 0;
        this.isInstalled = false;
        this.errorMessage = '';
      }
    }
  },
  methods: {
    handleBackdropClick() {
      if (!this.updateInfo.isForce && !this.isDownloading) {
        this.handleClose();
      }
    },

    handleClose() {
      this.$emit('close');
    },

    /**
     * 响应主按钮点击 (下载或重启生效)
     */
    async handleActionClick() {
      if (this.isInstalled) {
        // #ifdef APP-PLUS
        plus.runtime.restart();
        // #endif
        this.$emit('done');
        return;
      }

      if (this.isDownloading) return;

      this.isDownloading = true;
      this.errorMessage = '';
      this.downloadPercent = 0;

      try {
        const res = await downloadAndInstall(this.updateInfo, (percent) => {
          this.downloadPercent = percent;
        });

        this.isDownloading = false;
        if (res.needRestart) {
          this.isInstalled = true;
          this.downloadPercent = 100;
        } else {
          // APK 整包调起安装器后收起弹窗
          uni.showToast({ title: '已唤起系统安装', icon: 'success' });
          setTimeout(() => {
            this.handleClose();
          }, 1200);
        }
      } catch (err) {
        this.isDownloading = false;
        this.errorMessage = err.message || '升级安装遇到问题，请重试';
      }
    }
  }
};
</script>

<style scoped>
/* ============================================================================ */
/* UpgradeModal 样式：100% 契合 Mayfly 深黑暗金美学与毛玻璃质感                 */
/* ============================================================================ */
.upgradeModalContainer {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40rpx;
  box-sizing: border-box;
}

.upgradeBackdrop {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.78);
  backdrop-filter: blur(12px);
}

.upgradeCard {
  position: relative;
  z-index: 10;
  width: 100%;
  max-width: 620rpx;
  background: #181b22;
  border: 1rpx solid #2e374a;
  border-radius: 28rpx;
  box-shadow: 0 24rpx 60rpx rgba(0, 0, 0, 0.85);
  padding: 36rpx 32rpx;
  box-sizing: border-box;
  animation: popUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes popUp {
  from {
    opacity: 0;
    transform: scale(0.92) translateY(20rpx);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* 顶部信息行 */
.upgradeHeader {
  display: flex;
  align-items: center;
  gap: 20rpx;
  margin-bottom: 24rpx;
}

.upgradeIconBox {
  width: 90rpx;
  height: 90rpx;
  border-radius: 22rpx;
  background: linear-gradient(135deg, #da6b17, #f97316);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 20rpx rgba(218, 107, 23, 0.4);
  flex-shrink: 0;
}

.upgradeTitleCol {
  flex: 1;
  min-width: 0;
}

.titleRow {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 6rpx;
}

.upgradeMainTitle {
  font-size: 32rpx;
  font-weight: 700;
  color: #ffffff;
}

.upgradeTypeTag {
  font-size: 18rpx;
  font-weight: 600;
  padding: 2rpx 10rpx;
  border-radius: 8rpx;
}

.upgradeTypeTag.wgt {
  background: rgba(16, 185, 129, 0.15);
  color: #34d399;
  border: 1rpx solid rgba(16, 185, 129, 0.3);
}

.upgradeTypeTag.apk {
  background: rgba(56, 189, 248, 0.15);
  color: #38bdf8;
  border: 1rpx solid rgba(56, 189, 248, 0.3);
}

.upgradeVersionSub {
  font-size: 22rpx;
  color: #94a3b8;
}

/* 更新日志列表 */
.changelogWrap {
  background: #12141a;
  border: 1rpx solid #232938;
  border-radius: 16rpx;
  padding: 20rpx 24rpx;
  margin-bottom: 24rpx;
}

.changelogTitle {
  font-size: 22rpx;
  font-weight: 600;
  color: #cbd5e1;
  display: block;
  margin-bottom: 12rpx;
}

.changelogScroll {
  max-height: 240rpx;
}

.changelogList {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.changelogItem {
  display: flex;
  align-items: flex-start;
  gap: 10rpx;
}

.logDot {
  font-size: 18rpx;
  color: #da6b17;
  line-height: 32rpx;
}

.logText {
  font-size: 22rpx;
  color: #94a3b8;
  line-height: 32rpx;
  flex: 1;
}

/* 下载进度条 */
.progressSection {
  margin-bottom: 20rpx;
}

.progressInfoRow {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10rpx;
}

.progressLabel {
  font-size: 22rpx;
  color: #94a3b8;
}

.progressPercent {
  font-size: 22rpx;
  font-weight: 700;
  color: #da6b17;
}

.progressBarTrack {
  width: 100%;
  height: 12rpx;
  background: #232938;
  border-radius: 6rpx;
  overflow: hidden;
  margin-bottom: 8rpx;
}

.progressBarFill {
  height: 100%;
  background: linear-gradient(90deg, #da6b17, #f97316);
  border-radius: 6rpx;
  transition: width 0.2s ease;
}

.progressTipText {
  font-size: 18rpx;
  color: #64748b;
  display: block;
  text-align: center;
}

.errorRow {
  margin-bottom: 16rpx;
  padding: 10rpx 16rpx;
  background: rgba(239, 68, 68, 0.1);
  border-radius: 10rpx;
}

.errorText {
  font-size: 20rpx;
  color: #f87171;
  line-height: 1.4;
}

/* 按钮组 */
.upgradeActionsRow {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-top: 8rpx;
}

.upgradeCancelBtn {
  flex: 1;
  height: 76rpx;
  background: #20242f;
  border: 1rpx solid #333d52;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0;
}

.cancelBtnText {
  font-size: 26rpx;
  color: #94a3b8;
  font-weight: 500;
}

.upgradeConfirmBtn {
  flex: 1.6;
  height: 76rpx;
  background: linear-gradient(135deg, #da6b17, #f97316);
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 20rpx rgba(218, 107, 23, 0.35);
  border: none;
  margin: 0;
}

.upgradeConfirmBtn.full {
  flex: 1;
}

.upgradeConfirmBtn[disabled] {
  opacity: 0.65;
}

.confirmBtnText {
  font-size: 26rpx;
  color: #ffffff;
  font-weight: 700;
}
</style>
