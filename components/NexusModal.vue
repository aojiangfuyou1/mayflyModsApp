<template>
  <!-- ======================================================================== -->
  <!-- 组件名称：NexusModal 暗黑高定全局对话框 / 确认弹窗组件                  -->
  <!-- 功能描述：完全替代丑陋生硬的原生白色 uni.showModal，深度契合 Mayfly 暗黑风格 -->
  <!--           支持危险确认 (清空/删除)、警告提示、操作引导与成功警示        -->
  <!-- ======================================================================== -->
  <view class="nexusModalOverlay" v-if="visible" @click="handleOverlayClick">
    <view class="nexusModalCard" @click.stop>
      <!-- ==================================================================== -->
      <!-- 区域 1：顶部状态光晕徽标                                             -->
      <!-- ==================================================================== -->
      <view class="modalIconWrap" :class="[typeClass]">
        <NexusIcon :name="resolvedIcon" size="44rpx" :color="iconColor" />
      </view>

      <!-- ==================================================================== -->
      <!-- 区域 2：主标题与正文说明                                             -->
      <!-- ==================================================================== -->
      <text class="modalTitleText">{{ title || '提示' }}</text>
      <text class="modalContentText" v-if="content">{{ content }}</text>
      <!-- 支持自定义插槽内容 -->
      <slot></slot>

      <!-- ==================================================================== -->
      <!-- 区域 3：底部操作按钮栏 (告别粗笨大白框与生硬原生按钮)                -->
      <!-- ==================================================================== -->
      <view class="modalActionsRow">
        <!-- 取消按钮 (可选) -->
        <view
          class="modalBtn cancelBtn"
          v-if="showCancel"
          @click="handleCancel"
        >
          <text class="cancelBtnText">{{ cancelText || '取消' }}</text>
        </view>

        <!-- 确认 / 执行按钮 -->
        <view
          class="modalBtn confirmBtn"
          :class="[typeClass]"
          @click="handleConfirm"
        >
          <text class="confirmBtnText">{{ confirmText || '确定' }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
// ============================================================================
// NexusModal 逻辑实现：移动端暗黑风格统一确认/警告弹窗
// ============================================================================
import NexusIcon from './NexusIcon.vue';

export default {
  name: 'NexusModal',
  components: {
    NexusIcon
  },
  props: {
    // 弹窗显隐
    visible: {
      type: Boolean,
      default: false
    },
    // 弹窗标题
    title: {
      type: String,
      default: '提示'
    },
    // 弹窗详情正文
    content: {
      type: String,
      default: ''
    },
    // 弹窗类型: 'danger' (危险/删除) | 'warning' (警告) | 'info' (常规) | 'success' (成功)
    type: {
      type: String,
      default: 'danger'
    },
    // 自定义顶部图标 (为空时自动根据 type 推断)
    icon: {
      type: String,
      default: ''
    },
    // 确认按钮文本
    confirmText: {
      type: String,
      default: '确定'
    },
    // 取消按钮文本
    cancelText: {
      type: String,
      default: '取消'
    },
    // 是否显示取消按钮 (为 false 时退化为 Alert 提醒框)
    showCancel: {
      type: Boolean,
      default: true
    },
    // 点击深色毛玻璃蒙层是否关闭
    closeOnClickOverlay: {
      type: Boolean,
      default: true
    }
  },

  computed: {
    typeClass() {
      return `is-${this.type || 'info'}`;
    },

    /**
     * 根据弹窗业务类型智能分发矢量图标
     */
    resolvedIcon() {
      if (this.icon) return this.icon;
      switch (this.type) {
        case 'danger':
          return 'trash';
        case 'warning':
          return 'warning';
        case 'success':
          return 'check';
        case 'info':
        default:
          return 'info';
      }
    },

    /**
     * 根据弹窗业务类型分发图标主题色
     */
    iconColor() {
      switch (this.type) {
        case 'danger':
          return '#f87171';
        case 'warning':
          return '#fbbf24';
        case 'success':
          return '#34d399';
        case 'info':
        default:
          return '#38bdf8';
      }
    }
  },

  methods: {
    handleOverlayClick() {
      if (this.closeOnClickOverlay) {
        this.handleCancel();
      }
    },

    handleCancel() {
      this.$emit('cancel');
      this.$emit('close');
      this.$emit('update:visible', false);
    },

    handleConfirm() {
      this.$emit('confirm');
      this.$emit('update:visible', false);
    }
  }
};
</script>

<style scoped>
/* ============================================================================ */
/* NexusModal 蒙层与动效容器                                                    */
/* ============================================================================ */
.nexusModalOverlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(12px);
  z-index: 99999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40rpx;
  box-sizing: border-box;
  animation: overlayFadeIn 0.2s ease-out;
}

