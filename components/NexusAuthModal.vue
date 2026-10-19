<template>
  <!-- ======================================================================== -->
  <!-- NexusMods 官方账户中心与 API 授权统一弹窗组件 (多页面复用)             -->
  <!-- ======================================================================== -->
  <view class="modalOverlay" v-if="visible" @click.self="close">
    <view class="nexusAuthModalContent" @click.stop>
      <!-- 弹窗顶栏 -->
      <view class="authModalHeader">
        <view class="authModalTitleRow">
          <text class="nexusAuthBrandIcon">❖</text>
          <text class="modalTitle">NexusMods 账户与授权</text>
        </view>
        <view class="modalCloseBtn" @click="close">✕</view>
      </view>

      <!-- ==================================================================== -->
      <!-- 区域 A：已登录状态展示 (用户信息、VIP特权卡片、更换Key与登出)        -->
      <!-- ==================================================================== -->
      <view class="authLoggedView" v-if="nexusUser">
        <view class="loggedProfileHeader">
          <view class="largeAvatarBox">
            <image v-if="nexusUser.avatar" class="largeAvatarImg" :src="nexusUser.avatar" mode="aspectFill" />
            <text v-else class="largeAvatarGlyph">👤</text>
            <view v-if="nexusUser.isPremium" class="crownCornerBadge">👑</view>
          </view>
          <view class="largeProfileInfo">
            <view class="largeNameRow">
              <text class="largeUserName">{{ nexusUser.name }}</text>
              <text v-if="nexusUser.isPremium" class="vipTag premium">👑 PREMIUM</text>
              <text v-else-if="nexusUser.isSupporter" class="vipTag supporter">💎 SUPPORTER</text>
              <text v-else class="vipTag standard">标准会员</text>
            </view>
            <text class="userUidText">N网用户 UID: {{ nexusUser.userId }}</text>
            <text class="userEmailText" v-if="nexusUser.email">{{ nexusUser.email }}</text>
          </view>
        </view>

        <!-- 底部登出与重新授权操作 -->
        <view class="authActionsRow">
          <button class="authSubBtn" @click="handleSwitchApiKey">
            <text class="authBtnText">更换 API Key</text>
          </button>
          <button class="authLogoutBtn" @click="handleLogoutNexus">
            <text class="authBtnText">退出登录</text>
          </button>
        </view>
      </view>

      <!-- ==================================================================== -->
      <!-- 区域 B：未登录状态授权表单 (只保留 Personal API Key 官方访问凭据)    -->
      <!-- ==================================================================== -->
      <view class="authLoginForm" v-else>
        <view class="authIntroBanner">
          <text class="authIntroTitle">🔑 绑定 NexusMods 官方账号</text>
          <text class="authIntroDesc">
            输入您的 Personal API Key 即可一键绑定账号，畅享无限制模组检索、查看详情与远程一键推送装机。
          </text>
        </view>

        <!-- 实时操作状态与提示横幅 (确保点击操作均有直观显眼的文字与色彩动效反馈) -->
        <view class="inlineStatusBanner" v-if="inlineNotice.text" :class="inlineNotice.type">
          <text class="statusBannerIcon">{{ inlineNotice.type === 'success' ? '✓' : inlineNotice.type === 'error' ? '⚠️' : 'ℹ️' }}</text>
          <text class="statusBannerText">{{ inlineNotice.text }}</text>
        </view>

        <!-- API Key 输入框 -->
        <view class="formItem">
          <view class="formLabelRow">
            <text class="formLabel">Personal API Key (个人访问密钥)</text>
            <text class="pasteQuickLink" @click="handlePasteClipboard">📋 粘贴剪贴板</text>
          </view>
          <view class="keyInputBox">
            <input
              class="keyInput"
              type="text"
              v-model="apiKeyInput"
              placeholder="在此粘贴以 nxm_ 开头的 API Key..."
              confirm-type="done"
              @confirm="handleLoginWithApiKey"
            />
            <text v-if="apiKeyInput" class="clearKeyBtn" @click="handleClearKey">✕</text>
          </view>
        </view>

        <!-- 登录按钮 (未填入时点击会有明确提示，不出现死灰无响应现象) -->
        <button
          class="authLoginBtn"
          :disabled="isVerifyingNexusKey"
          @click="handleLoginWithApiKey"
        >
          <text class="loginBtnText">{{ isVerifyingNexusKey ? '正在向 NexusMods 验证授权...' : '🚀 验证并登录' }}</text>
        </button>

        <!-- 贴心获取指引卡片 -->
        <view class="keyGuideCard">
          <view class="guideHeader">
            <text class="guideIcon">💡</text>
            <text class="guideTitle">如何获取免费官方 API Key？</text>
          </view>
          <view class="guideSteps">
            <text class="guideStepText">1. 点击下方按钮，一键复制官方申请页面链接；</text>
            <text class="guideStepText">2. 切换至手机/电脑浏览器中粘贴并打开；</text>
            <text class="guideStepText">3. 滑动至页面最底部点击【Request Key】生成，复制后返回粘贴即可。</text>
          </view>
          <view class="keyActionRow">
            <button class="copyUrlBtn actionBtn primaryCopyBtn" @click="handleCopyAndOpenBrowser">
              <text class="copyUrlBtnText">📋 复制官网链接到浏览器打开</text>
            </button>
          </view>
        </view>

        <!-- 底部常驻：从电脑端同步快捷入口 -->
        <button
          class="syncPcBtn"
          :disabled="isSyncingFromPc"
          @click="handleSyncFromDesktop"
        >
          <text class="syncPcBtnText">{{ isSyncingFromPc ? '正在探测电脑端 Mayfly...' : '💻 从电脑端 Mayfly 一键同步登录' }}</text>
        </button>
      </view>
    </view>

    <!-- 自研暗黑对话框 / 确认弹窗组件 (完全替代原生白色 uni.showModal) -->
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
// NexusAuthModal 组件逻辑：仅保留 Personal API Key 官方访问凭据与电脑端同步
// ============================================================================
import {
  logoutNexus,
  validateNexusApiKey,
  syncNexusFromDesktop
} from '../services/nexus.js';
import NexusModal from './NexusModal.vue';

