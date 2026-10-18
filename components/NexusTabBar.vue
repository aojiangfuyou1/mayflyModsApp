<template>
  <!-- ======================================================================== -->
  <!-- 区域 1：全局底部导航栏外层容器 (吸底定位 + 磨砂玻璃质感 + 移动端安全区)  -->
  <!-- ======================================================================== -->
  <view class="nexusTabBarWrap">
    <view class="nexusTabBar">
      <!-- -------------------------------------------------------------------- -->
      <!-- Tab 1: 首页 (精选模组流与主推荐)                                     -->
      <!-- -------------------------------------------------------------------- -->
      <view
        class="tabItem"
        :class="{ active: activeTab === 'home' }"
        @click="switchTab('home')"
      >
        <view class="tabIconBox">
          <NexusIcon
            name="home"
            size="40rpx"
            :color="activeTab === 'home' ? '#da6b17' : '#94a3b8'"
          />
        </view>
        <text class="tabLabelText">首页</text>
        <view class="tabActiveBar" v-if="activeTab === 'home'"></view>
      </view>

      <!-- -------------------------------------------------------------------- -->
      <!-- Tab 2: 热门游戏专区 (海报库与分区选择)                               -->
      <!-- -------------------------------------------------------------------- -->
      <view
        class="tabItem"
        :class="{ active: activeTab === 'games' }"
        @click="switchTab('games')"
      >
        <view class="tabIconBox">
          <NexusIcon
            name="gamepad"
            size="40rpx"
            :color="activeTab === 'games' ? '#da6b17' : '#94a3b8'"
          />
        </view>
        <text class="tabLabelText">游戏</text>
        <view class="tabActiveBar" v-if="activeTab === 'games'"></view>
      </view>

      <!-- -------------------------------------------------------------------- -->
      <!-- Tab 3: 装机心愿单 (收藏夹与批量投递)                                 -->
      <!-- -------------------------------------------------------------------- -->
      <view
        class="tabItem"
        :class="{ active: activeTab === 'favorites' }"
        @click="switchTab('favorites')"
      >
        <view class="tabIconBox">
          <NexusIcon
            :name="activeTab === 'favorites' ? 'heart-fill' : 'heart'"
            size="38rpx"
            :color="activeTab === 'favorites' ? '#f43f5e' : '#94a3b8'"
          />
          <!-- 心愿单数量角标 Badge -->
          <view class="tabBadge" v-if="favoritesCount > 0">
            <text class="tabBadgeText">{{ favoritesCount > 99 ? '99+' : favoritesCount }}</text>
          </view>
        </view>
        <text class="tabLabelText">心愿单</text>
        <view class="tabActiveBar" v-if="activeTab === 'favorites'"></view>
      </view>

      <!-- -------------------------------------------------------------------- -->
      <!-- Tab 4: 推送清单 (已投递任务管理与重推)                               -->
      <!-- -------------------------------------------------------------------- -->
      <view
        class="tabItem"
        :class="{ active: activeTab === 'history' }"
        @click="switchTab('history')"
      >
        <view class="tabIconBox">
          <NexusIcon
            name="task"
            size="38rpx"
            :color="activeTab === 'history' ? '#38bdf8' : '#94a3b8'"
          />
          <!-- 任务历史数量角标 -->
          <view class="tabBadge grayBadge" v-if="historyCount > 0">
            <text class="tabBadgeText">{{ historyCount > 99 ? '99+' : historyCount }}</text>
          </view>
        </view>
        <text class="tabLabelText">任务</text>
        <view class="tabActiveBar" v-if="activeTab === 'history'"></view>
      </view>

      <!-- -------------------------------------------------------------------- -->
      <!-- Tab 5: 我的 (Nexus 账号、电脑端连接与设置中心)                       -->
      <!-- -------------------------------------------------------------------- -->
      <view
        class="tabItem"
        :class="{ active: activeTab === 'profile' }"
        @click="switchTab('profile')"
      >
        <view class="tabIconBox">
          <!-- 若已登录且有头像显示微型头像，否则显示极简用户轮廓矢量 -->
          <image
            v-if="nexusUser && nexusUser.avatar"
            class="tabAvatarImg"
            :src="nexusUser.avatar"
            mode="aspectFill"
          />
          <NexusIcon
            v-else
            name="user"
            size="38rpx"
            :color="activeTab === 'profile' ? '#da6b17' : '#94a3b8'"
          />
          <!-- 会员皇冠微标 -->
          <text v-if="nexusUser && nexusUser.isPremium" class="tabCrownBadge">👑</text>
          <!-- 电脑端在线绿色指示灯微点 -->
          <view
            class="tabDeviceDot"
            :class="{ online: desktopConnected }"
            :title="desktopConnected ? '电脑端已连接' : '电脑端离线'"
          ></view>
        </view>
        <text class="tabLabelText">我的</text>
        <view class="tabActiveBar" v-if="activeTab === 'profile'"></view>
      </view>
    </view>
  </view>
</template>

<script>
// ============================================================================
// NexusTabBar 组件脚本：手机 App 专用全局底部导航 Tab 栏
// ============================================================================
import NexusIcon from './NexusIcon.vue';

