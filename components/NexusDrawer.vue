<template>
  <!-- ======================================================================== -->
  <!-- NexusDrawer：全局统一抽屉导航菜单 (对标 Nexus 官方移动端全站导航规范)   -->
  <!-- ======================================================================== -->
  <view class="drawerMask" v-if="visible" @click="$emit('close')">
    <view class="drawerContent" @click.stop>
      <!-- 抽屉顶部头部 -->
      <view class="drawerHeader">
        <view class="drawerBrandArea">
          <view class="drawerLogoBox">
            <text class="drawerLogoGlyph">❖</text>
          </view>
          <view class="drawerBrandTextCol">
            <text class="drawerBrandTitle">Mayfly Mods</text>
            <text class="drawerBrandSub">NexusMods 官方移动伴侣</text>
          </view>
        </view>
        <view class="drawerCloseBtn" @click="$emit('close')">✕</view>
      </view>

      <!-- 1. 登录用户状态卡片 -->
      <view class="drawerNexusCard guest" v-if="!nexusUser" @click="handleNav('auth')">
        <view class="nexusAvatarBox">
          <NexusIcon name="user" size="44rpx" color="#da6b17" />
        </view>
        <view class="nexusCardInfo">
          <view class="nexusCardTitleRow">
            <text class="nexusCardTitle">登录 NexusMods 账户</text>
            <text class="nexusLoginPill">点击授权 ›</text>
          </view>
          <text class="nexusCardSub">支持网页免密授权与 API Key 直连</text>
        </view>
      </view>
      <view class="drawerNexusCard logged" v-else @click="handleNav('auth')">
        <view class="nexusAvatarBox">
          <image v-if="nexusUser.avatar" class="nexusAvatarImg" :src="nexusUser.avatar" mode="aspectFill" />
          <NexusIcon v-else name="user" size="44rpx" color="#da6b17" />
          <text v-if="nexusUser.isPremium" class="premiumCrownBadge">👑</text>
        </view>
        <view class="nexusCardInfo">
          <view class="nexusCardTitleRow">
            <text class="nexusCardTitle">{{ nexusUser.name }}</text>
            <text v-if="nexusUser.isPremium" class="userPremiumTag">PREMIUM</text>
            <text v-else-if="nexusUser.isSupporter" class="userSupporterTag">SUPPORTER</text>
            <text v-else class="userMemberTag">MEMBER</text>
          </view>
          <text class="nexusCardSub">UID: {{ nexusUser.userId }} · 已授权绑定</text>
        </view>
        <text class="drawerNavArrow">›</text>
      </view>

      <!-- 2. 当前选中的游戏卡片 -->
      <view class="drawerActiveGameCard" v-if="selectedGameDomain">
        <image
          class="activeGameThumb"
          :src="activeGameTileUrl || '/static/logo.png'"
          mode="aspectFill"
        />
        <view class="activeGameMetaBox" @click="handleNav('home')">
          <text class="activeGameNameText">{{ activeGameOriginalName || activeGameDisplayName }}</text>
          <text class="activeGameZhSubText" v-if="activeGameDisplayName && activeGameDisplayName !== activeGameOriginalName">
            {{ activeGameDisplayName }}
          </text>
        </view>
        <view class="clearActiveGameBtn" @click.stop="$emit('clear-game')">
          <text class="clearActiveGameIcon">✕</text>
        </view>
      </view>
      <view class="drawerNoGameCard" v-else @click="handleNav('games')">
        <view class="noGameIconBox">
          <NexusIcon name="globe" size="40rpx" color="#818cf8" />
        </view>
        <view class="noGameMetaBox">
          <text class="noGameMainText">全网模组模式</text>
          <text class="noGameSubText">点击进入热门游戏专区选择</text>
        </view>
        <text class="drawerNavArrow">›</text>
      </view>

      <!-- 3. 全局功能导航路由列表 -->
      <view class="drawerNavList">
        <view class="drawerNavItem" @click="handleNav('home')">
          <view class="navItemLeft">
            <NexusIcon name="home" size="34rpx" color="#cbd5e1" />
            <text class="itemText">精选模组库 (Mods)</text>
          </view>
          <view class="navItemRight">
            <text class="currentTag" v-if="selectedGameDomain">{{ activeGameDisplayName }}</text>
            <text class="drawerNavArrow">›</text>
          </view>
        </view>

        <view class="drawerNavItem" @click="handleNav('games')">
          <view class="navItemLeft">
            <NexusIcon name="gamepad" size="34rpx" color="#cbd5e1" />
            <text class="itemText">我的游戏 (My Games)</text>
          </view>
          <text class="drawerNavArrow">›</text>
        </view>

        <view class="drawerNavItem" @click="handleNav('favorites')">
          <view class="navItemLeft">
            <NexusIcon name="heart-fill" size="34rpx" color="#f43f5e" />
            <text class="itemText">我的模组收藏 (Favorites)</text>
          </view>
          <view class="navItemRight">
            <text class="itemBadge" v-if="favoritesCount > 0">{{ favoritesCount }}</text>
            <text class="drawerNavArrow">›</text>
          </view>
        </view>

        <view class="drawerNavItem" @click="handleNav('history')">
          <view class="navItemLeft">
            <NexusIcon name="download" size="34rpx" color="#38bdf8" />
            <text class="itemText">模组下载记录 (Downloads)</text>
          </view>
          <view class="navItemRight">
            <text class="itemBadge" v-if="historyCount > 0">{{ historyCount }}</text>
            <text class="drawerNavArrow">›</text>
          </view>
        </view>

        <view class="drawerNavItem" @click="handleNav('auth')">
          <view class="navItemLeft">
            <NexusIcon name="user" size="34rpx" color="#cbd5e1" />
            <text class="itemText">NexusMods 账户与授权</text>
          </view>
          <view class="navItemRight">
            <text class="nexusNavTag" :class="{ authed: !!nexusUser }">
              {{ nexusUser ? (nexusUser.isPremium ? '👑 Premium' : '已登录') : '去登录' }}
            </text>
            <text class="drawerNavArrow">›</text>
          </view>
        </view>

        <view class="drawerNavItem" @click="handleNav('profile')">
          <view class="navItemLeft">
            <NexusIcon name="gear" size="34rpx" color="#a78bfa" />
            <text class="itemText">个人中心与设置 (Profile)</text>
          </view>
          <text class="drawerNavArrow">›</text>
        </view>

        <!-- AI 智能双语图鉴 (优雅灵动星芒) -->
        <view class="drawerNavItem" @click="$emit('toggle-translate')">
          <view class="navItemLeft">
            <NexusIcon name="ai" size="34rpx" color="#f59e0b" />
            <text class="itemText">AI 智能双语图鉴</text>
          </view>
          <view class="navItemRight">
            <text class="itemSwitchTag" :class="{ on: enableAutoTranslate }">
              {{ enableAutoTranslate ? '已开启' : '原英文' }}
            </text>
          </view>
        </view>
      </view>

      <!-- 4. 电脑端连接卡片 -->
      <view class="drawerPcCard">
        <view class="pcCardTop">
          <view style="display: flex; align-items: center; gap: 8rpx;">
            <NexusIcon name="desktop" size="30rpx" color="#38bdf8" />
            <text class="pcCardTitle">电脑端连接状态</text>
          </view>
          <view class="pcStatusBadge" :class="{ online: desktopConfig && desktopConfig.connected }">
            <text class="pcStatusText">{{ desktopConfig && desktopConfig.connected ? '已连接' : '未连接' }}</text>
          </view>
        </view>
        <text class="pcIpText">目标主机: {{ desktopConfig ? desktopConfig.host : '' }}:{{ desktopConfig ? desktopConfig.port : '' }}</text>
        <view class="pcActionsRow">
          <button class="pcActionBtn primary" @click="handleNav('device')">
            <NexusIcon name="gear" size="24rpx" color="#ffffff" style="margin-right: 6rpx;" />
            <text class="btnText">配对设置</text>
          </button>
          <button class="pcActionBtn" @click="$emit('quick-test')">
            <NexusIcon name="wifi" size="24rpx" color="#cbd5e1" style="margin-right: 6rpx;" />
            <text class="btnText">测试连接</text>
          </button>
        </view>
      </view>

      <view class="drawerFooter">
        <text class="footerVersion">NexusMods 官方公开 GraphQL 直连</text>
        <text class="footerSub">Mayfly Mod Manager Companion</text>
      </view>
    </view>
  </view>
