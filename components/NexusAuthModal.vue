<template>
  <!-- ======================================================================== -->
  <!-- NexusMods 官方账户中心与 API 授权统一弹窗组件 (多页面复用)             -->
  <!-- ======================================================================== -->
  <view class="modalOverlay" v-if="visible" @click="close">
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

        <!-- 账号特权清单 -->
        <view class="privilegesBox">
          <text class="privilegeTitle">💎 已激活特权服务</text>
          <view class="privilegeGrid">
            <view class="privilegeItem">
              <text class="privItemIcon">⚡</text>
              <view class="privItemTextCol">
                <text class="privMain">高速直连通道</text>
                <text class="privSub">{{ nexusUser.isPremium ? '尊享无限制最高速' : '标准官方 CDN 加速' }}</text>
              </view>
            </view>
            <view class="privilegeItem">
              <text class="privItemIcon">🚀</text>
              <view class="privItemTextCol">
                <text class="privMain">电脑端一键装机</text>
                <text class="privSub">局域网 + 云信令无感落盘</text>
              </view>
            </view>
            <view class="privilegeItem">
              <text class="privItemIcon">🔖</text>
              <view class="privItemTextCol">
                <text class="privMain">个人心愿单漫游</text>
                <text class="privSub">随时保存、分享与推送到电脑</text>
              </view>
            </view>
            <view class="privilegeItem">
              <text class="privItemIcon">🛡️</text>
              <view class="privItemTextCol">
                <text class="privMain">官方 Personal Key</text>
                <text class="privSub">安全凭证本地加密存储</text>
              </view>
            </view>
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
              password
              v-model="apiKeyInput"
              placeholder="粘贴以 nxm_ 或密钥开头的 API Key..."
            />
            <text v-if="apiKeyInput" class="clearKeyBtn" @click="apiKeyInput = ''">✕</text>
          </view>
        </view>

        <!-- 登录按钮 -->
        <button
          class="authLoginBtn"
          :disabled="isVerifyingNexusKey || !apiKeyInput.trim()"
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
            <text class="guideStepText">1. 在已登录 N 网的浏览器中打开下方官方页面；</text>
            <text class="guideStepText">2. 滑动至页面最底部【Personal API Key】；</text>
            <text class="guideStepText">3. 点击【Request Key】生成密钥，复制后粘贴到上方即可。</text>
          </view>
          <view class="keyActionRow">
            <button class="copyUrlBtn actionBtn" @click="handleOpenKeyUrl">
              <text class="copyUrlBtnText">🌐 前往官网生成页面</text>
            </button>
            <button class="copyUrlBtn actionBtn subBtn" @click="handleCopyKeyUrl">
              <text class="copyUrlBtnText">📋 复制链接</text>
            </button>
          </view>
        </view>

        <!-- 底部常驻：从电脑端同步快捷入口 -->
        <button
          class="syncPcBtn"
          :disabled="isSyncingFromPc"
          @click="handleSyncFromDesktop"
        >
          <text class="syncPcBtnText">{{ isSyncingFromPc ? '正在从电脑同步...' : '💻 从电脑端 Mayfly 一键同步登录' }}</text>
        </button>
      </view>
    </view>
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

