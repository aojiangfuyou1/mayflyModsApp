<template>
  <!-- ======================================================================== -->
  <!-- 页面名称：个人中心与设置 (Profile & Settings Page)                        -->
  <!-- 功能描述：对标移动端体验，整合 Nexus 账户授权、电脑端配对、偏好设置与状态 -->
  <!-- ======================================================================== -->
  <view class="profilePage">
    <!-- 1. 手机沉浸式纯黑状态栏安全占位 (告别全屏叠加与遮挡) -->
    <view class="safeStatusBarSpacer"></view>

    <!-- 2. 主体可滚动内容区 (底部预留安全距离防止被 Tab 遮挡) -->
    <scroll-view class="profileScrollView" scroll-y>
      <view class="profileContainer">
        <!-- ------------------------------------------------------------------ -->
        <!-- 区域 A：Nexus 账户与授权卡片                                        -->
        <!-- ------------------------------------------------------------------ -->
        <view class="sectionCard userCard">
          <view class="userCardContent" v-if="!nexusUser" @click="openNexusAuth">
            <view class="userAvatarBox guest">
              <NexusIcon name="user" size="48rpx" color="#da6b17" />
            </view>
            <view class="userMetaCol">
              <view class="userTitleRow">
                <text class="userNameText">登录 NexusMods 账户</text>
                <text class="authPillBtn">点击授权 ›</text>
              </view>
              <text class="userSubText">支持网页免密授权与 API Key 直连服务</text>
            </view>
          </view>

          <view class="userCardContent logged" v-else @click="openNexusAuth">
            <view class="userAvatarBox">
              <image v-if="nexusUser.avatar" class="userAvatarImg" :src="nexusUser.avatar" mode="aspectFill" />
              <NexusIcon v-else name="user" size="48rpx" color="#da6b17" />
              <text v-if="nexusUser.isPremium" class="crownBadge">👑</text>
            </view>
            <view class="userMetaCol">
              <view class="userTitleRow">
                <text class="userNameText">{{ nexusUser.name }}</text>
                <text v-if="nexusUser.isPremium" class="roleTag premium">PREMIUM</text>
                <text v-else-if="nexusUser.isSupporter" class="roleTag supporter">SUPPORTER</text>
                <text v-else class="roleTag member">MEMBER</text>
              </view>
              <text class="userSubText">UID: {{ nexusUser.userId }} · 已授权绑定 (点击管理)</text>
            </view>
            <text class="cardArrow">›</text>
          </view>
        </view>

        <!-- ------------------------------------------------------------------ -->
        <!-- 区域 B：电脑端 Mayfly 连接与配对状态卡片                            -->
        <!-- ------------------------------------------------------------------ -->
        <view class="sectionCard pcConnectCard">
          <view class="cardHeaderRow">
            <view class="cardHeaderLeft">
              <NexusIcon name="desktop" size="32rpx" color="#38bdf8" />
              <text class="cardHeaderText">电脑端连接状态</text>
            </view>
            <view class="pcStatusBadge" :class="{ online: desktopConfig && desktopConfig.connected }">
              <view class="statusDot"></view>
              <text class="statusText">{{ desktopConfig && desktopConfig.connected ? '已连接' : '未连接' }}</text>
            </view>
          </view>

          <view class="pcMetaBox">
            <text class="pcIpText">目标主机: {{ desktopConfig ? desktopConfig.host : '10.204.160.22' }}:{{ desktopConfig ? desktopConfig.port : '28888' }}</text>
            <text class="pcNoticeText">{{ desktopConfig && desktopConfig.connected ? '局域网与云端信令通畅，可在手机一键推送模组到电脑' : '请确保电脑端 Mayfly 处于运行状态，并完成设备配对' }}</text>
          </view>

          <view class="pcActionsRow">
            <button class="actionBtn primary" @click="deviceModalVisible = true">
              <NexusIcon name="gear" size="28rpx" color="#ffffff" style="margin-right: 8rpx;" />
              <text class="btnText">配对设置</text>
            </button>
            <button class="actionBtn outline" :loading="isTestingConnection" @click="runQuickTest">
              <NexusIcon name="wifi" size="28rpx" color="#cbd5e1" style="margin-right: 8rpx;" />
              <text class="btnText">测试连接</text>
            </button>
            <button class="actionBtn downloadBtn" @click="openClientDownload">
              <NexusIcon name="download" size="28rpx" color="#38bdf8" style="margin-right: 8rpx;" />
              <text class="btnText">客户端下载</text>
            </button>
          </view>
        </view>

        <!-- ------------------------------------------------------------------ -->
        <!-- 区域 C：当前激活的游戏专区卡片                                      -->
        <!-- ------------------------------------------------------------------ -->
        <view class="sectionCard activeGameSection">
          <view class="cardHeaderRow">
            <view class="cardHeaderLeft">
              <NexusIcon name="gamepad" size="32rpx" color="#da6b17" />
              <text class="cardHeaderText">当前偏好游戏</text>
            </view>
            <text class="changeGameBtn" @click="goToGamesPage">切换专区 ›</text>
          </view>

          <view class="activeGameCard" v-if="activeGame.domain">
            <image class="activeGameThumb" :src="activeGame.tileUrl || '/static/logo.png'" mode="aspectFill" />
            <view class="activeGameMeta">
              <text class="gameTitle">{{ activeGame.zhName || activeGame.name }}</text>
              <text class="gameSubTitle" v-if="activeGame.zhName && activeGame.zhName !== activeGame.name">{{ activeGame.name }}</text>
              <text class="gameDomainTag">{{ activeGame.domain }}</text>
            </view>
            <view class="clearGameBtn" @click="clearActiveGame">
              <text class="clearGameText">清除</text>
            </view>
          </view>

          <view class="noGameCard" v-else @click="goToGamesPage">
            <view class="noGameIconBox">
              <NexusIcon name="globe" size="44rpx" color="#818cf8" />
            </view>
            <view class="noGameMeta">
              <text class="noGameTitle">全网模组模式</text>
              <text class="noGameSub">未锁定单一游戏，点击选择热门游戏专区</text>
            </view>
            <text class="cardArrow">›</text>
          </view>
        </view>

        <!-- ------------------------------------------------------------------ -->
        <!-- 区域 D：常用偏好与开关                                              -->
        <!-- ------------------------------------------------------------------ -->
        <view class="sectionCard preferencesCard">
          <view class="cardHeaderRow">
            <view class="cardHeaderLeft">
              <NexusIcon name="gear" size="32rpx" color="#a78bfa" />
              <text class="cardHeaderText">通用偏好与功能</text>
            </view>
          </view>

          <!-- 免费自动翻译开关 (纯净自动双语，零虚假宣传) -->
          <view class="prefItemRow" @click="toggleTranslate">
            <view class="prefItemLeft">
              <view class="translateIconBox">
                <NexusIcon name="globe" size="36rpx" color="#38bdf8" />
              </view>
              <view class="prefTextCol">
                <view class="prefTitleRow">
                  <text class="prefTitle">免费自动翻译</text>
                  <text class="freeFeatureTag">免费</text>
                </view>
                <text class="prefSub">自动将游戏名、模组标题与标签译为中文</text>
              </view>
            </view>
            <view class="switchBadge" :class="{ on: enableAutoTranslate }">
              <text class="switchText">{{ enableAutoTranslate ? '已开启' : '英文原文' }}</text>
            </view>
          </view>

          <!-- 是否显示 18+ 成人内容开关 (保护用户默认安全环境，自主决定开启) -->
          <view class="prefItemRow" @click="toggleAdultContent">
            <view class="prefItemLeft">
              <view class="adultIconHighlightBox">
                <text class="adultIconEmoji">🔞</text>
              </view>
              <view class="prefTextCol">
                <view class="prefTitleRow">
                  <text class="prefTitle">展示 18+ 成人内容</text>
                  <text class="adultWarningTag" v-if="showAdultContent">已解除限制</text>
                </view>
                <text class="prefSub">开启后将在模组列表展示含成人/清凉内容的模组</text>
              </view>
            </view>
            <view class="switchBadge" :class="{ on: showAdultContent, 'adult-switch': showAdultContent }">
              <text class="switchText">{{ showAdultContent ? '已开启' : '已过滤' }}</text>
            </view>
          </view>

          <!-- 收藏快速入口 (已移除数量角标展示) -->
          <view class="prefItemRow" @click="goToFavorites">
            <view class="prefItemLeft">
              <NexusIcon name="heart-fill" size="34rpx" color="#f43f5e" />
              <view class="prefTextCol">
                <text class="prefTitle">我的模组收藏</text>
                <text class="prefSub">已对接 Nexus 官方云端追踪</text>
              </view>
            </view>
            <view class="prefRightMeta">
              <text class="cardArrow">›</text>
            </view>
          </view>

          <!-- 下载记录快速入口 -->
          <view class="prefItemRow" @click="goToHistory">
            <view class="prefItemLeft">
              <NexusIcon name="download" size="34rpx" color="#38bdf8" />
              <view class="prefTextCol">
                <text class="prefTitle">模组下载记录</text>
                <text class="prefSub">推送到电脑端 Mayfly 的下载记录</text>
              </view>
            </view>
            <view class="prefRightMeta">
              <text class="countPill" v-if="historyCount > 0">{{ historyCount }} 项</text>
              <text class="cardArrow">›</text>
            </view>
          </view>

          <!-- 清理本地缓存 -->
          <view class="prefItemRow" @click="handleClearCache">
            <view class="prefItemLeft">
              <NexusIcon name="trash" size="34rpx" color="#94a3b8" />
              <view class="prefTextCol">
                <text class="prefTitle">清理本地缓存</text>
                <text class="prefSub">重置本地临时数据与未授权缓存</text>
              </view>
            </view>
            <view class="prefRightMeta">
              <text class="cardArrow">›</text>
            </view>
          </view>

          <!-- 检查版本更新 (支持 wgt 热更新与 APK 整包增量检测) -->
          <view class="prefItemRow" @click="handleCheckUpdate">
            <view class="prefItemLeft">
              <NexusIcon name="refresh" size="34rpx" color="#38bdf8" :class="{ 'spinIcon': isCheckingUpdate }" />
              <view class="prefTextCol">
                <view class="prefTitleRow">
                  <text class="prefTitle">检查版本更新</text>
                  <text class="versionBadge">v{{ appVersionName }}</text>
                </view>
                <text class="prefSub">{{ isCheckingUpdate ? '正在连接更新服务器检测中...' : '支持在线热更新与整包升级' }}</text>
              </view>
            </view>
            <view class="prefRightMeta">
              <text class="cardArrow">›</text>
            </view>
          </view>
        </view>

        <!-- ------------------------------------------------------------------ -->
        <!-- 区域 E：版本与关于说明                                              -->
        <!-- ------------------------------------------------------------------ -->
        <view class="aboutSection">
          <text class="aboutTitle">Mayfly Mods 手机移动伴侣</text>
          <text class="aboutDesc">基于 NexusMods 官方公开 GraphQL 直连生态</text>
          <text class="aboutDesc">支持无感局域网与云端双模投递安装</text>
          <text class="aboutVersion">Version {{ appVersionName }} (Build {{ appVersionCode }})</text>
        </view>
      </view>
    </scroll-view>

    <!-- 3. 全局底部导航栏组件 -->
    <NexusTabBar
      active-tab="profile"
      :favorites-count="favoritesCount"
      :history-count="historyCount"
      :desktop-connected="desktopConfig && desktopConfig.connected"
      :nexus-user="nexusUser"
      @tab-refresh="onTabRefresh"
    />

    <!-- 4. 电脑端连接与配对设置弹窗 -->
    <DevicePairModal
      :visible="deviceModalVisible"
      :config="desktopConfig"
      @close="deviceModalVisible = false"
      @saved="onDeviceSaved"
    />

    <!-- 5. NexusMods 账户授权弹窗 -->
    <NexusAuthModal
      :visible="nexusAuthModalVisible"
      :nexus-user="nexusUser"
      :desktop-config="desktopConfig"
      @close="nexusAuthModalVisible = false"
      @login-success="onLoginSuccess"
      @logout="onLogout"
    />

    <!-- 6. 自动更新与热更新进度弹窗 -->
    <UpgradeModal
      :visible="upgradeModalVisible"
      :update-info="upgradeInfo"
      @close="upgradeModalVisible = false"
      @done="onUpgradeDone"
    />
  </view>