</template>

<script>
// ============================================================================
// NexusDrawer 组件逻辑：侧边沉浸式全站导航抽屉
// ============================================================================
import NexusIcon from './NexusIcon.vue';

export default {
  name: 'NexusDrawer',
  components: {
    NexusIcon
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    nexusUser: {
      type: Object,
      default: null
    },
    selectedGameDomain: {
      type: String,
      default: ''
    },
    activeGameTileUrl: {
      type: String,
      default: ''
    },
    activeGameDisplayName: {
      type: String,
      default: ''
    },
    activeGameOriginalName: {
      type: String,
      default: ''
    },
    desktopConfig: {
      type: Object,
      default: () => ({ connected: false })
    },
    enableAutoTranslate: {
      type: Boolean,
      default: true
    },
    favoritesCount: {
      type: Number,
      default: 0
    },
    historyCount: {
      type: Number,
      default: 0
    }
  },

  methods: {
    handleNav(target) {
      this.$emit('close');
      this.$emit('nav', target);
    }
  }
};
</script>

<style scoped>
/* ============================================================================ */
/* NexusDrawer 抽屉菜单样式                                                     */
/* ============================================================================ */
.drawerMask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  z-index: 999;
}

.drawerContent {
  width: 600rpx;
  max-width: 80vw;
  height: 100%;
  background-color: #141518;
  border-right: 1rpx solid #232731;
  display: flex;
  flex-direction: column;
  padding: 40rpx 32rpx;
  box-sizing: border-box;
  animation: slideIn 0.25s ease-out;
  overflow-y: auto;
}