export default {
  name: 'NexusTabBar',
  components: {
    NexusIcon
  },
  props: {
    // 当前处于激活态的 Tab 标识: 'home' | 'games' | 'favorites' | 'history' | 'profile'
    activeTab: {
      type: String,
      default: 'home'
    },
    // 心愿单收藏总数 (用于红点角标呈现)
    favoritesCount: {
      type: Number,
      default: 0
    },
    // 推送任务总数 (用于灰蓝小角标呈现)
    historyCount: {
      type: Number,
      default: 0
    },
    // 电脑端是否已连接
    desktopConnected: {
      type: Boolean,
      default: false
    },
    // NexusMods 登录用户信息
    nexusUser: {
      type: Object,
      default: null
    }
  },

  methods: {
    /**
     * 核心路由切换处理函数
     * @param {string} tabKey 目标 Tab 标识符
     */
    switchTab(tabKey) {
      if (tabKey === this.activeTab) {
        // 重复点击当前已激活的 Tab，对外抛出刷新或回顶事件
        this.$emit('tab-refresh', tabKey);
        return;
      }

      // 路由字典映射
      const routeMap = {
        home: '/pages/index/index',
        games: '/pages/games/games',
        favorites: '/pages/favorites/favorites',
        history: '/pages/history/history',
        profile: '/pages/profile/profile'
      };

      const targetUrl = routeMap[tabKey];
      if (!targetUrl) return;

      // 使用 reLaunch 重载对应主页面，确保各 Tab 状态与生命周期干净清晰
      uni.reLaunch({
        url: targetUrl
      });
    }
  }
};
</script>

<style scoped>
/* ============================================================================ */
/* 区域 1：底部导航栏容器样式 (全面屏适配与毛玻璃背景)                          */
/* ============================================================================ */
.nexusTabBarWrap {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 990;
  background-color: rgba(18, 20, 26, 0.96);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border-top: 1rpx solid #232734;
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
  box-shadow: 0 -8rpx 30rpx rgba(0, 0, 0, 0.45);
}

.nexusTabBar {
  height: 104rpx;
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 0 10rpx;
  box-sizing: border-box;
}

/* ============================================================================ */
/* 区域 2：单个 Tab 按钮项样式 (高亮与图标动效)                                 */
/* ============================================================================ */
.tabItem {
  flex: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  transition: all 0.2s ease;
  user-select: none;
}

.tabIconBox {
  position: relative;
  width: 52rpx;
  height: 52rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 2rpx;
  color: #7d8495;
  transition: all 0.2s ease;
}

.tabGlyph {
  font-size: 38rpx;
  color: #7d8495;
  transition: all 0.2s ease;
  line-height: 1;
}

.tabAvatarImg {
  width: 44rpx;
  height: 44rpx;
  border-radius: 50%;
  border: 2rpx solid #7d8495;
  transition: all 0.2s ease;
}

.tabCrownBadge {
  position: absolute;
  top: -8rpx;
  right: -8rpx;
  font-size: 20rpx;
  line-height: 1;
}

.tabLabelText {
  font-size: 20rpx;
  font-weight: 500;
  color: #7d8495;
  transition: all 0.2s ease;
  line-height: 1;
  margin-top: 4rpx;
}

/* 激活态高亮样式 */
.tabItem.active .tabIconBox {
  color: #da6b17;
  transform: scale(1.1);
  filter: drop-shadow(0 0 10rpx rgba(218, 107, 23, 0.45));
}

.tabItem.active .tabGlyph {
  color: #da6b17;
  transform: scale(1.1);
  text-shadow: 0 0 14rpx rgba(218, 107, 23, 0.45);
}

.tabItem.active .tabAvatarImg {
  border-color: #da6b17;
  transform: scale(1.08);
  box-shadow: 0 0 12rpx rgba(218, 107, 23, 0.4);
}

.tabItem.active .tabLabelText {
  color: #da6b17;
  font-weight: 700;
}

/* 顶部/底部微型活跃光条 */
.tabActiveBar {
  position: absolute;
  bottom: 6rpx;
  width: 32rpx;
  height: 4rpx;
  background-color: #da6b17;
  border-radius: 4rpx;
  box-shadow: 0 0 8rpx #da6b17;
  animation: pulseBar 0.25s ease-out;
}

@keyframes pulseBar {
  from {
    transform: scaleX(0.2);
    opacity: 0;
  }
  to {
    transform: scaleX(1);
    opacity: 1;
  }
}

/* ============================================================================ */
/* 区域 3：角标 Badge 与连接指示灯样式                                          */
/* ============================================================================ */
.tabBadge {
  position: absolute;
  top: -4rpx;
  right: -14rpx;
  min-width: 28rpx;
  height: 28rpx;
  padding: 0 6rpx;
  background-color: #e02424;
  border: 2rpx solid #12141a;
  border-radius: 14rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}

.tabBadge.grayBadge {
  background-color: #3f4555;
}

.tabBadgeText {
  font-size: 18rpx;
  font-weight: 700;
  color: #ffffff;
  line-height: 1;
}

.tabDeviceDot {
  position: absolute;
  bottom: -2rpx;
  right: -2rpx;
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  background-color: #4b5563;
  border: 2rpx solid #12141a;
  transition: all 0.3s ease;
}

.tabDeviceDot.online {
  background-color: #10b981;
  box-shadow: 0 0 8rpx #10b981;
}
</style>
