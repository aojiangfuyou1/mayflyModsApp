<template>
  <view class="pageContainer">
    <!-- ==================================================================== -->
    <!-- 区域 1：顶部状态导航栏与电脑配对状态 -->
    <!-- ==================================================================== -->
    <view class="headerNav">
      <view class="brandArea">
        <text class="brandLogo">MAYFLY</text>
        <text class="brandSub">MODS</text>
        <text class="sourceTag">NexusMods</text>
      </view>
      <!-- 电脑连接状态胶囊 -->
      <view class="deviceBadge" @click="openDeviceModal">
        <view class="statusDot" :class="{ connected: desktopConfig.connected }"></view>
        <text class="statusText">{{ desktopConfig.connected ? '电脑已连接' : '配对电脑' }}</text>
      </view>
    </view>

    <!-- ==================================================================== -->
    <!-- 区域 2：搜索栏与排序过滤栏 -->
    <!-- ==================================================================== -->
    <view class="controlSection">
      <!-- 搜索输入框 -->
      <view class="searchBar">
        <text class="searchIcon">🔍</text>
        <input
          class="searchInput"
          v-model="searchText"
          placeholder="搜索 N网 任意 Mod 或游戏..."
          placeholder-class="searchPlaceholder"
          confirm-type="search"
          @confirm="onSearchConfirm"
        />
        <text v-if="searchText" class="clearIcon" @click="clearSearch">✕</text>
      </view>

      <!-- 排序切换胶囊 -->
      <view class="sortBar">
        <view
          class="sortItem"
          :class="{ active: currentSort === 'downloads' }"
          @click="changeSort('downloads')"
        >
          <text class="sortLabel">🔥 下载最多</text>
        </view>
        <view
          class="sortItem"
          :class="{ active: currentSort === 'updatedAt' }"
          @click="changeSort('updatedAt')"
        >
          <text class="sortLabel">⚡ 最近更新</text>
        </view>
        <view
          class="sortItem"
          :class="{ active: currentSort === 'createdAt' }"
          @click="changeSort('createdAt')"
        >
          <text class="sortLabel">🆕 最新发布</text>
        </view>
      </view>
    </view>

    <!-- ==================================================================== -->
    <!-- 区域 3：双列大图瀑布流卡片列表 (N网有啥显示啥) -->
    <!-- ==================================================================== -->
    <view class="modsWaterfallSection">
      <!-- 列表内容区 -->
      <view class="waterfallGrid" v-if="modList.length > 0">
        <view
          class="modCard"
          v-for="item in modList"
          :key="item.id"
          @click="openDetail(item)"
        >
          <!-- 封面大图与游戏角标 -->
          <view class="cardCoverWrapper">
            <image
              class="cardCover"
              :src="item.coverImageUrl || '/static/logo.png'"
              mode="aspectFill"
              lazy-load
            />
            <view class="gameTag">
              <text class="gameTagText">{{ item.game.name }}</text>
            </view>
          </view>

          <!-- 卡片信息主体 -->
          <view class="cardBody">
            <text class="modTitle">{{ item.title }}</text>
            <text class="modSummary">{{ item.summary }}</text>

            <view class="modMetaRow">
              <text class="modAuthor">👤 {{ item.author }}</text>
              <text class="modDownloads">📥 {{ formatCount(item.downloads) }}</text>
            </view>

            <!-- 卡片快捷安装推送按钮 -->
            <button
              class="quickPushBtn"
              :disabled="pushingModId === item.id"
              @click.stop="quickPushToDesktop(item)"
            >
              <text class="pushBtnText">
                {{ pushingModId === item.id ? '推送中...' : '🚀 推送到电脑' }}
              </text>
            </button>
          </view>
        </view>
      </view>

      <!-- 加载中状态 -->
      <view class="loadingBox" v-if="loading && modList.length === 0">
        <view class="loadingSpinner"></view>
        <text class="loadingText">正在从 N网 检索全库模组...</text>
      </view>

      <!-- 空结果提示 -->
      <view class="emptyBox" v-if="!loading && modList.length === 0">
        <text class="emptyIcon">📭</text>
        <text class="emptyText">未找到相关 N网 模组</text>
        <button class="retryBtn" @click="resetAndLoad">刷新重试</button>
      </view>

      <!-- 触底提示 -->
      <view class="bottomNotice" v-if="modList.length > 0">
        <text class="bottomText" v-if="loadingMore">正在加载更多 Mod...</text>
        <text class="bottomText" v-else-if="!hasMore">已加载全部 N网 热门模组</text>
      </view>
    </view>

    <!-- ==================================================================== -->
    <!-- 区域 4：模组详细图鉴与远程安装弹窗 -->
    <!-- ==================================================================== -->
    <view class="modalOverlay" v-if="detailVisible" @click="closeDetail">
      <view class="detailModalContent" @click.stop>
        <!-- 弹窗关闭按钮 -->
        <view class="modalCloseBtn" @click="closeDetail">✕</view>

        <!-- 模组全景封面 -->
        <image
          class="detailHeroCover"
          :src="selectedMod?.coverImageUrl || '/static/logo.png'"
          mode="aspectFill"
        />

        <scroll-view scroll-y class="detailScrollBody">
          <!-- 游戏与分类胶囊 -->
          <view class="detailTagRow">
            <view class="detailGameBadge">
              <text class="detailGameName">🎮 {{ selectedMod?.game.name }}</text>
            </view>
            <text class="detailCategoryBadge">🏷️ {{ selectedMod?.category }}</text>
          </view>

          <!-- 标题与版本 -->
          <text class="detailTitle">{{ selectedMod?.title }}</text>

          <view class="detailMetaBar">
            <text class="detailAuthor">作者：{{ selectedMod?.author }}</text>
            <text class="detailVersion">版本：v{{ selectedMod?.version }}</text>
            <text class="detailDownloads">下载：{{ formatCount(selectedMod?.downloads) }}</text>
          </view>

          <!-- 模组介绍 -->
          <view class="detailDescSection">
            <text class="detailDescTitle">📝 模组简介说明</text>
            <text class="detailDescText">{{ selectedMod?.summary }}</text>
          </view>

          <!-- 原出处直达链接 -->
          <view class="websiteLinkRow" v-if="selectedMod?.website" @click="copyWebsite">
            <text class="websiteLabel">🔗 NexusMods 原帖链接 (点击复制)</text>
          </view>
        </scroll-view>

        <!-- 底部固定大按钮：一键推送到电脑 -->
        <view class="detailFooter">
          <button
            class="detailPushBigBtn"
            :disabled="pushingModId === selectedMod?.id"
            @click="quickPushToDesktop(selectedMod)"
          >
            <text class="bigBtnText">
              {{ pushingModId === selectedMod?.id ? '正在推送到电脑...' : '🚀 一键推送到电脑 Mayfly 安装' }}
            </text>
          </button>
        </view>
      </view>
    </view>

    <!-- ==================================================================== -->
    <!-- 区域 5：电脑端连接与配对设置弹窗 -->
    <!-- ==================================================================== -->
    <view class="modalOverlay" v-if="deviceModalVisible" @click="closeDeviceModal">
      <view class="deviceModalContent" @click.stop>
        <view class="deviceModalHeader">
          <text class="modalTitle">💻 配对电脑端 Mayfly</text>
          <view class="modalCloseBtn" @click="closeDeviceModal">✕</view>
        </view>

        <view class="deviceForm">
          <view class="formItem">
            <text class="formLabel">电脑局域网 IP 地址</text>
            <input
              class="formInput"
              v-model="deviceForm.host"
              placeholder="例如 192.168.1.100"
            />
          </view>

          <view class="formItem">
            <text class="formLabel">通信端口</text>
            <input
              class="formInput"
              type="number"
              v-model="deviceForm.port"
              placeholder="默认 9876"
            />
          </view>

          <view class="formItem">
            <text class="formLabel">设备配对 Token</text>
            <input
              class="formInput"
              v-model="deviceForm.deviceToken"
              placeholder="例如 MF-PC-8891"
            />
          </view>

          <!-- 测试连接按钮 -->
          <button
            class="testConnBtn"
            :disabled="testingConnection"
            @click="runTestConnection"
          >
            <text class="testBtnText">{{ testingConnection ? '正在探测连通性...' : '⚡ 测试连接' }}</text>
          </button>

          <!-- 保存按钮 -->
          <button class="saveConfigBtn" @click="saveDeviceSettings">
            <text class="saveBtnText">保存配置</text>
          </button>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
