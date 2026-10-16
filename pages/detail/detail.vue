<template>
  <view class="detailPageContainer">
    <!-- ==================================================================== -->
    <!-- 区域 1：实机高清图鉴相册轮播 (支持全屏手势缩放) -->
    <!-- ==================================================================== -->
    <view class="gallerySection">
      <swiper
        class="gallerySwiper"
        circular
        indicator-dots
        indicator-color="rgba(255, 255, 255, 0.4)"
        indicator-active-color="#38bdf8"
        autoplay
        :interval="4500"
      >
        <swiper-item
          v-for="(imgUrl, index) in imageGallery"
          :key="index"
          @click="previewFullImage(index)"
        >
          <image
            class="galleryImage"
            :src="imgUrl"
            mode="aspectFill"
            lazy-load
          />
        </swiper-item>
      </swiper>

      <!-- 来源平台角标 -->
      <view class="sourceBadge">
        <text class="sourceBadgeText">NexusMods 官方源</text>
      </view>

      <!-- 点击全屏手势放大悬浮提示 -->
      <view class="zoomTipBadge">
        <text class="zoomTipText">🔍 点击进入全屏手势缩放</text>
      </view>
    </view>

    <!-- ==================================================================== -->
    <!-- 区域 2：核心元数据概览 -->
    <!-- ==================================================================== -->
    <view class="metaCard">
      <!-- 游戏与分类 -->
      <view class="tagRow">
        <view class="gamePill">
          <text class="gamePillText">🎮 {{ modInfo.game?.name || '未知游戏' }}</text>
        </view>
        <view class="categoryPill">
          <text class="categoryPillText">🏷️ {{ modInfo.category || '综合模组' }}</text>
        </view>
      </view>

      <!-- 模组标题与翻译切换开关 -->
      <view class="titleRow">
        <text class="modTitleText">
          {{ isChineseMode && modZhTitle ? modZhTitle : modInfo.title }}
        </text>
        <view class="translateToggleBtn" @click="toggleTranslate">
          <text class="translateToggleText">{{ isChineseMode ? '译 中文' : '原 英文' }}</text>
        </view>
      </view>

      <!-- 属性指标栏 -->
      <view class="statsGrid">
        <view class="statItem">
          <text class="statLabel">模组作者</text>
          <text class="statValue">👤 {{ modInfo.author || '未知' }}</text>
        </view>
        <view class="statItem">
          <text class="statLabel">版本</text>
          <text class="statValue">v{{ modInfo.version || '1.0' }}</text>
        </view>
        <view class="statItem">
          <text class="statLabel">总下载量</text>
          <text class="statValue highlight">📥 {{ formatNumber(modInfo.downloads) }}</text>
        </view>
        <view class="statItem">
          <text class="statLabel">赞同数</text>
          <text class="statValue highlight">❤️ {{ formatNumber(modInfo.likes) }}</text>
        </view>
      </view>
    </view>

    <!-- ==================================================================== -->
    <!-- 区域 3：AI 地道中文图鉴摘要与核心改动 -->
    <!-- ==================================================================== -->
    <view class="aiCard">
      <view class="aiHeader">
        <text class="aiIcon">✨</text>
        <text class="aiTitle">AI 智能中文图鉴摘要</text>
        <text class="aiSubBadge">自动提炼</text>
      </view>

      <!-- 一句话看懂 -->
      <view class="oneSentenceBox">
        <text class="oneSentenceLabel">【一句话看懂】</text>
        <text class="oneSentenceContent">{{ aiSummary.oneSentence }}</text>
      </view>

      <!-- 核心改动要点 -->
      <view class="highlightsBox">
        <text class="highlightsLabel">【核心改动与特性】</text>
        <view
          class="highlightItem"
          v-for="(point, idx) in aiSummary.highlights"
          :key="idx"
        >
          <text class="highlightDot">{{ idx + 1 }}</text>
          <text class="highlightText">{{ point }}</text>
        </view>
      </view>

      <!-- 原文详细描述折叠区 -->
      <view class="rawDescBox">
        <view class="rawDescHeader" @click="rawDescExpanded = !rawDescExpanded">
          <text class="rawDescTitle">原始详情描述说明</text>
          <text class="expandArrow">{{ rawDescExpanded ? '▲ 收起' : '▼ 展开' }}</text>
        </view>
        <view class="rawDescContent" v-if="rawDescExpanded">
          <text class="descText">{{ isChineseMode && modZhSummary ? modZhSummary : modInfo.summary }}</text>
        </view>
      </view>
    </view>

    <!-- ==================================================================== -->
    <!-- 区域 4：底部固定操作栏 -->
    <!-- ==================================================================== -->
    <view class="fixedBottomBar">
      <!-- 原帖链接直达 -->
      <view class="websiteBtn" @click="handleCopyWebsite">
        <text class="websiteBtnText">🔗 原帖出处</text>
      </view>

      <!-- 核心大按钮：一键推送到电脑 -->
      <button
        class="pushBigActionBtn"
        :disabled="isPushing"
        @click="handlePushToDesktop"
      >
        <text class="pushBigText">
          {{ isPushing ? '正在投递信令...' : '🚀 一键推送到电脑 Mayfly 安装' }}
        </text>
      </button>
    </view>
  </view>
