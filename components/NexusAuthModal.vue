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
      <!-- 区域 B：未登录状态授权表单 (双通道：网页免密/验证码 SSO + API Key)   -->
      <!-- ==================================================================== -->
      <view class="authLoginForm" v-else>
        <!-- 登录方式切换 Tab -->
        <view class="authTabRow">
          <view
            class="authTabItem"
            :class="{ active: authTab === 'sso' }"
            @click="switchAuthTab('sso')"
          >
            <text class="authTabIcon">🌐</text>
            <text class="authTabText">网页免密授权 (推荐)</text>
          </view>
          <view
            class="authTabItem"
            :class="{ active: authTab === 'apikey' }"
            @click="switchAuthTab('apikey')"
          >
            <text class="authTabIcon">🔑</text>
            <text class="authTabText">API Key 密钥</text>
          </view>
        </view>

        <!-- 方式一：网页免密授权 (SSO / 验证码模式) -->
        <view class="ssoAuthSection" v-if="authTab === 'sso'">
          <view class="authIntroBanner">
            <text class="authIntroTitle">🌐 NexusMods 官方网页免密授权</text>
            <text class="authIntroDesc">
              无需手动复制长密钥！点击前往 Nexus 官网登录并授权，本应用将通过安全信道自动接收授权并完成登录。
            </text>
          </view>

          <!-- SSO 实时信道状态 -->
          <view class="ssoStatusBox">
            <view class="ssoStatusRow">
              <view class="pulseDot" :class="ssoStatusClass"></view>
              <text class="ssoStatusText">{{ ssoStatusLabel }}</text>
            </view>
            <text class="ssoSubTip" v-if="ssoStatus === 'waiting'">
              请在打开的网页中点击绿色「Authorize」；若开启了 2FA，请在网页完成验证码校验。
            </text>
          </view>

          <!-- 网页授权主操作按钮 -->
          <button class="authLoginBtn ssoLaunchBtn" @click="handleOpenSsoUrl">
            <text class="loginBtnText">🚀 前往 N 网网页完成授权</text>
          </button>

          <!-- #ifdef H5 -->
          <!-- 网页端专属防拦截直接链接：点击直接在浏览器新标签页打开授权 -->
          <a
            v-if="currentSsoUrl"
            class="ssoDirectLink"
            :href="currentSsoUrl"
            target="_blank"
          >
            如未自动打开窗口，点此直接在新标签页打开授权页面 ›
          </a>
          <!-- #endif -->

          <view class="ssoActionSubRow">
            <button class="ssoSubActionBtn" @click="handleCopySsoUrl">
              <text class="ssoSubBtnText">📋 复制授权网址到浏览器</text>
            </button>
            <button class="ssoSubActionBtn" @click="handleRestartSso">
              <text class="ssoSubBtnText">⟳ 刷新信道</text>
            </button>
          </view>

          <view class="keyGuideCard">
            <view class="guideHeader">
              <text class="guideIcon">💡</text>
              <text class="guideTitle">网页授权操作指引</text>
            </view>
            <view class="guideSteps">
              <text class="guideStepText">1. 点击上方「前往 N 网网页完成授权」打开官方页面；</text>
              <text class="guideStepText">2. 登录您的 NexusMods 账号（若有双重验证则输入验证码）；</text>
              <text class="guideStepText">3. 页面提示请求授权时，点击绿色「Authorize」按钮；</text>
              <text class="guideStepText">4. 返回本应用，系统将通过官方安全信道自动登入！</text>
              <text class="guideStepText warnTip">⚠️ 注意：若在电脑 F12「手机设备模拟器」中打开，Cloudflare 会因伪装特征直接拦截报错；请在正常电脑标签页中打开或直接切换至上方【API Key 登录】。</text>
            </view>
          </view>
        </view>

        <!-- 方式二：API Key 密钥输入 -->
        <view class="apiKeyAuthSection" v-else>
          <view class="authIntroBanner">
            <text class="authIntroTitle">🔑 粘贴 Personal API Key 登录</text>
            <text class="authIntroDesc">
              适合网络受限无法使用 WebSocket 的场景，在 NexusMods 个人设置中获取 Personal API Key 粘贴即可。
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
              <text class="guideStepText">1. 登录 NexusMods 官网，进入个人账户安全设置；</text>
              <text class="guideStepText">2. 滑至底部【Personal API Key】，点击【Request Key】生成；</text>
              <text class="guideStepText">3. 复制生成的密钥并粘贴到上方输入框即可。</text>
            </view>
            <button class="copyUrlBtn" @click="handleCopyKeyUrl">
              <text class="copyUrlBtnText">📋 复制官方 API Key 获取页面链接</text>
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
// NexusAuthModal 组件逻辑：SSO 网页授权长连接与 API Key 双模式登录
// ============================================================================
import {
  logoutNexus,
  validateNexusApiKey,
  syncNexusFromDesktop,
  startNexusSsoSession
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
      authTab: 'sso', // 'sso' (网页免密/验证码) | 'apikey' (密钥输入)
      ssoSession: null,
      ssoStatus: 'idle', // 'idle' | 'connecting' | 'connected' | 'waiting' | 'verifying' | 'error'
      ssoErrorMsg: '',
      apiKeyInput: '',
      isVerifyingNexusKey: false,
      isSyncingFromPc: false
    };
  },

  computed: {
    /**
     * SSO 状态实时提示语
     */
    ssoStatusLabel() {
      switch (this.ssoStatus) {
        case 'connecting':
          return '正在建立安全 SSO 授权信道...';
        case 'connected':
          return '信道已就绪，请点击按钮前往网页授权';
        case 'waiting':
          return '等待网页端点击「Authorize」授权与验证码...';
        case 'verifying':
          return '已捕获凭据，正在校验账户信息...';
        case 'error':
          return this.ssoErrorMsg || 'SSO 信道连接失败，请点击刷新重试';
        default:
          return '点击下方按钮前往 NexusMods 官方完成授权';
      }
    },

    /**
     * SSO 呼吸灯状态样式类
     */
    ssoStatusClass() {
      switch (this.ssoStatus) {
        case 'connecting':
          return 'yellow pulse';
        case 'connected':
          return 'green';
        case 'waiting':
          return 'yellow fast-pulse';
        case 'verifying':
          return 'green fast-pulse';
        case 'error':
          return 'red';
        default:
          return 'gray';
      }
    },

    /**
     * 官方 SSO 授权目标 URL (兼容 authUrl 与 ssoUrl 字段)
     */
    currentSsoUrl() {
      return this.ssoSession ? (this.ssoSession.authUrl || this.ssoSession.ssoUrl || '') : '';
    }
  },

  watch: {
    visible(val) {
      if (val && !this.nexusUser) {
        this.initSsoSession();
      } else if (!val) {
        this.destroySsoSession();
      }
    }
  },

  beforeDestroy() {
    this.destroySsoSession();
  },

  methods: {
    /**
     * 关闭弹窗
     */
    close() {
      this.destroySsoSession();
      this.$emit('close');
    },

    /**
     * 销毁 SSO 会话长连接
     */
    destroySsoSession() {
      if (this.ssoSession) {
        try {
          this.ssoSession.close();
        } catch (e) {
          // ignore
        }
        this.ssoSession = null;
      }
      this.ssoStatus = 'idle';
    },

    /**
     * 切换未登录模式 Tab
     */
    switchAuthTab(tab) {
      this.authTab = tab;
      if (tab === 'sso' && !this.ssoSession) {
        this.initSsoSession();
      }
    },

    // ------------------------------------------------------------------------
    // SSO 会话生命周期与跳转方法
    // ------------------------------------------------------------------------

    /**
     * 初始化 Nexus 官方 SSO WebSocket 长连接会话
     */
    initSsoSession() {
      this.destroySsoSession();
      this.ssoStatus = 'connecting';
      this.ssoErrorMsg = '';

      this.ssoSession = startNexusSsoSession({
        // 实时信道状态变化回调
        onStatusChange: (status, data) => {
          this.ssoStatus = status;
          if (status === 'error' && data && data.message) {
            this.ssoErrorMsg = data.message;
          }
        },
        // 授权成功回调：兼容多种传参形式
        onSuccess: (data, maybeApiKey) => {
          this.ssoStatus = 'idle';
          const user = data?.user || (data?.name ? data : null);
          const apiKey = data?.apiKey || maybeApiKey || '';
          const userName = user?.name || 'Nexus 用户';
          uni.showToast({
            title: `欢迎回来，${userName}！`,
            icon: 'success'
          });
          this.$emit('login-success', { user, apiKey });
          this.close();
        },
        // 异常回调
        onError: (err) => {
          this.ssoStatus = 'error';
          this.ssoErrorMsg = (err && (err.message || (typeof err === 'string' && err))) || 'SSO 认证发生异常';
        }
      });
    },

    /**
     * 一键在浏览器打开 SSO 官方授权页面
     * 解决 H5/浏览器弹窗拦截问题，并支持移动端直接跳转
     */
    handleOpenSsoUrl() {
      // 若信道未连接或 URL 丢失，先尝试重新初始化
      if (!this.ssoSession || !this.currentSsoUrl) {
        this.initSsoSession();
      }
      const url = this.currentSsoUrl;
      if (!url) {
        uni.showToast({
          title: '信道初始化中，请稍候重试...',
          icon: 'none'
        });
        return;
      }
      this.ssoStatus = 'waiting';

      // ----------------------------------------------------------------------
      // 1. H5 网页/浏览器环境：唤起新标签页或模拟超链接防拦截
      // ----------------------------------------------------------------------
      // #ifdef H5
      try {
        // 打开新标签页（不携带 noreferrer，确保保留 Referer 和登录态 Cookie，避免触发 Cloudflare 验证失败）
        const win = window.open(url, '_blank');
        // 检测是否被浏览器拦截弹窗
        if (!win || win.closed || typeof win.closed === 'undefined') {
          // 降级策略：创建动态 a 标签模拟用户真实点击
          const a = document.createElement('a');
          a.href = url;
          a.target = '_blank';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
      } catch (e) {
        console.warn('[SSO] 窗口打开受限，提示手动打开:', e);
        uni.showToast({
          title: '请点击下方链接直接在新标签页打开',
          icon: 'none'
        });
      }
      // #endif

      // ----------------------------------------------------------------------
      // 2. 非 H5 环境 (移动端原生/小程序)：复制到剪贴板并弹窗引导
      // ----------------------------------------------------------------------
      // #ifndef H5
      uni.setClipboardData({
        data: url,
        showToast: false,
        success: () => {
          uni.showModal({
            title: '授权链接已就绪',
            content: '已将 N 网官方 SSO 授权网址复制到剪贴板，请在浏览器粘贴打开。登录并授权后，本应用将自动完成登入！',
            confirmText: '我知道了',
            showCancel: false
          });
        }
      });
      // #endif
    },

    /**
     * 复制 SSO 授权网址到系统剪贴板
     */
    handleCopySsoUrl() {
      const url = this.currentSsoUrl;
      if (!url) {
        uni.showToast({
          title: '信道准备中，请稍候重试',
          icon: 'none'
        });
        return;
      }
      uni.setClipboardData({
        data: url,
        success: () => {
          uni.showToast({
            title: 'SSO 授权网址已复制',
            icon: 'success'
          });
        }
      });
    },

    /**
     * 重启 / 刷新 SSO 信道
     */
    handleRestartSso() {
      this.initSsoSession();
      uni.showToast({
        title: '已重置 SSO 信道',
        icon: 'none'
      });
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
     * 复制官方 API Key 获取链接
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
        const user = await validateNexusApiKey(key);
        this.apiKeyInput = '';
        uni.showToast({
          title: `验证成功！欢迎 ${user.name}`,
          icon: 'success'
        });
        this.$emit('login-success', { user, apiKey: key });
        this.close();
      } catch (err) {
        uni.showModal({
          title: 'API Key 校验未通过',
          content: err.message || '请检查密钥是否正确，或登录 Nexus 官网重新申请',
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
      this.destroySsoSession();
      this.authTab = 'apikey';
      logoutNexus();
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
            this.destroySsoSession();
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

/* 登录方式切换 Tab */
.authTabRow {
  display: flex;
  background: #121418;
  border-radius: 14rpx;
  padding: 6rpx;
  gap: 8rpx;
  border: 1rpx solid #282c36;
}

.authTabItem {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
  padding: 16rpx 0;
  border-radius: 10rpx;
  cursor: pointer;
  transition: all 0.2s ease;
}

.authTabItem.active {
  background: #252a35;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.4);
}

.authTabIcon {
  font-size: 26rpx;
}

.authTabText {
  font-size: 22rpx;
  font-weight: 700;
  color: #9ca3af;
}

.authTabItem.active .authTabText {
  color: #ffffff;
}

/* SSO 区域 */
.ssoAuthSection,
.apiKeyAuthSection {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.ssoStatusBox {
  background: #14161a;
  border: 1rpx solid #2a2e38;
  border-radius: 14rpx;
  padding: 18rpx;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.ssoStatusRow {
  display: flex;
  align-items: center;
  gap: 14rpx;
}

.pulseDot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  flex-shrink: 0;
}

.pulseDot.gray {
  background: #64748b;
}

.pulseDot.yellow {
  background: #f59e0b;
}

.pulseDot.red {
  background: #ef4444;
}

.pulseDot.green {
  background: #10b981;
}

.pulseDot.pulse {
  animation: ssoPulse 1.8s infinite;
}

.pulseDot.fast-pulse {
  animation: ssoPulse 0.8s infinite;
}

@keyframes ssoPulse {
  0% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
  }
  70% {
    transform: scale(1.1);
    box-shadow: 0 0 0 12rpx rgba(16, 185, 129, 0);
  }
  100% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
  }
}

.ssoStatusText {
  font-size: 22rpx;
  font-weight: 600;
  color: #e5e7eb;
}

.ssoSubTip {
  font-size: 19rpx;
  color: #9ca3af;
  line-height: 1.4;
  margin-left: 30rpx;
}

.ssoLaunchBtn {
  margin-top: 6rpx;
}

.ssoDirectLink {
  display: block;
  text-align: center;
  font-size: 21rpx;
  color: #60a5fa;
  text-decoration: underline;
  padding: 4rpx 0;
  cursor: pointer;
  transition: opacity 0.2s ease;
}

.ssoDirectLink:hover {
  opacity: 0.85;
}

.ssoActionSubRow {
  display: flex;
  align-items: center;
  gap: 14rpx;
}

.ssoSubActionBtn {
  flex: 1;
  background: #20242e;
  border: 1rpx solid #333946;
  border-radius: 10rpx;
  padding: 14rpx 0;
  margin: 0;
}

.ssoSubBtnText {
  font-size: 22rpx;
  color: #cbd5e1;
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
}

.keyInput {
  flex: 1;
  background: #1f232b;
  border: 1rpx solid #363c4a;
  border-radius: 12rpx;
  padding: 16rpx 60rpx 16rpx 20rpx;
  font-size: 24rpx;
  color: #ffffff;
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
  background: #da6b17;
  color: #ffffff;
  border-radius: 12rpx;
  font-size: 26rpx;
  font-weight: 700;
  padding: 18rpx 0;
  margin-top: 6rpx;
  border: none;
}

.authLoginBtn[disabled] {
  opacity: 0.5;
}

.syncPcBtn {
  background: #252a35;
  border: 1rpx solid #3a4152;
  color: #e5e7eb;
  border-radius: 12rpx;
  font-size: 24rpx;
  font-weight: 600;
  padding: 16rpx 0;
  margin: 0;
}

.syncPcBtnText {
  color: #e5e7eb;
}

.keyGuideCard {
  background: #191c22;
  border: 1rpx dashed #303542;
  border-radius: 14rpx;
  padding: 16rpx;
  margin-top: 6rpx;
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

.guideStepText.warnTip {
  color: #f59e0b;
  margin-top: 6rpx;
  line-height: 1.5;
}

.copyUrlBtn {
  background: rgba(218, 107, 23, 0.12);
  border: 1rpx solid rgba(218, 107, 23, 0.35);
  color: #da6b17;
  border-radius: 8rpx;
  padding: 10rpx 0;
  font-size: 20rpx;
  font-weight: 700;
  margin-top: 4rpx;
}

.copyUrlBtnText {
  color: #da6b17;
}
</style>
