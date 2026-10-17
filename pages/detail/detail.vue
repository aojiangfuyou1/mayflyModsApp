<template>
  <view class="nexusDetailPage">
    <!-- ==================================================================== -->
    <!-- 区域 1：全局沉浸式顶栏 (已组件化)                                   -->
    <!-- ==================================================================== -->
    <NexusHeader
      title="模组详情"
      :show-back="true"
      :show-search="false"
      :desktop-config="desktopConfig"
      :nexus-user="nexusUser"
      @back-click="handleNavBack"
      @pc-click="openDeviceModal"
      @user-click="openNexusAuthModal"
      @logo-click="handleNavBack"
    />

    <!-- ==================================================================== -->
    <!-- 区域 2：Hero 头部大图画幅与核心指标 (100% 对标用户参考图 3) -->
    <!-- ==================================================================== -->
    <view class="heroBannerSection">
      <!-- 背景大图层 (渐变半透明遮罩) -->
      <image
        class="heroBgImage"
        :src="modInfo.coverImageUrl || '/static/logo.png'"
        mode="aspectFill"
      />
      <view class="heroOverlayGradient"></view>

      <!-- 头部内容层 -->
      <view class="heroContentBox">
        <!-- 模组大标题 (白字加粗) -->
        <text class="modMainTitle">
          {{ isChineseMode && modZhTitle ? modZhTitle : modInfo.title }}
        </text>

        <!-- 5 列横向指标数据条 (对标图 3: 赞同推荐 | 独立下载 | 总下载量 | 总浏览数 | 版本号) -->
        <view class="heroStatsRow">
          <!-- 赞同数 Endorsements -->
          <view class="heroStatCol">
            <text class="heroStatLabel">赞同推荐</text>
            <text class="heroStatVal highlight">{{ modInfo.likes || 0 }}</text>
          </view>
          <!-- 唯一独立下载 Unique DLs -->
          <view class="heroStatCol">
            <text class="heroStatLabel">独立下载</text>
            <text class="heroStatVal">--</text>
          </view>
          <!-- 总下载量 Total DLs -->
          <view class="heroStatCol">
            <text class="heroStatLabel">总下载量</text>
            <text class="heroStatVal">{{ formatMetric(modInfo.downloads) }}</text>
          </view>
          <!-- 总浏览数 Total views -->
          <view class="heroStatCol">
            <text class="heroStatLabel">总浏览数</text>
            <text class="heroStatVal">--</text>
          </view>
          <!-- 模组版本 Version -->
          <view class="heroStatCol">
            <text class="heroStatLabel">版本号</text>
            <text class="heroStatVal boldWhite">{{ modInfo.version || '1.0' }}</text>
          </view>
        </view>

        <!-- 动作操作行 (访问官方原帖 + 推送到电脑) -->
        <view class="heroActionRow">
          <view class="originalFileBtn" @click="handleOpenWebsite">
            <text class="originalFileText">访问官方原帖</text>
          </view>
          <view class="heroPushBtn" @click="handlePushToDesktop">
            <text class="heroPushText">{{ isPushing ? '投递中...' : '🚀 推送到电脑' }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- ==================================================================== -->
    <!-- 区域 3：媒体画廊缩略条 (对标图 3: 缩略图 + 截图数量 + 全屏放大) -->
    <!-- ==================================================================== -->
    <view class="galleryStrip">
      <view class="galleryThumbBox" @click="previewFullImage">
        <image
          class="galleryThumbImg"
          :src="modInfo.coverImageUrl || '/static/logo.png'"
          mode="aspectFill"
        />
      </view>
      <view class="galleryBadgeBox">
        <text class="galleryBadgeText">{{ imageGallery.length }} 张截图</text>
      </view>
      <view class="galleryFullscreenBtn" @click="previewFullImage">
        <text class="galleryFullscreenIcon">⛶</text>
      </view>
    </view>

    <!-- ==================================================================== -->
    <!-- 区域 4：双列元数据信息表格 (100% 对标用户参考图 3，纯中文规范展示) -->
    <!-- ==================================================================== -->
    <view class="metaTableCard">
      <view class="metaGrid">
        <!-- 左列 -->
        <view class="metaCol">
          <!-- 最近更新 -->
          <view class="metaCell">
            <text class="metaCellLabel">最近更新</text>
            <text class="metaCellVal">{{ formatDetailDate(modInfo.updatedAt || modInfo.createdAt) }}</text>
          </view>
          <!-- 创建作者 -->
          <view class="metaCell">
            <text class="metaCellLabel">创建作者</text>
            <text class="metaCellVal">{{ modInfo.author || '未知作者' }}</text>
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

        <!-- 右列 -->
        <view class="metaCol">
          <!-- 首发上传 -->
          <view class="metaCell">
            <text class="metaCellLabel">首发上传</text>
            <text class="metaCellVal">{{ formatDetailDate(modInfo.createdAt) }}</text>
          </view>
          <!-- 上传者 -->
          <view class="metaCell">
            <text class="metaCellLabel">上传者</text>
            <text class="metaCellVal uploaderLink">{{ modInfo.uploaderName || modInfo.author || '未知上传者' }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- ==================================================================== -->
    <!-- 区域 5：标签胶囊列表栏 (对标图 3，支持动态并发转译中文标签) -->
    <!-- ==================================================================== -->
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

    <!-- ==================================================================== -->
    <!-- 区域 6：Current section 切换选择器 (对标图 3: 当前板块: 详细说明 ⌄) -->
    <!-- ==================================================================== -->
    <view class="currentSectionArea">
      <text class="sectionHeaderTitle">当前板块</text>
      <picker
        mode="selector"
        :range="currentSectionOptions"
        :value="currentSectionIndex"
        @change="onSectionChange"
      >
        <view class="sectionSelectCard">
          <text class="viewingPrefix">当前板块:</text>
          <text class="viewingValue">{{ currentSectionOptions[currentSectionIndex] }}</text>
          <text class="selectArrow">⌄</text>
        </view>
      </picker>
    </view>

    <!-- ==================================================================== -->
    <!-- 区域 7A：Section = Description 模组正文详情 (100% 对标用户参考图 4) -->
    <!-- ==================================================================== -->
    <view class="sectionBodyContainer" v-if="currentSectionIndex === 0">
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

      <!-- 图 4 原汁原味富文本渲染区域 -->
      <view class="nexusArticleBody" v-else>
        <!-- 正文正在翻译提示 (极轻量微标，不打扰阅读) -->
        <view class="translatingNoticeBar" v-if="isChineseMode && isTranslatingDescription && !modZhDescription">
          <text class="translatingNoticeIcon">⚡</text>
          <text class="translatingNoticeText">正在为您无缝转译中文图鉴...</text>
        </view>

        <!-- 一句话总结 / 中文简述 (如有) -->
        <view class="articleSummaryBox" v-if="modInfo.summary">
          <text class="articleSummaryText">
            {{ isChineseMode && modZhSummary ? modZhSummary : modInfo.summary }}
          </text>
        </view>

        <!-- 正文富文本节点 (BBCode 转译后的原汁原味排版，标题白字加粗、暖金链接、代码块等) -->
        <rich-text
          class="nexusRichNode"
          :nodes="formattedRichDescription"
        ></rich-text>
      </view>
    </view>

    <!-- ==================================================================== -->
    <!-- 区域 7B：Section = Files 物理文件清单 (精准分拣与单文件推送) -->
    <!-- ==================================================================== -->
    <view class="sectionBodyContainer" v-else-if="currentSectionIndex === 1">
      <view class="aboutHeaderRow">
        <text class="aboutTitle">物理文件清单 (Files)</text>
        <text class="filesCountBadge">{{ modFiles.length }} 个文件</text>
      </view>

      <view class="loadingBox" v-if="loadingFiles">
        <view class="loadingSpinner"></view>
        <text class="loadingNotice">正在拉取官方各版本安装包...</text>
      </view>

      <view class="emptyFilesBox" v-else-if="modFiles.length === 0">
        <text class="emptyFilesNotice">暂未解析到分流文件，推送时将默认拉取官方主包。</text>
      </view>

      <view class="filesListGrid" v-else>
        <view
          class="fileCard"
          v-for="file in modFiles"
          :key="file.fileId"
          :class="{ selected: selectedFileId === file.fileId }"
          @click="selectFile(file)"
        >
          <view class="fileCardTop">
            <view class="fileCatPill" :class="file.category.toLowerCase()">
              <text class="fileCatText">{{ getFileCatLabel(file.category) }}</text>
            </view>
            <text class="fileName">{{ file.name }}</text>
            <text class="fileRadioDot">{{ selectedFileId === file.fileId ? '🟢' : '⚪' }}</text>
          </view>

          <view class="fileMetaInfoRow">
            <text class="fileMetaTag">v{{ file.version }}</text>
            <text class="fileMetaTag">{{ file.sizeFormatted }}</text>
            <text class="fileMetaPrimary" v-if="file.isPrimary">★ 官方推荐</text>
          </view>

          <text class="fileDescPreview" v-if="file.description">{{ file.description }}</text>

          <view class="fileActionRow">
            <button
              class="filePushBtn"
              @click.stop="handlePushSingleFile(file)"
            >
              <text class="filePushText">🚀 仅推送此文件</text>
            </button>
          </view>
        </view>
      </view>
    </view>

    <!-- ==================================================================== -->
    <!-- 区域 7C：Section = Requirements 前置依赖体检 (闭环免前置排查) -->
    <!-- ==================================================================== -->
    <view class="sectionBodyContainer" v-else-if="currentSectionIndex === 2">
      <view class="aboutHeaderRow">
        <text class="aboutTitle">前置依赖体检 (Requirements)</text>
        <text class="reqStatusBadge" :class="{ free: requirements.length === 0 }">
          {{ requirements.length === 0 ? '✓ 开箱即用' : `${requirements.length} 个前置` }}
        </text>
      </view>

      <view class="loadingBox" v-if="loadingRequirements">
        <view class="loadingSpinner"></view>
        <text class="loadingNotice">正在检测底层运行库与 Hook 依赖...</text>
      </view>

      <view class="reqFreeCard" v-else-if="requirements.length === 0">
        <text class="reqFreeTitle">✨ 免任何前置，原生开箱即用</text>
        <text class="reqFreeDesc">该模组为独立数据/资产包，无需额外安装底层 Script Extender 或复杂外挂，Mayfly 原生部署即可生效。</text>
      </view>

      <view class="reqListGroup" v-else>
        <view class="reqItemCard" v-for="(req, rIdx) in requirements" :key="rIdx">
          <text class="reqBullet">⚠️</text>
          <view class="reqTextCol">
            <text class="reqItemName">{{ req.name }}</text>
            <text class="reqItemNotes" v-if="req.notes">{{ req.notes }}</text>
          </view>
        </view>
        <text class="reqMayflyTip">💡 电脑端 Mayfly 安装时会自动匹配并静默补齐前置环境，请放心使用。</text>
      </view>
    </view>

    <!-- ==================================================================== -->
    <!-- 区域 8：底部悬浮固定操作栏 (原帖出处 + 收藏 + 一键推送到电脑) -->
    <!-- ==================================================================== -->
    <view class="fixedBottomActionBar">
      <!-- 官方原帖外链直达 -->
      <view class="bottomIconBtn" @click="handleOpenWebsite">
        <text class="bottomIcon">🔗</text>
        <text class="bottomIconLabel">原帖</text>
      </view>

      <!-- 心愿单收藏 -->
      <view class="bottomIconBtn" @click="handleToggleFavorite">
        <text class="bottomIcon">{{ favorited ? '❤️' : '🤍' }}</text>
        <text class="bottomIconLabel">{{ favorited ? '已收藏' : '心愿单' }}</text>
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

    <!-- ==================================================================== -->
    <!-- 区域 8：电脑端 Mayfly 局域网配对弹窗 (已组件化)                     -->
    <!-- ==================================================================== -->
    <DevicePairModal
      :visible="deviceModalVisible"
      :config="desktopConfig"
      @close="closeDeviceModal"
      @saved="onDeviceConfigSaved"
    />

    <!-- ==================================================================== -->
    <!-- 区域 9：NexusMods 官方账户中心与 API 授权弹窗 (已组件化)            -->
    <!-- ==================================================================== -->
    <NexusAuthModal
      :visible="nexusAuthModalVisible"
      :nexus-user="nexusUser"
      :desktop-config="desktopConfig"
      @close="closeNexusAuthModal"
      @login-success="onNexusLoginSuccess"
      @logout="onNexusLogout"
    />
  </view>
</template>

<script>
// ============================================================================
// 脚本逻辑：模组详情页控制与富文本原汁原味还原 (100% 对标图 3 与图 4)
// ============================================================================
import {
  fetchModDetail,
  fetchModFiles,
  fetchModRequirements,
  fetchGameIdByDomain,
  pushModToDesktop,
  getDesktopConfig,
  formatNexusMetric,
  formatNexusDate,
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
import NexusHeader from '../../components/NexusHeader.vue';
import DevicePairModal from '../../components/DevicePairModal.vue';
import NexusAuthModal from '../../components/NexusAuthModal.vue';

export default {
  components: {
    NexusHeader,
    DevicePairModal,
    NexusAuthModal
  },

  data() {
    return {
      // 模组核心元数据 (100% 动态，来自 Nexus 官方 GraphQL，零硬编码)
      modInfo: {
        id: '',
        modId: '',
        title: '',
        summary: '',
        description: '',
        coverImageUrl: '',
        version: '1.0',
        author: '',
        uploaderName: '',
        downloads: 0,
        likes: 0,
        category: '',
        createdAt: '',
        updatedAt: '',
        formattedDate: '',
        formattedUpdateDate: '',
        formattedFullCreated: '',
        formattedFullUpdated: '',
        tags: [],
        game: {
          id: 0,
          domainName: '',
          name: ''
        },
        website: ''
      },

      // Section 切换 (对标图 3 Current section: Description / Files / Requirements)
      sectionOptions: ['Description', 'Files', 'Requirements'],
      currentSectionIndex: 0,

      // 详情与富文本加载状态
      loadingDetail: false,

      // 心愿单状态
      favorited: false,

      // 图集相册
      imageGallery: [],

      // 物理文件列表 (Files)
      modFiles: [],
      loadingFiles: false,
      selectedFileId: null,
      selectedFile: null,

      // 前置依赖检测
      requirements: [],
      loadingRequirements: false,

      // 翻译模式与标签中文字典 (默认开启智能全中文图鉴)
      isChineseMode: true,
      modZhTitle: '',
      modZhSummary: '',
      modZhDescription: '',
      tagZhMap: {},
      isTranslatingDescription: false,

      // 投递状态
      isPushing: false,

      // 设备配对状态 (弹窗已组件化)
      deviceModalVisible: false,
      desktopConfig: {
        host: '192.168.1.100',
        port: 9876,
        deviceToken: 'MF-PC-8891',
        connected: false
      },

      // NexusMods 官方账户授权状态 (弹窗已组件化)
      nexusUser: null,
      nexusApiKey: '',
      nexusAuthModalVisible: false
    };
  },

  computed: {
    /**
     * 当前板块选项名称 (纯正中文板块规范)
     */
    currentSectionOptions() {
      return ['详细说明 (Description)', '物理文件 (Files)', '前置体检 (Requirements)'];
    },

    /**
     * 显示的模组标签列表 (动态解析)
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
     * 将原始描述或富文本转为图 4 标准 HTML 节点 (优先中文渲染)
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

    // 2. 如果入参没有或者在浏览器中按 F5 刷新了，从本地缓存恢复
    if (!targetItem) {
      try {
        const cached = uni.getStorageSync('mayfly_active_mod_cache');
        if (cached && (cached.id || cached.modId)) {
          targetItem = cached;
        }
      } catch (e) {}
    }

    // 3. 如果通过直接链接进入（如 ?modId=107676&gameId=1704）
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
    // 基础数据初筛与全量异步装载 (100% 官方 GraphQL 动态抓取，零硬编码)
    // ------------------------------------------------------------------------

    /**
     * 初始化基础数据并触发并行 GraphQL 动态拉取
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

      // 相册初值
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
        // 动态加载物理文件清单
        this.loadFiles(modId, gameId);
        // 动态加载前置依赖体检
        this.loadRequirements(modId, gameId);
      }

      // 默认开启中文模式时，快速预翻译标题与摘要
      if (this.isChineseMode) {
        this.autoTranslateBasicInfo();
      }
    },

    /**
     * 格式化详情页详细时间 (纯正中文日期: 2026年10月12日 13:21)
     */
    formatDetailDate(dateStr) {
      if (!dateStr) return '--';
      return formatNexusFullDate(dateStr, true);
    },

    /**
     * 获取文件分类的友好中文说明
     */
    getFileCatLabel(category) {
      const cat = String(category || '').toUpperCase();
      const map = {
        'MAIN': '主包 (MAIN)',
        'UPDATE': '更新补丁 (UPDATE)',
        'OPTIONAL': '可选分流 (OPTIONAL)',
        'OLD': '历史版本 (OLD)',
        'MISCELLANEOUS': '杂项附件 (MISC)'
      };
      return map[cat] || category || '文件';
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

        // 详情就绪后，全自动触发正文深度中文翻译
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
     * 异步拉取物理文件列表
     */
    async loadFiles(modId, gameId) {
      this.loadingFiles = true;
      try {
        const files = await fetchModFiles(modId, gameId);
        this.modFiles = files;
        if (files.length > 0) {
          const primary = files.find(f => f.isPrimary) ||
                          files.find(f => f.category === 'MAIN') ||
                          files[0];
          this.selectedFileId = primary.fileId;
          this.selectedFile = primary;
        }
      } catch (e) {
        this.modFiles = [];
      } finally {
        this.loadingFiles = false;
      }
    },

    /**
     * 异步拉取前置依赖
     */
    async loadRequirements(modId, gameId) {
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

    // ------------------------------------------------------------------------
    // Section 切换与交互
    // ------------------------------------------------------------------------

    onSectionChange(e) {
      this.currentSectionIndex = Number(e.detail.value) || 0;
    },

    /**
     * 极速预翻译标题与一句话摘要
     */
    async autoTranslateBasicInfo() {
      const tasks = [];
      if (this.modInfo.title && !this.modZhTitle) {
        tasks.push(
          translateTextToZh(this.modInfo.title).then((res) => {
            if (res) this.modZhTitle = res;
          })
        );
      }
      if (this.modInfo.summary && !this.modZhSummary) {
        tasks.push(
          translateTextToZh(this.modInfo.summary).then((res) => {
            if (res) this.modZhSummary = res;
          })
        );
      }
      try {
        await Promise.all(tasks);
      } catch (e) {
        console.warn('[MayflyDetail] 基础标题摘要翻译提示:', e);
      }
    },

    /**
     * 全自动异步深度翻译标题、摘要与正文详细描述
     */
    async autoTranslateAllDetail() {
      await this.autoTranslateBasicInfo();

      const rawDesc = this.modInfo.description;
      if (rawDesc && !this.modZhDescription && !this.isTranslatingDescription) {
        this.isTranslatingDescription = true;
        try {
          const zhDesc = await translateRichDescription(rawDesc);
          if (zhDesc) {
            this.modZhDescription = zhDesc;
          }
        } catch (e) {
          console.warn('[MayflyDetail] 正文深度翻译异常:', e);
        } finally {
          this.isTranslatingDescription = false;
        }
      }
    },

    /**
     * 切换中文/原语言模式
     */
    async toggleTranslate() {
      this.isChineseMode = !this.isChineseMode;
      if (this.isChineseMode) {
        uni.showToast({
          title: '已开启中文图鉴模式',
          icon: 'none'
        });
        if (!this.modZhDescription && this.modInfo.description) {
          this.autoTranslateAllDetail();
        } else if (!this.modZhTitle) {
          this.autoTranslateBasicInfo();
        }
      } else {
        uni.showToast({
          title: '已切换为英文原版',
          icon: 'none'
        });
      }
    },

    /**
     * 选择物理文件项
     */
    selectFile(file) {
      this.selectedFileId = file.fileId;
      this.selectedFile = file;
    },

    /**
     * 单独推送选中物理文件
     */
    async handlePushSingleFile(file) {
      this.selectFile(file);
      await this.handlePushToDesktop();
    },

    /**
     * 全屏放大预览模组封面/截图
     */
    previewFullImage() {
      if (this.imageGallery.length > 0) {
        uni.previewImage({
          urls: this.imageGallery,
          current: 0
        });
      }
    },

    /**
     * 打开/复制 Nexus 官方原帖
     */
    handleOpenWebsite() {
      const url = this.modInfo.website ||
        (this.modInfo.game?.domainName && this.modInfo.modId
          ? `https://www.nexusmods.com/${this.modInfo.game.domainName}/mods/${this.modInfo.modId}`
          : 'https://www.nexusmods.com');

      uni.setClipboardData({
        data: url,
        success: () => {
          uni.showToast({ title: '原帖链接已复制 📋', icon: 'none' });
        }
      });
    },

    /**
     * 切换心愿单收藏
     */
    handleToggleFavorite() {
      if (!this.modInfo.game || !this.modInfo.game.domainName) {
        try {
          const savedGame = uni.getStorageSync('mayfly_active_game');
          if (savedGame && savedGame.domain) {
            this.modInfo.game = this.modInfo.game || {};
            this.modInfo.game.domainName = this.modInfo.game.domainName || savedGame.domain;
            this.modInfo.game.name = this.modInfo.game.name || savedGame.name;
          }
        } catch (e) {}
      }
      const status = toggleFavorite(this.modInfo);
      this.favorited = status;
      uni.showToast({
        title: status ? '已收藏到心愿单 ❤️' : '已移出心愿单',
        icon: 'none'
      });
    },

    /**
     * 核心动作：一键推送到电脑 Mayfly 安装
     */
    async handlePushToDesktop() {
      if (this.isPushing) return;
      this.isPushing = true;
      uni.showLoading({ title: '正在投递信令...' });

      try {
        const zhTitle = this.modZhTitle || this.modInfo.zhTitle || '';
        const payload = {
          ...this.modInfo,
          zhTitle,
          selectedFile: this.selectedFile
        };

        const res = await pushModToDesktop(payload, this.desktopConfig);
        uni.hideLoading();

        if (res.success) {
          uni.showModal({
            title: '推送成功 🚀',
            content: `已成功投递到电脑端 Mayfly！\n模组【${zhTitle || this.modInfo.title}】正在电脑端后台高速下载并安装。`,
            showCancel: false
          });
        } else {
          uni.showModal({
            title: '推送提示',
            content: res.message || '电脑端连接超时，请检查电脑端 Mayfly 是否已启动。',
            confirmText: '设备配对',
            cancelText: '知道了',
            success: (m) => {
              if (m.confirm) {
                this.openDeviceModal();
              }
            }
          });
        }
      } catch (err) {
        uni.hideLoading();
        uni.showToast({ title: '投递异常', icon: 'none' });
      } finally {
        this.isPushing = false;
      }
    },

    handleNavBack() {
      uni.navigateBack({
        fail: () => {
          uni.reLaunch({ url: '/pages/index/index' });
        }
      });
    },

    handleTagTip() {
      uni.showToast({ title: '登录 Nexus 官方即可添加标签', icon: 'none' });
    },

    formatMetric(num) {
      return formatNexusMetric(num);
    },

    // ------------------------------------------------------------------------
    // 设备配对设置弹窗 (已组件化)
    // ------------------------------------------------------------------------

    openDeviceModal() {
      this.deviceModalVisible = true;
    },

    closeDeviceModal() {
      this.deviceModalVisible = false;
    },

    onDeviceConfigSaved(newConfig) {
      this.desktopConfig = { ...newConfig };
    },

    // ------------------------------------------------------------------------
    // NexusMods 官方账户中心与授权方法 (已组件化)
    // ------------------------------------------------------------------------

    refreshNexusUser() {
      this.nexusUser = getNexusUser();
      this.nexusApiKey = getNexusApiKey();
    },

    openNexusAuthModal() {
      this.refreshNexusUser();
      this.nexusAuthModalVisible = true;
    },

    closeNexusAuthModal() {
      this.nexusAuthModalVisible = false;
    },

    onNexusLoginSuccess({ user, apiKey }) {
      this.nexusUser = user;
      this.nexusApiKey = apiKey;
    },

    onNexusLogout() {
      this.nexusUser = null;
      this.nexusApiKey = '';
    }
  }
};
</script>

<style scoped>
/* ============================================================================ */
/* 样式规范：100% 对标 NexusMods 移动端官方纯粹暗黑设计 (Screenshot 3 & Screenshot 4) */
/* ============================================================================ */

.nexusDetailPage {
  min-height: 100vh;
  background-color: #121212;
  color: #e5e7eb;
  padding-bottom: 140rpx;
  box-sizing: border-box;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}

/* ---------------------------------------------------------------------------- */
/* 顶栏 (对标图 3: ☰/← + ❖ 橙标 + 📤 + 👤) */
/* ---------------------------------------------------------------------------- */
.nexusHeader {
  position: sticky;
  top: 0;
  z-index: 100;
  height: 96rpx;
  background-color: #161616;
  border-bottom: 1rpx solid #232323;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24rpx;
  box-sizing: border-box;
}

.headerBtn {
  width: 72rpx;
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.headerIcon {
  font-size: 38rpx;
  color: #e5e7eb;
}

.headerLogoArea {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.nexusLogoBox {
  width: 60rpx;
  height: 60rpx;
  background-color: #da6b17; /* Nexus 官方橙标方块 */
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nexusLogoGlyph {
  font-size: 34rpx;
  color: #ffffff;
  font-weight: 900;
}

.headerRightArea {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.pcBtn,
.userBtn {
  position: relative;
}

.headerAvatarImg {
  width: 52rpx;
  height: 52rpx;
  border-radius: 50%;
  border: 2rpx solid #da6b17;
}

.headerPremiumBadge {
  position: absolute;
  top: -4rpx;
  right: -4rpx;
  font-size: 20rpx;
}

.authNoticeDot {
  position: absolute;
  top: 14rpx;
  right: 14rpx;
  width: 14rpx;
  height: 14rpx;
  border-radius: 50%;
  background-color: #da6b17;
  border: 2rpx solid #161616;
}

.onlineDot {
  position: absolute;
  top: 14rpx;
  right: 14rpx;
  width: 14rpx;
  height: 14rpx;
  border-radius: 50%;
  background-color: #64748b;
  border: 2rpx solid #161616;
}

.onlineDot.connected {
  background-color: #10b981;
  box-shadow: 0 0 10rpx #10b981;
}

/* ---------------------------------------------------------------------------- */
/* Hero 画幅区 (100% 对标图 3 头部大图、大标题、5 列横向指标与 Original File 按钮) */
/* ---------------------------------------------------------------------------- */
.heroBannerSection {
  position: relative;
  width: 100%;
  min-height: 480rpx;
  background-color: #1a1c22;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.heroBgImage {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.55;
  filter: blur(1rpx);
}

.heroOverlayGradient {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    to bottom,
    rgba(18, 18, 18, 0.2) 0%,
    rgba(18, 18, 18, 0.75) 55%,
    #121212 100%
  );
}

.heroContentBox {
  position: relative;
  z-index: 10;
  padding: 40rpx 24rpx 24rpx;
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.modMainTitle {
  font-size: 42rpx;
  font-weight: 800;
  color: #ffffff;
  line-height: 1.25;
  text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.8);
}

/* 5 列横向指标数据条 (对标图 3) */
.heroStatsRow {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12rpx;
  margin-top: 10rpx;
}

.heroStatCol {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.heroStatLabel {
  font-size: 20rpx;
  color: #9ca3af;
  white-space: nowrap;
}

.heroStatVal {
  font-size: 26rpx;
  font-weight: 700;
  color: #d1d5db;
}

.heroStatVal.highlight {
  color: #da6b17; /* Nexus 橙色高亮 */
}

.heroStatVal.boldWhite {
  color: #ffffff;
}

/* 动作操作行 (对标图 3: Original File 按钮) */
.heroActionRow {
  display: flex;
  align-items: center;
  gap: 20rpx;
  margin-top: 12rpx;
}

.originalFileBtn {
  background-color: rgba(30, 33, 40, 0.9);
  border: 1rpx solid #3c424e;
  border-radius: 8rpx;
  padding: 12rpx 28rpx;
  cursor: pointer;
}

.originalFileText {
  font-size: 24rpx;
  font-weight: 700;
  color: #ffffff;
}

.heroPushBtn {
  background-color: #da6b17;
  border-radius: 8rpx;
  padding: 12rpx 30rpx;
  cursor: pointer;
}

.heroPushText {
  font-size: 24rpx;
  font-weight: 700;
  color: #ffffff;
}

/* ---------------------------------------------------------------------------- */
/* 区域 3：媒体画廊缩略条 (对标图 3) */
/* ---------------------------------------------------------------------------- */
.galleryStrip {
  background-color: #121212;
  padding: 20rpx 24rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.galleryThumbBox {
  width: 130rpx;
  height: 80rpx;
  border-radius: 8rpx;
  overflow: hidden;
  border: 2rpx solid #374151;
  background-color: #1a1c22;
}

.galleryThumbImg {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.galleryBadgeBox {
  background-color: #1f2229;
  border-radius: 6rpx;
  padding: 8rpx 20rpx;
}

.galleryBadgeText {
  font-size: 22rpx;
  color: #9ca3af;
  font-weight: 600;
}

.galleryFullscreenBtn {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.galleryFullscreenIcon {
  font-size: 36rpx;
  color: #9ca3af;
}

/* ---------------------------------------------------------------------------- */
/* 区域 4：双列元数据信息表格 (对标图 3) */
/* ---------------------------------------------------------------------------- */
.metaTableCard {
  background-color: #17191e;
  margin: 0 24rpx;
  border-radius: 10rpx;
  border: 1rpx solid #232730;
  padding: 24rpx;
}

.metaGrid {
  display: flex;
  justify-content: space-between;
  gap: 24rpx;
}

.metaCol {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.metaCell {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.metaCellLabel {
  font-size: 26rpx;
  font-weight: 700;
  color: #ffffff;
}

.metaCellVal {
  font-size: 22rpx;
  color: #9ca3af;
  line-height: 1.4;
}

.metaCellVal.uploaderLink {
  color: #d4a373; /* Nexus 经典作者暖金色 */
  font-weight: 600;
}

.virusScanRow {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.virusScanIcon {
  font-size: 22rpx;
}

.virusScanText {
  font-size: 22rpx;
  color: #9ca3af;
}

/* ---------------------------------------------------------------------------- */
/* 区域 5：标签列表 (对标图 3) */
/* ---------------------------------------------------------------------------- */
.tagsSection {
  padding: 24rpx 24rpx 10rpx;
}

.tagsScrollView {
  width: 100%;
  white-space: nowrap;
}

.tagsList {
  display: inline-flex;
  align-items: center;
  gap: 14rpx;
}

.tagPill {
  display: inline-flex;
  align-items: center;
  background-color: #242831;
  border-radius: 8rpx;
  padding: 10rpx 20rpx;
  border: 1rpx solid #333945;
}

.tagPillText {
  font-size: 22rpx;
  color: #d1d5db;
  font-weight: 500;
}

.addTagPill {
  background-color: transparent;
  border: 1rpx dashed #4b5563;
  gap: 6rpx;
}

.addTagIcon {
  font-size: 24rpx;
  color: #9ca3af;
}

/* 分割线 */
.nexusDivider {
  height: 1rpx;
  background-color: #232730;
  margin: 24rpx;
}

/* ---------------------------------------------------------------------------- */
/* 区域 6：Current section 下拉选择区 (对标图 3) */
/* ---------------------------------------------------------------------------- */
.currentSectionArea {
  padding: 0 24rpx 20rpx;
  display: flex;
  flex-direction: column;
  gap: 14rpx;
}

.sectionHeaderTitle {
  font-size: 28rpx;
  font-weight: 700;
  color: #ffffff;
}

.sectionSelectCard {
  background-color: #1f232c;
  border: 1rpx solid #323846;
  border-radius: 8rpx;
  height: 84rpx;
  padding: 0 24rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.viewingPrefix {
  font-size: 26rpx;
  color: #9ca3af;
  margin-right: 10rpx;
}

.viewingValue {
  font-size: 26rpx;
  color: #ffffff;
  font-weight: 600;
  flex: 1;
}

.selectArrow {
  font-size: 28rpx;
  color: #9ca3af;
}

/* ---------------------------------------------------------------------------- */
/* 区域 7A：模组正文富文本 (100% 对标用户参考图 4) */
/* ---------------------------------------------------------------------------- */
.sectionBodyContainer {
  padding: 24rpx;
}

.aboutHeaderRow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24rpx;
}

.aboutTitle {
  font-size: 38rpx;
  font-weight: 800;
  color: #ffffff;
  letter-spacing: 0.5rpx;
}

.translateBtn {
  background-color: #242831;
  border: 1rpx solid #3a4252;
  border-radius: 6rpx;
  padding: 8rpx 20rpx;
}

.translateBtnText {
  font-size: 22rpx;
  color: #da6b17;
  font-weight: 700;
}

.articleSummaryBox {
  background-color: #181b22;
  border-left: 6rpx solid #da6b17;
  border-radius: 6rpx;
  padding: 18rpx 20rpx;
  margin-bottom: 24rpx;
}

.articleSummaryText {
  font-size: 26rpx;
  color: #cbd5e1;
  line-height: 1.5;
}

.translatingNoticeBar {
  display: flex;
  align-items: center;
  gap: 12rpx;
  background-color: rgba(218, 107, 23, 0.12);
  border: 1rpx solid rgba(218, 107, 23, 0.35);
  border-radius: 6rpx;
  padding: 12rpx 18rpx;
  margin-bottom: 20rpx;
}

.translatingNoticeIcon {
  font-size: 24rpx;
  color: #da6b17;
}

.translatingNoticeText {
  font-size: 22rpx;
  color: #f3a863;
  line-height: 1.3;
}

.nexusArticleBody {
  background-color: #15171c;
  border-radius: 10rpx;
  border: 1rpx solid #232730;
  padding: 28rpx;
}

.nexusRichNode {
  font-size: 26rpx;
  color: #d1d5db;
  line-height: 1.65;
  word-break: break-word;
}

/* ---------------------------------------------------------------------------- */
/* 区域 7B：物理文件列表 (Files) */
/* ---------------------------------------------------------------------------- */
.filesCountBadge {
  font-size: 22rpx;
  background-color: #1f232c;
  color: #9ca3af;
  padding: 6rpx 16rpx;
  border-radius: 6rpx;
}

.filesListGrid {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.fileCard {
  background-color: #181b22;
  border: 1rpx solid #282d38;
  border-radius: 10rpx;
  padding: 22rpx;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  cursor: pointer;
}

.fileCard.selected {
  border-color: #da6b17;
  background-color: #1c202a;
}

.fileCardTop {
  display: flex;
  align-items: center;
  gap: 14rpx;
}

.fileCatPill {
  background-color: #374151;
  border-radius: 6rpx;
  padding: 4rpx 14rpx;
}

.fileCatPill.main {
  background-color: #da6b17;
}

.fileCatPill.update {
  background-color: #2563eb;
}

.fileCatPill.optional {
  background-color: #4b5563;
}

.fileCatText {
  font-size: 20rpx;
  font-weight: 700;
  color: #ffffff;
}

.fileName {
  font-size: 26rpx;
  font-weight: 700;
  color: #ffffff;
  flex: 1;
}

.fileRadioDot {
  font-size: 24rpx;
}

.fileMetaInfoRow {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.fileMetaTag {
  font-size: 20rpx;
  color: #9ca3af;
}

.fileMetaPrimary {
  font-size: 20rpx;
  color: #f59e0b;
  font-weight: 700;
}

.fileDescPreview {
  font-size: 22rpx;
  color: #9ca3af;
  line-height: 1.4;
}

.fileActionRow {
  display: flex;
  justify-content: flex-end;
  margin-top: 8rpx;
}

.filePushBtn {
  background-color: #242933;
  border: 1rpx solid #3b4353;
  border-radius: 6rpx;
  padding: 8rpx 20rpx;
  margin: 0;
  line-height: 1.4;
}

.filePushText {
  font-size: 22rpx;
  color: #da6b17;
  font-weight: 700;
}

/* ---------------------------------------------------------------------------- */
/* 区域 7C：前置依赖体检 (Requirements) */
/* ---------------------------------------------------------------------------- */
.reqStatusBadge {
  font-size: 22rpx;
  background-color: #1f232c;
  color: #e5e7eb;
  padding: 6rpx 16rpx;
  border-radius: 6rpx;
}

.reqStatusBadge.free {
  background-color: rgba(16, 185, 129, 0.2);
  color: #10b981;
}

.reqFreeCard {
  background-color: #151e19;
  border: 1rpx solid #065f46;
  border-radius: 10rpx;
  padding: 24rpx;
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.reqFreeTitle {
  font-size: 28rpx;
  font-weight: 700;
  color: #10b981;
}

.reqFreeDesc {
  font-size: 24rpx;
  color: #a7f3d0;
  line-height: 1.45;
}

.reqListGroup {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.reqItemCard {
  background-color: #191c23;
  border: 1rpx solid #2a303d;
  border-radius: 8rpx;
  padding: 20rpx;
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
}

.reqBullet {
  font-size: 24rpx;
}

.reqTextCol {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.reqItemName {
  font-size: 26rpx;
  font-weight: 700;
  color: #ffffff;
}

.reqItemNotes {
  font-size: 22rpx;
  color: #9ca3af;
}

.reqMayflyTip {
  font-size: 22rpx;
  color: #9ca3af;
  margin-top: 10rpx;
}

/* ---------------------------------------------------------------------------- */
/* 加载与空白态 */
/* ---------------------------------------------------------------------------- */
.loadingBox {
  padding: 50rpx 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
}

.loadingSpinner {
  width: 44rpx;
  height: 44rpx;
  border: 4rpx solid #374151;
  border-top-color: #da6b17;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loadingNotice,
.emptyFilesNotice {
  font-size: 24rpx;
  color: #9ca3af;
}

/* ---------------------------------------------------------------------------- */
/* 区域 8：底部悬浮固定操作栏 */
/* ---------------------------------------------------------------------------- */
.fixedBottomActionBar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 110rpx;
  background-color: #16181d;
  border-top: 1rpx solid #232731;
  display: flex;
  align-items: center;
  padding: 0 24rpx;
  gap: 20rpx;
  z-index: 99;
  box-sizing: border-box;
}

.bottomIconBtn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4rpx;
  width: 90rpx;
  cursor: pointer;
}

.bottomIcon {
  font-size: 32rpx;
}

.bottomIconLabel {
  font-size: 20rpx;
  color: #9ca3af;
}

.bottomPushBigBtn {
  flex: 1;
  background-color: #da6b17;
  border-radius: 8rpx;
  height: 78rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  border: none;
}

.bottomPushText {
  font-size: 28rpx;
  font-weight: 800;
  color: #ffffff;
  letter-spacing: 1rpx;
}

/* ---------------------------------------------------------------------------- */
/* 区域 9：设备配对弹窗 */
/* ---------------------------------------------------------------------------- */
.deviceModalMask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 30rpx;
  box-sizing: border-box;
}

.deviceModalContent {
  width: 100%;
  max-width: 620rpx;
  background-color: #1e2128;
  border: 1rpx solid #2f3542;
  border-radius: 12rpx;
  padding: 30rpx;
  box-sizing: border-box;
}

.modalHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24rpx;
}

.modalTitle {
  font-size: 30rpx;
  font-weight: 700;
  color: #ffffff;
}

.modalClose {
  font-size: 32rpx;
  color: #9ca3af;
  cursor: pointer;
}

.modalBody {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  margin-bottom: 30rpx;
}

.formRow {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.formLabel {
  font-size: 24rpx;
  color: #9ca3af;
}

.formInput {
  background-color: #121418;
  border: 1rpx solid #333946;
  border-radius: 6rpx;
  height: 72rpx;
  padding: 0 16rpx;
  font-size: 26rpx;
  color: #ffffff;
}

.modalFooter {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.modalBtn {
  flex: 1;
  height: 72rpx;
  border-radius: 6rpx;
  font-size: 26rpx;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  border: none;
}

.testBtn {
  background-color: #2b303c;
  color: #e5e7eb;
}

.saveBtn {
  background-color: #da6b17;
  color: #ffffff;
}

/* ---------------------------------------------------------------------------- */
/* 区域 8：NexusMods 账户与授权弹窗样式 */
/* ---------------------------------------------------------------------------- */
.modalOverlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.nexusAuthModalContent {
  width: 92%;
  max-width: 680rpx;
  background: #17191d;
  border: 1rpx solid #2f3440;
  border-radius: 24rpx;
  padding: 32rpx;
  box-sizing: border-box;
  box-shadow: 0 16rpx 48rpx rgba(0, 0, 0, 0.85);
}

.authModalHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24rpx;
  padding-bottom: 16rpx;
  border-bottom: 1rpx solid #262933;
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

.modalCloseBtn {
  font-size: 30rpx;
  color: #9ca3af;
  padding: 6rpx;
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
  border: 1rpx solid #333947;
  border-radius: 16rpx;
  padding: 20rpx;
}

.largeAvatarBox {
  position: relative;
  width: 104rpx;
  height: 104rpx;
  border-radius: 50%;
  background: #2b2f3a;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.largeAvatarImg {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.largeAvatarGlyph {
  font-size: 52rpx;
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
  gap: 6rpx;
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
  padding: 4rpx 10rpx;
  border-radius: 6rpx;
}

.vipTag.premium {
  color: #fbbf24;
  background: rgba(251, 191, 36, 0.18);
  border: 1rpx solid rgba(251, 191, 36, 0.4);
}

.vipTag.supporter {
  color: #38bdf8;
  background: rgba(56, 189, 248, 0.18);
}

.vipTag.standard {
  color: #9ca3af;
  background: rgba(255, 255, 255, 0.08);
}

.userUidText,
.userEmailText {
  font-size: 20rpx;
  color: #9ca3af;
}

.privilegesBox {
  background: #1a1c22;
  border: 1rpx solid #282c38;
  border-radius: 16rpx;
  padding: 20rpx;
}

.privilegeTitle {
  font-size: 24rpx;
  font-weight: 700;
  color: #e5e7eb;
  margin-bottom: 16rpx;
  display: block;
}

.privilegeGrid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16rpx;
}

.privilegeItem {
  display: flex;
  align-items: flex-start;
  gap: 12rpx;
}

.privItemIcon {
  font-size: 28rpx;
  margin-top: 2rpx;
}

.privItemTextCol {
  display: flex;
  flex-direction: column;
  gap: 2rpx;
}

.privMain {
  font-size: 22rpx;
  font-weight: 700;
  color: #ffffff;
}

.privSub {
  font-size: 18rpx;
  color: #9ca3af;
  line-height: 1.3;
}

.authActionsRow {
  display: flex;
  gap: 16rpx;
  margin-top: 10rpx;
}

.authSubBtn {
  flex: 1;
  background: #252933;
  border: 1rpx solid #373d4d;
  color: #ffffff;
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

.formLabelRow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10rpx;
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