</template>

<script>
// ============================================================================
// 脚本逻辑：模组详情图鉴与全屏交互
// ============================================================================
import { pushModToDesktop, getDesktopConfig } from '../../services/nexus.js';
import { translateTextToZh, formatAiModSummary } from '../../services/translate.js';

export default {
  data() {
    return {
      // 模组核心属性
      modInfo: {
        id: '',
        modId: '',
        title: '',
        summary: '',
        coverImageUrl: '',
        version: '',
        author: '',
        downloads: 0,
        likes: 0,
        category: '',
        game: {
          name: '',
          domainName: ''
        },
        website: ''
      },

      // 图集相册
      imageGallery: [],

      // 翻译与 AI 摘要
      isChineseMode: true,
      modZhTitle: '',
      modZhSummary: '',
      aiSummary: {
        oneSentence: '正在分析提炼中文图鉴...',
        highlights: []
      },
      rawDescExpanded: false,

      // 推送状态
      isPushing: false
    };
  },

  onLoad(options) {
    if (options && options.payload) {
      try {
        // 解析从首页传递进来的序列化 Mod 完整数据
        const parsed = JSON.parse(decodeURIComponent(options.payload));
        this.initModDetail(parsed);
      } catch (e) {
        console.error('[MayflyDetail] 详情入参解析异常:', e);
      }
    }
  },

  methods: {
    // ------------------------------------------------------------------------
    // 数据初始化与智能摘要提炼
    // ------------------------------------------------------------------------

    /**
     * 初始化详情数据并触发 AI 中文摘要处理
     */
    async initModDetail(mod) {
      this.modInfo = mod;

      // 构建相册图集（默认封面，若有附加图片自动拼入）
      const list = [];
      if (mod.coverImageUrl) list.push(mod.coverImageUrl);
      this.imageGallery = list.length > 0 ? list : ['/static/logo.png'];

      // 立即触发中文翻译与要点提炼
      try {
        const [zhTitle, zhSummary] = await Promise.all([
          translateTextToZh(mod.title),
          translateTextToZh(mod.summary)
        ]);

        this.modZhTitle = zhTitle;
        this.modZhSummary = zhSummary;
        this.aiSummary = formatAiModSummary(mod.summary, zhSummary);
      } catch (err) {
        // 翻译失败优雅降级为原简介
        this.aiSummary = formatAiModSummary(mod.summary);
      }
    },

    /**
     * 切换中英双语模式
     */
    toggleTranslate() {
      this.isChineseMode = !this.isChineseMode;
    },

    // ------------------------------------------------------------------------
    // 全屏图集浏览
    // ------------------------------------------------------------------------

    /**
     * 点击进入全屏手势缩放浏览
     */
    previewFullImage(index) {
      if (this.imageGallery.length === 0) return;
      uni.previewImage({
        current: index,
        urls: this.imageGallery
      });
    },

    // ------------------------------------------------------------------------
    // 远程推送与原帖
    // ------------------------------------------------------------------------

    /**
     * 一键推送到电脑 Mayfly 安装
     */
    async handlePushToDesktop() {
      if (this.isPushing) return;
      this.isPushing = true;

      uni.showLoading({
        title: '正在唤醒电脑端...'
      });

      try {
        const result = await pushModToDesktop(this.modInfo);
        uni.hideLoading();

        if (result.success) {
          uni.showModal({
            title: '推送成功 🚀',
            content: result.message,
            showCancel: false
          });
        } else {
          uni.showModal({
            title: '推送提示',
            content: result.message,
            confirmText: '返回设置',
            success: (res) => {
              if (res.confirm) {
                uni.navigateBack();
              }
            }
          });
        }
      } catch (err) {
        uni.hideLoading();
        uni.showToast({
          title: '推送超时，请检查网络',
          icon: 'none'
        });
      } finally {
        this.isPushing = false;
      }
    },

    /**
     * 复制原帖出处链接
     */
    handleCopyWebsite() {
      const url = this.modInfo.website;
      if (!url) {
        uni.showToast({
          title: '未提供出处链接',
          icon: 'none'
        });
        return;
      }

      uni.setClipboardData({
        data: url,
        success: () => {
          uni.showToast({
            title: '出处链接已复制',
            icon: 'success'
          });
        }
      });
    },

    /**
     * 格式化数字展示
     */
    formatNumber(val) {
      const n = Number(val) || 0;
      if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
      if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
      return String(n);
    }
  }
};
</script>

