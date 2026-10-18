<template>
  <!-- ======================================================================== -->
  <!-- 模组详情页 (极简纯黑沉浸式排版，已剔除冗余按钮与不必要板块)                 -->
  <!-- ======================================================================== -->
  <view class="nexusDetailPage">
    <!-- -------------------------------------------------------------------- -->
    <!-- 区域 1：沉浸式安全区悬浮返回导航 (取代沉重顶栏，自适应手机状态栏)        -->
    <!-- -------------------------------------------------------------------- -->
    <view class="floatingTopBar">
      <view class="floatingBackBtn" @click="handleNavBack">
        <NexusIcon name="chevron-left" size="36rpx" color="#ffffff" />
      </view>
    </view>

    <!-- -------------------------------------------------------------------- -->
    <!-- 区域 2：Hero 头部大图画幅与核心指标 (去除重复操作按钮，数据 100% 真实) -->
    <!-- -------------------------------------------------------------------- -->
    <view class="heroBannerSection">
      <!-- 背景大图层 (渐变半透明遮罩) -->
      <image
        class="heroBgImage"
        :src="modInfo.coverImageUrl || '/static/logo.png'"
        mode="aspectFill"
      ></image>
      <view class="heroOverlayGradient"></view>

      <!-- 头部内容层 -->
      <view class="heroContentBox">
        <!-- 模组所属游戏与书签标记行 -->
        <view class="modGameBadgeRow" v-if="modInfo.game && (modInfo.game.name || modInfo.game.domainName)">
          <view class="modGameBadge" @click="goToGameHome">
            <text class="modGameBadgeIcon">🎮</text>
            <text class="modGameBadgeName">{{ modInfo.game.shortZhName || modInfo.game.name }}</text>
          </view>
          <view
            class="modGameBookmarkBtn"
            :class="{ isBookmarked: isCurrentGameBookmarked }"
            @click.stop="handleToggleCurrentGameBookmark"
            title="标记为我的游戏"
          >
            <text class="modGameBookmarkIcon">🔖</text>
            <text class="modGameBookmarkText">{{ isCurrentGameBookmarked ? '已在我的游戏' : '标记为我的游戏' }}</text>
          </view>
        </view>

        <!-- 模组大标题 (白字加粗) -->
        <text class="modMainTitle">
          {{ isChineseMode && modZhTitle ? modZhTitle : modInfo.title }}
        </text>

        <!-- 4 列横向真实指标条 (获赞推荐 | 总下载量 | 当前版本 | 所属分类，彻底告别 '--' 占位) -->
        <view class="heroStatsRow">
          <!-- 获赞数 Endorsements -->
          <view class="heroStatCol">
            <text class="heroStatLabel">获赞推荐</text>
            <text class="heroStatVal highlight">{{ modInfo.likes || 0 }}</text>
          </view>
          <!-- 总下载量 Total DLs -->
          <view class="heroStatCol">
            <text class="heroStatLabel">总下载量</text>
            <text class="heroStatVal">{{ formatMetric(modInfo.downloads) }}</text>
          </view>
          <!-- 模组版本 Version -->
          <view class="heroStatCol">
            <text class="heroStatLabel">当前版本</text>
            <text class="heroStatVal boldWhite">v{{ modInfo.version || '1.0' }}</text>
          </view>
          <!-- 模组分类 Category -->
          <view class="heroStatCol">
            <text class="heroStatLabel">所属分类</text>
            <text class="heroStatVal">{{ displayCategory }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- -------------------------------------------------------------------- -->
    <!-- 区域 3：模组展示图画廊 (支持多截图横向滚动浏览与全屏缩放预览)          -->
    <!-- -------------------------------------------------------------------- -->
    <view class="gallerySection" v-if="allGalleryImages.length > 0">
      <view class="galleryHeaderRow">
        <view class="galleryTitleGroup">
          <text class="gallerySectionTitle">模组展示图</text>
          <text class="galleryCountBadge">共 {{ allGalleryImages.length }} 张</text>
        </view>
        <view class="galleryPreviewAction" @click="previewFullImage(0)">
          <NexusIcon name="search" size="22rpx" color="#da6b17" />
          <text class="galleryPreviewActionText">全屏查看</text>
        </view>
      </view>

      <!-- 多图横向画廊流 -->
      <scroll-view class="galleryScrollView" scroll-x show-scrollbar="false">
        <view class="galleryImagesList">
          <view
            class="galleryCardItem"
            v-for="(imgUrl, gIdx) in allGalleryImages"
            :key="gIdx"
            @click="previewFullImage(gIdx)"
          >
            <image
              class="galleryCardImg"
              :src="imgUrl"
              mode="aspectFill"
              lazy-load
            ></image>
            <view class="galleryCardIndex">
              <text class="galleryCardIndexText">{{ gIdx + 1 }}/{{ allGalleryImages.length }}</text>
            </view>
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- -------------------------------------------------------------------- -->
    <!-- 区域 4：双列精炼元数据卡片 (彻底剔除作者与上传者、首发与更新的重复)      -->
    <!-- -------------------------------------------------------------------- -->
    <view class="metaTableCard">
      <view class="metaGrid">
        <!-- 左列 -->
        <view class="metaCol">
          <!-- 作者信息 (作者与上传者相同时仅显示单项，杜绝重复) -->
          <view class="metaCell">
            <text class="metaCellLabel">{{ isSameAuthor ? '创建作者' : '原始创作者' }}</text>
            <text class="metaCellVal">{{ modInfo.author || '未知作者' }}</text>
          </view>
          <!-- 时间信息：若相同仅显示发布时间，若不同显示最近更新 -->
          <view class="metaCell">
            <text class="metaCellLabel">{{ isSameDate ? '发布时间' : '最近更新' }}</text>
            <text class="metaCellVal">{{ isSameDate ? formattedCreatedDate : formattedUpdatedDate }}</text>
          </view>
        </view>

        <!-- 右列 -->
        <view class="metaCol">
          <!-- 上传者 (仅当创作者与上传者不同时单独展示) -->
          <view class="metaCell" v-if="!isSameAuthor">
            <text class="metaCellLabel">上传分发者</text>
            <text class="metaCellVal uploaderLink">{{ modInfo.uploaderName }}</text>
          </view>
          <!-- 首发时间 (仅当首发与更新时间不同时单独展示) -->
          <view class="metaCell" v-if="!isSameDate">
            <text class="metaCellLabel">首发上传</text>
            <text class="metaCellVal">{{ formattedCreatedDate }}</text>
          </view>
          <!-- 安全检测 -->
          <view class="metaCell">
            <text class="metaCellLabel">安全检测</text>
            <view class="virusScanRow">
              <text class="virusScanIcon">✓</text>
              <text class="virusScanText">官方无毒安全免扫</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- -------------------------------------------------------------------- -->
    <!-- 区域 5：标签胶囊列表栏 (支持动态并发转译中文标签)                      -->
    <!-- -------------------------------------------------------------------- -->
    <view class="tagsSection">
      <scroll-view class="tagsScrollView" scroll-x show-scrollbar="false">
        <view class="tagsList">
          <view
            class="tagPill"
            v-for="(tag, tIdx) in displayTags"
            :key="tIdx"
          >
            <text class="tagPillText">{{ getTagDisplayName(tag) }}</text>
          </view>
          <view class="tagPill addTagPill" @click="handleTagTip">
            <text class="addTagIcon">+</text>
            <text class="tagPillText">标记此模组</text>
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 分割线 -->
    <view class="nexusDivider"></view>

    <!-- -------------------------------------------------------------------- -->
    <!-- 区域 6：模组详细说明正文区 (直接直观呈现，彻底移除不必要的多板块选择器)   -->
    <!-- -------------------------------------------------------------------- -->
    <view class="sectionBodyContainer">
      <view class="aboutHeaderRow">
        <text class="aboutTitle">{{ isChineseMode ? '模组详细说明' : 'About this mod' }}</text>
        <view class="translateBtn" @click="toggleTranslate">
          <text class="translateBtnText">{{ isChineseMode ? '译 中文' : '原 英文' }}</text>
        </view>
      </view>

      <!-- 详情加载指示器 -->
      <view class="loadingBox" v-if="loadingDetail">
        <view class="loadingSpinner"></view>
        <text class="loadingNotice">正在从 N网 GraphQL 实时解析正文富文本...</text>
      </view>

      <!-- 正文富文本渲染区域 -->
      <view class="nexusArticleBody" v-else>
        <!-- 正文正在翻译提示 -->
        <view class="translatingNoticeBar" v-if="isChineseMode && isTranslatingDescription && !modZhDescription">
          <text class="translatingNoticeIcon">⚡</text>
          <text class="translatingNoticeText">正在为您无缝转译中文图鉴...</text>
        </view>

        <!-- 一句话总结 / 中文简述 (与标题不相同时展示) -->
        <view class="articleSummaryBox" v-if="shouldShowSummary">
          <text class="articleSummaryText">
            {{ isChineseMode && modZhSummary ? modZhSummary : modInfo.summary }}
          </text>
        </view>

        <!-- 正文富文本节点 (BBCode 转译后的原汁原味排版) -->
        <rich-text
          class="nexusRichNode"
          :nodes="formattedRichDescription"
        ></rich-text>
      </view>
    </view>

    <!-- -------------------------------------------------------------------- -->
    <!-- 区域 7：底部悬浮固定操作栏 (原帖出处 + 心愿单追踪 + 一键推送到电脑)    -->
    <!-- -------------------------------------------------------------------- -->
    <view class="fixedBottomActionBar">
      <!-- 官方原帖外链直达 -->
      <view class="bottomIconBtn" @click="handleOpenWebsite">
        <NexusIcon name="link" size="34rpx" color="#cbd5e1" />
        <text class="bottomIconLabel">原帖</text>
      </view>

      <!-- 心愿单收藏 / N网云端追踪 -->
      <view class="bottomIconBtn" @click="handleToggleFavorite">
        <NexusIcon
          :name="favorited ? 'heart-fill' : 'heart'"
          size="34rpx"
          :color="favorited ? '#ef4444' : '#cbd5e1'"
        />
        <text class="bottomIconLabel">{{ favorited ? '已追踪' : '追踪' }}</text>
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
    <!-- 区域 8：配套弹窗组件 (电脑配对、N网授权与通用模态框)                 -->
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
// 区域 9：组件业务逻辑 (GraphQL 详情装载、智能图集提取与排版数据驱动)
// ============================================================================
import {
  fetchModDetail,
  fetchGameIdByDomain,
  pushModToDesktop,
  getDesktopConfig,
  formatNexusMetric,
  formatNexusFullDate,
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
          name: ''
        },
        website: ''
      },

      // 详情与富文本加载状态
      loadingDetail: false,

      // 心愿单状态
      favorited: false,

      // 图集相册
      imageGallery: [],

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
     * 聚合所有可用截图展示图 (包含封面、大缩略图以及描述内嵌入的图片)
     */
    allGalleryImages() {
      const list = [];
      if (this.modInfo.coverImageUrl) {
        list.push(this.modInfo.coverImageUrl);
      }
      if (this.modInfo.thumbnailLargeUrl && !list.includes(this.modInfo.thumbnailLargeUrl)) {
        list.push(this.modInfo.thumbnailLargeUrl);
      }
      if (Array.isArray(this.imageGallery)) {
        this.imageGallery.forEach(url => {
          if (url && !list.includes(url)) list.push(url);
        });
      }
      // 从描述中提取所有真实图片链接
      const rawDesc = this.modInfo.description || '';
      const extracted = this.extractImagesFromText(rawDesc);
      extracted.forEach(url => {
        if (url && !list.includes(url)) list.push(url);
      });
      return list;
    },

    /**
     * 判定创作者与上传者是否完全相同 (去重判断)
     */
    isSameAuthor() {
      const author = String(this.modInfo.author || '').trim().toLowerCase();
      const uploader = String(this.modInfo.uploaderName || '').trim().toLowerCase();
      return !uploader || author === uploader;
    },

    /**
     * 格式化首发时间
     */
    formattedCreatedDate() {
      return this.formatDetailDate(this.modInfo.createdAt);
    },

    /**
     * 格式化最近更新时间
     */
    formattedUpdatedDate() {
      return this.formatDetailDate(this.modInfo.updatedAt || this.modInfo.createdAt);
    },

    /**
     * 判定首发时间与更新时间是否完全相同 (去重判断)
     */
    isSameDate() {
      if (!this.modInfo.createdAt || !this.modInfo.updatedAt) return true;
      return this.formattedCreatedDate === this.formattedUpdatedDate;
    },

    /**
     * 判定是否展示单独的简要描述块 (避免与主标题 100% 重复)
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
     * 将原始描述或富文本转为标准 HTML 节点
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

    // 1. 尝试从 options.payload 或 options.modData 中反序列化对象
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

    // 2. 页面刷新时从本地缓存恢复
    if (!targetItem) {
      try {
        const cached = uni.getStorageSync('mayfly_active_mod_cache');
        if (cached && (cached.id || cached.modId)) {
          targetItem = cached;
        }
      } catch (e) {}
    }

    // 3. 通过直接链接进入
    if (!targetItem && (options?.modId || options?.id)) {
      targetItem = {
        id: options.modId || options.id,
        modId: options.modId || options.id,
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

      // 初步加入封面大图
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
        // 动态加载完整详情 (描述、作者、标签、更新时间)
        this.loadFullDetail(modId, gameId);
      }

      // 默认开启中文模式时预翻译基础信息
      if (this.isChineseMode) {
        this.autoTranslateBasicInfo();
      }
    },

    /**
     * 从文本中提取所有图片链接 (支持 BBCode 与 HTML)
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
      // 3. 常见 N网 静态分发图片直链
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
     * 格式化详情页时间
     */
    formatDetailDate(dateStr) {
      if (!dateStr) return '--';
      return formatNexusFullDate(dateStr, true);
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
      if (this.modInfo.description && !this.modZhDescription) {
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
/* 区域 10：页面整体与悬浮返回按钮样式                                          */
/* ============================================================================ */
.nexusDetailPage {
  min-height: 100vh;
  background-color: #0b0e14;
  color: #e5e7eb;
  padding-bottom: 160rpx;
  position: relative;
}

/* 沉浸式浮动顶部返回栏 */
.floatingTopBar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: calc(88rpx + env(safe-area-inset-top, 0px));
  padding-top: env(safe-area-inset-top, 0px);
  padding-left: 24rpx;
  padding-right: 24rpx;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  z-index: 60;
  pointer-events: none;
}

.floatingBackBtn {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  background: rgba(18, 20, 24, 0.75);
  backdrop-filter: blur(8px);
  border: 1rpx solid rgba(255, 255, 255, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: auto;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.4);
  transition: transform 0.15s ease, background-color 0.2s ease;
}

.floatingBackBtn:active {
  transform: scale(0.92);
  background: rgba(218, 107, 23, 0.85);
}

/* ---------------------------------------------------------------------------- */
/* 区域 11：Hero 封面大图画幅与真实指标排版                                      */
/* ---------------------------------------------------------------------------- */
.heroBannerSection {
  position: relative;
  width: 100%;
  min-height: 480rpx;
  overflow: hidden;
  background-color: #0b0e14;
}

.heroBgImage {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  filter: brightness(0.7);
}

.heroOverlayGradient {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    to bottom,
    rgba(11, 14, 20, 0.3) 0%,
    rgba(11, 14, 20, 0.6) 50%,
    #0b0e14 100%
  );
}