export default {
  name: 'NexusAuthModal',
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
      isSyncingFromPc: false
    };
  },

  methods: {
    /**
     * 关闭弹窗
     */
    close() {
      this.$emit('close');
    },

    /**
     * 快速粘贴剪贴板到 API Key 输入框
     */
    handlePasteClipboard() {
      uni.getClipboardData({
        success: (res) => {
          if (res.data) {
            this.apiKeyInput = String(res.data).trim();
            uni.showToast({
              title: '已填入剪贴板内容',
              icon: 'none'
            });
          } else {
            uni.showToast({
              title: '剪贴板为空',
              icon: 'none'
            });
          }
        },
        fail: () => {
          uni.showToast({
            title: '无法读取剪贴板',
            icon: 'none'
          });
        }
      });
    },

    /**
     * 浏览器直接打开获取官方 API Key 的安全设置页面
     */
    handleOpenKeyUrl() {
      const url = 'https://www.nexusmods.com/users/myaccount?tab=api';
      // #ifdef H5
      window.open(url, '_blank');
      // #endif
      // #ifndef H5
      this.handleCopyKeyUrl();
      // #endif
    },

    /**
     * 复制官方 API Key 获取链接到剪贴板
     */
    handleCopyKeyUrl() {
      uni.setClipboardData({
        data: 'https://www.nexusmods.com/users/myaccount?tab=api',
        success: () => {
          uni.showToast({
            title: '官网链接已复制',
            icon: 'success'
          });
        }
      });
    },

    /**
     * 使用 Personal API Key 提交校验并登录
     */
    async handleLoginWithApiKey() {
      const key = (this.apiKeyInput || '').trim();
      if (!key) {
        uni.showToast({
          title: '请先输入 API Key',
          icon: 'none'
        });
        return;
      }
      this.isVerifyingNexusKey = true;
      try {
        const res = await validateNexusApiKey(key);
        if (res && res.success && res.user) {
          const userName = res.user.name || 'Nexus 用户';
          this.apiKeyInput = '';
          uni.showToast({
            title: `验证成功！欢迎 ${userName}`,
            icon: 'success'
          });
          this.$emit('login-success', { user: res.user, apiKey: key });
          this.close();
        } else {
          uni.showModal({
            title: 'API Key 校验未通过',
            content: (res && res.message) || '请检查密钥是否正确，或登录 Nexus 官网重新申请',
            showCancel: false
          });
        }
      } catch (err) {
        uni.showModal({
          title: 'API Key 校验未通过',
          content: err.message || '网络连接超时，请确认能够正常访问 NexusMods 官方服务',
          showCancel: false
        });
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
      this.$emit('logout');
    },

    /**
     * 登出 Nexus 账户
     */
    handleLogoutNexus() {
      uni.showModal({
        title: '确认退出登录？',
        content: '退出后将清除手机本地缓存的 N网 凭据，不会影响已推送到电脑端的模组。',
        success: (res) => {
          if (res.confirm) {
            logoutNexus();
            this.apiKeyInput = '';
            this.$emit('logout');
            uni.showToast({
              title: '已退出登录',
              icon: 'none'
            });
          }
        }
      });
    },

    /**
     * 从电脑端 Mayfly 一键同步凭据
     */
    async handleSyncFromDesktop() {
      this.isSyncingFromPc = true;
      try {
        const syncResult = await syncNexusFromDesktop(this.desktopConfig);
        if (syncResult && syncResult.user) {
          uni.showToast({
            title: `已同步电脑端凭据: ${syncResult.user.name}`,
            icon: 'success'
          });
          this.$emit('login-success', { user: syncResult.user, apiKey: syncResult.apiKey });
          this.close();
        } else {
          uni.showModal({
            title: '同步失败',
            content: '电脑端 Mayfly 尚未登录 Nexus 账户，或当前未与电脑端成功配对连接。',
            showCancel: false
          });
        }
      } catch (err) {
        uni.showModal({
          title: '同步请求异常',
          content: err.message || '请确保电脑端 Mayfly 保持开启且局域网互通',
          showCancel: false
        });
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
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32rpx;
  box-sizing: border-box;
}

.nexusAuthModalContent {
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
  font-size: 32rpx;
  color: #9ca3af;
  padding: 8rpx;
  cursor: pointer;
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

/* 特权清单 */
.privilegesBox {
  background: #14161a;
  border: 1rpx solid #282c36;
  border-radius: 16rpx;
  padding: 20rpx;
}

.privilegeTitle {
  font-size: 24rpx;
  font-weight: 700;
  color: #da6b17;
  margin-bottom: 16rpx;
  display: block;
}

.privilegeGrid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14rpx;
}

.privilegeItem {
  display: flex;
  align-items: center;
  gap: 12rpx;
  background: #1c1f26;
  border: 1rpx solid #2a303d;
  border-radius: 10rpx;
  padding: 12rpx 14rpx;
}

.privItemIcon {
  font-size: 28rpx;
}

.privItemTextCol {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.privMain {
  font-size: 20rpx;
  font-weight: 700;
  color: #e5e7eb;
}

.privSub {
  font-size: 18rpx;
  color: #9ca3af;
}

.authActionsRow {
  display: flex;
  align-items: center;
  gap: 16rpx;
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
}

.keyInputBox {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  box-sizing: border-box;
}

.keyInput {
  flex: 1;
  width: 100%;
  background: #1f232b;
  border: 1rpx solid #363c4a;
  border-radius: 12rpx;
  padding: 18rpx 60rpx 18rpx 20rpx;
  font-size: 24rpx;
  color: #ffffff;
  box-sizing: border-box;
}

.clearKeyBtn {
  position: absolute;
  right: 18rpx;
  font-size: 24rpx;
  color: #9ca3af;
  cursor: pointer;
  padding: 6rpx;
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

.authLoginBtn::after {
  border: none;
}

.authLoginBtn[disabled] {
  opacity: 0.6;
  background: #282d37 !important;
  color: #71717a !important;
  border: 1rpx solid #3b4252 !important;
  cursor: not-allowed;
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
}

.syncPcBtn::after {
  border: none;
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
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(218, 107, 23, 0.15);
  border: 1rpx solid rgba(218, 107, 23, 0.4);
  color: #da6b17;
  border-radius: 10rpx;
  padding: 12rpx 0;
  font-size: 21rpx;
  font-weight: 700;
  margin: 0;
  box-sizing: border-box;
  cursor: pointer;
}

.copyUrlBtn.actionBtn::after {
  border: none;
}

.copyUrlBtn.actionBtn.subBtn {
  flex: 0.8;
  background: #252a35;
  border: 1rpx solid #3a4254;
  color: #cbd5e1;
}

.copyUrlBtn.actionBtn.subBtn .copyUrlBtnText {
  color: #cbd5e1;
}

.copyUrlBtnText {
  color: #da6b17;
}
</style>