</template>

<script>
// ============================================================================
// 页面脚本：个人中心与系统设置逻辑
// ============================================================================
import NexusHeader from '../../components/NexusHeader.vue';
import NexusTabBar from '../../components/NexusTabBar.vue';
import NexusIcon from '../../components/NexusIcon.vue';
import DevicePairModal from '../../components/DevicePairModal.vue';
import NexusAuthModal from '../../components/NexusAuthModal.vue';
import UpgradeModal from '../../components/UpgradeModal.vue';
import {
  getDesktopConfig,
  saveDesktopConfig,
  testDesktopConnection,
  getNexusUser,
  getNexusApiKey,
  getShowAdultContent,
  setShowAdultContent
} from '../../services/nexus.js';
import { getFavorites } from '../../services/favorites.js';
import { getPushHistory } from '../../services/history.js';
import {
  checkAppUpgrade,
  getAppLocalVersion
} from '../../services/upgrade.js';

export default {
  name: 'ProfilePage',
  components: {
    NexusHeader,
    NexusTabBar,
    NexusIcon,
    DevicePairModal,
    NexusAuthModal,
    UpgradeModal
  },

  data() {
    return {
      // 电脑端连接配置
      desktopConfig: {
        host: '10.204.160.22',
        port: 28888,
        deviceToken: '',
        connected: false
      },
      isTestingConnection: false,
      deviceModalVisible: false,

      // NexusMods 账号信息
      nexusUser: null,
      nexusApiKey: '',
      nexusAuthModalVisible: false,

      // 统计数据
      favoritesCount: 0,
      historyCount: 0,

      // 当前选中的游戏
      activeGame: {
        domain: '',
        name: '',
        zhName: '',
        tileUrl: ''
      },

      // AI 智能翻译开关
      enableAutoTranslate: true,

      // 18+ 成人内容显示偏好开关 (默认安全过滤)
      showAdultContent: false,

      // 版本与升级相关状态
      appVersionName: '1.0.0',
      appVersionCode: 100,
      isCheckingUpdate: false,
      upgradeModalVisible: false,
      upgradeInfo: {}
    };
  },

  onShow() {
    this.refreshAllData();
  },

  methods: {
    /**
     * 刷新页面全部基础数据
     */
    refreshAllData() {
      // 读取电脑端配置
      this.desktopConfig = getDesktopConfig();

      // 读取 Nexus 用户
      this.nexusUser = getNexusUser();
      this.nexusApiKey = getNexusApiKey();

      // 读取心愿单总数
      const favs = getFavorites();
      this.favoritesCount = Array.isArray(favs) ? favs.length : 0;

      // 读取历史任务数
      const history = getPushHistory();
      this.historyCount = Array.isArray(history) ? history.length : 0;

      // 读取激活的游戏
      try {
        const saved = uni.getStorageSync('mayfly_active_game');
        if (saved && saved.domain) {
          this.activeGame = saved;
        } else {
          this.activeGame = { domain: '', name: '', zhName: '', tileUrl: '' };
        }
      } catch (e) {}

      // 读取翻译开关
      try {
        const tr = uni.getStorageSync('mayfly_enable_auto_translate');
        if (tr !== '') {
          this.enableAutoTranslate = Boolean(tr);
        }
      } catch (e) {}

      // 读取 18+ 成人内容显示偏好设置 (默认 false 安全过滤)
      this.showAdultContent = getShowAdultContent();

      // 异步读取本地原生版本号与 BuildCode
      getAppLocalVersion().then((v) => {
        if (v && v.versionName) {
          this.appVersionName = v.versionName;
          this.appVersionCode = v.versionCode;
        }
      });
    },

    /**
     * 手动检查应用新版本
     */
    async handleCheckUpdate() {
      if (this.isCheckingUpdate) return;
      this.isCheckingUpdate = true;
      try {
        const { hasUpdate, updateInfo } = await checkAppUpgrade({ showTip: true });
        if (hasUpdate && updateInfo) {
          this.upgradeInfo = updateInfo;
          this.upgradeModalVisible = true;
        }
      } catch (e) {
        uni.showToast({ title: '检查更新遇到问题', icon: 'none' });
      } finally {
        this.isCheckingUpdate = false;
      }
    },

    /**
     * 更新完成或关闭回调
     */
    onUpgradeDone() {
      this.upgradeModalVisible = false;
      this.refreshAllData();
    },

    /**
     * 打开 Nexus 账号授权弹窗
     */
    openNexusAuth() {
      this.nexusAuthModalVisible = true;
    },

    /**
     * 账号登录成功回调
     */
    onLoginSuccess(userData) {
      this.nexusUser = userData;
      this.nexusAuthModalVisible = false;
      uni.showToast({ title: 'NexusMods 授权成功', icon: 'success' });
    },

    /**
     * 退出登录回调
     */
    onLogout() {
      this.nexusUser = null;
      this.nexusApiKey = '';
      this.nexusAuthModalVisible = false;
      uni.showToast({ title: '已退出登录', icon: 'none' });
    },

    /**
     * 设备配对保存回调
     */
    onDeviceSaved(newCfg) {
      this.desktopConfig = { ...newCfg };
      this.deviceModalVisible = false;
      uni.showToast({ title: '设备配置已保存', icon: 'success' });
    },

    /**
     * 快速测试电脑端连接 (兼顾局域网 IP、端口与 Token 自动同步)
     */
    async runQuickTest() {
      this.isTestingConnection = true;
      try {
        const res = await testDesktopConnection(this.desktopConfig);
        const isOk = Boolean(res && (res.online || res === true));
        this.desktopConfig.connected = isOk;

        if (isOk && res && typeof res === 'object') {
          if (res.token && !this.desktopConfig.deviceToken) {
            this.desktopConfig.deviceToken = res.token;
          }
          if (res.hostname) {
            this.desktopConfig.hostname = res.hostname;
          }
          if (res.ip) {
            this.desktopConfig.host = res.ip;
          }
        }

        saveDesktopConfig(this.desktopConfig);
        uni.showToast({
          title: isOk ? '电脑端连接成功！' : '连接失败，请确认电脑端已启动',
          icon: isOk ? 'success' : 'none'
        });
      } catch (e) {
        uni.showToast({ title: '测试发生异常', icon: 'none' });
      } finally {
        this.isTestingConnection = false;
      }
    },

    /**
     * 打开电脑端 Mayfly 客户端官方网盘下载地址 (夸克网盘)
     */
    openClientDownload() {
      const downloadUrl = 'https://pan.quark.cn/s/37d038a566a0';
      // #ifdef APP-PLUS
      plus.runtime.openURL(downloadUrl);
      // #endif
      // #ifndef APP-PLUS
      if (typeof window !== 'undefined') {
        window.open(downloadUrl, '_blank');
      }
      // #endif
    },

    /**
     * 切换免费自动翻译状态
     */
    toggleTranslate() {
      this.enableAutoTranslate = !this.enableAutoTranslate;
      try {
        uni.setStorageSync('mayfly_enable_auto_translate', this.enableAutoTranslate);
      } catch (e) {}
      uni.showToast({
        title: this.enableAutoTranslate ? '已开启自动翻译' : '已切换为英文原文',
        icon: 'none'
      });
    },

    /**
     * 切换是否展示 18+ 成人内容偏好设置 (带状态持久化与全应用事件广播)
     */
    toggleAdultContent() {
      // 1. 翻转布尔状态并同步至本地持久化存储
      const nextState = !this.showAdultContent;
      this.showAdultContent = nextState;
      setShowAdultContent(nextState);

      // 2. 界面友好提示反馈
      uni.showToast({
        title: nextState ? '已开启 18+ 内容显示' : '已恢复默认安全过滤',
        icon: 'none',
        duration: 2000
      });

      // 3. 全局广播偏好变更信令，通知首页模组流及其他页面联动重新检索
      uni.$emit('setting-adult-changed', nextState);
    },

    /**
     * 清空当前激活的游戏专区筛选
     */
    clearActiveGame() {
      this.activeGame = { domain: '', name: '', zhName: '', tileUrl: '' };
      try {
        uni.removeStorageSync('mayfly_active_game');
      } catch (e) {}
      uni.showToast({ title: '已恢复全网模组模式', icon: 'none' });
    },

    /**
     * 跳转到游戏专区 (进入首页游戏库视角)
     */
    goToGamesPage() {
      uni.reLaunch({ url: '/pages/index/index?view=games' });
    },

    /**
     * 跳转到心愿单
     */
    goToFavorites() {
      uni.reLaunch({ url: '/pages/favorites/favorites' });
    },

    /**
     * 跳转到历史记录
     */
    goToHistory() {
      uni.reLaunch({ url: '/pages/history/history' });
    },

    /**
     * 当前 Tab 刷新
     */
    onTabRefresh() {
      this.refreshAllData();
      uni.showToast({ title: '已刷新设置', icon: 'none' });
    },

    /**
     * 清理本地缓存
     */
    handleClearCache() {
      uni.showModal({
        title: '清理本地缓存',
        content: '确定要清除所有本地临时数据吗？这将重置未同步的本地记录。',
        confirmText: '确定清理',
        confirmColor: '#ef4444',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            try {
              uni.removeStorageSync('mayfly_my_games');
              uni.removeStorageSync('mayfly_mod_favorites');
              uni.removeStorageSync('mayfly_nexus_tracked_raw');
              this.favoritesCount = 0;
            } catch (e) {}
            uni.showToast({ title: '本地缓存已清空', icon: 'success' });
            this.refreshAllData();
          }
        }
      });
    }
  }
};
</script>