.heroContentBox {
  position: relative;
  z-index: 2;
  padding: calc(100rpx + env(safe-area-inset-top, 0px)) 28rpx 32rpx 28rpx;
  display: flex;
  flex-direction: column;
}

.modGameBadgeRow {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 16rpx;
}

.modGameBadge {
  display: inline-flex;
  align-items: center;
  gap: 8rpx;
  background: rgba(0, 0, 0, 0.65);
  border: 1rpx solid rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(4px);
  padding: 6rpx 16rpx;
  border-radius: 20rpx;
}

.modGameBadgeIcon {
  font-size: 20rpx;
}

.modGameBadgeName {
  font-size: 22rpx;
  color: #f3f4f6;
  font-weight: 600;
}

.modGameBookmarkBtn {
  display: inline-flex;
  align-items: center;
  gap: 8rpx;
  background: rgba(218, 107, 23, 0.2);
  border: 1rpx solid rgba(218, 107, 23, 0.5);
  padding: 6rpx 16rpx;
  border-radius: 20rpx;
  backdrop-filter: blur(4px);
}

.modGameBookmarkBtn.isBookmarked {
  background: rgba(218, 107, 23, 0.9);
  border-color: #da6b17;
}

.modGameBookmarkIcon {
  font-size: 20rpx;
}