// ============================================================================
// 脚本逻辑：首页数据流控制与交互
// ============================================================================
import {
  fetchNexusMods,
  pushModToDesktop,
  getDesktopConfig,
  saveDesktopConfig,
  testDesktopConnection
} from '../../services/nexus.js';

export default {
  data() {
    return {
      // 模组列表状态
      modList: [],
      page: 1,
      pageSize: 20,
      totalCount: 0,
      hasMore: true,
      loading: false,
      loadingMore: false,

      // 搜索与排序
      searchText: '',
      currentSort: 'downloads', // 'downloads' | 'updatedAt' | 'createdAt'

      // 详情弹窗
      detailVisible: false,
      selectedMod: null,
      pushingModId: null,

      // 设备配对设置
      deviceModalVisible: false,
      desktopConfig: {
        host: '192.168.1.100',
        port: 9876,
        deviceToken: 'MF-PC-8891',
        connected: false
      },
      deviceForm: {
        host: '',
        port: 9876,
        deviceToken: ''
      },
      testingConnection: false
    };
  },

  onLoad() {
    this.initDesktopConfig();
    this.loadMods();
  },

  onPullDownRefresh() {
    this.resetAndLoad(() => {
      uni.stopPullDownRefresh();
    });
  },

  onReachBottom() {
    if (this.hasMore && !this.loading && !this.loadingMore) {
      this.loadMoreMods();
    }
  },

  methods: {
    // ------------------------------------------------------------------------
    // 数据拉取与列表生命周期
    // ------------------------------------------------------------------------

    /**
     * 加载第一页 Nexus 模组列表
     */
    async loadMods() {
      if (this.loading) return;
      this.loading = true;
      this.page = 1;

      try {
        const result = await fetchNexusMods({
          page: 1,
          pageSize: this.pageSize,
          sort: this.currentSort,
          searchText: this.searchText
        });

        this.modList = result.items;
        this.totalCount = result.totalCount;
        this.hasMore = result.hasMore;
      } catch (err) {
        uni.showToast({
          title: '从 N网 加载失败，请检查网络',
          icon: 'none'
        });
      } finally {
        this.loading = false;
      }
    },

    /**
     * 上拉加载更多
     */
    async loadMoreMods() {
      if (this.loadingMore || !this.hasMore) return;
      this.loadingMore = true;
      const nextPage = this.page + 1;

      try {
        const result = await fetchNexusMods({
          page: nextPage,
          pageSize: this.pageSize,
          sort: this.currentSort,
          searchText: this.searchText
        });

        this.modList = [...this.modList, ...result.items];
        this.page = nextPage;
        this.hasMore = result.hasMore;
      } catch (err) {
        uni.showToast({
          title: '加载下一页失败',
          icon: 'none'
        });
      } finally {
        this.loadingMore = false;
      }
    },

    /**
     * 重置状态并重新加载
     */
    async resetAndLoad(callback) {
      this.page = 1;
      this.hasMore = true;
      await this.loadMods();
      if (typeof callback === 'function') {
        callback();
      }
    },

    // ------------------------------------------------------------------------
    // 筛选与排序交互
    // ------------------------------------------------------------------------

    /**
     * 切换排序维度
     */
    changeSort(sortType) {
      if (this.currentSort === sortType) return;
      this.currentSort = sortType;
      this.resetAndLoad();
    },

    /**
     * 搜索确认触发
     */
    onSearchConfirm() {
      this.resetAndLoad();
    },

    /**
     * 清除搜索关键字
     */
    clearSearch() {
      this.searchText = '';
      this.resetAndLoad();
    },

    // ------------------------------------------------------------------------
    // 详情交互与远程推送
    // ------------------------------------------------------------------------

    /**
     * 打开 Mod 详情模态框
     */
    openDetail(item) {
      this.selectedMod = item;
      this.detailVisible = true;
    },

    /**
     * 关闭 Mod 详情
     */
    closeDetail() {
      this.detailVisible = false;
      this.selectedMod = null;
    },

    /**
     * 快捷推送到电脑安装
     */
    async quickPushToDesktop(modItem) {
      if (!modItem || this.pushingModId) return;
      this.pushingModId = modItem.id;

      uni.showLoading({
        title: '正在推送信令...'
      });

      try {
        const result = await pushModToDesktop(modItem, this.desktopConfig);
        uni.hideLoading();

        if (result.success) {
          uni.showModal({
            title: '推送成功 🚀',
            content: result.message,
            showCancel: false
          });
        } else {
          uni.showModal({
            title: '推送未完成',
            content: result.message,
            confirmText: '去设置电脑',
            success: (res) => {
              if (res.confirm) {
                this.openDeviceModal();
              }
            }
          });
        }
      } catch (err) {
        uni.hideLoading();
        uni.showToast({
          title: '推送异常，请重试',
          icon: 'none'
        });
      } finally {
        this.pushingModId = null;
      }
    },

    /**
     * 复制 N网 原帖链接
     */
    copyWebsite() {
      if (!this.selectedMod?.website) return;
      uni.setClipboardData({
        data: this.selectedMod.website,
        success: () => {
          uni.showToast({
            title: '链接已复制到剪贴板',
            icon: 'success'
          });
        }
      });
    },

    // ------------------------------------------------------------------------
    // 电脑端配对与连通性控制
    // ------------------------------------------------------------------------

    /**
     * 初始化电脑端连接配置
     */
    initDesktopConfig() {
      this.desktopConfig = getDesktopConfig();
      this.deviceForm = {
        host: this.desktopConfig.host,
        port: this.desktopConfig.port,
        deviceToken: this.desktopConfig.deviceToken
      };
    },

    /**
     * 打开电脑配对弹窗
     */
    openDeviceModal() {
      this.deviceForm = {
        host: this.desktopConfig.host,
        port: this.desktopConfig.port,
        deviceToken: this.desktopConfig.deviceToken
      };
      this.deviceModalVisible = true;
    },

    /**
     * 关闭电脑配对弹窗
     */
    closeDeviceModal() {
      this.deviceModalVisible = false;
    },

    /**
     * 测试电脑端连通性
     */
    async runTestConnection() {
      if (!this.deviceForm.host) {
        uni.showToast({
          title: '请先填写电脑局域网 IP',
          icon: 'none'
        });
        return;
      }
      this.testingConnection = true;
      const ok = await testDesktopConnection(this.deviceForm.host, this.deviceForm.port);
      this.testingConnection = false;

      if (ok) {
        uni.showToast({
          title: '连通成功！电脑 Mayfly 响应正常',
          icon: 'success'
        });
        this.desktopConfig.connected = true;
      } else {
        uni.showModal({
          title: '连接测试未成功',
          content: '请确认电脑端 Mayfly 是否已启动且开启了远程伴侣监听，并确保手机与电脑连接同一 WiFi。',
          showCancel: false
        });
        this.desktopConfig.connected = false;
      }
    },

    /**
     * 保存设备配置
     */
    saveDeviceSettings() {
      this.desktopConfig = {
        ...this.desktopConfig,
        host: this.deviceForm.host.trim(),
        port: Number(this.deviceForm.port) || 9876,
        deviceToken: this.deviceForm.deviceToken.trim()
      };
      saveDesktopConfig(this.desktopConfig);
      this.closeDeviceModal();
      uni.showToast({
        title: '电脑配对配置已保存',
        icon: 'success'
      });
    },

    // ------------------------------------------------------------------------
    // 工具辅助方法
    // ------------------------------------------------------------------------

    /**
     * 格式化数量展示
     */
    formatCount(num) {
      const val = Number(num) || 0;
      if (val >= 1000000) {
        return (val / 1000000).toFixed(1) + 'M';
      }
      if (val >= 1000) {
        return (val / 1000).toFixed(1) + 'k';
      }
      return String(val);
    }
  }
};
</script>