export default {
  name: 'NexusAuthModal',
  components: {
    NexusModal
  },
  props: {
    // 弹窗可见性
    visible: {
      type: Boolean,
      default: false
    },
    // 当前登录的 NexusMods 用户对象
    nexusUser: {
      type: Object,
      default: null
    },
    // 电脑端配对配置 (用于一键同步)
    desktopConfig: {
      type: Object,
      default: () => ({})
    }
  },

  data() {
    return {
      apiKeyInput: '',
      isVerifyingNexusKey: false,
      isSyncingFromPc: false,
      // 弹窗内嵌实时状态提示 (成功/警告/信息)，确保即便系统 Toast 延迟用户也能立刻看清响应
      inlineNotice: {
        text: '',
        type: 'info'
      },
      noticeTimer: null,
      confirmModal: {
        visible: false,
        title: '提示',
        content: '',
        type: 'danger',
        icon: '',
        confirmText: '确定',
        cancelText: '取消',
        showCancel: true,
        onConfirm: null
      }
    };
  },

  watch: {
    visible(val) {
      if (val) {
        // 每次打开弹窗重置临时加载锁，防止被卡死
        this.isSyncingFromPc = false;
        this.isVerifyingNexusKey = false;
        this.inlineNotice = { text: '', type: 'info' };
        if (this.noticeTimer) {
          clearTimeout(this.noticeTimer);
          this.noticeTimer = null;
        }
      }
    }
  },

  methods: {
    /**
     * 设置弹窗内嵌高亮提示文本 (自动定时重置)
     * @param {string} text 提示内容
     * @param {'info' | 'error' | 'success'} type 类型
     * @param {number} duration 毫秒数 (默认 3500)
     */
    setNotice(text, type = 'info', duration = 3500) {
      if (this.noticeTimer) {
        clearTimeout(this.noticeTimer);
        this.noticeTimer = null;
      }
      this.inlineNotice = { text, type };
      if (duration > 0) {
        this.noticeTimer = setTimeout(() => {
          this.inlineNotice = { text: '', type: 'info' };
          this.noticeTimer = null;
        }, duration);
      }
    },

    /**
     * 清空当前输入的 API Key
     */
    handleClearKey() {
      this.apiKeyInput = '';
      this.setNotice('已清空 API Key 输入框', 'info', 2000);
    },

    /**
     * 关闭弹窗
     */
    close() {
      this.isSyncingFromPc = false;
      this.isVerifyingNexusKey = false;
      this.inlineNotice = { text: '', type: 'info' };
      if (this.noticeTimer) {
        clearTimeout(this.noticeTimer);
        this.noticeTimer = null;
      }
      this.$emit('close');
    },

    /**
     * 外部官网链接点击事件
     */
    onWebLinkClick() {
      this.setNotice('🌐 正在跳转 NexusMods 官网申请页面...', 'info', 3000);
    },

    /**
     * 快速粘贴剪贴板到 API Key 输入框 (多端兼容，带直观反馈)
     */
    async handlePasteClipboard() {
      // 1. 尝试现代浏览器 / H5 异步 Clipboard API
      // #ifdef H5
      if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.readText === 'function') {
        try {
          const text = await navigator.clipboard.readText();
          if (text && text.trim()) {
            this.apiKeyInput = text.trim();
            this.setNotice('✓ 已成功从系统剪贴板填入密钥', 'success', 3000);
            uni.showToast({
              title: '已自动填入密钥',
              icon: 'success'
            });
            return;
          }
        } catch (e) {
          console.warn('[Clipboard] 现代剪贴板读取被浏览器安全策略限制:', e);
        }
      }
      // #endif

      // 2. 原生 App / 小程序端剪贴板接口
      uni.getClipboardData({
        success: (res) => {
          if (res.data) {
            this.apiKeyInput = String(res.data).trim();
            this.setNotice('✓ 已成功填入剪贴板内容', 'success', 3000);
            uni.showToast({
              title: '已填入剪贴板内容',
              icon: 'success'
            });
          } else {
            this.setNotice('💡 剪贴板为空，请在输入框按 Ctrl+V 粘贴', 'info', 3500);
            uni.showToast({
              title: '请点击输入框按 Ctrl+V 粘贴',
              icon: 'none'
            });
          }
        },
        fail: () => {
          this.setNotice('💡 浏览器已限制自动读取，请直接在输入框按 Ctrl+V 粘贴', 'info', 4500);
          uni.showToast({
            title: '请直接点击输入框按 Ctrl+V 粘贴',
            icon: 'none'
          });
        }
      });
    },

    /**
     * 一键复制官方 API Key 申请链接，并在原生 App 环境下唤醒系统外部默认浏览器
     * (绝不在应用内跳转网页，保证用户操作状态不丢失)
     */
    handleCopyAndOpenBrowser() {
      const targetUrl = 'https://www.nexusmods.com/users/myaccount?tab=api';

      // 1. 现代浏览器 / H5 异步 Clipboard API
      // #ifdef H5
      if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        navigator.clipboard.writeText(targetUrl).catch(() => {});
      }
      // #endif

      // 2. 原生 App 环境支持：唤起手机系统外部默认浏览器 (Safari / Chrome 等，保持当前 App 状态)
      // #ifdef APP-PLUS
      try {
        if (typeof plus !== 'undefined' && plus.runtime && typeof plus.runtime.openURL === 'function') {
          plus.runtime.openURL(targetUrl);
        }
      } catch (e) {
        console.warn('[BrowserWakeup] 唤醒外部浏览器异常:', e);
      }
      // #endif

      // 3. 通用剪贴板写入并给出明晰操作引导
      uni.setClipboardData({
        data: targetUrl,
        success: () => {
          this.setNotice('✓ 申请链接已复制！请切换至浏览器粘贴打开', 'success', 4500);
          uni.showToast({
            title: '链接已复制，请在浏览器粘贴打开',
            icon: 'none',
            duration: 3000
          });
        },
        fail: () => {
          this.setNotice('官网申请地址: ' + targetUrl, 'info', 6000);
        }
      });
    },

    /**
     * 兼容别名：复制官方 API Key 获取链接
     */
    handleCopyKeyUrl(customNotice = '') {
      this.handleCopyAndOpenBrowser();
    },

    /**
     * 兼容别名：打开官方页面
     */
    handleOpenKeyUrl() {
      this.handleCopyAndOpenBrowser();
    },

    /**
     * 使用 Personal API Key 提交校验并登录
     */
    async handleLoginWithApiKey() {
      const key = (this.apiKeyInput || '').trim();
      if (!key) {
        this.setNotice('⚠️ 请先在上方输入框粘贴或输入 API Key', 'error', 3500);
        uni.showToast({
          title: '请先粘贴或输入 API Key',
          icon: 'none'
        });
        return;
      }
      this.isVerifyingNexusKey = true;
      this.setNotice('正在向 NexusMods 官方校验密钥...', 'info', 10000);
      try {
        const res = await validateNexusApiKey(key);
        if (res && res.success && res.user) {
          const userName = res.user.name || 'Nexus 用户';
          this.apiKeyInput = '';
          this.setNotice(`✓ 验证成功！欢迎 ${userName}`, 'success', 3000);
          uni.showToast({
            title: `验证成功！欢迎 ${userName}`,
            icon: 'success'
          });
          this.$emit('login-success', { user: res.user, apiKey: key });
          setTimeout(() => {
            this.close();
          }, 600);
        } else {
          const errMsg = (res && res.message) || '请检查密钥是否正确，或登录 Nexus 官网重新申请';
          this.setNotice(`❌ 校验未通过: ${errMsg}`, 'error', 5000);
          this.confirmModal = {
            visible: true,
            title: 'API Key 校验未通过',
            content: errMsg,
            type: 'warning',
            icon: 'warning',
            confirmText: '我知道了',
            cancelText: '',
            showCancel: false,
            onConfirm: null
          };
        }
      } catch (err) {
        const errMsg = err.message || '网络连接超时，请确认能够正常访问 NexusMods 官方服务';
        this.setNotice(`❌ 校验异常: ${errMsg}`, 'error', 5000);
        this.confirmModal = {
          visible: true,
          title: 'API Key 校验未通过',
          content: errMsg,
          type: 'warning',
          icon: 'warning',
          confirmText: '我知道了',
          cancelText: '',
          showCancel: false,
          onConfirm: null
        };
      } finally {
        this.isVerifyingNexusKey = false;
      }
    },

    /**
     * 更换 API Key (切换到输入状态)
     */
    handleSwitchApiKey() {
      logoutNexus();
      this.apiKeyInput = '';
      this.setNotice('已重置凭据，请重新输入', 'info', 2500);
      this.$emit('logout');
    },

    /**
     * 自研暗黑对话框操作确认响应
     */
    onConfirmModalAction() {
      this.confirmModal.visible = false;
      if (typeof this.confirmModal.onConfirm === 'function') {
        this.confirmModal.onConfirm();
      }
    },

    /**
     * 登出 Nexus 账户 (使用自研高颜值暗黑微光 NexusModal 组件)
     */
    handleLogoutNexus() {
      this.confirmModal = {
        visible: true,
        title: '确认退出登录？',
        content: '退出后将清除手机本地缓存的 N网 凭据，不会影响已推送到电脑端的模组。',
        type: 'danger',
        icon: 'trash',
        confirmText: '退出登录',
        cancelText: '取消',
        showCancel: true,
        onConfirm: () => {
          logoutNexus();
          this.apiKeyInput = '';
          this.$emit('logout');
          uni.showToast({
            title: '已退出登录',
            icon: 'none'
          });
        }
      };
    },

    /**
     * 从电脑端 Mayfly 一键同步凭据 (带快速熔断与明确报错)
     */
    async handleSyncFromDesktop() {
      if (this.isSyncingFromPc) return;
      this.isSyncingFromPc = true;
      this.setNotice('正在探测电脑端 Mayfly 局域网服务...', 'info', 5000);
      try {
        const syncResult = await syncNexusFromDesktop(this.desktopConfig);
        if (syncResult && syncResult.user) {
          this.setNotice(`✓ 已同步电脑端凭据: ${syncResult.user.name}`, 'success', 3000);
          uni.showToast({
            title: `已同步电脑端凭据: ${syncResult.user.name}`,
            icon: 'success'
          });
          this.$emit('login-success', { user: syncResult.user, apiKey: syncResult.apiKey });
          setTimeout(() => {
            this.close();
          }, 600);
        } else {
          const msg = (syncResult && syncResult.message) || '电脑端 Mayfly 暂未登录 Nexus 账户，或当前未连接电脑端。';
          this.setNotice(`⚠️ ${msg}`, 'error', 5000);
          this.confirmModal = {
            visible: true,
            title: '未同步到有效账号',
            content: msg,
            type: 'warning',
            icon: 'warning',
            confirmText: '我知道了',
            cancelText: '',
            showCancel: false,
            onConfirm: null
          };
        }
      } catch (err) {
        const msg = err.message || '请确保电脑端 Mayfly 处于运行状态且在同一局域网';
        this.setNotice(`⚠️ ${msg}`, 'error', 5000);
        this.confirmModal = {
          visible: true,
          title: '同步请求异常',
          content: msg,
          type: 'warning',
          icon: 'warning',
          confirmText: '我知道了',
          cancelText: '',
          showCancel: false,
          onConfirm: null
        };
      } finally {
        this.isSyncingFromPc = false;
      }
    }
  }
};
</script>