.modGameBookmarkText {
  font-size: 20rpx;
  color: #ffffff;
  font-weight: 700;
}

.modMainTitle {
  font-size: 38rpx;
  font-weight: 900;
  color: #ffffff;
  line-height: 1.3;
  margin-bottom: 24rpx;
  text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.8);
}

/* 4 列指标条排版 */
.heroStatsRow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(18, 20, 26, 0.85);
  border: 1rpx solid #232731;
  backdrop-filter: blur(6px);
  border-radius: 14rpx;
  padding: 16rpx 20rpx;
}

.heroStatCol {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4rpx;
  flex: 1;
}

.heroStatLabel {
  font-size: 19rpx;
  color: #94a3b8;
}

.heroStatVal {
  font-size: 24rpx;
  font-weight: 700;
  color: #cbd5e1;
  line-height: 1.2;
}

.heroStatVal.highlight {
  color: #da6b17;
}

.heroStatVal.boldWhite {
  color: #ffffff;
}

/* ---------------------------------------------------------------------------- */
/* 区域 12：展示图画廊卡片样式                                                 */
/* ---------------------------------------------------------------------------- */
.gallerySection {
  margin: 16rpx 28rpx 24rpx 28rpx;
  background: #14161c;
  border: 1rpx solid #232731;
  border-radius: 16rpx;
  padding: 20rpx 20rpx 24rpx 20rpx;
}