<style scoped>
/* ============================================================================ */
/* 样式体系：现代暗黑电竞科技风 (Mayfly Cyber Dark) */
/* ============================================================================ */

.pageContainer {
  min-height: 100vh;
  background-color: #0f1117;
  color: #e5e7eb;
  padding: 24rpx 20rpx 40rpx;
  box-sizing: border-box;
}

/* 区域 1：头部品牌与状态栏 */
.headerNav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
  padding: 8rpx 6rpx;
}

.brandArea {
  display: flex;
  align-items: baseline;
  gap: 10rpx;
}

.brandLogo {
  font-size: 40rpx;
  font-weight: 900;
  letter-spacing: 2rpx;
  background: linear-gradient(135deg, #38bdf8, #818cf8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.brandSub {
  font-size: 26rpx;
  font-weight: 700;
  color: #94a3b8;
}

.sourceTag {
  font-size: 20rpx;
  background-color: rgba(245, 158, 11, 0.15);
  color: #fbbf24;
  padding: 4rpx 14rpx;
  border-radius: 12rpx;
  font-weight: 600;
  margin-left: 8rpx;
}

.deviceBadge {
  display: flex;
  align-items: center;
  background-color: #1e293b;
  padding: 10rpx 20rpx;
  border-radius: 30rpx;
  border: 1rpx solid #334155;
}

.statusDot {
  width: 14rpx;
  height: 14rpx;
  border-radius: 50%;
  background-color: #94a3b8;
  margin-right: 12rpx;
}

.statusDot.connected {
  background-color: #10b981;
  box-shadow: 0 0 10rpx #10b981;
}

.statusText {
  font-size: 22rpx;
  color: #cbd5e1;
}

/* 区域 2：搜索与排序 */
.controlSection {
  margin-bottom: 24rpx;
}

.searchBar {
  display: flex;
  align-items: center;
  background-color: #1a2234;
  border: 1rpx solid #2e3a52;
  border-radius: 20rpx;
  padding: 14rpx 20rpx;
  margin-bottom: 18rpx;
}

.searchIcon {
  font-size: 28rpx;
  margin-right: 12rpx;
}

.searchInput {
  flex: 1;
  font-size: 26rpx;
  color: #f8fafc;
}

.searchPlaceholder {
  color: #64748b;
  font-size: 24rpx;
}

.clearIcon {
  font-size: 26rpx;
  color: #94a3b8;
  padding: 6rpx;
}

.sortBar {
  display: flex;
  gap: 16rpx;
}

.sortItem {
  flex: 1;
  text-align: center;
  padding: 14rpx 0;
  background-color: #1e293b;
  border-radius: 16rpx;
  border: 1rpx solid #334155;
  transition: all 0.2s;
}

.sortItem.active {
  background: linear-gradient(135deg, rgba(56, 189, 248, 0.15), rgba(129, 140, 248, 0.2));
  border-color: #38bdf8;
}

.sortLabel {
  font-size: 24rpx;
  font-weight: 600;
  color: #94a3b8;
}

.sortItem.active .sortLabel {
  color: #38bdf8;
}

/* 区域 3：双列大图瀑布流 */
.modsWaterfallSection {
  width: 100%;
}

.waterfallGrid {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
}

.modCard {
  width: 48.5%;
  background-color: #182030;
  border: 1rpx solid #28354d;
  border-radius: 20rpx;
  overflow: hidden;
  margin-bottom: 22rpx;
  display: flex;
  flex-direction: column;
}

.cardCoverWrapper {
  position: relative;
  width: 100%;
  height: 240rpx;
  background-color: #0d131f;
}

.cardCover {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.gameTag {
  position: absolute;
  top: 12rpx;
  left: 12rpx;
  background: rgba(15, 23, 42, 0.85);
  backdrop-filter: blur(8px);
  padding: 4rpx 14rpx;
  border-radius: 10rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.15);
  max-width: 80%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.gameTagText {
  font-size: 20rpx;
  color: #38bdf8;
  font-weight: 600;
}

.cardBody {
  padding: 16rpx 14rpx;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.modTitle {
  font-size: 26rpx;
  font-weight: 700;
  color: #f1f5f9;
  line-height: 1.35;
  margin-bottom: 8rpx;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  height: 70rpx;
}

.modSummary {
  font-size: 22rpx;
  color: #94a3b8;
  line-height: 1.3;
  margin-bottom: 14rpx;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  height: 58rpx;
}

.modMetaRow {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 20rpx;
  color: #64748b;
  margin-bottom: 14rpx;
}

.modAuthor {
  max-width: 60%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.quickPushBtn {
  background: linear-gradient(135deg, #0284c7, #4f46e5);
  color: #ffffff;
  border: none;
  border-radius: 14rpx;
  padding: 10rpx 0;
  line-height: 1.4;
  margin-top: auto;
}

.pushBtnText {
  font-size: 22rpx;
  font-weight: 600;
}

/* 加载与空提示 */
.loadingBox, .emptyBox {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80rpx 0;
}

.loadingSpinner {
  width: 50rpx;
  height: 50rpx;
  border: 4rpx solid #334155;
  border-top-color: #38bdf8;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 20rpx;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loadingText, .emptyText, .bottomText {
  font-size: 24rpx;
  color: #64748b;
}

.emptyIcon {
  font-size: 70rpx;
  margin-bottom: 16rpx;
}

.retryBtn {
  margin-top: 24rpx;
  background-color: #1e293b;
  color: #38bdf8;
  font-size: 24rpx;
  border-radius: 20rpx;
  padding: 10rpx 36rpx;
  border: 1rpx solid #334155;
}

.bottomNotice {
  text-align: center;
  padding: 30rpx 0 10rpx;
}

/* 区域 4：详情弹窗 */
.modalOverlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(6px);
  z-index: 999;
  display: flex;
  align-items: flex-end;
}

.detailModalContent {
  width: 100%;
  max-height: 86vh;
  background-color: #131b2a;
  border-top-left-radius: 36rpx;
  border-top-right-radius: 36rpx;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  box-shadow: 0 -10rpx 40rpx rgba(0, 0, 0, 0.6);
}

.modalCloseBtn {
  position: absolute;
  top: 20rpx;
  right: 24rpx;
  background: rgba(15, 23, 42, 0.7);
  color: #e2e8f0;
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  z-index: 10;
  border: 1rpx solid rgba(255, 255, 255, 0.2);
}

.detailHeroCover {
  width: 100%;
  height: 380rpx;
  background-color: #0b0f17;
}

.detailScrollBody {
  padding: 24rpx 28rpx;
  box-sizing: border-box;
  max-height: 48vh;
}

.detailTagRow {
  display: flex;
  gap: 16rpx;
  margin-bottom: 16rpx;
}

.detailGameBadge {
  background-color: rgba(56, 189, 248, 0.15);
  border: 1rpx solid rgba(56, 189, 248, 0.4);
  padding: 6rpx 18rpx;
  border-radius: 12rpx;
}

.detailGameName {
  font-size: 22rpx;
  color: #38bdf8;
  font-weight: 600;
}

.detailCategoryBadge {
  font-size: 22rpx;
  color: #94a3b8;
  background-color: #1e293b;
  padding: 6rpx 18rpx;
  border-radius: 12rpx;
}

.detailTitle {
  font-size: 34rpx;
  font-weight: 800;
  color: #ffffff;
  line-height: 1.4;
  margin-bottom: 16rpx;
  display: block;
}

.detailMetaBar {
  display: flex;
  gap: 24rpx;
  font-size: 22rpx;
  color: #94a3b8;
  margin-bottom: 24rpx;
  padding-bottom: 20rpx;
  border-bottom: 1rpx solid #243048;
}

.detailDescSection {
  margin-bottom: 24rpx;
}

.detailDescTitle {
  font-size: 26rpx;
  font-weight: 700;
  color: #cbd5e1;
  margin-bottom: 10rpx;
  display: block;
}

.detailDescText {
  font-size: 24rpx;
  color: #94a3b8;
  line-height: 1.6;
}

.websiteLinkRow {
  background-color: #1e293b;
  padding: 16rpx 20rpx;
  border-radius: 14rpx;
  margin-top: 16rpx;
  margin-bottom: 20rpx;
}

.websiteLabel {
  font-size: 22rpx;
  color: #38bdf8;
  text-decoration: underline;
}

.detailFooter {
  padding: 20rpx 28rpx 36rpx;
  background-color: #131b2a;
  border-top: 1rpx solid #243048;
}

.detailPushBigBtn {
  background: linear-gradient(135deg, #0284c7, #6366f1);
  color: #ffffff;
  border-radius: 20rpx;
  border: none;
  padding: 20rpx 0;
  line-height: 1.4;
}

.bigBtnText {
  font-size: 28rpx;
  font-weight: 700;
  letter-spacing: 1rpx;
}

/* 区域 5：设备配对设置弹窗 */
.deviceModalContent {
  width: 90%;
  margin: auto;
  background-color: #172133;
  border-radius: 28rpx;
  border: 1rpx solid #2d3b56;
  padding: 30rpx 26rpx;
  box-sizing: border-box;
}

.deviceModalHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}

.modalTitle {
  font-size: 30rpx;
  font-weight: 700;
  color: #f1f5f9;
}

.deviceForm {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.formItem {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.formLabel {
  font-size: 22rpx;
  color: #94a3b8;
}

.formInput {
  background-color: #0f172a;
  border: 1rpx solid #334155;
  border-radius: 14rpx;
  padding: 14rpx 18rpx;
  font-size: 26rpx;
  color: #f8fafc;
}

.testConnBtn {
  background-color: #1e293b;
  border: 1rpx solid #38bdf8;
  border-radius: 16rpx;
  padding: 14rpx 0;
  margin-top: 10rpx;
}

.testBtnText {
  font-size: 24rpx;
  color: #38bdf8;
  font-weight: 600;
}

.saveConfigBtn {
  background: linear-gradient(135deg, #059669, #10b981);
  color: #ffffff;
  border-radius: 16rpx;
  border: none;
  padding: 18rpx 0;
  margin-top: 8rpx;
}

.saveBtnText {
  font-size: 26rpx;
  font-weight: 700;
}
</style>