<style scoped>
/* ============================================================================ */
/* 样式体系：现代暗黑图鉴画册风 */
/* ============================================================================ */

.detailPageContainer {
  min-height: 100vh;
  background-color: #0b0f17;
  color: #f1f5f9;
  padding-bottom: 160rpx;
  box-sizing: border-box;
}

/* 区域 1：相册大图轮播 */
.gallerySection {
  position: relative;
  width: 100%;
  height: 480rpx;
  background-color: #05080e;
}

.gallerySwiper {
  width: 100%;
  height: 100%;
}

.galleryImage {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.sourceBadge {
  position: absolute;
  top: 24rpx;
  left: 24rpx;
  background: rgba(15, 23, 42, 0.85);
  backdrop-filter: blur(8px);
  padding: 6rpx 20rpx;
  border-radius: 20rpx;
  border: 1rpx solid rgba(251, 191, 36, 0.4);
}

.sourceBadgeText {
  font-size: 20rpx;
  font-weight: 700;
  color: #fbbf24;
}

.zoomTipBadge {
  position: absolute;
  bottom: 24rpx;
  right: 24rpx;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(6px);
  padding: 6rpx 16rpx;
  border-radius: 12rpx;
}

.zoomTipText {
  font-size: 20rpx;
  color: #94a3b8;
}

/* 区域 2：核心元数据概览 */
.metaCard {
  background-color: #121927;
  margin: 24rpx 24rpx 20rpx;
  border-radius: 24rpx;
  border: 1rpx solid #1f2b42;
  padding: 24rpx 26rpx;
}

.tagRow {
  display: flex;
  gap: 16rpx;
  margin-bottom: 18rpx;
}

.gamePill {
  background-color: rgba(56, 189, 248, 0.15);
  border: 1rpx solid rgba(56, 189, 248, 0.4);
  padding: 6rpx 20rpx;
  border-radius: 12rpx;
}

.gamePillText {
  font-size: 22rpx;
  color: #38bdf8;
  font-weight: 700;
}

.categoryPill {
  background-color: #1e293b;
  padding: 6rpx 20rpx;
  border-radius: 12rpx;
}

.categoryPillText {
  font-size: 22rpx;
  color: #94a3b8;
}

.titleRow {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 18rpx;
  margin-bottom: 24rpx;
}

.modTitleText {
  font-size: 34rpx;
  font-weight: 800;
  color: #ffffff;
  line-height: 1.35;
  flex: 1;
}

.translateToggleBtn {
  background: linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(129, 140, 248, 0.2));
  border: 1rpx solid #38bdf8;
  border-radius: 20rpx;
  padding: 8rpx 20rpx;
  white-space: nowrap;
}