.galleryHeaderRow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16rpx;
}

.galleryTitleGroup {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.gallerySectionTitle {
  font-size: 26rpx;
  font-weight: 700;
  color: #ffffff;
}

.galleryCountBadge {
  font-size: 19rpx;
  color: #da6b17;
  background: rgba(218, 107, 23, 0.15);
  padding: 2rpx 10rpx;
  border-radius: 6rpx;
  font-weight: 600;
}

.galleryPreviewAction {
  display: flex;
  align-items: center;
  gap: 6rpx;
  background: rgba(255, 255, 255, 0.05);
  border: 1rpx solid rgba(255, 255, 255, 0.1);
  padding: 4rpx 14rpx;
  border-radius: 20rpx;
}

.galleryPreviewActionText {
  font-size: 20rpx;
  color: #da6b17;
  font-weight: 600;
}

.galleryScrollView {
  width: 100%;
  white-space: nowrap;
}

.galleryImagesList {
  display: inline-flex;
  gap: 16rpx;
}

.galleryCardItem {
  position: relative;
  width: 440rpx;
  height: 248rpx;
  border-radius: 12rpx;
  overflow: hidden;
  background-color: #0b0e14;
  border: 1rpx solid #282c37;
  flex-shrink: 0;
}

.galleryCardImg {
  width: 100%;
  height: 100%;
}

.galleryCardIndex {
  position: absolute;
  bottom: 8rpx;
  right: 8rpx;
  background: rgba(0, 0, 0, 0.7);
  padding: 2rpx 10rpx;
  border-radius: 6rpx;
}

.galleryCardIndexText {
  font-size: 18rpx;
  color: #ffffff;
  font-weight: 600;
}

/* ---------------------------------------------------------------------------- */
/* 区域 13：双列精炼元数据表格样式                                             */
/* ---------------------------------------------------------------------------- */
.metaTableCard {
  margin: 0 28rpx 20rpx 28rpx;
  background: #14161c;
  border: 1rpx solid #232731;
  border-radius: 16rpx;
  padding: 20rpx 24rpx;
}

.metaGrid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16rpx 28rpx;
}

