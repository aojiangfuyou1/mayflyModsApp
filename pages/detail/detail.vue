<template>
  <!-- ======================================================================== -->
  <!-- 模组详情页 (高定数字图鉴风格：影院级宽幅轮播 + 无边框流式排版 + 纯黑暗调)   -->
  <!-- ======================================================================== -->
  <view class="nexusDetailPage">
    <!-- -------------------------------------------------------------------- -->
    <!-- 区域 1：顶部安全区悬浮返回导航 (极简毛玻璃圆键，不遮挡大画幅)           -->
    <!-- -------------------------------------------------------------------- -->
    <view class="floatingTopBar">
      <view class="floatingBackBtn" @click="handleNavBack">
        <NexusIcon name="chevron-left" size="36rpx" color="#ffffff" />
      </view>
    </view>

    <!-- -------------------------------------------------------------------- -->
    <!-- 区域 2：影院级宽幅实机画廊轮播 (整合封面与正文多截图，彻底淘汰冗余小卡片) -->
    <!-- -------------------------------------------------------------------- -->
    <view class="heroShowcaseSection">
      <!-- 2.1 原生滑动手势轮播画廊 -->
      <swiper
        class="heroSwiper"
        :indicator-dots="allGalleryImages.length > 1"
        indicator-color="rgba(255, 255, 255, 0.25)"
        indicator-active-color="#da6b17"
        :autoplay="allGalleryImages.length > 1"
        :interval="5000"
        duration="400"
        circular
      >
        <swiper-item
          v-for="(imgUrl, idx) in allGalleryImages"
          :key="idx"
          @click="previewFullImage(idx)"
        >
          <image
            class="heroSwiperImg"
            :src="imgUrl"
            mode="aspectFill"
            lazy-load
            @error="onSwiperImageError(imgUrl)"
          ></image>
        </swiper-item>
      </swiper>

      <!-- 2.2 底部平滑深黑渐变蒙层：将画面自然融进正文背景 -->
      <view class="heroBottomFade"></view>

      <!-- 2.3 右下角截图张数浮标与全屏放大提示 -->
      <view
        class="heroGalleryBadge"
        v-if="allGalleryImages.length > 0"
        @click="previewFullImage(0)"
      >
        <NexusIcon name="search" size="20rpx" color="#ffffff" />
        <text class="heroGalleryBadgeText">{{ allGalleryImages.length }} 张图鉴</text>
      </view>
    </view>

    <!-- -------------------------------------------------------------------- -->
    <!-- 区域 3：模组核心信息区 (流式现代排版，彻底告别沉重灰框堆砌)              -->
    <!-- -------------------------------------------------------------------- -->
    <view class="detailMainContent">
      <!-- 3.1 所属游戏与我的游戏书签微标 -->
      <view class="gameInfoRow" v-if="modInfo.game && (modInfo.game.name || modInfo.game.domainName)">
        <view class="gamePill" @click="goToGameHome">
          <text class="gamePillIcon">🎮</text>
          <text class="gamePillName">{{ modInfo.game.shortZhName || modInfo.game.name }}</text>
        </view>
        <view
          class="bookmarkPill"
          :class="{ isBookmarked: isCurrentGameBookmarked }"
          @click.stop="handleToggleCurrentGameBookmark"
        >
          <text class="bookmarkIcon">🔖</text>
          <text class="bookmarkText">{{ isCurrentGameBookmarked ? '已标记游戏' : '标记游戏' }}</text>
        </view>
      </view>

      <!-- 3.2 模组大标题 (白字加粗，高雅行距) -->
      <text class="modMainTitle">
        {{ isChineseMode && modZhTitle ? modZhTitle : modInfo.title }}
      </text>

      <!-- 3.3 创作者 · 时间 · 版本 · 安全认证 一体化精炼文字流 (杜绝边框堆积) -->
      <view class="authorMetaLine">
        <text class="authorName">❖ {{ modInfo.author || '未知作者' }}</text>
        <text class="metaDivider">·</text>
        <text class="metaDate">{{ isSameDate ? formattedCreatedDate : formattedUpdatedDate }}</text>
        <text class="metaDivider">·</text>
        <text class="metaVersion">v{{ modInfo.version || '1.0' }}</text>
        <text class="metaDivider">·</text>
        <view class="securityBadge">
          <text class="securityIcon">✓</text>
          <text class="securityText">安全无毒</text>
        </view>
      </view>

      <!-- 3.4 核心指标微光胶囊行 (获赞 | 下载 | 分类，轻质感透明毛玻璃) -->
      <view class="statsCapsuleRow">
        <view class="statCapsule">
          <NexusIcon name="like" size="24rpx" color="#da6b17" />
          <text class="statCount highlight">{{ modInfo.likes || 0 }}</text>
          <text class="statLabel">赞同</text>
        </view>
        <view class="statCapsule">
          <NexusIcon name="download" size="24rpx" color="#38bdf8" />
          <text class="statCount">{{ formatMetric(modInfo.downloads) }}</text>
          <text class="statLabel">下载</text>
        </view>
        <view class="statCapsule" v-if="displayCategory">
          <NexusIcon name="gamepad" size="24rpx" color="#a78bfa" />
          <text class="statCount categoryText">{{ displayCategory }}</text>
        </view>
      </view>

      <!-- 3.5 社区标签胶囊流 -->
      <view class="tagsRow" v-if="displayTags.length > 0">
        <view
          class="tagItem"
          v-for="(tag, tIdx) in displayTags"
          :key="tIdx"
        >
          <text class="tagText">{{ getTagDisplayName(tag) }}</text>
        </view>
        <view class="tagItem tagItemAdd" @click="handleTagTip">
          <text class="tagAddIcon">+</text>
          <text class="tagText">标记模组</text>
        </view>
      </view>

      <!-- 细致微弱分割线 -->
      <view class="contentDivider"></view>

      <!-- ------------------------------------------------------------------ -->
      <!-- 区域 4：模组详细说明正文区 (杂志级阅读排版，支持中英双模一键切换)    -->
      <!-- ------------------------------------------------------------------ -->
      <view class="descriptionSection">
        <view class="descHeader">
          <text class="descTitle">{{ isChineseMode ? '模组详细说明' : 'About this mod' }}</text>
          <view class="translatePill" @click="toggleTranslate">
            <text class="translatePillText">{{ isChineseMode ? '译 中文' : '原 英文' }}</text>
          </view>
        </view>

        <!-- 翻译加载指示微条 (mayflymods 专属流光徽标) -->
        <view class="translatingNoticeBar" v-if="isChineseMode && isTranslatingDescription && !modZhDescription">
          <image class="loadingMiniLogo" src="/static/logo.png" mode="aspectFit" />
          <text class="translatingNoticeText">正在为您无缝转译中文图鉴...</text>
        </view>

        <!-- 摘要引述卡片 (仅当摘要不为空且与标题不重复时展示) -->
        <view class="summaryCard" v-if="shouldShowSummary">
          <text class="summaryText">
            {{ isChineseMode && modZhSummary ? modZhSummary : modInfo.summary }}
          </text>
        </view>

        <!-- 正文富文本节点渲染 -->
        <view class="richTextContainer">
          <rich-text
            class="nexusRichNode"
            :nodes="formattedRichDescription"
          ></rich-text>
        </view>
      </view>
    </view>

    <!-- -------------------------------------------------------------------- -->
    <!-- 区域 5：底部悬浮固定操作栏 (原帖直达 + 心愿单追踪 + 一键推送到电脑)    -->
    <!-- -------------------------------------------------------------------- -->
    <view class="fixedBottomActionBar">
      <!-- 官方原帖外链直达 -->
      <view class="bottomIconBtn" @click="handleOpenWebsite">
        <NexusIcon name="link" size="34rpx" color="#94a3b8" />
        <text class="bottomIconLabel">原帖</text>
      </view>

      <!-- 心愿单收藏 / N网云端追踪 -->
      <view class="bottomIconBtn" @click="handleToggleFavorite">
        <NexusIcon
          :name="favorited ? 'heart-fill' : 'heart'"
          size="34rpx"
          :color="favorited ? '#ef4444' : '#94a3b8'"
        />
        <text class="bottomIconLabel">{{ favorited ? '已收藏' : '收藏' }}</text>
      </view>

      <!-- 核心大按钮：一键推送到电脑 Mayfly 安装 -->
      <button
        class="bottomPushBigBtn"
        :disabled="isPushing"
        @click="handlePushToDesktop"
      >
        <text class="bottomPushText">
          {{ isPushing ? '正在投递信令...' : '🚀 推送到电脑 Mayfly' }}
        </text>
      </button>
    </view>

    <!-- -------------------------------------------------------------------- -->
    <!-- 区域 6：配套弹窗组件 (电脑配对、N网授权与通用模态框)                 -->
    <!-- -------------------------------------------------------------------- -->
    <DevicePairModal
      :visible="deviceModalVisible"
      :config="desktopConfig"
      @close="closeDeviceModal"
      @saved="onDeviceConfigSaved"
    />

    <NexusAuthModal
      :visible="nexusAuthModalVisible"
      :nexus-user="nexusUser"
      :desktop-config="desktopConfig"
      @close="closeNexusAuthModal"
      @login-success="onNexusLoginSuccess"
      @logout="onNexusLogout"
    />

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
// 区域 7：组件逻辑实现 (异步图集解析、智能翻译驱动与设备信令投递)
// ============================================================================
import {
  fetchModDetail,
  fetchGameIdByDomain,
  pushModToDesktop,
  getDesktopConfig,
  formatNexusMetric,
  formatNexusDate,
  parseNexusBbCode,
  getNexusUser,
  getNexusApiKey
} from '../../services/nexus.js';
import {
  translateTextToZh,
  translateRichDescription,
  batchTranslateToZh,
  getCategoryZhName
} from '../../services/translate.js';
import { isFavorited, toggleFavorite } from '../../services/favorites.js';
import { isGameBookmarked, toggleGameBookmark } from '../../services/games.js';
import NexusIcon from '../../components/NexusIcon.vue';
import DevicePairModal from '../../components/DevicePairModal.vue';
import NexusAuthModal from '../../components/NexusAuthModal.vue';
import NexusModal from '../../components/NexusModal.vue';