.translateToggleText {
  font-size: 20rpx;
  color: #38bdf8;
  font-weight: 700;
}

.statsGrid {
  display: flex;
  justify-content: space-between;
  background-color: #0b111d;
  border-radius: 16rpx;
  padding: 16rpx 20rpx;
  border: 1rpx solid #1a253a;
}

.statItem {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.statLabel {
  font-size: 20rpx;
  color: #64748b;
}

.statValue {
  font-size: 22rpx;
  color: #e2e8f0;
  font-weight: 600;
}

.statValue.highlight {
  color: #38bdf8;
}

/* 区域 3：AI 中文图鉴摘要卡片 */
.aiCard {
  background-color: #121927;
  margin: 0 24rpx 24rpx;
  border-radius: 24rpx;
  border: 1rpx solid #1f2b42;
  padding: 26rpx;
}

.aiHeader {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 20rpx;
}

.aiIcon {
  font-size: 30rpx;
}

.aiTitle {
  font-size: 28rpx;
  font-weight: 800;
  background: linear-gradient(135deg, #38bdf8, #a855f7);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.aiSubBadge {
  font-size: 18rpx;
  background-color: rgba(168, 85, 247, 0.2);
  color: #c084fc;
  padding: 2rpx 12rpx;
  border-radius: 8rpx;
  font-weight: 600;
}

.oneSentenceBox {
  background-color: #1a2436;
  border-left: 6rpx solid #38bdf8;
  border-radius: 12rpx;
  padding: 18rpx 20rpx;
  margin-bottom: 20rpx;
}

.oneSentenceLabel {
  font-size: 22rpx;
  color: #38bdf8;
  font-weight: 700;
  display: block;
  margin-bottom: 6rpx;
}

.oneSentenceContent {
  font-size: 26rpx;
  color: #f1f5f9;
  line-height: 1.5;
}

.highlightsBox {
  margin-bottom: 24rpx;
}

.highlightsLabel {
  font-size: 22rpx;
  color: #a855f7;
  font-weight: 700;
  display: block;
  margin-bottom: 12rpx;
}

.highlightItem {
  display: flex;
  align-items: flex-start;
  gap: 14rpx;
  margin-bottom: 14rpx;
}

.highlightDot {
  width: 32rpx;
  height: 32rpx;
  background-color: rgba(168, 85, 247, 0.2);
  border: 1rpx solid #a855f7;
  color: #c084fc;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20rpx;
  font-weight: 700;
  flex-shrink: 0;
}

.highlightText {
  font-size: 24rpx;
  color: #cbd5e1;
  line-height: 1.45;
  flex: 1;
}

.rawDescBox {
  border-top: 1rpx solid #1f2b42;
  padding-top: 18rpx;
}

.rawDescHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.rawDescTitle {
  font-size: 24rpx;
  color: #94a3b8;
  font-weight: 600;
}

.expandArrow {
  font-size: 22rpx;
  color: #38bdf8;
}

.rawDescContent {
  margin-top: 14rpx;
}

.descText {
  font-size: 22rpx;
  color: #64748b;
  line-height: 1.55;
}

/* 区域 4：底部固定栏 */
.fixedBottomBar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(11, 15, 23, 0.95);
  backdrop-filter: blur(12px);
  border-top: 1rpx solid #1f2b42;
  padding: 20rpx 24rpx 40rpx;
  display: flex;
  gap: 18rpx;
  align-items: center;
  z-index: 100;
}

.websiteBtn {
  background-color: #1e293b;
  border: 1rpx solid #334155;
  border-radius: 20rpx;
  padding: 20rpx 28rpx;
  white-space: nowrap;
}

.websiteBtnText {
  font-size: 24rpx;
  color: #94a3b8;
  font-weight: 600;
}

.pushBigActionBtn {
  flex: 1;
  background: linear-gradient(135deg, #0284c7, #6366f1);
  color: #ffffff;
  border-radius: 20rpx;
  border: none;
  padding: 20rpx 0;
  line-height: 1.4;
}

.pushBigText {
  font-size: 28rpx;
  font-weight: 800;
  letter-spacing: 1rpx;
}
</style>