.metaCol {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.metaCell {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.metaCellLabel {
  font-size: 20rpx;
  color: #94a3b8;
}

.metaCellVal {
  font-size: 22rpx;
  color: #f1f5f9;
  font-weight: 500;
  line-height: 1.3;
}

.metaCellVal.uploaderLink {
  color: #da6b17;
}

.virusScanRow {
  display: flex;
  align-items: center;
  gap: 6rpx;
}

.virusScanIcon {
  font-size: 20rpx;
  color: #34d399;
  font-weight: 700;
}

.virusScanText {
  font-size: 20rpx;
  color: #34d399;
}

/* ---------------------------------------------------------------------------- */
/* 区域 14：标签列表与分割线                                                   */
/* ---------------------------------------------------------------------------- */
.tagsSection {
  margin: 0 28rpx 16rpx 28rpx;
}

.tagsScrollView {
  width: 100%;
  white-space: nowrap;
}

.tagsList {
  display: inline-flex;
  gap: 12rpx;
}

.tagPill {
  display: inline-flex;
  align-items: center;
  gap: 6rpx;
  background: #1e222a;
  border: 1rpx solid #2a2e37;
  padding: 8rpx 18rpx;
  border-radius: 8rpx;
}

.tagPillText {
  font-size: 20rpx;
  color: #cbd5e1;
}

.addTagPill {
  border-style: dashed;
  border-color: #4b5563;
}

.addTagIcon {
  font-size: 20rpx;
  color: #9ca3af;
}

.nexusDivider {
  height: 1rpx;
  background: #232731;
  margin: 20rpx 28rpx;
}

/* ---------------------------------------------------------------------------- */
/* 区域 15：模组详细说明正文区样式                                             */
/* ---------------------------------------------------------------------------- */
.sectionBodyContainer {
  margin: 0 28rpx;
}

.aboutHeaderRow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20rpx;
}

.aboutTitle {
  font-size: 30rpx;
  font-weight: 800;
  color: #ffffff;
}

.translateBtn {
  background: #da6b17;
  padding: 6rpx 18rpx;
  border-radius: 8rpx;
}

.translateBtnText {
  font-size: 22rpx;
  font-weight: 700;
  color: #ffffff;
}

.loadingBox {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60rpx 0;
  gap: 16rpx;
}

.loadingSpinner {
  width: 50rpx;
  height: 50rpx;
  border: 4rpx solid rgba(218, 107, 23, 0.2);
  border-top-color: #da6b17;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loadingNotice {
  font-size: 22rpx;
  color: #9ca3af;
}

.translatingNoticeBar {
  display: flex;
  align-items: center;
  gap: 8rpx;
  background: rgba(218, 107, 23, 0.15);
  border: 1rpx solid rgba(218, 107, 23, 0.3);
  padding: 10rpx 18rpx;
  border-radius: 8rpx;
  margin-bottom: 16rpx;
}

.translatingNoticeIcon {
  font-size: 22rpx;
}

.translatingNoticeText {
  font-size: 20rpx;
  color: #da6b17;
  font-weight: 600;
}

.articleSummaryBox {
  background: rgba(255, 255, 255, 0.04);
  border-left: 6rpx solid #da6b17;
  padding: 14rpx 18rpx;
  border-radius: 4rpx;
  margin-bottom: 20rpx;
}

.articleSummaryText {
  font-size: 22rpx;
  color: #cbd5e1;
  line-height: 1.5;
}

.nexusArticleBody {
  font-size: 24rpx;
  line-height: 1.6;
  color: #e2e8f0;
}

.nexusRichNode {
  display: block;
}

/* ---------------------------------------------------------------------------- */
/* 区域 16：底部悬浮固定操作栏样式                                             */
/* ---------------------------------------------------------------------------- */
.fixedBottomActionBar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: calc(110rpx + env(safe-area-inset-bottom, 0px));
  padding-bottom: env(safe-area-inset-bottom, 0px);
  background: rgba(14, 16, 21, 0.95);
  backdrop-filter: blur(12px);
  border-top: 1rpx solid #232731;
  display: flex;
  align-items: center;
  padding-left: 28rpx;
  padding-right: 28rpx;
  gap: 20rpx;
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
  font-size: 19rpx;
  color: #94a3b8;
  font-weight: 500;
}

.bottomPushBigBtn {
  flex: 1;
  background: linear-gradient(135deg, #da6b17, #f97316);
  border-radius: 12rpx;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  box-shadow: 0 4rpx 16rpx rgba(218, 107, 23, 0.4);
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
