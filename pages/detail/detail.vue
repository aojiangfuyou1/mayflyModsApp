<template>
  <view class="nexusDetailPage">
    <!-- ==================================================================== -->
    <!-- 区域 1：Nexus 官方移动端标准顶栏 (☰ 抽屉/返回 + ❖ 橙标 + 🔍 搜索 + 👤 电脑配对) -->
    <!-- ==================================================================== -->
    <view class="nexusHeader">
      <view class="headerBtn" @click="handleNavBack">
        <text class="headerIcon">←</text>
      </view>

      <view class="headerLogoArea" @click="handleNavBack">
        <view class="nexusLogoBox">
          <text class="nexusLogoGlyph">❖</text>
        </view>
      </view>

      <view class="headerRightArea">
        <view class="headerBtn" @click="handleShareMod">
          <text class="headerIcon">📤</text>
        </view>
        <view class="headerBtn userBtn" @click="openDeviceModal">
          <text class="headerIcon">👤</text>
          <view class="onlineDot" :class="{ connected: desktopConfig.connected }"></view>
        </view>
      </view>
    </view>

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

        <!-- 5 列横向指标数据条 (对标图 3: Endorsements | Unique DLs | Total DLs | Total views | Version) -->
        <view class="heroStatsRow">
          <!-- 赞同数 Endorsements -->
          <view class="heroStatCol">
            <text class="heroStatLabel">Endorsements</text>
            <text class="heroStatVal highlight">{{ modInfo.likes || 0 }}</text>
          </view>
          <!-- 唯一独立下载 Unique DLs -->
          <view class="heroStatCol">
            <text class="heroStatLabel">Unique DLs</text>
            <text class="heroStatVal">--</text>
          </view>
          <!-- 总下载量 Total DLs -->
          <view class="heroStatCol">
            <text class="heroStatLabel">Total DLs</text>
            <text class="heroStatVal">{{ formatMetric(modInfo.downloads) }}</text>
          </view>
          <!-- 总浏览数 Total views -->
          <view class="heroStatCol">
            <text class="heroStatLabel">Total views</text>
            <text class="heroStatVal">--</text>
          </view>
          <!-- 模组版本 Version -->
          <view class="heroStatCol">
            <text class="heroStatLabel">Version</text>
            <text class="heroStatVal boldWhite">{{ modInfo.version || '1.0' }}</text>
          </view>
        </view>

        <!-- 动作操作行 (对标图 3: Original File 按钮 + Mayfly 专属推送到电脑) -->
        <view class="heroActionRow">
          <view class="originalFileBtn" @click="handleOpenWebsite">
            <text class="originalFileText">Original File</text>
          </view>
          <view class="heroPushBtn" @click="handlePushToDesktop">
            <text class="heroPushText">{{ isPushing ? '投递中...' : '🚀 推送到电脑' }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- ==================================================================== -->
    <!-- 区域 3：媒体画廊缩略条 (对标图 3: 缩略图 + 1 items + 全屏放大) -->
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
        <text class="galleryBadgeText">{{ imageGallery.length }} items</text>
      </view>
      <view class="galleryFullscreenBtn" @click="previewFullImage">
        <text class="galleryFullscreenIcon">⛶</text>
      </view>
    </view>

    <!-- ==================================================================== -->
    <!-- 区域 4：双列元数据信息表格 (100% 对标用户参考图 3) -->
    <!-- ==================================================================== -->
    <view class="metaTableCard">
      <view class="metaGrid">
        <!-- 左列 -->
        <view class="metaCol">
          <!-- Last updated -->
          <view class="metaCell">
            <text class="metaCellLabel">Last updated</text>
            <text class="metaCellVal">{{ modInfo.formattedFullUpdated || modInfo.formattedUpdateDate || '--' }}</text>
          </view>
          <!-- Created by -->
          <view class="metaCell">
            <text class="metaCellLabel">Created by</text>
            <text class="metaCellVal">{{ modInfo.author || '未知作者' }}</text>
          </view>
          <!-- Virus scan -->
          <view class="metaCell">
            <text class="metaCellLabel">Virus scan</text>
            <view class="virusScanRow">
              <text class="virusScanIcon">⚠️</text>
              <text class="virusScanText">Some files not scanned</text>
            </view>
          </view>
        </view>

        <!-- 右列 -->
        <view class="metaCol">
          <!-- Original upload -->
          <view class="metaCell">
            <text class="metaCellLabel">Original upload</text>
            <text class="metaCellVal">{{ modInfo.formattedFullCreated || modInfo.formattedDate || '--' }}</text>
          </view>
          <!-- Uploaded by -->
          <view class="metaCell">
            <text class="metaCellLabel">Uploaded by</text>
            <text class="metaCellVal uploaderLink">{{ modInfo.uploaderName || modInfo.author || '未知上传者' }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- ==================================================================== -->
    <!-- 区域 5：标签胶囊列表栏 (对标图 3: User Interface, Translation, + Tag this mod) -->
    <!-- ==================================================================== -->
    <view class="tagsSection">
      <scroll-view class="tagsScrollView" scroll-x show-scrollbar="false">
        <view class="tagsList">
          <view
            class="tagPill"
            v-for="(tag, tIdx) in displayTags"
            :key="tIdx"
          >
            <text class="tagPillText">{{ tag }}</text>
          </view>
          <view class="tagPill addTagPill" @click="handleTagTip">
            <text class="addTagIcon">+</text>
            <text class="tagPillText">Tag this mod</text>
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 分割线 -->
    <view class="nexusDivider"></view>

    <!-- ==================================================================== -->
    <!-- 区域 6：Current section 切换选择器 (对标图 3: Viewing: Description ⌄) -->
    <!-- ==================================================================== -->
    <view class="currentSectionArea">
      <text class="sectionHeaderTitle">Current section</text>
      <picker
        :range="sectionOptions"
        :value="currentSectionIndex"
        @change="onSectionChange"
      >
        <view class="sectionSelectCard">
          <text class="viewingPrefix">Viewing:</text>
          <text class="viewingValue">{{ sectionOptions[currentSectionIndex] }}</text>
          <text class="selectArrow">⌄</text>
        </view>
      </picker>
    </view>

    <!-- ==================================================================== -->
    <!-- 区域 7A：Section = Description 模组正文详情 (100% 对标用户参考图 4) -->
    <!-- ==================================================================== -->
    <view class="sectionBodyContainer" v-if="currentSectionIndex === 0">
      <view class="aboutHeaderRow">
        <text class="aboutTitle">About this mod</text>
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
        <text class="aboutTitle">Files 物理文件清单</text>
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
              <text class="fileCatText">{{ file.category }}</text>
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
        <text class="aboutTitle">Requirements 前置体检</text>
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
    <!-- 区域 9：电脑端设备配对弹窗 -->
    <!-- ==================================================================== -->
    <view class="deviceModalMask" v-if="deviceModalVisible" @click="closeDeviceModal">
      <view class="deviceModalContent" @click.stop>
        <view class="modalHeader">
          <text class="modalTitle">电脑端 Mayfly 配对设置</text>
          <text class="modalClose" @click="closeDeviceModal">✕</text>
        </view>

        <view class="modalBody">
          <view class="formRow">
            <text class="formLabel">电脑 IP 地址</text>
            <input
              class="formInput"
              v-model="deviceForm.host"
              placeholder="例如: 192.168.1.100"
            />
          </view>
          <view class="formRow">
            <text class="formLabel">服务端口</text>
            <input
              class="formInput"
              type="number"
              v-model="deviceForm.port"
              placeholder="默认: 9876"
            />
          </view>
          <view class="formRow">
            <text class="formLabel">设备通信密钥 Token</text>
            <input
              class="formInput"
              v-model="deviceForm.deviceToken"
              placeholder="例如: MF-PC-8891"
            />
          </view>
        </view>

        <view class="modalFooter">
          <button
            class="modalBtn testBtn"
            :loading="testingConnection"
            @click="testConnection"
          >
            测试连通
          </button>
          <button class="modalBtn saveBtn" @click="saveDevice">
            保存配对
          </button>
        </view>
      </view>
    </view>
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
  saveDesktopConfig,
  testDesktopConnection,
  formatNexusMetric,
  formatNexusDate,
  formatNexusFullDate,
  parseNexusBbCode
} from '../../services/nexus.js';
import {
  translateTextToZh,
  translateRichDescription
} from '../../services/translate.js';
import { isFavorited, toggleFavorite } from '../../services/favorites.js';
import { formatModShareText } from '../../services/poster.js';

export default {
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

      // 翻译模式与缓存 (默认开启智能全中文图鉴)
      isChineseMode: true,
      modZhTitle: '',
      modZhSummary: '',
      modZhDescription: '',
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
      deviceForm: {
        host: '',
        port: 9876,
        deviceToken: ''
      },
      testingConnection: false
    };
  },

  computed: {
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

  async onLoad(options) {
    this.desktopConfig = getDesktopConfig();
    this.deviceForm.host = this.desktopConfig.host;
    this.deviceForm.port = this.desktopConfig.port;
    this.deviceForm.deviceToken = this.desktopConfig.deviceToken;

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
      const status = toggleFavorite(this.modInfo);
      this.favorited = status;
      uni.showToast({
        title: status ? '已收藏到心愿单 ❤️' : '已移出心愿单',
        icon: 'none'
      });
    },

    /**
     * 分享模组装机口令
     */
    handleShareMod() {
      const text = formatModShareText(this.modInfo);
      uni.setClipboardData({
        data: text,
        success: () => {
          uni.showModal({
            title: '装机口令已复制',
            content: '已将该模组的专属 Mayfly 装机口令复制到剪贴板，可直接发送给好友一键打开！',
            showCancel: false
          });
        }
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
        const payload = {
          ...this.modInfo,
          selectedFile: this.selectedFile
        };

        const res = await pushModToDesktop(payload, this.desktopConfig);
        uni.hideLoading();

        if (res.success) {
          uni.showModal({
            title: '推送成功 🚀',
            content: `已成功投递到电脑端 Mayfly！\n模组【${this.modInfo.title}】正在后台下载并安装。`,
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
    // 设备配对设置弹窗
    // ------------------------------------------------------------------------

    openDeviceModal() {
      this.deviceModalVisible = true;
    },

    closeDeviceModal() {
      this.deviceModalVisible = false;
    },

    async testConnection() {
      this.testingConnection = true;
      const ok = await testDesktopConnection(this.deviceForm.host, Number(this.deviceForm.port));
      this.testingConnection = false;
      if (ok) {
        this.desktopConfig.connected = true;
        uni.showToast({ title: '已成功连通电脑！', icon: 'success' });
      } else {
        this.desktopConfig.connected = false;
        uni.showToast({ title: '未能连通电脑，请检查IP', icon: 'none' });
      }
    },

    saveDevice() {
      this.desktopConfig.host = this.deviceForm.host.trim();
      this.desktopConfig.port = Number(this.deviceForm.port) || 9876;
      this.desktopConfig.deviceToken = this.deviceForm.deviceToken.trim();
      saveDesktopConfig(this.desktopConfig);
      this.closeDeviceModal();
      uni.showToast({ title: '配对信息已保存', icon: 'success' });
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

.userBtn {
  position: relative;
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
</style>
