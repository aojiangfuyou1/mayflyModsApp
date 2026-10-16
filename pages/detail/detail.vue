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
      <!-- 游戏与分类 + 收藏与分享 -->
      <view class="tagRow">
        <view class="tagLeft">
          <view class="gamePill">
            <text class="gamePillText">🎮 {{ modInfo.game?.name || '未知游戏' }}</text>
          </view>
          <view class="categoryPill">
            <text class="categoryPillText">🏷️ {{ modInfo.category || '综合模组' }}</text>
          </view>
        </view>
        <view class="tagRightActions">
          <!-- 收藏按钮 -->
          <view class="actionCircleBtn" @click="handleToggleFavorite">
            <text class="actionCircleIcon">{{ favorited ? '❤️' : '🤍' }}</text>
          </view>
          <!-- 分享按钮 -->
          <view class="actionCircleBtn" @click="handleShareMod">
            <text class="actionCircleIcon">📤</text>
          </view>
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
    <!-- 区域 3.5：前置依赖体检与避坑提示 -->
    <!-- ==================================================================== -->
    <view class="reqCard">
      <view class="reqHeader">
        <text class="reqIcon">🧩</text>
        <text class="reqTitle">前置依赖与运行体检</text>
        <text class="reqBadge" :class="{ free: !loadingRequirements && requirements.length === 0 }">
          {{ loadingRequirements ? '检测中...' : requirements.length === 0 ? '免前置 · 开箱即用' : `${requirements.length} 个前置` }}
        </text>
      </view>

      <view class="reqBody">
        <view class="reqFreeNotice" v-if="!loadingRequirements && requirements.length === 0">
          <text class="freeText">✓ 该模组为独立 Mod，无需额外安装复杂的前置 Loader，电脑端可直接原生部署生效！</text>
        </view>

        <view class="reqList" v-if="requirements.length > 0">
          <view class="reqItem" v-for="(req, idx) in requirements" :key="idx">
            <text class="reqBullet">⚠️</text>
            <view class="reqInfo">
              <text class="reqName">{{ req.name }}</text>
              <text class="reqNotes" v-if="req.notes">{{ req.notes }}</text>
            </view>
          </view>
          <text class="reqTip">💡 提示：电脑端 Mayfly 收到推送后会自动检测并一键补齐上述前置，请放心安装。</text>
        </view>
      </view>
    </view>

    <!-- ==================================================================== -->
    <!-- 区域 3.6：物理文件清单 (Files) 与精准分流选择 -->
    <!-- ==================================================================== -->
    <view class="filesCard">
      <view class="filesHeader">
        <text class="filesIcon">📦</text>
        <text class="filesTitle">模组物理文件清单 (Files)</text>
        <text class="filesBadge" :class="{ loading: loadingFiles }">
          {{ loadingFiles ? '拉取中...' : `${modFiles.length} 个文件` }}
        </text>
      </view>

      <view class="filesBody">
        <!-- 加载中骨架 -->
        <view class="filesLoadingNotice" v-if="loadingFiles">
          <text class="loadingNoticeText">⏳ 正在从 Nexus 节点拉取最新文件列表...</text>
        </view>

        <!-- 无文件回退 -->
        <view class="filesEmptyNotice" v-else-if="modFiles.length === 0">
          <text class="emptyNoticeText">ℹ️ 暂未解析到独立可选包，推送时电脑端将默认拉取官方最新主文件。</text>
        </view>

        <!-- 文件项列表 -->
        <view class="filesList" v-else>
          <view
            class="fileItem"
            v-for="file in modFiles"
            :key="file.fileId"
            :class="{ selected: selectedFileId === file.fileId, isMain: file.category === 'MAIN' }"
            @click="selectFile(file)"
          >
            <view class="fileItemTop">
              <view class="fileCategoryBadge" :class="fileCategoryClass(file.category)">
                <text class="fileCategoryText">{{ fileCategoryLabel(file.category) }}</text>
              </view>
              <text class="fileNameText">{{ file.name }}</text>
              <view class="fileRadioIndicator">
                <text class="radioIcon">{{ selectedFileId === file.fileId ? '🟢' : '⚪' }}</text>
              </view>
            </view>

            <view class="fileMetaRow">
              <text class="fileMetaTag">🏷️ v{{ file.version }}</text>
              <text class="fileMetaTag">💾 {{ file.sizeFormatted }}</text>
              <text class="fileMetaPrimary" v-if="file.isPrimary">★ 官方推荐</text>
            </view>

            <view class="fileDescBox" v-if="file.description">
              <text class="fileDescText">{{ file.description }}</text>
            </view>

            <view class="fileItemActionRow">
              <view class="singlePushBtn" @click.stop="handlePushSingleFile(file)">
                <text class="singlePushBtnText">🚀 仅推送此文件</text>
              </view>
            </view>
          </view>
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
import { pushModToDesktop, getDesktopConfig, fetchModRequirements, fetchModFiles } from '../../services/nexus.js';
import { translateTextToZh, formatAiModSummary } from '../../services/translate.js';
import { isFavorited, toggleFavorite } from '../../services/favorites.js';

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
          domainName: '',
          id: 0
        },
        website: ''
      },

      // 心愿单状态
      favorited: false,

      // 前置依赖
      requirements: [],
      loadingRequirements: false,

      // 物理文件列表 (Files)
      modFiles: [],
      loadingFiles: false,
      selectedFileId: null,
      selectedFile: null,

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
      this.favorited = isFavorited(mod.id || mod.modId);

      // 构建相册图集（默认封面，若有附加图片自动拼入）
      const list = [];
      if (mod.coverImageUrl) list.push(mod.coverImageUrl);
      this.imageGallery = list.length > 0 ? list : ['/static/logo.png'];

      // 异步探测前置依赖
      this.loadRequirements(mod);

      // 异步拉取物理文件清单
      this.loadModFiles(mod);

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
     * 异步拉取模组前置依赖
     */
    async loadRequirements(mod) {
      const modId = mod.modId || mod.id;
      const gameId = mod.game?.id;
      if (!modId || !gameId) return;

      this.loadingRequirements = true;
      try {
        const reqs = await fetchModRequirements(modId, gameId);
        this.requirements = reqs;
      } catch (e) {
        this.requirements = [];
      } finally {
        this.loadingRequirements = false;
      }
    },

    /**
     * 异步拉取物理文件列表 (Files)
     */
    async loadModFiles(mod) {
      const modId = mod.modId || mod.id;
      const gameId = mod.game?.id;
      if (!modId || !gameId) return;

      this.loadingFiles = true;
      try {
        const files = await fetchModFiles(modId, gameId);
        this.modFiles = files;

        // 默认自动选中推荐主文件 (isPrimary 或 MAIN 或首项)
        if (files && files.length > 0) {
          const primaryFile = files.find(f => f.isPrimary) ||
                              files.find(f => f.category === 'MAIN') ||
                              files[0];
          this.selectedFileId = primaryFile.fileId;
          this.selectedFile = primaryFile;
        }
      } catch (e) {
        this.modFiles = [];
      } finally {
        this.loadingFiles = false;
      }
    },

    /**
     * 用户单选文件项
     */
    selectFile(file) {
      this.selectedFileId = file.fileId;
      this.selectedFile = file;
    },

    /**
     * 获取文件分类徽章样式类
     */
    fileCategoryClass(category) {
      const cat = String(category || '').toUpperCase();
      if (cat === 'MAIN') return 'catMain';
      if (cat === 'UPDATE') return 'catUpdate';
      if (cat === 'OPTIONAL') return 'catOptional';
      return 'catDefault';
    },

    /**
     * 获取文件分类友好中文展示
     */
    fileCategoryLabel(category) {
      const cat = String(category || '').toUpperCase();
      if (cat === 'MAIN') return '主文件';
      if (cat === 'UPDATE') return '更新补丁';
      if (cat === 'OPTIONAL') return '可选扩展';
      if (cat === 'OLD_VERSION') return '历史旧版';
      return '其他附件';
    },

    /**
     * 单独推送指定文件到电脑
     */
    async handlePushSingleFile(file) {
      this.selectFile(file);
      await this.handlePushToDesktop();
    },

    /**
     * 切换心愿单收藏状态
     */
    handleToggleFavorite() {
      const nextStatus = toggleFavorite(this.modInfo);
      this.favorited = nextStatus;
      uni.showToast({
        title: nextStatus ? '已加入心愿单 ❤️' : '已移出心愿单',
        icon: 'none'
      });
    },

    /**
     * 分享 Mod 口令卡片给好友
     */
    handleShareMod() {
      const title = this.modZhTitle || this.modInfo.title;
      const game = this.modInfo.game?.name || '热门游戏';
      const url = this.modInfo.website || 'https://www.nexusmods.com';
      const shareText = `【Mayfly Mod 伴侣分享】\n🎮 游戏：《${game}》\n📦 模组：${title}\n🔗 直达：${url}\n⚡ 手机一键推送到电脑 Mayfly 极速安装！`;

      uni.setClipboardData({
        data: shareText,
        success: () => {
          uni.showModal({
            title: '分享口令已复制 📋',
            content: '已将 Mod 信息与直达链接复制到剪贴板，可直接粘贴发送给微信/QQ好友！',
            showCancel: false
          });
        }
      });
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

      const fileDesc = this.selectedFile ? ` (${this.selectedFile.name})` : '';
      uni.showLoading({
        title: '正在唤醒电脑端...'
      });

      try {
        // 如果用户选中了特定的文件，装配精准物理文件参数
        const targetPayload = {
          ...this.modInfo
        };
        if (this.selectedFile) {
          targetPayload.fileId = this.selectedFile.fileId;
          targetPayload.fileName = this.selectedFile.name;
          targetPayload.fileVersion = this.selectedFile.version;
          targetPayload.fileSize = this.selectedFile.sizeInBytes;
          targetPayload.fileSizeFormatted = this.selectedFile.sizeFormatted;
        }

        const result = await pushModToDesktop(targetPayload);
        uni.hideLoading();

        if (result.success) {
          uni.showModal({
            title: '推送成功 🚀',
            content: result.message + fileDesc,
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
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18rpx;
}

.tagLeft {
  display: flex;
  gap: 16rpx;
}

.tagRightActions {
  display: flex;
  gap: 14rpx;
}

.actionCircleBtn {
  background-color: #1e293b;
  border: 1rpx solid #334155;
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.actionCircleIcon {
  font-size: 24rpx;
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

/* 区域 3.5：前置依赖体检卡片 */
.reqCard {
  background-color: #121927;
  margin: 0 24rpx 24rpx;
  border-radius: 24rpx;
  border: 1rpx solid #1f2b42;
  padding: 26rpx;
}

.reqHeader {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 18rpx;
}

.reqIcon {
  font-size: 28rpx;
}

.reqTitle {
  font-size: 28rpx;
  font-weight: 800;
  color: #f1f5f9;
}

.reqBadge {
  font-size: 20rpx;
  padding: 4rpx 14rpx;
  border-radius: 10rpx;
  font-weight: 700;
  background-color: rgba(245, 158, 11, 0.15);
  color: #fbbf24;
  margin-left: auto;
}

.reqBadge.free {
  background-color: rgba(16, 185, 129, 0.15);
  color: #10b981;
}

.reqFreeNotice {
  background-color: rgba(16, 185, 129, 0.1);
  border: 1rpx solid rgba(16, 185, 129, 0.3);
  border-radius: 14rpx;
  padding: 16rpx 20rpx;
}

.freeText {
  font-size: 22rpx;
  color: #34d399;
  line-height: 1.5;
}

.reqList {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.reqItem {
  display: flex;
  align-items: flex-start;
  gap: 12rpx;
  background-color: #1a2436;
  padding: 14rpx 18rpx;
  border-radius: 14rpx;
}

.reqBullet {
  font-size: 24rpx;
  flex-shrink: 0;
}

.reqInfo {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.reqName {
  font-size: 24rpx;
  font-weight: 700;
  color: #f8fafc;
}

.reqNotes {
  font-size: 20rpx;
  color: #94a3b8;
}

.reqTip {
  font-size: 20rpx;
  color: #64748b;
  margin-top: 8rpx;
  line-height: 1.4;
}

/* 区域 3.6：模组物理文件清单 (Files) 卡片 */
.filesCard {
  background-color: #121927;
  margin: 0 24rpx 24rpx;
  border-radius: 24rpx;
  border: 1rpx solid #1f2b42;
  padding: 26rpx;
}

.filesHeader {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 20rpx;
}

.filesIcon {
  font-size: 28rpx;
}

.filesTitle {
  font-size: 28rpx;
  font-weight: 800;
  color: #f1f5f9;
}

.filesBadge {
  font-size: 20rpx;
  padding: 4rpx 14rpx;
  border-radius: 10rpx;
  font-weight: 700;
  background-color: rgba(56, 189, 248, 0.15);
  color: #38bdf8;
  margin-left: auto;
}

.filesBadge.loading {
  background-color: rgba(148, 163, 184, 0.15);
  color: #94a3b8;
}

.filesLoadingNotice,
.filesEmptyNotice {
  background-color: #1a2436;
  border-radius: 14rpx;
  padding: 20rpx;
  text-align: center;
}

.loadingNoticeText,
.emptyNoticeText {
  font-size: 22rpx;
  color: #94a3b8;
}

.filesList {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.fileItem {
  background-color: #162032;
  border: 1.5rpx solid #23314d;
  border-radius: 18rpx;
  padding: 20rpx 22rpx;
  transition: all 0.2s ease;
}

.fileItem.selected {
  border-color: #38bdf8;
  background-color: rgba(56, 189, 248, 0.08);
  box-shadow: 0 0 16rpx rgba(56, 189, 248, 0.2);
}

.fileItem.isMain {
  border-left: 6rpx solid #10b981;
}

.fileItemTop {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 12rpx;
}

.fileCategoryBadge {
  padding: 2rpx 12rpx;
  border-radius: 8rpx;
  flex-shrink: 0;
}

.fileCategoryBadge.catMain {
  background-color: rgba(16, 185, 129, 0.2);
  border: 1rpx solid rgba(16, 185, 129, 0.5);
}

.fileCategoryBadge.catMain .fileCategoryText {
  color: #34d399;
}

.fileCategoryBadge.catUpdate {
  background-color: rgba(245, 158, 11, 0.2);
  border: 1rpx solid rgba(245, 158, 11, 0.5);
}

.fileCategoryBadge.catUpdate .fileCategoryText {
  color: #fbbf24;
}

.fileCategoryBadge.catOptional {
  background-color: rgba(168, 85, 247, 0.2);
  border: 1rpx solid rgba(168, 85, 247, 0.5);
}

.fileCategoryBadge.catOptional .fileCategoryText {
  color: #c084fc;
}

.fileCategoryBadge.catDefault {
  background-color: rgba(148, 163, 184, 0.2);
  border: 1rpx solid rgba(148, 163, 184, 0.4);
}

.fileCategoryBadge.catDefault .fileCategoryText {
  color: #cbd5e1;
}

.fileCategoryText {
  font-size: 18rpx;
  font-weight: 700;
}

.fileNameText {
  font-size: 24rpx;
  font-weight: 700;
  color: #ffffff;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fileRadioIndicator {
  flex-shrink: 0;
}

.radioIcon {
  font-size: 24rpx;
}

.fileMetaRow {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 10rpx;
}

.fileMetaTag {
  font-size: 20rpx;
  color: #94a3b8;
}

.fileMetaPrimary {
  font-size: 20rpx;
  color: #34d399;
  font-weight: 700;
  margin-left: auto;
}

.fileDescBox {
  background-color: #0d1522;
  border-radius: 10rpx;
  padding: 10rpx 14rpx;
  margin-bottom: 12rpx;
}

.fileDescText {
  font-size: 20rpx;
  color: #64748b;
  line-height: 1.45;
}

.fileItemActionRow {
  display: flex;
  justify-content: flex-end;
}

.singlePushBtn {
  background-color: rgba(56, 189, 248, 0.15);
  border: 1rpx solid rgba(56, 189, 248, 0.35);
  border-radius: 12rpx;
  padding: 6rpx 18rpx;
}

.singlePushBtnText {
  font-size: 20rpx;
  color: #38bdf8;
  font-weight: 600;
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