<style scoped>
/* ============================================================================ */
/* 页面基础容器样式                                                             */
/* ============================================================================ */
.profilePage {
  min-height: 100vh;
  background-color: #0c0d11;
  display: flex;
  flex-direction: column;
}

.safeStatusBarSpacer {
  width: 100%;
  height: var(--status-bar-height, 25px);
  background-color: #0b0e14;
  box-sizing: border-box;
}

.profileScrollView {
  flex: 1;
  height: 0;
}

.profileContainer {
  padding: 24rpx 24rpx 160rpx 24rpx;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

/* ============================================================================ */
/* 通用卡片容器样式                                                             */
/* ============================================================================ */
.sectionCard {
  background-color: #151821;
  border-radius: 20rpx;
  border: 1rpx solid #232838;
  padding: 28rpx;
  box-sizing: border-box;
}

.cardHeaderRow {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.cardHeaderLeft {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.headerIcon {
  font-size: 32rpx;
}

.cardHeaderText {
  font-size: 28rpx;
  font-weight: 700;
  color: #f1f3f7;
}

.cardArrow {
  font-size: 36rpx;
  color: #62697b;
  font-weight: 300;
}

/* ============================================================================ */
/* 区域 A：用户状态卡片                                                         */
/* ============================================================================ */
.userCard {
  background: linear-gradient(135deg, #1e2230 0%, #151821 100%);
  border: 1rpx solid #2e3549;
}

.userCardContent {
  display: flex;
  align-items: center;
  gap: 20rpx;
  cursor: pointer;
}

.userAvatarBox {
  position: relative;
  width: 96rpx;
  height: 96rpx;
  border-radius: 50%;
  background-color: #242938;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.userAvatarBox.guest {
  background-color: rgba(218, 107, 23, 0.15);
  border: 2rpx dashed #da6b17;
}

.userAvatarImg {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 3rpx solid #da6b17;
}

.userAvatarGlyph {
  font-size: 48rpx;
  color: #da6b17;
}

.crownBadge {
  position: absolute;
  top: -6rpx;
  right: -6rpx;
  font-size: 26rpx;
}

.userMetaCol {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.userTitleRow {
  display: flex;
  align-items: center;
  gap: 14rpx;
}

.userNameText {
  font-size: 32rpx;
  font-weight: 700;
  color: #ffffff;
}

.authPillBtn {
  font-size: 22rpx;
  color: #da6b17;
  font-weight: 700;
  background-color: rgba(218, 107, 23, 0.12);
  padding: 4rpx 14rpx;
  border-radius: 20rpx;
}

.userSubText {
  font-size: 22rpx;
  color: #8b92a5;
  line-height: 1.4;
}

.roleTag {
  font-size: 18rpx;
  font-weight: 800;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
  letter-spacing: 1rpx;
}

.roleTag.premium {
  background-color: #ffd700;
  color: #121212;
}

.roleTag.supporter {
  background-color: #06b6d4;
  color: #ffffff;
}

.roleTag.member {
  background-color: #4b5563;
  color: #d1d5db;
}

/* ============================================================================ */
/* 区域 B：电脑端连接卡片                                                       */
/* ============================================================================ */
.pcStatusBadge {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 6rpx 16rpx;
  background-color: rgba(75, 85, 99, 0.3);
  border-radius: 20rpx;
}

.pcStatusBadge.online {
  background-color: rgba(16, 185, 129, 0.15);
  border: 1rpx solid rgba(16, 185, 129, 0.4);
}

.statusDot {
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  background-color: #9ca3af;
}

.pcStatusBadge.online .statusDot {
  background-color: #10b981;
  box-shadow: 0 0 8rpx #10b981;
}

.statusText {
  font-size: 22rpx;
  font-weight: 700;
  color: #9ca3af;
}

.pcStatusBadge.online .statusText {
  color: #10b981;
}

.pcMetaBox {
  background-color: #0e1017;
  border-radius: 14rpx;
  padding: 20rpx;
  margin-bottom: 20rpx;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.pcIpText {
  font-size: 24rpx;
  font-weight: 600;
  color: #dbe0eb;
  font-family: monospace;
}

.pcNoticeText {
  font-size: 20rpx;
  color: #7b8296;
  line-height: 1.4;
}

.pcActionsRow {
  display: flex;
  gap: 16rpx;
}

.actionBtn {
  flex: 1;
  height: 72rpx;
  border-radius: 14rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26rpx;
  font-weight: 700;
  cursor: pointer;
}

.actionBtn.primary {
  background-color: #da6b17;
  color: #ffffff;
  border: none;
}

.actionBtn.outline {
  background-color: #1c202d;
  color: #cbd5e1;
  border: 1rpx solid #31384e;
}

.actionBtn.downloadBtn {
  background-color: rgba(56, 189, 248, 0.12);
  color: #38bdf8;
  border: 1rpx solid rgba(56, 189, 248, 0.35);
}

.btnText {
  font-size: 26rpx;
}

/* ============================================================================ */
/* 区域 C：当前激活的游戏专区卡片                                               */
/* ============================================================================ */
.changeGameBtn {
  font-size: 24rpx;
  color: #da6b17;
  font-weight: 600;
}

.activeGameCard {
  display: flex;
  align-items: center;
  gap: 18rpx;
  background-color: #0e1017;
  border-radius: 14rpx;
  padding: 16rpx;
}

.activeGameThumb {
  width: 90rpx;
  height: 120rpx;
  border-radius: 10rpx;
  flex-shrink: 0;
}

.activeGameMeta {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
  overflow: hidden;
}

.gameTitle {
  font-size: 28rpx;
  font-weight: 700;
  color: #ffffff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.gameSubTitle {
  font-size: 20rpx;
  color: #8b92a5;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.gameDomainTag {
  font-size: 18rpx;
  color: #da6b17;
  font-family: monospace;
}

.clearGameBtn {
  padding: 8rpx 16rpx;
  background-color: #242938;
  border-radius: 8rpx;
  cursor: pointer;
}

.clearGameText {
  font-size: 22rpx;
  color: #cbd5e1;
}

.noGameCard {
  display: flex;
  align-items: center;
  gap: 16rpx;
  background-color: #0e1017;
  border-radius: 14rpx;
  padding: 20rpx;
  cursor: pointer;
}

.noGameIcon {
  font-size: 40rpx;
}

.noGameMeta {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.noGameTitle {
  font-size: 26rpx;
  font-weight: 700;
  color: #e2e8f0;
}

.noGameSub {
  font-size: 20rpx;
  color: #7b8296;
}

/* ============================================================================ */
/* 区域 D：常用偏好与入口                                                       */
/* ============================================================================ */
.prefItemRow {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #1f2433;
  cursor: pointer;
}

.prefItemRow:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.prefItemLeft {
  display: flex;
  align-items: center;
  gap: 18rpx;
  flex: 1;
}

.aiIconHighlightBox,
.translateIconBox {
  width: 58rpx;
  height: 58rpx;
  border-radius: 14rpx;
  background: linear-gradient(135deg, rgba(56, 189, 248, 0.12) 0%, rgba(14, 165, 233, 0.22) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1rpx solid rgba(56, 189, 248, 0.35);
  box-shadow: 0 0 14rpx rgba(56, 189, 248, 0.2);
}

/* 18+ 内容开关专属高亮与提示样式 */
.adultIconHighlightBox {
  width: 58rpx;
  height: 58rpx;
  border-radius: 14rpx;
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(185, 28, 28, 0.22) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1rpx solid rgba(239, 68, 68, 0.35);
  box-shadow: 0 0 14rpx rgba(239, 68, 68, 0.2);
}

.adultIconEmoji {
  font-size: 32rpx;
  line-height: 1;
}

.prefTitleRow {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.aiFeatureTag,
.freeFeatureTag {
  font-size: 18rpx;
  font-weight: 700;
  color: #38bdf8;
  background-color: rgba(56, 189, 248, 0.15);
  border: 1rpx solid rgba(56, 189, 248, 0.35);
  padding: 2rpx 8rpx;
  border-radius: 6rpx;
  line-height: 1.2;
}

.adultWarningTag {
  font-size: 18rpx;
  font-weight: 700;
  color: #ef4444;
  background-color: rgba(239, 68, 68, 0.15);
  border: 1rpx solid rgba(239, 68, 68, 0.35);
  padding: 2rpx 8rpx;
  border-radius: 6rpx;
  line-height: 1.2;
}

.prefIcon {
  font-size: 34rpx;
}

.prefTextCol {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.prefTitle {
  font-size: 26rpx;
  font-weight: 600;
  color: #f1f3f7;
}

.prefSub {
  font-size: 20rpx;
  color: #7b8296;
}

.switchBadge {
  padding: 6rpx 16rpx;
  border-radius: 20rpx;
  background-color: #242938;
}

.switchBadge.on {
  background-color: rgba(16, 185, 129, 0.15);
  border: 1rpx solid rgba(16, 185, 129, 0.35);
}

.switchBadge.adult-switch.on {
  background-color: rgba(239, 68, 68, 0.15);
  border: 1rpx solid rgba(239, 68, 68, 0.4);
}

.switchText {
  font-size: 22rpx;
  color: #8b92a5;
  font-weight: 600;
}

.switchBadge.on .switchText {
  color: #10b981;
}

.switchBadge.adult-switch.on .switchText {
  color: #ef4444;
}

.prefRightMeta {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.countPill {
  font-size: 22rpx;
  color: #da6b17;
  font-weight: 700;
  background-color: rgba(218, 107, 23, 0.12);
  padding: 2rpx 12rpx;
  border-radius: 12rpx;
}

/* ============================================================================ */
/* 区域 E：版本与关于说明                                                       */
/* ============================================================================ */
.aboutSection {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  padding: 30rpx 0;
}

.aboutTitle {
  font-size: 24rpx;
  font-weight: 700;
  color: #64748b;
}

.aboutDesc {
  font-size: 20rpx;
  color: #475569;
}

.aboutVersion {
  font-size: 18rpx;
  color: #334155;
  font-family: monospace;
  margin-top: 8rpx;
}

/* 版本号徽章与旋转动画 */
.versionBadge {
  font-size: 18rpx;
  color: #38bdf8;
  background: rgba(56, 189, 248, 0.12);
  border: 1rpx solid rgba(56, 189, 248, 0.25);
  padding: 2rpx 10rpx;
  border-radius: 8rpx;
  font-weight: 600;
  margin-left: 8rpx;
}

.spinIcon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