export default {
  components: {
    NexusIcon,
    DevicePairModal,
    NexusAuthModal,
    NexusModal
  },

  data() {
    return {
      // 通用确认弹窗状态
      confirmModal: {
        visible: false,
        title: '提示',
        content: '',
        type: 'info',
        icon: '',
        confirmText: '确定',
        cancelText: '取消',
        showCancel: true,
        onConfirm: null
      },

      // 模组核心元数据
      modInfo: {
        id: '',
        modId: '',
        title: '',
        summary: '',
        description: '',
        coverImageUrl: '',
        thumbnailLargeUrl: '',
        version: '1.0',
        author: '',
        uploaderName: '',
        downloads: 0,
        likes: 0,
        category: '',
        createdAt: '',
        updatedAt: '',
        tags: [],
        game: {
          id: 0,
          domainName: '',
          name: '',
          shortZhName: ''
        },
        website: ''
      },

      // 详情加载状态
      loadingDetail: false,

      // 心愿单状态
      favorited: false,

      // 图集相册与加载失败过滤池
      imageGallery: [],
      failedImageUrls: [],

      // 翻译模式与标签中文字典 (默认开启全中文图鉴)
      isChineseMode: true,
      modZhTitle: '',
      modZhSummary: '',
      modZhDescription: '',
      tagZhMap: {},
      isTranslatingDescription: false,

      // 投递状态
      isPushing: false,

      // 设备配对状态
      deviceModalVisible: false,
      desktopConfig: {
        host: '192.168.1.100',
        port: 9876,
        deviceToken: 'MF-PC-8891',
        connected: false
      },

      // NexusMods 官方账户授权状态
      nexusUser: null,
      nexusApiKey: '',
      nexusAuthModalVisible: false
    };
  },

  computed: {
    /**
     * 判断当前模组所属游戏是否已被标记为「我的游戏」
     */
    isCurrentGameBookmarked() {
      if (!this.modInfo || !this.modInfo.game) return false;
      const g = this.modInfo.game;
      return isGameBookmarked(g.id || g.domainName || g.name);
    },

    /**
     * 计算友好中文分类名称
     */
    displayCategory() {
      if (!this.modInfo.category) return '综合模组';
      if (this.isChineseMode) {
        return getCategoryZhName(this.modInfo.category);
      }
      return this.modInfo.category;
    },

    /**
     * 聚合所有可用截图画廊 (自动去重并剔除加载失败项，整合封面与正文提取的高清图)
     */
    allGalleryImages() {
      const list = [];
      const cover = this.modInfo.coverImageUrl;
      if (cover && !this.failedImageUrls.includes(cover)) {
        list.push(cover);
      }
      if (this.modInfo.thumbnailLargeUrl && !list.includes(this.modInfo.thumbnailLargeUrl) && !this.failedImageUrls.includes(this.modInfo.thumbnailLargeUrl)) {
        list.push(this.modInfo.thumbnailLargeUrl);
      }
      if (Array.isArray(this.imageGallery)) {
        this.imageGallery.forEach((url) => {
          if (url && !list.includes(url) && !this.failedImageUrls.includes(url)) list.push(url);
        });
      }
      // 从描述中提取真实游戏截图
      const rawDesc = this.modInfo.description || '';
      const extracted = this.extractImagesFromText(rawDesc);
      extracted.forEach((url) => {
        if (url && !list.includes(url) && !this.failedImageUrls.includes(url)) list.push(url);
      });
      if (list.length > 0) return list;
      return (cover && !this.failedImageUrls.includes(cover)) ? [cover] : ['/static/logo.png'];
    },

    /**
     * 格式化首发时间 (紧凑月日或年月日)
     */
    formattedCreatedDate() {
      return formatNexusDate(this.modInfo.createdAt, true);
    },

    /**
     * 格式化最近更新时间
     */
    formattedUpdatedDate() {
      return formatNexusDate(this.modInfo.updatedAt || this.modInfo.createdAt, true);
    },

    /**
     * 判定首发时间与更新时间是否相同 (相同则无需多行展示)
     */
    isSameDate() {
      if (!this.modInfo.createdAt || !this.modInfo.updatedAt) return true;
      return this.formattedCreatedDate === this.formattedUpdatedDate;
    },

    /**
     * 判定是否展示简述卡片 (杜绝与标题机械重复)
     */
    shouldShowSummary() {
      const summary = (this.isChineseMode && this.modZhSummary ? this.modZhSummary : this.modInfo.summary || '').trim();
      const title = (this.isChineseMode && this.modZhTitle ? this.modZhTitle : this.modInfo.title || '').trim();
      return summary && summary.toLowerCase() !== title.toLowerCase();
    },

    /**
     * 显示的模组标签列表
     */
    displayTags() {
      if (this.modInfo.tags && this.modInfo.tags.length > 0) {
        return this.modInfo.tags;
      }
      const list = [];
      if (this.modInfo.category) list.push(this.modInfo.category);
      if (this.modInfo.game?.name) list.push(this.modInfo.game.name);
      return list.length > 0 ? list : ['General'];
    },

    /**
     * 将原始描述转为标准 HTML 节点
     */
    formattedRichDescription() {
      let raw = this.modInfo.description || this.modInfo.summary || '暂无详细描述。';
      if (this.isChineseMode && this.modZhDescription) {
        raw = this.modZhDescription;
      }
      return parseNexusBbCode(raw);
    }
  },

  onShow() {
    this.refreshNexusUser();
  },

  async onLoad(options) {
    this.refreshNexusUser();
    this.desktopConfig = getDesktopConfig();

    let targetItem = null;

    // 1. 尝试从入参反序列化对象
    const raw = options?.payload || options?.modData;
    if (raw) {
      try {
        targetItem = JSON.parse(decodeURIComponent(raw));
      } catch (e) {
        try {
          targetItem = JSON.parse(raw);
        } catch (e2) {}
      }
    }

    // 2. 页面刷新时从本地缓存恢复 (严格核对 modId 一致性，杜绝脏缓存串位覆盖新点击的模组)
    const incomingModId = String(options?.modId || options?.id || '');
    if (!targetItem) {
      try {
        const cached = uni.getStorageSync('mayfly_active_mod_cache');
        if (cached && (cached.id || cached.modId)) {
          const cachedModId = String(cached.modId || cached.id || '');
          // 若路由显式指定了 modId，必须严格匹配才使用缓存，否则废弃旧缓存
          if (!incomingModId || cachedModId === incomingModId) {
            targetItem = cached;
          }
        }
      } catch (e) {}
    }

    // 3. 通过直接链接或基础参数进入 (降级通过 modId + gameDomain/gameId 动态拉取)
    if (!targetItem && incomingModId) {
      targetItem = {
        id: incomingModId,
        modId: incomingModId,
        title: options.title || '',
        game: {
          id: Number(options.gameId) || 0,
          domainName: options.gameDomain || ''
        }
      };
    }

    if (targetItem) {
      try {
        uni.setStorageSync('mayfly_active_mod_cache', targetItem);
      } catch (e) {}
      await this.initBasicInfo(targetItem);
    }
  },

  methods: {
    // ------------------------------------------------------------------------
    // 基础数据初筛与全量异步装载
    // ------------------------------------------------------------------------

    /**
     * 初始化基础数据并触发 GraphQL 动态拉取
     */
    async initBasicInfo(item) {
      if (!item) return;

      this.modInfo = {
        ...this.modInfo,
        ...item,
        id: String(item.modId || item.id || ''),
        modId: String(item.modId || item.id || '')
      };

      this.favorited = isFavorited(this.modInfo.id);

      if (item.coverImageUrl) {
        this.imageGallery = [item.coverImageUrl];
      }

      const modId = this.modInfo.modId;
      let gameId = this.modInfo.game?.id;
      const domainName = this.modInfo.game?.domainName;

      // 如果缺少 gameId，自动通过域名检索补齐
      if (!gameId && domainName) {
        try {
          const resolved = await fetchGameIdByDomain(domainName);
          if (resolved) {
            gameId = resolved;
            this.modInfo.game.id = resolved;
          }
        } catch (e) {}
      }

      if (item.tags && item.tags.length > 0) {
        this.autoTranslateTags(item.tags);
      }

      if (modId && gameId) {
        this.loadFullDetail(modId, gameId);
      }

      if (this.isChineseMode) {
        this.autoTranslateBasicInfo();
      }
    },

    /**
     * 从文本中提取所有真实图片直链 (支持 BBCode、HTML 与静态 CDN)
     */
    extractImagesFromText(text) {
      const urls = [];
      if (!text) return urls;
      // 1. BBCode [img]url[/img]
      const bbRegex = /\[img\](.*?)\[\/img\]/gi;
      let m;
      while ((m = bbRegex.exec(text)) !== null) {
        if (m[1]) {
          const u = m[1].trim();
          if (u.startsWith('http') && !urls.includes(u)) urls.push(u);
        }
      }
      // 2. HTML <img> 标签
      const htmlRegex = /<img[^>]+src=["']([^"']+)["']/gi;
      while ((m = htmlRegex.exec(text)) !== null) {
        if (m[1]) {
          const u = m[1].trim();
          if (u.startsWith('http') && !urls.includes(u)) urls.push(u);
        }
      }
      // 3. N网静态直链识别
      const nexRegex = /https:\/\/staticdelivery\.nexusmods\.com\/[^"'\s\)]+\.(?:jpg|jpeg|png|webp)/gi;
      while ((m = nexRegex.exec(text)) !== null) {
        if (m[0] && !urls.includes(m[0])) {
          urls.push(m[0].trim());
        }
      }
      return urls;
    },

    /**
     * 点击全屏浏览图集
     */
    previewFullImage(startIndex = 0) {
      if (!this.allGalleryImages || this.allGalleryImages.length === 0) return;
      const idx = typeof startIndex === 'number' ? startIndex : 0;
      uni.previewImage({
        current: this.allGalleryImages[idx] || this.allGalleryImages[0],
        urls: this.allGalleryImages
      });
    },

    /**
     * 轮播画廊单张图片加载失败容错处理 (自动剔除损坏/不可达图片，杜绝黑屏死锁)
     */
    onSwiperImageError(url) {
      if (url && !this.failedImageUrls.includes(url)) {
        this.failedImageUrls.push(url);
      }
    },

    /**
     * 切换当前模组所属游戏的「我的游戏」书签标记
     */
    async handleToggleCurrentGameBookmark() {
      if (!this.modInfo || !this.modInfo.game) return;
      const g = this.modInfo.game;
      const gameItem = {
        id: g.id,
        name: g.name,
        domain: g.domainName || g.domain,
        modCount: g.modCount || 0,
        downloadCount: g.downloadCount || 0,
        collectionCount: g.collectionCount || 0
      };
      const res = await toggleGameBookmark(gameItem, this.nexusApiKey);
      this.$forceUpdate();
      uni.showToast({
        title: res.message,
        icon: res.bookmarked ? 'success' : 'none'
      });
    },

    /**
     * 点击所属游戏直达该游戏的首页模组流
     */
    goToGameHome() {
      if (!this.modInfo || !this.modInfo.game) return;
      const g = this.modInfo.game;
      uni.reLaunch({
        url: `/pages/index/index?domain=${g.domainName || ''}&name=${encodeURIComponent(g.name || '')}&zhName=${encodeURIComponent(g.shortZhName || g.name || '')}`
      });
    },

    /**
     * 格式化数据指标
     */
    formatMetric(num) {
      return formatNexusMetric(num);
    },

    /**
     * 获取标签中文显示名称
     */
    getTagDisplayName(tag) {
      if (!tag) return '';
      if (this.tagZhMap[tag]) return this.tagZhMap[tag];
      const dict = getCategoryZhName(tag);
      if (dict && dict !== tag) return dict;
      return tag;
    },

    /**
     * 后台静默为未翻译的模组标签批量发起并发翻译
     */
    async autoTranslateTags(tags) {
      if (!Array.isArray(tags) || tags.length === 0) return;
      const unmapped = [];
      tags.forEach((t) => {
        if (!t) return;
        const zh = getCategoryZhName(t);
        if (zh && zh !== t) {
          this.tagZhMap[t] = zh;
        } else if (!this.tagZhMap[t]) {
          unmapped.push(t);
        }
      });

      if (unmapped.length === 0) return;
      try {
        const transMap = await batchTranslateToZh(unmapped);
        const nextMap = { ...this.tagZhMap };
        unmapped.forEach((tag) => {
          if (transMap.has(tag)) {
            nextMap[tag] = transMap.get(tag);
          }
        });
        this.tagZhMap = nextMap;
      } catch (e) {
        console.warn('[MayflyDetail] 标签并发翻译提示:', e);
      }
    },

    /**
     * 从 GraphQL 实时拉取完整模组详情
     */
    async loadFullDetail(modId, gameId) {
      this.loadingDetail = true;
      try {
        const detail = await fetchModDetail(modId, gameId);
        this.modInfo = {
          ...this.modInfo,
          ...detail
        };

        if (detail.coverImageUrl && !this.imageGallery.includes(detail.coverImageUrl)) {
          this.imageGallery = [detail.coverImageUrl];
        }

        if (detail.tags && detail.tags.length > 0) {
          this.autoTranslateTags(detail.tags);
        }

        if (this.isChineseMode) {
          this.autoTranslateAllDetail();
        }
      } catch (err) {
        console.warn('[MayflyDetail] 模组全量详情异步拉取提示:', err);
      } finally {
        this.loadingDetail = false;
      }
    },

    /**
     * 极速预翻译标题与一句话摘要
     */
    async autoTranslateBasicInfo() {
      if (this.modInfo.title && !this.modZhTitle) {
        translateTextToZh(this.modInfo.title).then((t) => {
          this.modZhTitle = t;
        });
      }
      if (this.modInfo.summary && !this.modZhSummary) {
        translateTextToZh(this.modInfo.summary).then((s) => {
          this.modZhSummary = s;
        });
      }
    },

    /**
     * 正文全量深度中文翻译
     */
    async autoTranslateAllDetail() {
      await this.autoTranslateBasicInfo();
      const needsRetranslate = !this.modZhDescription || /\[(?:尺寸|大小|体型|颜色)=/i.test(this.modZhDescription);
      if (this.modInfo.description && needsRetranslate) {
        this.isTranslatingDescription = true;
        try {
          const zhRich = await translateRichDescription(this.modInfo.description);
          this.modZhDescription = zhRich;
        } catch (e) {
          console.warn('[MayflyDetail] 正文翻译异常:', e);
        } finally {
          this.isTranslatingDescription = false;
        }
      }
    },

    /**
     * 手动切换中文 / 英文原版查看
     */
    toggleTranslate() {
      this.isChineseMode = !this.isChineseMode;
      if (this.isChineseMode && !this.modZhDescription) {
        this.autoTranslateAllDetail();
      }
    },

    /**
     * 导航返回上一页
     */
    handleNavBack() {
      const pages = getCurrentPages();
      if (pages.length > 1) {
        uni.navigateBack();
      } else {
        uni.reLaunch({
          url: '/pages/index/index'
        });
      }
    },

    /**
     * 心愿单收藏 / 云端追踪切换
     */
    async handleToggleFavorite() {
      const res = await toggleFavorite(this.modInfo, this.nexusApiKey);
      this.favorited = res.favorited;
      uni.showToast({
        title: res.message,
        icon: res.favorited ? 'success' : 'none'
      });
    },

    /**
     * 访问官方原帖外链
     */
    handleOpenWebsite() {
      const url = this.modInfo.website;
      if (!url) {
        uni.showToast({ title: '暂无官方页面外链', icon: 'none' });
        return;
      }
      // #ifdef H5
      window.open(url, '_blank');
      // #endif
      // #ifndef H5
      uni.setClipboardData({
        data: url,
        success: () => {
          uni.showToast({ title: '原帖链接已复制到剪贴板', icon: 'none' });
        }
      });
      // #endif
    },

    /**
     * 一键推送到电脑端 Mayfly 自动下载安装
     */
    async handlePushToDesktop() {
      this.isPushing = true;
      try {
        const payload = {
          modId: this.modInfo.modId,
          modName: this.modInfo.title,
          gameDomain: this.modInfo.game?.domainName || '',
          gameName: this.modInfo.game?.name || '',
          coverUrl: this.modInfo.coverImageUrl,
          version: this.modInfo.version || '1.0'
        };

        const res = await pushModToDesktop(payload, this.desktopConfig);
        uni.showToast({
          title: res.message || '推送信令已到达电脑端！',
          icon: 'success',
          duration: 2500
        });
      } catch (err) {
        this.confirmModal = {
          visible: true,
          title: '电脑端连接提示',
          content: err.message || '未检测到电脑端 Mayfly 守护进程，是否立即检查配对设置？',
          type: 'warning',
          icon: 'desktop',
          confirmText: '配对设置',
          cancelText: '取消',
          showCancel: true,
          onConfirm: () => {
            this.confirmModal.visible = false;
            this.openDeviceModal();
          }
        };
      } finally {
        this.isPushing = false;
      }
    },

    handleTagTip() {
      uni.showToast({ title: '模组标签由社区投票生成', icon: 'none' });
    },

    refreshNexusUser() {
      this.nexusUser = getNexusUser();
      this.nexusApiKey = getNexusApiKey();
    },

    openDeviceModal() {
      this.deviceModalVisible = true;
    },

    closeDeviceModal() {
      this.deviceModalVisible = false;
    },

    onDeviceConfigSaved(newConfig) {
      this.desktopConfig = newConfig;
    },

    openNexusAuthModal() {
      this.nexusAuthModalVisible = true;
    },

    closeNexusAuthModal() {
      this.nexusAuthModalVisible = false;
    },

    onNexusLoginSuccess(user) {
      this.nexusUser = user;
      this.refreshNexusUser();
    },

    onNexusLogout() {
      this.nexusUser = null;
      this.refreshNexusUser();
    },

    onConfirmModalAction() {
      if (typeof this.confirmModal.onConfirm === 'function') {
        this.confirmModal.onConfirm();
      } else {
        this.confirmModal.visible = false;
      }
    }
  }
};
</script>

<style scoped>
/* ============================================================================ */
/* 区域 8：高保真暗黑极简详情页样式 (Steam / App Store 现代一体化视感)          */
/* ============================================================================ */
.nexusDetailPage {
  min-height: 100vh;
  background-color: #0d0f14;
  color: #f1f5f9;
  padding-bottom: 180rpx;
  position: relative;
}

/* 沉浸式顶部悬浮返回键 */
.floatingTopBar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: calc(88rpx + env(safe-area-inset-top, 0px));
  padding-top: env(safe-area-inset-top, 0px);
  padding-left: 24rpx;
  display: flex;
  align-items: center;
  z-index: 60;
  pointer-events: none;
}

.floatingBackBtn {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  background: rgba(18, 20, 26, 0.75);
  backdrop-filter: blur(12px);
  border: 1rpx solid rgba(255, 255, 255, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: auto;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.5);
  transition: transform 0.15s ease, background-color 0.2s ease;
}

.floatingBackBtn:active {
  transform: scale(0.92);
  background: #da6b17;
}

/* ---------------------------------------------------------------------------- */
/* 区域 9：影院级宽幅实机画廊轮播                                               */
/* ---------------------------------------------------------------------------- */
.heroShowcaseSection {
  position: relative;
  width: 100%;
  height: 520rpx;
  background-color: #07080b;
}

.heroSwiper {
  width: 100%;
  height: 100%;
}

.heroSwiperImg {
  width: 100%;
  height: 100%;
}

.heroBottomFade {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 160rpx;
  background: linear-gradient(to bottom, transparent 0%, rgba(13, 15, 20, 0.8) 60%, #0d0f14 100%);
  pointer-events: none;
}

.heroGalleryBadge {
  position: absolute;
  bottom: 24rpx;
  right: 24rpx;
  background: rgba(13, 15, 20, 0.75);
  backdrop-filter: blur(8px);
  border: 1rpx solid rgba(255, 255, 255, 0.15);
  padding: 6rpx 16rpx;
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  gap: 8rpx;
  z-index: 5;
}

.heroGalleryBadgeText {
  font-size: 20rpx;
  color: #ffffff;
  font-weight: 600;
}

/* ---------------------------------------------------------------------------- */
/* 区域 10：主信息排版区 (告别框套框，采用高级无界流式排版)                     */
/* ---------------------------------------------------------------------------- */
.detailMainContent {
  padding: 0 32rpx;
  position: relative;
  z-index: 2;
  margin-top: -20rpx;
}

/* 游戏分类与标记行 */
.gameInfoRow {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 16rpx;
}

.gamePill {
  display: inline-flex;
  align-items: center;
  gap: 8rpx;
  background: rgba(255, 255, 255, 0.06);
  border: 1rpx solid rgba(255, 255, 255, 0.1);
  padding: 6rpx 16rpx;
  border-radius: 20rpx;
}

.gamePillIcon {
  font-size: 20rpx;
}

.gamePillName {
  font-size: 22rpx;
  color: #e2e8f0;
  font-weight: 600;
}

.bookmarkPill {
  display: inline-flex;
  align-items: center;
  gap: 8rpx;
  background: rgba(218, 107, 23, 0.15);
  border: 1rpx solid rgba(218, 107, 23, 0.4);
  padding: 6rpx 16rpx;
  border-radius: 20rpx;
}

.bookmarkPill.isBookmarked {
  background: #da6b17;
  border-color: #da6b17;
}

.bookmarkIcon {
  font-size: 20rpx;
}

.bookmarkText {
  font-size: 20rpx;
  color: #ffffff;
  font-weight: 700;
}

/* 标题 */
.modMainTitle {
  font-size: 40rpx;
  font-weight: 900;
  color: #ffffff;
  line-height: 1.3;
  margin-bottom: 16rpx;
  display: block;
}

/* 创作者一体化单行 */
.authorMetaLine {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10rpx;
  font-size: 22rpx;
  color: #94a3b8;
  margin-bottom: 24rpx;
  line-height: 1.4;
}

.authorName {
  color: #d4a373;
  font-weight: 600;
}

.metaDivider {
  color: #475569;
}

.metaDate {
  color: #94a3b8;
}

.metaVersion {
  color: #cbd5e1;
  font-weight: 600;
}

.securityBadge {
  display: inline-flex;
  align-items: center;
  gap: 4rpx;
  background: rgba(52, 211, 153, 0.12);
  border: 1rpx solid rgba(52, 211, 153, 0.3);
  padding: 2rpx 10rpx;
  border-radius: 6rpx;
}

.securityIcon {
  font-size: 18rpx;
  color: #34d399;
  font-weight: 800;
}

.securityText {
  font-size: 18rpx;
  color: #34d399;
  font-weight: 600;
}

/* 核心指标微光胶囊条 */
.statsCapsuleRow {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 24rpx;
}

.statCapsule {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  background: rgba(255, 255, 255, 0.04);
  border: 1rpx solid rgba(255, 255, 255, 0.07);
  border-radius: 12rpx;
  padding: 14rpx 16rpx;
}

.statCount {
  font-size: 24rpx;
  font-weight: 700;
  color: #ffffff;
}

.statCount.highlight {
  color: #da6b17;
}

.statCount.categoryText {
  color: #cbd5e1;
  font-size: 22rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.statLabel {
  font-size: 20rpx;
  color: #64748b;
}

/* 标签流 */
.tagsRow {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-bottom: 24rpx;
}

.tagItem {
  background: rgba(255, 255, 255, 0.05);
  border: 1rpx solid rgba(255, 255, 255, 0.08);
  border-radius: 8rpx;
  padding: 6rpx 16rpx;
}

.tagText {
  font-size: 20rpx;
  color: #94a3b8;
}

.tagItemAdd {
  border-style: dashed;
  border-color: #475569;
  display: inline-flex;
  align-items: center;
  gap: 4rpx;
}

.tagAddIcon {
  font-size: 20rpx;
  color: #64748b;
}

.contentDivider {
  height: 1rpx;
  background: rgba(255, 255, 255, 0.08);
  margin: 28rpx 0;
}

/* ---------------------------------------------------------------------------- */
/* 区域 11：正文描述区样式                                                     */
/* ---------------------------------------------------------------------------- */
.descriptionSection {
  margin-top: 10rpx;
}

.descHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24rpx;
}

.descTitle {
  font-size: 32rpx;
  font-weight: 800;
  color: #ffffff;
  letter-spacing: 0.5rpx;
}

.translatePill {
  background: #da6b17;
  padding: 8rpx 20rpx;
  border-radius: 20rpx;
  box-shadow: 0 2rpx 10rpx rgba(218, 107, 23, 0.35);
}

.translatePillText {
  font-size: 22rpx;
  font-weight: 700;
  color: #ffffff;
}

.translatingNoticeBar {
  display: flex;
  align-items: center;
  gap: 8rpx;
  background: rgba(218, 107, 23, 0.12);
  border: 1rpx solid rgba(218, 107, 23, 0.25);
  padding: 12rpx 20rpx;
  border-radius: 10rpx;
  margin-bottom: 20rpx;
}

.loadingMiniLogo {
  width: 28rpx;
  height: 28rpx;
  border-radius: 6rpx;
  animation: spin 1.2s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.translatingNoticeIcon {
  font-size: 22rpx;
}

.translatingNoticeText {
  font-size: 20rpx;
  color: #da6b17;
  font-weight: 600;
}

.summaryCard {
  background: rgba(255, 255, 255, 0.03);
  border-left: 6rpx solid #da6b17;
  padding: 16rpx 20rpx;
  border-radius: 4rpx;
  margin-bottom: 24rpx;
}

.summaryText {
  font-size: 22rpx;
  color: #cbd5e1;
  line-height: 1.6;
}

.richTextContainer {
  font-size: 26rpx;
  line-height: 1.7;
  color: #e2e8f0;
}

.nexusRichNode {
  display: block;
}

/* ---------------------------------------------------------------------------- */
/* 区域 12：底部吸底操作栏                                                     */
/* ---------------------------------------------------------------------------- */
.fixedBottomActionBar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: calc(110rpx + env(safe-area-inset-bottom, 0px));
  padding-bottom: env(safe-area-inset-bottom, 0px);
  background: rgba(13, 15, 20, 0.94);
  backdrop-filter: blur(16px);
  border-top: 1rpx solid rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  padding-left: 28rpx;
  padding-right: 28rpx;
  gap: 24rpx;
  z-index: 50;
}

.bottomIconBtn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4rpx;
  padding: 0 16rpx;
}

.bottomIconLabel {
  font-size: 20rpx;
  color: #94a3b8;
  font-weight: 500;
}

.bottomPushBigBtn {
  flex: 1;
  background: linear-gradient(135deg, #da6b17, #f97316);
  border-radius: 14rpx;
  height: 84rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  box-shadow: 0 4rpx 20rpx rgba(218, 107, 23, 0.4);
}

.bottomPushText {
  font-size: 26rpx;
  font-weight: 800;
  color: #ffffff;
}

.bottomPushBigBtn[disabled] {
  opacity: 0.6;
  background: #475569;
  box-shadow: none;
}
</style>