<style scoped>
/* ============================================================================ */
/* NexusMods 授权弹窗样式                                                      */
/* ============================================================================ */
.modalOverlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32rpx;
  box-sizing: border-box;
  pointer-events: auto;
}

.nexusAuthModalContent {
  position: relative;
  z-index: 1001;
  pointer-events: auto;
  width: 100%;
  max-width: 680rpx;
  background: #181a1f;
  border: 1rpx solid #2d3340;
  border-radius: 24rpx;
  padding: 32rpx;
  box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.8);
  box-sizing: border-box;
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

.authModalHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
  padding-bottom: 16rpx;
  border-bottom: 1rpx solid #232731;
}

.authModalTitleRow {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.nexusAuthBrandIcon {
  font-size: 32rpx;
  color: #da6b17;
  font-weight: 900;
}

.modalTitle {
  font-size: 30rpx;
  font-weight: 700;
  color: #ffffff;
}

.modalCloseBtn {
  font-size: 34rpx;
  color: #9ca3af;
  padding: 12rpx 16rpx;
  margin: -12rpx -16rpx -12rpx 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s ease;
}

.modalCloseBtn:hover {
  color: #ffffff;
}

/* 已登录视图 */
.authLoggedView {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.loggedProfileHeader {
  display: flex;
  align-items: center;
  gap: 20rpx;
  background: #1f232b;
  border: 1rpx solid #333a48;
  border-radius: 16rpx;
  padding: 20rpx;
}

.largeAvatarBox {
  position: relative;
  width: 96rpx;
  height: 96rpx;
  border-radius: 50%;
  background: #2a2f3a;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3rpx solid #da6b17;
  flex-shrink: 0;
}

.largeAvatarImg {
  width: 100%;
  height: 100%;
  border-radius: 50%;
}

.largeAvatarGlyph {
  font-size: 48rpx;
  color: #e5e7eb;
}

.crownCornerBadge {
  position: absolute;
  top: -8rpx;
  right: -8rpx;
  font-size: 26rpx;
}

.largeProfileInfo {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
  overflow: hidden;
}

.largeNameRow {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.largeUserName {
  font-size: 30rpx;
  font-weight: 800;
  color: #ffffff;
}

.vipTag {
  font-size: 18rpx;
  font-weight: 800;
  padding: 2rpx 10rpx;
  border-radius: 6rpx;
}

.vipTag.premium {
  background: linear-gradient(135deg, #da6b17 0%, #f59e0b 100%);
  color: #ffffff;
}

.vipTag.supporter {
  background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);
  color: #ffffff;
}

.vipTag.standard {
  background: #374151;
  color: #9ca3af;
}

.userUidText,
.userEmailText {
  font-size: 20rpx;
  color: #9ca3af;
}

.authActionsRow {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-top: 8rpx;
}

.authSubBtn {
  flex: 1;
  background: #252a35;
  border: 1rpx solid #3a4254;
  color: #e5e7eb;
  border-radius: 12rpx;
  padding: 16rpx 0;
  font-size: 24rpx;
  font-weight: 600;
  cursor: pointer;
  box-sizing: border-box;
  transition: all 0.2s ease;
}

.authSubBtn:active {
  background: #323948;
  transform: scale(0.98);
}

.authSubBtn::after {
  border: none;
}

.authLogoutBtn {
  flex: 1;
  background: rgba(239, 68, 68, 0.15);
  border: 1rpx solid rgba(239, 68, 68, 0.4);
  color: #ef4444;
  border-radius: 12rpx;
  padding: 16rpx 0;
  font-size: 24rpx;
  font-weight: 600;
  cursor: pointer;
  box-sizing: border-box;
  transition: all 0.2s ease;
}

.authLogoutBtn:active {
  background: rgba(239, 68, 68, 0.25);
  transform: scale(0.98);
}

.authLogoutBtn::after {
  border: none;
}

/* 未登录授权表单 */
.authLoginForm {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.authIntroBanner {
  background: linear-gradient(135deg, #242833 0%, #1c1e24 100%);
  border: 1rpx solid #353b4b;
  border-radius: 14rpx;
  padding: 18rpx;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.authIntroTitle {
  font-size: 24rpx;
  font-weight: 700;
  color: #da6b17;
}

.authIntroDesc {
  font-size: 20rpx;
  color: #9ca3af;
  line-height: 1.4;
}

.formItem {
  display: flex;
  flex-direction: column;
}

/* 实时操作状态横幅动效 */
.inlineStatusBanner {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 14rpx 18rpx;
  border-radius: 12rpx;
  font-size: 22rpx;
  line-height: 1.4;
  margin-top: 4rpx;
  box-sizing: border-box;
  animation: noticeFadeIn 0.25s ease-out;
}

@keyframes noticeFadeIn {
  from {
    opacity: 0;
    transform: translateY(-8rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.inlineStatusBanner.info {
  background: rgba(56, 189, 248, 0.12);
  border: 1rpx solid rgba(56, 189, 248, 0.35);
  color: #38bdf8;
}

.inlineStatusBanner.error {
  background: rgba(239, 68, 68, 0.15);
  border: 1rpx solid rgba(239, 68, 68, 0.4);
  color: #f87171;
}

.inlineStatusBanner.success {
  background: rgba(34, 197, 94, 0.15);
  border: 1rpx solid rgba(34, 197, 94, 0.4);
  color: #4ade80;
}

.statusBannerIcon {
  font-size: 24rpx;
  font-weight: 700;
  flex-shrink: 0;
}

.statusBannerText {
  flex: 1;
  word-break: break-all;
}

.formLabelRow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10rpx;
}

.formLabel {
  font-size: 22rpx;
  font-weight: 600;
  color: #cbd5e1;
}

.pasteQuickLink {
  font-size: 20rpx;
  color: #da6b17;
  font-weight: 600;
  cursor: pointer;
  padding: 4rpx 8rpx;
  user-select: none;
  transition: all 0.2s ease;
}

.pasteQuickLink:active {
  opacity: 0.6;
  transform: scale(0.96);
}

.keyInputBox {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  height: 84rpx;
  min-height: 84rpx;
  background: #1f232b;
  border: 1rpx solid #363c4a;
  border-radius: 12rpx;
  box-sizing: border-box;
  transition: border-color 0.2s ease;
}

.keyInputBox:focus-within {
  border-color: #da6b17;
}

.keyInput {
  flex: 1;
  width: 100%;
  height: 84rpx;
  min-height: 84rpx;
  line-height: 84rpx;
  background: transparent;
  border: none;
  outline: none;
  padding: 0 68rpx 0 20rpx;
  font-size: 24rpx;
  color: #ffffff;
  box-sizing: border-box;
  user-select: text;
  -webkit-user-select: text;
}

.clearKeyBtn {
  position: absolute;
  right: 18rpx;
  font-size: 24rpx;
  color: #9ca3af;
  cursor: pointer;
  padding: 10rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  user-select: none;
  transition: color 0.2s ease;
}

.clearKeyBtn:active {
  color: #ffffff;
  transform: scale(0.9);
}

.authLoginBtn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #da6b17;
  color: #ffffff;
  border-radius: 12rpx;
  font-size: 26rpx;
  font-weight: 700;
  padding: 20rpx 0;
  margin-top: 8rpx;
  border: none;
  cursor: pointer;
  box-sizing: border-box;
  transition: all 0.2s ease;
}

.authLoginBtn:active {
  transform: scale(0.98);
  opacity: 0.9;
}

.authLoginBtn::after {
  border: none;
}

.authLoginBtn[disabled] {
  opacity: 0.6;
  background: #282d37 !important;
  color: #71717a !important;
  border: 1rpx solid #3b4252 !important;
  cursor: not-allowed;
  transform: none !important;
}

.syncPcBtn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #252a35;
  border: 1rpx solid #3a4152;
  color: #e5e7eb;
  border-radius: 12rpx;
  font-size: 24rpx;
  font-weight: 600;
  padding: 18rpx 0;
  margin: 0;
  box-sizing: border-box;
  cursor: pointer;
  transition: all 0.2s ease;
}

.syncPcBtn:active {
  transform: scale(0.98);
  background: #323948;
}

.syncPcBtn::after {
  border: none;
}

.syncPcBtn[disabled] {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
}

.syncPcBtnText {
  color: #e5e7eb;
}

.keyGuideCard {
  background: #191c22;
  border: 1rpx dashed #303542;
  border-radius: 14rpx;
  padding: 18rpx;
  margin-top: 4rpx;
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.guideHeader {
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.guideIcon {
  font-size: 24rpx;
}

.guideTitle {
  font-size: 22rpx;
  font-weight: 700;
  color: #e5e7eb;
}

.guideSteps {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.guideStepText {
  font-size: 20rpx;
  color: #9ca3af;
  line-height: 1.4;
}

.keyActionRow {
  display: flex;
  gap: 12rpx;
  margin-top: 8rpx;
}

.copyUrlBtn.actionBtn {
  flex: 1;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(218, 107, 23, 0.15);
  border: 1rpx solid rgba(218, 107, 23, 0.45);
  color: #da6b17;
  border-radius: 12rpx;
  padding: 16rpx 0;
  font-size: 24rpx;
  font-weight: 700;
  margin: 0;
  box-sizing: border-box;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.2s ease;
}

.copyUrlBtn.actionBtn:active {
  transform: scale(0.98);
  background: rgba(218, 107, 23, 0.25);
  opacity: 0.9;
}

.copyUrlBtn.actionBtn::after {
  border: none;
}

.copyUrlBtnText {
  color: #da6b17;
}
</style>