@keyframes slideIn {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(0);
  }
}

.drawerHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 28rpx;
}

.drawerBrandArea {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.drawerLogoBox {
  width: 68rpx;
  height: 68rpx;
  background-color: #da6b17;
  border-radius: 14rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.drawerLogoGlyph {
  font-size: 40rpx;
  color: #ffffff;
  font-weight: 900;
}

.drawerBrandTextCol {
  display: flex;
  flex-direction: column;
}

.drawerBrandTitle {
  font-size: 32rpx;
  font-weight: 800;
  color: #ffffff;
}

.drawerBrandSub {
  font-size: 20rpx;
  color: #9ca3af;
}

.drawerCloseBtn {
  font-size: 36rpx;
  color: #9ca3af;
  padding: 10rpx;
  cursor: pointer;
}

.drawerNexusCard {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 20rpx;
  border-radius: 16rpx;
  margin-bottom: 24rpx;
  cursor: pointer;
}

.drawerNexusCard.guest {
  background: linear-gradient(135deg, #1f232b 0%, #16191f 100%);
  border: 1rpx solid #333a48;
}

.drawerNexusCard.logged {
  background: linear-gradient(135deg, #26211d 0%, #1a1715 100%);
  border: 1rpx solid #573a21;
}

.nexusAvatarBox {
  position: relative;
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  background-color: #2a2f3a;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nexusAvatarImg {
  width: 100%;
  height: 100%;
  border-radius: 50%;
}

.nexusAvatarGlyph {
  font-size: 36rpx;
  color: #9ca3af;
}

.premiumCrownBadge {
  position: absolute;
  top: -6rpx;
  right: -6rpx;
  font-size: 20rpx;
}

.nexusCardInfo {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
  overflow: hidden;
}

.nexusCardTitleRow {
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.nexusCardTitle {
  font-size: 26rpx;
  font-weight: 700;
  color: #ffffff;
}

.nexusLoginPill {
  font-size: 20rpx;
  color: #da6b17;
  font-weight: 700;
}

.userPremiumTag {
  font-size: 16rpx;
  background: linear-gradient(135deg, #da6b17 0%, #f59e0b 100%);
  color: #ffffff;
  padding: 2rpx 8rpx;
  border-radius: 4rpx;
  font-weight: 800;
}

.userSupporterTag {
  font-size: 16rpx;
  background: #3b82f6;
  color: #ffffff;
  padding: 2rpx 8rpx;
  border-radius: 4rpx;
  font-weight: 800;
}

.userMemberTag {
  font-size: 16rpx;
  background: #374151;
  color: #9ca3af;
  padding: 2rpx 8rpx;
  border-radius: 4rpx;
}

.nexusCardSub {
  font-size: 20rpx;
  color: #9ca3af;
}

.drawerActiveGameCard {
  display: flex;
  align-items: center;
  gap: 16rpx;
  background: #1e2229;
  border: 1rpx solid #363d4a;
  border-radius: 14rpx;
  padding: 16rpx;
  margin-bottom: 24rpx;
}

.activeGameThumb {
  width: 64rpx;
  height: 96rpx;
  border-radius: 8rpx;
  flex-shrink: 0;
}

.activeGameMetaBox {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
  overflow: hidden;
}

.activeGameNameText {
  font-size: 24rpx;
  font-weight: 700;
  color: #ffffff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.activeGameZhSubText {
  font-size: 20rpx;
  color: #d4a373;
}

.clearActiveGameBtn {
  width: 44rpx;
  height: 44rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #2b303c;
}

.clearActiveGameIcon {
  font-size: 22rpx;
  color: #9ca3af;
}

.drawerNoGameCard {
  display: flex;
  align-items: center;
  gap: 16rpx;
  background: #181b21;
  border: 1rpx dashed #303744;
  border-radius: 14rpx;
  padding: 18rpx;
  margin-bottom: 24rpx;
}

.noGameIconBox {
  width: 60rpx;
  height: 60rpx;
  border-radius: 12rpx;
  background: #232731;
  display: flex;
  align-items: center;
  justify-content: center;
}

.noGameGlyph {
  font-size: 32rpx;
}

.noGameMetaBox {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.noGameMainText {
  font-size: 24rpx;
  font-weight: 700;
  color: #e5e7eb;
}

.noGameSubText {
  font-size: 19rpx;
  color: #9ca3af;
}

.drawerNavList {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  margin-bottom: 28rpx;
}

.drawerNavItem {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 22rpx 16rpx;
  border-radius: 12rpx;
  transition: background-color 0.15s ease;
  cursor: pointer;
}

.drawerNavItem:active {
  background-color: #20242e;
}

.navItemLeft {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.navItemRight {
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.itemIcon {
  font-size: 32rpx;
}

.itemText {
  font-size: 26rpx;
  font-weight: 600;
  color: #e5e7eb;
}

.drawerNavArrow {
  font-size: 28rpx;
  color: #64748b;
}

.currentTag {
  font-size: 18rpx;
  color: #da6b17;
  background: rgba(218, 107, 23, 0.15);
  padding: 2rpx 10rpx;
  border-radius: 6rpx;
  max-width: 140rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.itemBadge {
  background: #da6b17;
  color: #ffffff;
  font-size: 18rpx;
  font-weight: 700;
  padding: 2rpx 12rpx;
  border-radius: 12rpx;
}

.nexusNavTag {
  font-size: 20rpx;
  color: #da6b17;
  font-weight: 600;
}

.nexusNavTag.authed {
  color: #10b981;
}

.itemSwitchTag {
  font-size: 20rpx;
  color: #9ca3af;
  background: #232731;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
}

.itemSwitchTag.on {
  color: #10b981;
  background: rgba(16, 185, 129, 0.15);
}

.drawerPcCard {
  background: #181b21;
  border: 1rpx solid #282e3a;
  border-radius: 16rpx;
  padding: 20rpx;
  display: flex;
  flex-direction: column;
  gap: 10rpx;
  margin-top: auto;
}

.pcCardTop {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pcCardTitle {
  font-size: 24rpx;
  font-weight: 700;
  color: #e5e7eb;
}

.pcStatusBadge {
  padding: 2rpx 10rpx;
  border-radius: 8rpx;
  background: #374151;
}

.pcStatusBadge.online {
  background: rgba(16, 185, 129, 0.15);
}

.pcStatusText {
  font-size: 18rpx;
  font-weight: 700;
  color: #9ca3af;
}

.pcStatusBadge.online .pcStatusText {
  color: #10b981;
}

.pcIpText {
  font-size: 20rpx;
  color: #64748b;
}

.pcActionsRow {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-top: 6rpx;
}

.pcActionBtn {
  flex: 1;
  background: #232731;
  border: 1rpx solid #333a48;
  border-radius: 10rpx;
  padding: 10rpx 0;
  margin: 0;
}

.pcActionBtn.primary {
  background: #da6b17;
  border-color: #da6b17;
}

.btnText {
  font-size: 22rpx;
  font-weight: 600;
  color: #ffffff;
}

.drawerFooter {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4rpx;
  padding-top: 24rpx;
}

.footerVersion {
  font-size: 18rpx;
  color: #64748b;
}

.footerSub {
  font-size: 16rpx;
  color: #475569;
}
</style>