@keyframes overlayFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* ============================================================================ */
/* 弹窗核心卡片 (暗黑微光质感 + 精致圆角)                                         */
/* ============================================================================ */
.nexusModalCard {
  width: 100%;
  max-width: 580rpx;
  background: linear-gradient(155deg, #1d212a 0%, #13151b 100%);
  border: 1rpx solid rgba(255, 255, 255, 0.1);
  border-radius: 28rpx;
  box-shadow: 0 24rpx 64rpx rgba(0, 0, 0, 0.85);
  padding: 40rpx 36rpx 32rpx;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  animation: modalScaleIn 0.24s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes modalScaleIn {
  from {
    opacity: 0;
    transform: scale(0.92) translateY(24rpx);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* ============================================================================ */
/* 顶部微光光晕图标徽章                                                         */
/* ============================================================================ */
.modalIconWrap {
  width: 88rpx;
  height: 88rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20rpx;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

/* 危险 / 绯红 (如清空、删除) */
.modalIconWrap.is-danger {
  background: rgba(239, 68, 68, 0.12);
  border: 1rpx solid rgba(239, 68, 68, 0.3);
  box-shadow: 0 0 24rpx rgba(239, 68, 68, 0.2);
}

/* 警告 / 琥珀 */
.modalIconWrap.is-warning {
  background: rgba(245, 158, 11, 0.12);
  border: 1rpx solid rgba(245, 158, 11, 0.3);
  box-shadow: 0 0 24rpx rgba(245, 158, 11, 0.2);
}

/* 信息 / 科技青蓝 */
.modalIconWrap.is-info {
  background: rgba(56, 189, 248, 0.12);
  border: 1rpx solid rgba(56, 189, 248, 0.3);
  box-shadow: 0 0 24rpx rgba(56, 189, 248, 0.2);
}

/* 成功 / 翡翠绿 */
.modalIconWrap.is-success {
  background: rgba(16, 185, 129, 0.12);
  border: 1rpx solid rgba(16, 185, 129, 0.3);
  box-shadow: 0 0 24rpx rgba(16, 185, 129, 0.2);
}

/* ============================================================================ */
/* 文本排版 (告别原生的硬邦邦黑白居中文本)                                      */
/* ============================================================================ */
.modalTitleText {
  font-size: 32rpx;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: 0.5rpx;
  margin-bottom: 12rpx;
  line-height: 1.35;
}

.modalContentText {
  font-size: 24rpx;
  color: #94a3b8;
  line-height: 1.55;
  margin-bottom: 36rpx;
  padding: 0 12rpx;
  word-break: break-all;
}

/* ============================================================================ */
/* 底部按键组 (告别原生丑陋白色分栏按键)                                         */
/* ============================================================================ */
.modalActionsRow {
  display: flex;
  align-items: center;
  gap: 20rpx;
  width: 100%;
}

.modalBtn {
  flex: 1;
  height: 76rpx;
  border-radius: 38rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  user-select: none;
  cursor: pointer;
  box-sizing: border-box;
  transition: all 0.2s ease;
}

.modalBtn:active {
  transform: scale(0.96);
}

/* 取消按钮：磨砂低反光深色灰胶囊 */
.cancelBtn {
  background: rgba(255, 255, 255, 0.06);
  border: 1rpx solid rgba(255, 255, 255, 0.12);
}

.cancelBtn:active {
  background: rgba(255, 255, 255, 0.12);
}

.cancelBtnText {
  font-size: 26rpx;
  color: #cbd5e1;
  font-weight: 600;
}

/* 确认按钮：依业务类型赋予高饱和度渐变 */
.confirmBtn.is-danger {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  border: 1rpx solid rgba(239, 68, 68, 0.6);
  box-shadow: 0 4rpx 18rpx rgba(239, 68, 68, 0.35);
}

.confirmBtn.is-warning {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  border: 1rpx solid rgba(245, 158, 11, 0.6);
  box-shadow: 0 4rpx 18rpx rgba(245, 158, 11, 0.35);
}

.confirmBtn.is-info {
  background: linear-gradient(135deg, #da6b17 0%, #b8540c 100%);
  border: 1rpx solid rgba(218, 107, 23, 0.6);
  box-shadow: 0 4rpx 18rpx rgba(218, 107, 23, 0.35);
}

.confirmBtn.is-success {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border: 1rpx solid rgba(16, 185, 129, 0.6);
  box-shadow: 0 4rpx 18rpx rgba(16, 185, 129, 0.35);
}

.confirmBtnText {
  font-size: 26rpx;
  color: #ffffff;
  font-weight: 700;
  letter-spacing: 0.5rpx;
}
</style>
