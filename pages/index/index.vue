<template>
  <view class="nexusPage">
    <!-- ==================================================================== -->
    <!-- 区域 1：Nexus 官方移动端标准顶栏 (☰ 抽屉 + ❖ 橙标 + 🔍 搜索 + 👤 电脑配对) -->
    <!-- ==================================================================== -->
    <view class="nexusHeader">
      <view class="headerBtn" @click="toggleDrawer">
        <text class="headerIcon">☰</text>
      </view>

      <view class="headerLogoArea" @click="switchView(currentView === 'mods' ? 'games' : 'mods')">
        <view class="nexusLogoBox">
          <text class="nexusLogoGlyph">❖</text>
        </view>
      </view>

      <view class="headerRightArea">
        <view class="headerBtn" @click="toggleSearchExpand">
          <text class="headerIcon">🔍</text>
        </view>
        <view class="headerBtn userBtn" @click="openDeviceModal">
          <text class="headerIcon">👤</text>
          <view class="onlineDot" :class="{ connected: desktopConfig.connected }"></view>
        </view>
      </view>
    </view>

    <!-- ==================================================================== -->
    <!-- 区域 1.5：平滑展开的搜索输入栏 -->
    <!-- ==================================================================== -->
    <view class="searchExpandSection" v-if="searchExpanded || searchText">
      <view class="searchBarBox">
        <text class="searchIcon">🔍</text>
        <input
          class="searchInput"
          v-model="searchText"
          placeholder="搜索 NexusMods 任意模组或游戏..."
          placeholder-class="searchPlaceholder"
          confirm-type="search"
          @confirm="onSearchConfirm"
        />
        <text v-if="searchText" class="clearIcon" @click="clearSearch">✕</text>
      </view>
    </view>

    <!-- ==================================================================== -->
    <!-- 区域 2A：Games 视角 (100% 对标用户截图 1 的双列竖版海报风格，动态拉取) -->
    <!-- ==================================================================== -->
    <view class="gamesContainer" v-if="currentView === 'games'">
      <!-- 游戏区块标题行 (对标图 1 与图 2 统一规范: 🎮 Games   View all mods) -->
      <view class="gamesHeaderRow">
        <view class="gamesHeaderLeft">
          <text class="gamesIcon">🎮</text>
          <text class="gamesTitle">Games</text>
        </view>
        <text class="gamesViewAllLink" @click="switchView('mods')">View all mods</text>
      </view>

      <!-- 加载状态 -->
      <view class="loadingBox" v-if="gamesLoading && gamesList.length === 0">
        <view class="loadingSpinner"></view>
        <text class="loadingText">正在从 N网 动态加载热门游戏库...</text>
      </view>

      <!-- 双列竖版游戏海报网格 (对标图 1: Skyrim SE, Fallout 4 等) -->
      <view class="gamesGrid" v-else>
        <view
          class="gamePosterCard"
          v-for="game in gamesList"
          :key="game.id"
          @click="selectGameAndJumpMods(game)"
        >
          <!-- 竖版封面 (2:3比例) + 赛博朋克同款书签角标 -->
          <view class="gameCoverBox">
            <image
              class="gameCoverImg"
              :src="game.tileUrl"
              mode="aspectFill"
              lazy-load
            />
            <view class="gameBookmarkBadge" :class="{ selected: selectedGameDomain === game.domain }">
              <text class="bookmarkIcon">🔖</text>
            </view>
          </view>

          <!-- 游戏标题 (优先展示友好中文名，白字加粗) -->
          <text class="gameTitleText">{{ getGameDisplayTitle(game) }}</text>
          <!-- 英文原名副标 (灰字紧凑小字) -->
          <text class="gameOriginalNameText" v-if="getGameDisplayTitle(game) !== game.name">{{ game.name }}</text>

          <!-- 统计指标行 (对标图 1: ◆ 142k  ▤ 4.8k  ⬇ 13.4b) -->
          <view class="gameStatsRow">
            <view class="statMetricItem">
              <text class="statGlyph">◆</text>
              <text class="statMetricVal">{{ game.stats.mods }}</text>
            </view>
            <view class="statMetricItem">
              <text class="statGlyph">▤</text>
              <text class="statMetricVal">{{ game.stats.tracking }}</text>
            </view>
            <view class="statMetricItem">
              <text class="statGlyph">⬇</text>
              <text class="statMetricVal">{{ game.stats.downloads }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- ==================================================================== -->
    <!-- 区域 2B：Mods 视角 (100% 对标用户截图 2 的模组流风格，动态拉取) -->
    <!-- ==================================================================== -->
    <view class="modsContainer" v-else>
      <!-- 当前选中游戏横幅栏 (100% 对标图 2 风格，直观清晰呈现当前游戏与取消按钮) -->
      <view class="activeGameNavRow" v-if="selectedGameDomain">
        <view class="activeGameLeftBox">
          <image
            class="activeGameMiniThumb"
            :src="activeGameTileUrl || '/static/logo.png'"
            mode="aspectFill"
          />
          <view class="activeGameTitleWrap">
            <text class="activeGameTitleText">{{ activeGameDisplayName }}</text>
            <text class="activeGameOriginalText" v-if="activeGameOriginalName && activeGameOriginalName !== activeGameDisplayName">
              {{ activeGameOriginalName }}
            </text>
          </view>
        </view>
        <view class="clearGamePillBtn" @click="clearGameFilterAndBack">
          <text class="clearGamePillIcon">✕</text>
          <text class="clearGamePillText">全部游戏</text>
        </view>
      </view>
      <view class="activeGameNavRow globalRow" v-else>
        <view class="activeGameLeftBox">
          <text class="globalModeIcon">🌐</text>
          <text class="activeGameTitleText">全网热门模组流</text>
        </view>
        <view class="pickGamePillBtn" @click="switchView('games')">
          <text class="pickGamePillText">选择专区 ›</text>
        </view>
      </view>

      <!-- 模组区块标题行 (100% 对标图 2: ◆ Mods   View all) -->
      <view class="modsHeaderRow">
        <view class="modsHeaderLeft">
          <text class="modsIcon">◆</text>
          <text class="modsTitle">Mods</text>
        </view>
        <text class="modsViewAllLink" @click="clearGameFilterAndBack">View all games</text>
      </view>

      <!-- 排序选项卡 (100% 对标图 2: ☀ New | ⟳ Updated | 📈 Trending | ★ Popular | ❤️ Favorites) -->
      <scroll-view class="filterPillsScroll" scroll-x show-scrollbar="false">
        <view class="filterPillsList">
          <!-- ☀ New (活跃态为白底黑字胶囊) -->
          <view
            class="filterPill"
            :class="{ active: currentSort === 'createdAt' }"
            @click="changeSort('createdAt')"
          >
            <text class="pillIcon">☀</text>
            <text class="pillLabel">New</text>
          </view>

          <!-- ⟳ Updated -->
          <view
            class="filterPill"
            :class="{ active: currentSort === 'updatedAt' }"
            @click="changeSort('updatedAt')"
          >
            <text class="pillIcon">⟳</text>
            <text class="pillLabel">Updated</text>
          </view>

          <!-- 📈 Trending -->
          <view
            class="filterPill"
            :class="{ active: currentSort === 'trending' }"
            @click="changeSort('trending')"
          >
            <text class="pillIcon">📈</text>
            <text class="pillLabel">Trending</text>
          </view>

          <!-- ★ Popular -->
          <view
            class="filterPill"
            :class="{ active: currentSort === 'downloads' }"
            @click="changeSort('downloads')"
          >
            <text class="pillIcon">★</text>
            <text class="pillLabel">Popular</text>
          </view>

          <!-- ❤️ Favorites (装机心愿单) -->
          <view
            class="filterPill"
            :class="{ active: currentSort === 'favorites' }"
            @click="changeSort('favorites')"
          >
            <text class="pillIcon">❤️</text>
            <text class="pillLabel">Favorites{{ favoritesCount > 0 ? ` (${favoritesCount})` : '' }}</text>
          </view>
        </view>
      </scroll-view>

      <!-- N网官方实时动态分类胶囊栏 (100% 动态，来自 Nexus facetsData，零硬编码) -->
      <scroll-view class="categoryPillsScroll" scroll-x show-scrollbar="false" v-if="dynamicCategories.length > 0">
        <view class="categoryPillsList">
          <view
            class="catPill"
            :class="{ active: !selectedCategory }"
            @click="selectCategory('')"
          >
            <text class="catPillText">全部 (All)</text>
          </view>
          <view
            class="catPill"
            v-for="cat in dynamicCategories"
            :key="cat.name"
            :class="{ active: selectedCategory === cat.name }"
            @click="selectCategory(cat.name)"
          >
            <text class="catPillText">{{ getCategoryPillLabel(cat) }}</text>
          </view>
        </view>
      </scroll-view>

      <!-- 时间范围下拉筛选行 (对标图 2: All time ↕) -->
      <view class="timeFilterRow">
        <picker :range="timeFilterOptions" :value="timeFilterIndex" @change="onTimeFilterChange">
          <view class="timeSelectBox">
            <text class="timeSelectLabel">{{ timeFilterOptions[timeFilterIndex] }}</text>
            <text class="timeSelectArrow">↕</text>
          </view>
        </picker>
      </view>

      <!-- 心愿单模式批量操作工具条 (支持按当前选中游戏过滤，杜绝跨游戏乱跑) -->
      <view class="favBatchBar" v-if="currentSort === 'favorites'">
        <!-- 范围切换胶囊 (当选定了具体游戏时展示) -->
        <view class="favScopeRow" v-if="selectedGameDomain">
          <view
            class="favScopePill"
            :class="{ active: favoritesScope === 'current' }"
            @click="favoritesScope = 'current'"
          >
            <text class="favScopeText">🎮 {{ activeGameDisplayName }} ({{ currentGameFavoritesList.length }})</text>
          </view>
          <view
            class="favScopePill"
            :class="{ active: favoritesScope === 'all' }"
            @click="favoritesScope = 'all'"
          >
            <text class="favScopeText">🌐 全部游戏 ({{ favoritesList.length }})</text>
          </view>
        </view>

        <view class="favSummaryText">
          <text class="favCountNum">❤️ 已收藏 {{ filteredFavoritesList.length }} 个模组</text>
          <text class="favTipText">{{ selectedGameDomain && favoritesScope === 'current' ? `当前仅展示 ${activeGameDisplayName} 模组` : '展示全游戏综合心愿单' }}</text>
        </view>
        <view class="favBatchActions" v-if="filteredFavoritesList.length > 0">
          <button class="favExportBtn" @click="exportFavoritesList">
            <text class="favExportBtnText">📋 导出</text>
          </button>
          <button
            class="favBatchPushBtn"
            :disabled="isBatchPushing"
            @click="batchPushFavorites"
          >
            <text class="favBatchBtnText">
              {{ isBatchPushing ? '投递中...' : `🚀 批量推送 (${filteredFavoritesList.length})` }}
            </text>
          </button>
        </view>
      </view>

      <!-- 双列模组卡片网格 (100% 对标图 2) -->
      <view class="modsGrid" v-if="streamModList.length > 0">
        <view
          class="modCard"
          v-for="item in streamModList"
          :key="item.id"
          @click="openDetail(item)"
        >
          <!-- 封面大图 (16:9) + 游戏短角标 + 右上角操作点 -->
          <view class="modCoverBox">
            <image
              class="modCoverImg"
              :src="item.coverImageUrl || '/static/logo.png'"
              mode="aspectFill"
              lazy-load
            />
            <view class="modGameBadge">
              <text class="modGameBadgeText">{{ item.game.shortZhName || item.game.name }}</text>
            </view>
            <view class="modActionBtn" @click.stop="toggleCardFavorite(item)">
              <text class="actionDotText">{{ favoriteIdMap[item.id] ? '❤️' : '···' }}</text>
            </view>
          </view>

          <!-- 卡片信息主体 (对标图 2) -->
          <view class="modBody">
            <!-- 标题 (白字加粗) -->
            <text class="modTitleText">
              {{ enableAutoTranslate && zhTitleMap[item.id] ? zhTitleMap[item.id] : item.title }}
            </text>

            <!-- 作者信息 (Nexus 经典暖金色 #d4a373) -->
            <view class="modAuthorRow">
              <text class="authorGlyph">👤</text>
              <text class="authorNameText">{{ item.author }}</text>
            </view>

            <!-- 模组类型 (对标图 2 Patches, Audio 等，中文友好映射) -->
            <text class="modCategoryText">{{ getCategoryDisplayName(item.category) }}</text>

            <!-- 更新与创建时间 (对标图 2: ⟳ 2 minutes ago / ⬆ 16 Oct 2026) -->
            <view class="modTimeRow">
              <view class="timeCol">
                <text class="timeIcon">⟳</text>
                <text class="timeVal">{{ item.timeAgo || 'recently' }}</text>
              </view>
              <view class="timeCol" v-if="item.formattedDate">
                <text class="timeIcon">⬆</text>
                <text class="timeVal">{{ item.formattedDate }}</text>
              </view>
            </view>

            <!-- 简介摘要预览 (灰色两行，自动中文翻译呈现) -->
            <text class="modSummaryText">{{ getModDisplaySummary(item) }}</text>

            <!-- 底部统计与推送 (对标图 2: 👍 0  📥 0  + Mayfly 独有推送到电脑) -->
            <view class="modFooterRow">
              <view class="modStatsLeft">
                <text class="footerMetric">👍 {{ item.likes }}</text>
                <text class="footerMetric">📥 {{ formatCount(item.downloads) }}</text>
              </view>
              <button
                class="nexusPushBtn"
                :disabled="pushingModId === item.id"
                @click.stop="quickPushToDesktop(item)"
              >
                <text class="nexusPushBtnText">
                  {{ pushingModId === item.id ? '推送中' : '🚀 推送' }}
                </text>
              </button>
            </view>
          </view>
        </view>
      </view>

      <!-- 加载与空结果提示 -->
      <view class="loadingBox" v-if="loading && modList.length === 0">
        <view class="loadingSpinner"></view>
        <text class="loadingText">正在从 NexusMods 检索模组...</text>
      </view>

      <view class="emptyBox" v-if="!loading && modList.length === 0">
        <text class="emptyIcon">📭</text>
        <text class="emptyText">未找到相关 N网 模组</text>
        <button class="retryBtn" @click="resetAndLoad">刷新重试</button>
      </view>

      <view class="bottomNotice" v-if="modList.length > 0">
        <text class="bottomText" v-if="loadingMore">正在加载更多 Nexus 模组...</text>
        <text class="bottomText" v-else-if="!hasMore">已加载全部热门 Nexus 模组</text>
      </view>
    </view>

    <!-- ==================================================================== -->
    <!-- 区域 4：侧边滑出抽屉导航 (100% 对标用户参考图 2 Nexus 官方结构) -->
    <!-- ==================================================================== -->
    <view class="drawerMask" v-if="drawerVisible" @click="closeDrawer">
      <view class="drawerBody" @click.stop>
        <!-- 抽屉顶部标准顶栏 (❖ 橙标 + ✕ 关闭) -->
        <view class="drawerHeaderRow">
          <view class="drawerBrandBox">
            <text class="drawerLogo">❖</text>
            <text class="drawerBrandTitle">Mayfly Nexus</text>
          </view>
          <view class="drawerCloseBtn" @click="closeDrawer">✕</view>
        </view>

        <!-- 100% 对标图 2：当前选中的游戏卡片 (Active Game Badge Card) -->
        <view class="drawerActiveGameCard" v-if="selectedGameDomain">
          <image
            class="activeGameThumb"
            :src="activeGameTileUrl || '/static/logo.png'"
            mode="aspectFill"
          />
          <view class="activeGameMetaBox" @click="switchView('mods'); closeDrawer()">
            <text class="activeGameNameText">{{ activeGameOriginalName || activeGameDisplayName }}</text>
            <text class="activeGameZhSubText" v-if="activeGameDisplayName && activeGameDisplayName !== activeGameOriginalName">
              {{ activeGameDisplayName }}
            </text>
          </view>
          <view class="clearActiveGameBtn" @click.stop="clearGameFilterAndBack">
            <text class="clearActiveGameIcon">✕</text>
          </view>
        </view>

        <!-- 未选择游戏时的全网状态卡片 -->
        <view class="drawerNoGameCard" v-else @click="switchView('games'); closeDrawer()">
          <view class="noGameIconBox">
            <text class="noGameGlyph">🌐</text>
          </view>
          <view class="noGameMetaBox">
            <text class="noGameMainText">全网模组模式</text>
            <text class="noGameSubText">点击进入热门游戏专区选择</text>
          </view>
          <text class="drawerNavArrow">›</text>
        </view>

        <!-- 100% 对标图 2：极简导航功能列表 (带右侧优雅 › 箭头) -->
        <view class="drawerNavList">
          <view class="drawerNavItem" @click="switchView('games'); closeDrawer()">
            <view class="navItemLeft">
              <text class="itemIcon">🎮</text>
              <text class="itemText">Games 热门游戏专区</text>
            </view>
            <text class="drawerNavArrow">›</text>
          </view>

          <view class="drawerNavItem" @click="switchView('mods'); closeDrawer()">
            <view class="navItemLeft">
              <text class="itemIcon">◆</text>
              <text class="itemText">Mods 模组流水线</text>
            </view>
            <view class="navItemRight">
              <text class="currentTag" v-if="selectedGameDomain">{{ activeGameDisplayName }}</text>
              <text class="drawerNavArrow">›</text>
            </view>
          </view>

          <view class="drawerNavItem" @click="changeSort('favorites'); switchView('mods'); closeDrawer()">
            <view class="navItemLeft">
              <text class="itemIcon">❤️</text>
              <text class="itemText">Wishlist 装机心愿单</text>
            </view>
            <view class="navItemRight">
              <text class="itemBadge" v-if="favoritesCount > 0">{{ favoritesCount }}</text>
              <text class="drawerNavArrow">›</text>
            </view>
          </view>

          <view class="drawerNavItem" @click="openHistoryModal">
            <view class="navItemLeft">
              <text class="itemIcon">📋</text>
              <text class="itemText">History 推送任务清单</text>
            </view>
            <view class="navItemRight">
              <text class="itemBadge" v-if="historyList.length > 0">{{ historyList.length }}</text>
              <text class="drawerNavArrow">›</text>
            </view>
          </view>

          <view class="drawerNavItem" @click="toggleAutoTranslate">
            <view class="navItemLeft">
              <text class="itemIcon">🌐</text>
              <text class="itemText">AI 智能双语图鉴</text>
            </view>
            <view class="navItemRight">
              <text class="itemSwitchTag" :class="{ on: enableAutoTranslate }">
                {{ enableAutoTranslate ? '已开启' : '原英文' }}
              </text>
            </view>
          </view>
        </view>

        <!-- 电脑端连接卡片 (保留配对与测试) -->
        <view class="drawerPcCard">
          <view class="pcCardTop">
            <text class="pcCardTitle">💻 电脑端连接状态</text>
            <view class="pcStatusBadge" :class="{ online: desktopConfig.connected }">
              <text class="pcStatusText">{{ desktopConfig.connected ? '已连接' : '未连接' }}</text>
            </view>
          </view>
          <text class="pcIpText">目标主机: {{ desktopConfig.host }}:{{ desktopConfig.port }}</text>
          <view class="pcActionsRow">
            <button class="pcActionBtn primary" @click="openDeviceModal">
              <text class="btnText">⚙️ 配对设置</text>
            </button>
            <button class="pcActionBtn" @click="runQuickTest">
              <text class="btnText">📶 测试连接</text>
            </button>
          </view>
        </view>

        <view class="drawerFooter">
          <text class="footerVersion">NexusMods 官方公开 GraphQL 直连</text>
          <text class="footerSub">Mayfly Mod Manager Companion</text>
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
          <!-- 扫码一键配对按钮 -->
          <button class="scanCodeBtn" @click="handleScanCodePair">
            <text class="scanCodeBtnText">📷 扫一扫屏幕二维码自动配对</text>
          </button>

          <view class="formDividerRow">
            <view class="dividerLine"></view>
            <text class="dividerText">或手动输入配置</text>
            <view class="dividerLine"></view>
          </view>

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
              placeholder="默认 28888 或 9876"
            />
          </view>

          <view class="formItem">
            <text class="formLabel">设备配对 Token / Pin</text>
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

    <!-- ==================================================================== -->
    <!-- 区域 6：推送任务清单与历史记录抽屉 -->
    <!-- ==================================================================== -->
    <view class="modalOverlay" v-if="historyModalVisible" @click="closeHistoryModal">
      <view class="historyDrawerContent" @click.stop>
        <view class="drawerHeader">
          <view class="drawerTitleBox">
            <text class="drawerTitle">📋 推送任务清单</text>
            <text class="drawerSub">已推送到电脑 Mayfly 的模组</text>
          </view>
          <view class="drawerActions">
            <text class="clearHistoryText" v-if="historyList.length > 0" @click="handleClearHistory">清空</text>
            <view class="modalCloseBtn" @click="closeHistoryModal">✕</view>
          </view>
        </view>

        <!-- 历史清单滚动列表 -->
        <scroll-view scroll-y class="historyScrollList">
          <view class="historyEmpty" v-if="historyList.length === 0">
            <text class="emptyTipIcon">📦</text>
            <text class="emptyTipText">暂无推送记录，挑选心仪的 Mod 体验一键推送吧！</text>
          </view>

          <view class="historyItem" v-for="item in historyList" :key="item.id">
            <image class="historyThumb" :src="item.coverImageUrl || '/static/logo.png'" mode="aspectFill" />
            <view class="historyBody">
              <text class="historyTitle">{{ item.title }}</text>
              <view class="historyMeta">
                <text class="historyGame">{{ item.gameName }}</text>
                <text class="historyChannelTag">{{ item.channel === 'LAN_HTTP' ? '局域网' : '云通道' }}</text>
                <text class="historyTime">{{ formatHistoryTime(item.timestamp) }}</text>
              </view>
            </view>
            <button class="rePushBtn" @click="rePushItem(item)">
              <text class="rePushText">重推</text>
            </button>
          </view>
        </scroll-view>
      </view>
    </view>
  </view>
</template>

<script>
// ============================================================================
// 脚本逻辑：首页 Nexus 动态数据流控制与交互
// ============================================================================
import {
  fetchNexusMods,
  fetchNexusGames,
  pushModToDesktop,
  getDesktopConfig,
  saveDesktopConfig,
  testDesktopConnection
} from '../../services/nexus.js';
import {
  batchTranslateToZh,
  getCategoryZhName,
  batchTranslateModList
} from '../../services/translate.js';
import { getPushHistory, clearPushHistory } from '../../services/history.js';
import { getFavorites, toggleFavorite } from '../../services/favorites.js';
import { parseShareClipboard, formatFavoritesShareText } from '../../services/poster.js';

export default {
  data() {
    return {
      // 当前主视角: 默认优先展示全部游戏专区 ('games')，点击后进入对应游戏模组流 ('mods')
      currentView: 'games',

      // 动态游戏列表数据 (100% 动态，来自 Nexus 官方 GraphQL，零硬编码)
      gamesList: [],
      gamesLoading: false,
      selectedGameDomain: '',
      selectedGameName: '',
      selectedGameZhName: '',
      selectedGameTileUrl: '',

      // 心愿单展示范围: 'current' (仅当前选中游戏) | 'all' (全部游戏)
      favoritesScope: 'current',

      // 动态模组列表状态 (100% 动态，来自 Nexus 官方 GraphQL)
      modList: [],
      page: 1,
      pageSize: 20,
      totalCount: 0,
      hasMore: true,
      loading: false,
      loadingMore: false,

      // N网官方实时动态分类 (零硬编码，从 GraphQL 聚合返回)
      dynamicCategories: [],
      selectedCategory: '',

      // 排序维度: 'createdAt' (New) | 'updatedAt' (Updated) | 'trending' | 'downloads' (Popular) | 'favorites'
      currentSort: 'createdAt',
      timeFilterIndex: 0,
      timeFilterOptions: ['All time', 'Last 24 hours', 'Last 7 days', 'Last 14 days', 'Last 30 days', '1 year'],

      // 智能翻译与全自动双语图鉴 (默认开启，自动将游戏名、模组标题、简介与分类翻译为地道中文)
      enableAutoTranslate: true,
      zhTitleMap: {},
      zhSummaryMap: {},
      zhCategoryMap: {},
      zhGameNameMap: {},

      // 心愿单收藏
      favoritesList: [],
      favoriteIdMap: {},

      // 搜索控制
      searchText: '',
      searchExpanded: false,

      // 侧边抽屉与弹窗状态
      drawerVisible: false,
      pushingModId: null,

      // 推送历史与任务清单
      historyModalVisible: false,
      historyList: [],
      pushedIdMap: {},
      isBatchPushing: false,
      lastHandledClipboard: '',

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

  computed: {
    /**
     * 当前选中的游戏封面图
     */
    activeGameTileUrl() {
      if (this.selectedGameTileUrl) return this.selectedGameTileUrl;
      const match = this.gamesList.find((g) => g.domain === this.selectedGameDomain);
      if (match && match.tileUrl) return match.tileUrl;
      return '';
    },

    /**
     * 当前选中的游戏英文原名
     */
    activeGameOriginalName() {
      if (!this.selectedGameDomain) return '';
      if (this.selectedGameName) return this.selectedGameName;
      const match = this.gamesList.find((g) => g.domain === this.selectedGameDomain);
      return match ? match.name : this.selectedGameDomain;
    },

    /**
     * 当前选中的游戏展示名称 (优先中文)
     */
    activeGameDisplayName() {
      if (!this.selectedGameDomain) return '';
      if (this.selectedGameZhName) return this.selectedGameZhName;
      const match = this.gamesList.find((g) => g.domain === this.selectedGameDomain);
      if (match) {
        return this.getGameDisplayTitle(match);
      }
      return this.selectedGameName || this.selectedGameDomain;
    },

    /**
     * 属于当前选中游戏的心愿单列表 (按游戏精准归集，杜绝跨游戏乱跑)
     */
    currentGameFavoritesList() {
      if (!this.selectedGameDomain) return this.favoritesList;
      const currentDomain = String(this.selectedGameDomain).toLowerCase().replace(/[^a-z0-9]/g, '');
      const currentName = String(this.selectedGameName || '').toLowerCase().replace(/[^a-z0-9]/g, '');

      return this.favoritesList.filter((item) => {
        const itemDomain = String(item.game?.domainName || item.gameDomain || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const itemName = String(item.game?.name || item.gameName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        return (
          itemDomain === currentDomain ||
          (itemDomain && currentDomain && (itemDomain.includes(currentDomain) || currentDomain.includes(itemDomain))) ||
          (itemName && currentName && (itemName.includes(currentName) || currentName.includes(itemName)))
        );
      });
    },

    /**
     * 根据当前选择范围过滤后的心愿单列表
     */
    filteredFavoritesList() {
      if (!this.selectedGameDomain || this.favoritesScope === 'all') {
        return this.favoritesList;
      }
      return this.currentGameFavoritesList;
    },

    /**
     * 收藏总数
     */
    favoritesCount() {
      if (this.selectedGameDomain && this.favoritesScope === 'current') {
        return this.currentGameFavoritesList.length;
      }
      return this.favoritesList.length;
    },

    /**
     * 全网流水线瀑布流列表
     */
    streamModList() {
      if (this.currentSort === 'favorites') {
        return this.filteredFavoritesList;
      }
      return this.modList;
    }
  },

  onLoad() {
    this.initDesktopConfig();
    this.refreshHistory();
    this.refreshFavorites();

    // 恢复上次激活的游戏状态与视图，防止刷新后上下文丢失
    try {
      const savedGame = uni.getStorageSync('mayfly_active_game');
      if (savedGame && savedGame.domain) {
        this.selectedGameDomain = savedGame.domain;
        this.selectedGameName = savedGame.name || '';
        this.selectedGameZhName = savedGame.zhName || '';
        this.selectedGameTileUrl = savedGame.tileUrl || '';
        this.currentView = 'mods';
      }
    } catch (e) {}

    // 首次进入动态加载游戏列表与模组列表
    this.loadGames();
    this.loadMods();
  },

  onShow() {
    this.refreshHistory();
    this.refreshFavorites();
    this.checkClipboardModShare();
  },

  onPullDownRefresh() {
    if (this.currentView === 'games') {
      this.loadGames(() => {
        uni.stopPullDownRefresh();
      });
      return;
    }
    if (this.currentSort === 'favorites') {
      this.refreshFavorites();
      uni.stopPullDownRefresh();
      return;
    }
    this.resetAndLoad(() => {
      uni.stopPullDownRefresh();
    });
  },

  onReachBottom() {
    if (this.currentView === 'games') {
      this.loadMoreGames();
      return;
    }
    if (this.currentView === 'mods' && this.hasMore && !this.loading && !this.loadingMore) {
      this.loadMoreMods();
    }
  },

  methods: {
    // ------------------------------------------------------------------------
    // 视角切换与抽屉交互
    // ------------------------------------------------------------------------

    /**
     * 切换主视角 ('mods' | 'games')
     */
    switchView(viewName) {
      this.currentView = viewName;
      if (viewName === 'games' && this.gamesList.length === 0) {
        this.loadGames();
      }
    },

    /**
     * 开关侧边抽屉
     */
    toggleDrawer() {
      this.drawerVisible = !this.drawerVisible;
    },

    closeDrawer() {
      this.drawerVisible = false;
    },

    /**
     * 切换搜索条展开状态
     */
    toggleSearchExpand() {
      this.searchExpanded = !this.searchExpanded;
    },

    /**
     * 从 Games 视角选中某游戏并进入 Mods 列表筛选 (并持久化当前激活游戏)
     */
    selectGameAndJumpMods(game) {
      if (!game) return;
      this.selectedGameDomain = game.domain;
      this.selectedGameName = game.name;
      this.selectedGameZhName = game.zhName || game.shortZhName || game.name;
      this.selectedGameTileUrl = game.tileUrl || '';
      this.selectedCategory = '';
      this.currentView = 'mods';
      this.favoritesScope = 'current';

      try {
        uni.setStorageSync('mayfly_active_game', {
          domain: game.domain,
          name: game.name,
          zhName: this.selectedGameZhName,
          tileUrl: this.selectedGameTileUrl
        });
      } catch (e) {}

      this.resetAndLoad();
    },

    /**
     * 清空游戏筛选，恢复全部游戏专区模式
     */
    clearGameFilterAndBack() {
      this.selectedGameDomain = '';
      this.selectedGameName = '';
      this.selectedGameZhName = '';
      this.selectedGameTileUrl = '';
      this.selectedCategory = '';
      this.currentView = 'games';
      this.favoritesScope = 'all';

      try {
        uni.removeStorageSync('mayfly_active_game');
      } catch (e) {}

      if (this.gamesList.length === 0) {
        this.loadGames();
      }
    },

    /**
     * 选中 N网 官方实时动态分类胶囊
     */
    selectCategory(catName) {
      this.selectedCategory = catName === this.selectedCategory ? '' : catName;
      this.resetAndLoad();
    },

    /**
     * 时间筛选下拉框触发
     */
    onTimeFilterChange(e) {
      this.timeFilterIndex = Number(e.detail?.value) || 0;
      this.resetAndLoad();
    },

    // ------------------------------------------------------------------------
    // 动态数据拉取 (100% 动态，零硬编码)
    // ------------------------------------------------------------------------

    /**
     * 从 Nexus 官方 GraphQL 动态抓取游戏列表 (对标图 1)
     */
    async loadGames(callback) {
      if (this.gamesLoading) return;
      this.gamesLoading = true;
      try {
        const res = await fetchNexusGames({
          count: 40,
          offset: 0,
          sort: 'downloads'
        });
        this.gamesList = res.games || [];
        if (this.enableAutoTranslate) {
          this.autoTranslateGameNames(this.gamesList);
        }
      } catch (e) {
        console.warn('[MayflyIndex] 动态加载游戏列表异常:', e);
      } finally {
        this.gamesLoading = false;
        if (typeof callback === 'function') callback();
      }
    },

    /**
     * 滚动触底分页动态加载更多游戏
     */
    async loadMoreGames() {
      if (this.gamesLoading) return;
      this.gamesLoading = true;
      try {
        const res = await fetchNexusGames({
          count: 30,
          offset: this.gamesList.length,
          sort: 'downloads'
        });
        if (res.games && res.games.length > 0) {
          this.gamesList = [...this.gamesList, ...res.games];
          if (this.enableAutoTranslate) {
            this.autoTranslateGameNames(res.games);
          }
        }
      } catch (e) {
        console.warn('[MayflyIndex] 加载更多游戏异常:', e);
      } finally {
        this.gamesLoading = false;
      }
    },

    /**
     * 从 Nexus 官方 GraphQL 动态抓取模组列表 (对标图 2)
     */
    async loadMods() {
      if (this.loading) return;
      this.loading = true;
      this.page = 1;

      try {
        const result = await fetchNexusMods({
          page: 1,
          pageSize: this.pageSize,
          sort: this.currentSort === 'favorites' ? 'downloads' : this.currentSort,
          searchText: (this.searchText || '').trim(),
          gameDomain: this.selectedGameDomain || '',
          categoryName: this.selectedCategory || ''
        });

        this.modList = result.items || [];
        this.totalCount = result.totalCount || 0;
        this.hasMore = result.hasMore;

        if (result.dynamicCategories && result.dynamicCategories.length > 0) {
          this.dynamicCategories = result.dynamicCategories;
        }

        if (this.enableAutoTranslate) {
          this.autoTranslateItems(result.items);
        }
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
     * 上拉加载更多模组
     */
    async loadMoreMods() {
      if (this.loadingMore || !this.hasMore) return;
      this.loadingMore = true;
      const nextPage = this.page + 1;

      try {
        const result = await fetchNexusMods({
          page: nextPage,
          pageSize: this.pageSize,
          sort: this.currentSort === 'favorites' ? 'downloads' : this.currentSort,
          searchText: (this.searchText || '').trim(),
          gameDomain: this.selectedGameDomain || '',
          categoryName: this.selectedCategory || ''
        });

        this.modList = [...this.modList, ...(result.items || [])];
        this.page = nextPage;
        this.hasMore = result.hasMore;

        if (this.enableAutoTranslate) {
          this.autoTranslateItems(result.items);
        }
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

    /**
     * 切换排序维度或进入心愿单模式 (对标图 2 选项卡)
     */
    changeSort(sortType) {
      if (this.currentSort === sortType) return;
      this.currentSort = sortType;
      if (sortType === 'favorites') {
        this.refreshFavorites();
        return;
      }
      this.resetAndLoad();
    },

    /**
     * 确认搜索
     */
    onSearchConfirm() {
      this.currentView = 'mods';
      this.resetAndLoad();
    },

    /**
     * 清空搜索词
     */
    clearSearch() {
      this.searchText = '';
      this.resetAndLoad();
    },

    // ------------------------------------------------------------------------
    // 收藏与心愿单
    // ------------------------------------------------------------------------

    refreshFavorites() {
      this.favoritesList = getFavorites();
      const map = {};
      this.favoritesList.forEach((item) => {
        map[item.id] = true;
      });
      this.favoriteIdMap = map;
    },

    toggleCardFavorite(item) {
      if (!item || !item.id) return;
      // 补齐游戏元数据，杜绝无归属模组导致跨游戏乱跑
      if ((!item.game || !item.game.domainName) && this.selectedGameDomain) {
        item.game = item.game || {};
        item.game.domainName = this.selectedGameDomain;
        item.game.name = this.selectedGameName || this.selectedGameDomain;
      }
      const nextStatus = toggleFavorite(item);
      this.refreshFavorites();
      uni.showToast({
        title: nextStatus ? '已加入装机心愿单' : '已移出心愿单',
        icon: 'none'
      });
    },

    exportFavoritesList() {
      const list = this.filteredFavoritesList;
      if (list.length === 0) return;
      const text = formatFavoritesShareText(list);
      uni.setClipboardData({
        data: text,
        success: () => {
          uni.showToast({
            title: '心愿单口令已复制到剪贴板',
            icon: 'success'
          });
        }
      });
    },

    async batchPushFavorites() {
      const targetList = this.filteredFavoritesList;
      if (this.isBatchPushing || targetList.length === 0) return;
      this.isBatchPushing = true;
      let okCount = 0;
      for (const mod of targetList) {
        try {
          const res = await pushModToDesktop(mod, this.desktopConfig);
          if (res.success) {
            okCount++;
            this.pushedIdMap[mod.id] = true;
          }
        } catch (e) {
          console.warn('[MayflyIndex] 批量推送异常:', e);
        }
      }
      this.isBatchPushing = false;
      uni.showModal({
        title: '批量推送完成',
        content: `成功投递 ${okCount} / ${targetList.length} 个模组到电脑端 Mayfly。`,
        showCancel: false
      });
      this.refreshHistory();
    },

    // ------------------------------------------------------------------------
    // 详情跳转与电脑远程安装推送
    // ------------------------------------------------------------------------

    /**
     * 跳转至模组全景图鉴详情页
     */
    openDetail(item) {
      if (!item || !item.id) return;
      try {
        uni.setStorageSync('mayfly_active_mod_cache', item);
      } catch (e) {}

      const encoded = encodeURIComponent(JSON.stringify(item));
      const modId = item.modId || item.id;
      const gameId = item.game?.id || '';
      const domain = item.game?.domainName || '';
      uni.navigateTo({
        url: `/pages/detail/detail?payload=${encoded}&modData=${encoded}&modId=${modId}&gameId=${gameId}&gameDomain=${domain}`
      });
    },

    /**
     * 快捷一键推送到电脑端 Mayfly 安装
     */
    async quickPushToDesktop(item) {
      if (!item || !item.id) return;
      this.pushingModId = item.id;

      uni.showLoading({
        title: '正在投递信令...'
      });

      try {
        const res = await pushModToDesktop(item, this.desktopConfig);
        uni.hideLoading();

        if (res.success) {
          this.pushedIdMap[item.id] = true;
          this.refreshHistory();
          uni.showToast({
            title: '已成功推送到电脑 Mayfly 安装！',
            icon: 'success',
            duration: 2500
          });
        } else {
          uni.showModal({
            title: '推送未完成',
            content: res.message || '电脑端连接超时，请确认电脑已开启 Mayfly 并连接同一局域网。',
            confirmText: '去配对',
            cancelText: '取消',
            success: (mRes) => {
              if (mRes.confirm) {
                this.openDeviceModal();
              }
            }
          });
        }
      } catch (err) {
        uni.hideLoading();
        uni.showToast({
          title: '推送异常: ' + (err.message || '未知错误'),
          icon: 'none'
        });
      } finally {
        this.pushingModId = null;
      }
    },

    // ------------------------------------------------------------------------
    // 智能双语图鉴 (全自动无缝中文本地化)
    // ------------------------------------------------------------------------

    /**
     * 获取游戏专区展示标题 (优先友好中文名，降级为翻译名，兜底英文全名)
     */
    getGameDisplayTitle(game) {
      if (!game) return '';
      if (game.zhName && game.zhName !== game.name) return game.zhName;
      if (this.zhGameNameMap[game.id]) return this.zhGameNameMap[game.id];
      if (game.shortZhName && game.shortZhName !== game.name) return game.shortZhName;
      return game.name;
    },

    /**
     * 获取分类的友好中文显示名称
     */
    getCategoryDisplayName(category) {
      if (!category) return '';
      if (this.enableAutoTranslate) {
        if (this.zhCategoryMap[category]) return this.zhCategoryMap[category];
        const mapped = getCategoryZhName(category);
        if (mapped && mapped !== category) return mapped;
      }
      return category;
    },

    /**
     * 动态分类胶囊显示的中文与统计标签
     */
    getCategoryPillLabel(cat) {
      if (!cat || !cat.name) return '';
      const countStr = this.formatCount(cat.count);
      if (this.enableAutoTranslate) {
        const zh = getCategoryZhName(cat.name);
        if (zh && zh !== cat.name) {
          return `${zh} (${countStr})`;
        }
      }
      return `${cat.name} (${countStr})`;
    },

    /**
     * 模组卡片简介摘要展示文本 (优先中文翻译，兜底原版英文)
     */
    getModDisplaySummary(item) {
      if (!item) return '';
      if (this.enableAutoTranslate && this.zhSummaryMap[item.id]) {
        return this.zhSummaryMap[item.id];
      }
      return item.summary || '暂无简介说明';
    },

    /**
     * 开关智能中文图鉴
     */
    async toggleAutoTranslate() {
      this.enableAutoTranslate = !this.enableAutoTranslate;
      if (this.enableAutoTranslate) {
        uni.showToast({
          title: '已开启智能中文图鉴',
          icon: 'none'
        });
        await this.autoTranslateItems(this.modList);
        await this.autoTranslateGameNames(this.gamesList);
      } else {
        uni.showToast({
          title: '已切换为英文原版',
          icon: 'none'
        });
      }
    },

    /**
     * 后台静默为新发现的游戏动态翻译中文名称
     */
    async autoTranslateGameNames(games) {
      if (!Array.isArray(games) || games.length === 0) return;
      const unmapped = games.filter(
        (g) => (!g.zhName || g.zhName === g.name) && !this.zhGameNameMap[g.id]
      );
      if (unmapped.length === 0) return;

      try {
        const names = unmapped.map((g) => g.name);
        const map = await batchTranslateToZh(names);
        const nextMap = { ...this.zhGameNameMap };
        unmapped.forEach((g) => {
          if (map.has(g.name)) {
            nextMap[g.id] = map.get(g.name);
          }
        });
        this.zhGameNameMap = nextMap;
      } catch (e) {
        console.warn('[MayflyIndex] 游戏名动态翻译异常:', e);
      }
    },

    /**
     * 批量自动并发翻译当前模组列表的标题、摘要与分类
     */
    async autoTranslateItems(items) {
      if (!Array.isArray(items) || items.length === 0) return;
      try {
        const { zhTitleMap, zhSummaryMap, zhCategoryMap } = await batchTranslateModList(items);
        this.zhTitleMap = { ...this.zhTitleMap, ...zhTitleMap };
        this.zhSummaryMap = { ...this.zhSummaryMap, ...zhSummaryMap };
        this.zhCategoryMap = { ...this.zhCategoryMap, ...zhCategoryMap };
      } catch (e) {
        console.warn('[MayflyIndex] 模组自动翻译异常:', e);
      }
    },

    /**
     * 仅翻译标题 (兼容旧调用)
     */
    async translateCurrentTitles(items) {
      await this.autoTranslateItems(items);
    },

    // ------------------------------------------------------------------------
    // 设备配对与抽屉快测
    // ------------------------------------------------------------------------

    initDesktopConfig() {
      this.desktopConfig = getDesktopConfig();
    },

    openDeviceModal() {
      this.deviceForm = {
        host: this.desktopConfig.host,
        port: this.desktopConfig.port,
        deviceToken: this.desktopConfig.deviceToken
      };
      this.deviceModalVisible = true;
    },

    closeDeviceModal() {
      this.deviceModalVisible = false;
    },

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
          content: '请确认电脑端 Mayfly 是否已启动，并确保手机与电脑连接同一 WiFi。',
          showCancel: false
        });
        this.desktopConfig.connected = false;
      }
    },

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

    async runQuickTest() {
      if (!this.desktopConfig.host) {
        uni.showToast({
          title: '请先在配对设置中填写电脑 IP',
          icon: 'none'
        });
        return;
      }
      uni.showLoading({ title: '测试连接中...' });
      const ok = await testDesktopConnection(this.desktopConfig.host, this.desktopConfig.port);
      uni.hideLoading();
      this.desktopConfig.connected = ok;
      saveDesktopConfig(this.desktopConfig);
      uni.showToast({
        title: ok ? '电脑连接成功' : '电脑未响应，请检查 WiFi',
        icon: ok ? 'success' : 'none'
      });
    },

    handleScanCodePair() {
      // #ifdef MP-WEIXIN || APP-PLUS || MP-ALIPAY
      uni.scanCode({
        scanType: ['qrCode'],
        success: (res) => {
          const raw = res.result || '';
          this.parseAndApplyPairCode(raw);
        },
        fail: () => {
          uni.showToast({
            title: '扫码取消或未识别二维码',
            icon: 'none'
          });
        }
      });
      // #endif

      // #ifdef H5
      uni.showModal({
        title: 'H5 浏览器环境提示',
        content: '网页端可通过上方直接手动输入电脑 IP、端口与 Token 完成配对。',
        showCancel: false
      });
      // #endif
    },

    async parseAndApplyPairCode(rawText) {
      try {
        let host = '';
        let port = 9876;
        let token = '';

        if (rawText.startsWith('mayfly://pair')) {
          const query = rawText.split('?')[1] || '';
          const params = new URLSearchParams(query);
          host = params.get('host') || '';
          port = Number(params.get('port')) || 9876;
          token = params.get('token') || '';
        } else if (rawText.startsWith('http://') || rawText.startsWith('https://')) {
          const urlMatch = rawText.match(/^https?:\/\/([^:/]+)(?::(\d+))?.*?[?&](?:token|pin)=([^&]+)/i);
          if (urlMatch) {
            host = urlMatch[1];
            port = Number(urlMatch[2]) || 28888;
            token = decodeURIComponent(urlMatch[3] || '');
          } else {
            const simpleUrl = rawText.match(/^https?:\/\/([^:/]+)(?::(\d+))?/i);
            if (simpleUrl) {
              host = simpleUrl[1];
              port = Number(simpleUrl[2]) || 28888;
            }
          }
        }

        if (host) {
          this.deviceForm.host = host;
          this.deviceForm.port = port;
          if (token) this.deviceForm.deviceToken = token;
          await this.runTestConnection();
          if (this.desktopConfig.connected) {
            this.saveDeviceSettings();
          }
        }
      } catch (e) {
        console.warn('[MayflyIndex] 解析二维码失败:', e);
      }
    },

    // ------------------------------------------------------------------------
    // 推送历史与剪贴板接力
    // ------------------------------------------------------------------------

    refreshHistory() {
      this.historyList = getPushHistory();
    },

    openHistoryModal() {
      this.refreshHistory();
      this.historyModalVisible = true;
    },

    closeHistoryModal() {
      this.historyModalVisible = false;
    },

    handleClearHistory() {
      uni.showModal({
        title: '提示',
        content: '确定清空所有推送历史任务记录吗？',
        success: (res) => {
          if (res.confirm) {
            clearPushHistory();
            this.refreshHistory();
          }
        }
      });
    },

    async rePushItem(item) {
      if (!item) return;
      uni.showLoading({ title: '重新推送中...' });
      const res = await pushModToDesktop(
        {
          id: item.modId,
          modId: item.modId,
          title: item.title,
          game: { domainName: item.gameDomain, name: item.gameName }
        },
        this.desktopConfig
      );
      uni.hideLoading();
      if (res.success) {
        uni.showToast({ title: '重推成功！', icon: 'success' });
        this.refreshHistory();
      } else {
        uni.showToast({ title: res.message || '重推失败', icon: 'none' });
      }
    },

    checkClipboardModShare() {
      uni.getClipboardData({
        success: (res) => {
          const content = res.data;
          if (!content || content === this.lastHandledClipboard) return;
          const parsed = parseShareClipboard(content);
          if (parsed && parsed.modId) {
            this.lastHandledClipboard = content;
            uni.showModal({
              title: '发现 Mayfly 装机口令',
              content: `是否打开模组【${parsed.title || 'Nexus Mod #' + parsed.modId}】？`,
              confirmText: '立即打开',
              success: (mRes) => {
                if (mRes.confirm) {
                  this.openDetail({
                    id: parsed.modId,
                    modId: parsed.modId,
                    title: parsed.title,
                    game: { domainName: parsed.gameDomain, name: parsed.gameDomain }
                  });
                }
              }
            });
          }
        }
      });
    },

    // ------------------------------------------------------------------------
    // 工具辅助方法
    // ------------------------------------------------------------------------

    formatCount(num) {
      const val = Number(num) || 0;
      if (val >= 1000000000) {
        return (val / 1000000000).toFixed(1).replace(/\.0$/, '') + 'b';
      }
      if (val >= 1000000) {
        return (val / 1000000).toFixed(1).replace(/\.0$/, '') + 'm';
      }
      if (val >= 1000) {
        return (val / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
      }
      return String(val);
    },

    formatHistoryTime(timestamp) {
      if (!timestamp) return '';
      const d = new Date(timestamp);
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const h = String(d.getHours()).padStart(2, '0');
      const min = String(d.getMinutes()).padStart(2, '0');
      return `${m}-${day} ${h}:${min}`;
    }
  }
};
</script>

<style scoped>
/* ============================================================================ */
/* 样式体系：100% 对标 NexusMods 官方移动端纯粹暗黑风格 (Screenshot 1 & 2) */
/* ============================================================================ */

.nexusPage {
  min-height: 100vh;
  background-color: #121212;
  color: #e5e7eb;
  padding: 0 0 60rpx 0;
  box-sizing: border-box;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}

/* ---------------------------------------------------------------------------- */
/* 区域 1：Nexus 官方顶栏 (☰ + ❖ + 🔍 + 👤) */
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
  gap: 12rpx;
  cursor: pointer;
}

.nexusLogoBox {
  width: 60rpx;
  height: 60rpx;
  background-color: #da6b17; /* Nexus 经典橙色底标 */
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nexusLogoGlyph {
  font-size: 34rpx;
  color: #ffffff; /* 纯白徽标 */
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
/* 区域 1.5：平滑展开的搜索栏 */
/* ---------------------------------------------------------------------------- */
.searchExpandSection {
  padding: 16rpx 24rpx 10rpx;
  background-color: #161616;
  border-bottom: 1rpx solid #232323;
}

.searchBarBox {
  display: flex;
  align-items: center;
  background: #1f2125;
  border: 1rpx solid #373b43;
  border-radius: 12rpx;
  padding: 14rpx 20rpx;
}

.searchIcon {
  font-size: 28rpx;
  margin-right: 12rpx;
}

.searchInput {
  flex: 1;
  font-size: 26rpx;
  color: #ffffff;
}

.searchPlaceholder {
  color: #6b7280;
  font-size: 24rpx;
}

.clearIcon {
  font-size: 28rpx;
  color: #9ca3af;
  padding: 4rpx;
}

/* ---------------------------------------------------------------------------- */
/* 区域 2：主副视角导航 (Mods 与 Games) */
/* ---------------------------------------------------------------------------- */
.nexusNavSegment {
  display: flex;
  background-color: #141517;
  border-bottom: 1rpx solid #232323;
}

.segmentTab {
  flex: 1;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  border-bottom: 4rpx solid transparent;
  transition: all 0.2s ease;
  cursor: pointer;
}

.segmentTab.active {
  border-bottom-color: #da6b17;
  background: rgba(218, 107, 23, 0.08);
}

.segmentIcon {
  font-size: 28rpx;
}

.segmentText {
  font-size: 26rpx;
  font-weight: 700;
  color: #9ca3af;
}

.segmentTab.active .segmentText {
  color: #ffffff;
}

/* ---------------------------------------------------------------------------- */
/* 区域 2A：Games 视角 (100% 对标图 1 双列竖版海报) */
/* ---------------------------------------------------------------------------- */
.gamesContainer {
  padding: 24rpx;
}

.gamesHeaderRow {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.gamesHeaderLeft {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.gamesIcon {
  font-size: 32rpx;
  color: #ffffff;
}

.gamesTitle {
  font-size: 36rpx;
  font-weight: 800;
  color: #ffffff;
}

.gamesViewAllLink {
  font-size: 24rpx;
  font-weight: 700;
  color: #ffffff;
  text-decoration: underline;
  cursor: pointer;
}

.gamesGrid {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 24rpx 0;
}

.gamePosterCard {
  width: 48.2%;
  display: flex;
  flex-direction: column;
  cursor: pointer;
}

.gameCoverBox {
  position: relative;
  width: 100%;
  height: 440rpx;
  border-radius: 12rpx;
  overflow: hidden;
  background-color: #1b1b1b;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.5);
}

.gameCoverImg {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.gameBookmarkBadge {
  position: absolute;
  top: 14rpx;
  right: 14rpx;
  width: 50rpx;
  height: 50rpx;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
}

.gameBookmarkBadge.selected {
  background: rgba(218, 107, 23, 0.95);
}

.bookmarkIcon {
  font-size: 20rpx;
  font-weight: 800;
  color: #ffffff;
}

.gameTitleText {
  font-size: 26rpx;
  font-weight: 700;
  color: #ffffff;
  margin-top: 14rpx;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.gameOriginalNameText {
  font-size: 20rpx;
  color: #8c8c8c;
  margin-top: 4rpx;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.gameStatsRow {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-top: 8rpx;
}

.statMetricItem {
  display: flex;
  align-items: center;
  gap: 6rpx;
}

.statGlyph {
  font-size: 20rpx;
  color: #8c8c8c;
}

.statMetricVal {
  font-size: 20rpx;
  color: #8c8c8c;
  font-weight: 600;
}

/* ---------------------------------------------------------------------------- */
/* 区域 3B：Mods 视角 (100% 对标图 2) */
/* ---------------------------------------------------------------------------- */
.modsContainer {
  padding: 24rpx;
}

.activeGameNavRow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20rpx;
  background-color: #191c22;
  border: 1rpx solid #282d38;
  border-radius: 12rpx;
  padding: 16rpx 20rpx;
}

.activeGameLeftBox {
  display: flex;
  align-items: center;
  gap: 16rpx;
  flex: 1;
  overflow: hidden;
}

.activeGameMiniThumb {
  width: 56rpx;
  height: 56rpx;
  border-radius: 8rpx;
  background-color: #2a2e38;
  flex-shrink: 0;
}

.activeGameTitleWrap {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.activeGameTitleText {
  font-size: 26rpx;
  font-weight: 700;
  color: #ffffff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.activeGameOriginalText {
  font-size: 20rpx;
  color: #9ca3af;
  margin-top: 2rpx;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.clearGamePillBtn {
  display: flex;
  align-items: center;
  gap: 8rpx;
  background-color: rgba(218, 107, 23, 0.15);
  border: 1rpx solid rgba(218, 107, 23, 0.4);
  border-radius: 20rpx;
  padding: 8rpx 18rpx;
  cursor: pointer;
  flex-shrink: 0;
}

.clearGamePillIcon {
  font-size: 22rpx;
  color: #da6b17;
  font-weight: 800;
}

.clearGamePillText {
  font-size: 22rpx;
  color: #da6b17;
  font-weight: 700;
}

.globalModeIcon {
  font-size: 32rpx;
  margin-right: 4rpx;
}

.pickGamePillBtn {
  background-color: #242832;
  border: 1rpx solid #373b43;
  border-radius: 20rpx;
  padding: 8rpx 18rpx;
  cursor: pointer;
}

.pickGamePillText {
  font-size: 22rpx;
  color: #9ca3af;
  font-weight: 600;
}

/* N网官方实时动态分类胶囊栏 */
.categoryPillsScroll {
  width: 100%;
  white-space: nowrap;
  margin-bottom: 20rpx;
}

.categoryPillsList {
  display: inline-flex;
  gap: 12rpx;
  padding: 4rpx 0;
}

.catPill {
  display: inline-flex;
  align-items: center;
  background-color: #1a1c22;
  border: 1rpx solid #2c313d;
  border-radius: 8rpx;
  padding: 10rpx 20rpx;
  white-space: nowrap;
  flex-shrink: 0;
  cursor: pointer;
  transition: all 0.2s ease;
}

.catPill.active {
  background-color: #da6b17;
  border-color: #da6b17;
}

.catPillText {
  font-size: 22rpx;
  font-weight: 600;
  color: #9ca3af;
}

.catPill.active .catPillText {
  color: #ffffff;
  font-weight: 700;
}

/* Header Row: 🔷 Mods   View all (对标图 2) */
.modsHeaderRow {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.modsHeaderLeft {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.modsIcon {
  font-size: 32rpx;
  color: #ffffff;
}

.modsTitle {
  font-size: 36rpx;
  font-weight: 800;
  color: #ffffff;
}

.modsViewAllLink {
  font-size: 24rpx;
  font-weight: 700;
  color: #ffffff;
  text-decoration: underline;
  cursor: pointer;
}

/* Filter Pills: ☀ New | ⟳ Updated | 📈 Trending | ★ Popular (对标图 2) */
.filterPillsScroll {
  width: 100%;
  white-space: nowrap;
  margin-bottom: 20rpx;
}

.filterPillsList {
  display: inline-flex;
  gap: 16rpx;
  padding: 4rpx 0;
}

.filterPill {
  display: inline-flex;
  align-items: center;
  gap: 10rpx;
  background-color: #1f2125;
  border: 1rpx solid #373b43;
  border-radius: 40rpx;
  padding: 14rpx 32rpx;
  white-space: nowrap;
  flex-shrink: 0;
  cursor: pointer;
  transition: all 0.2s ease;
}

.filterPill.active {
  background-color: #ffffff;
  border-color: #ffffff;
}

.pillIcon {
  font-size: 24rpx;
  color: #ffffff;
}

.filterPill.active .pillIcon {
  color: #121212;
}

.pillLabel {
  font-size: 24rpx;
  font-weight: 700;
  color: #ffffff;
}

.filterPill.active .pillLabel {
  color: #121212;
  font-weight: 800;
}

/* Time Filter Dropdown: All time ↕ (对标图 2) */
.timeFilterRow {
  margin-bottom: 24rpx;
}

.timeSelectBox {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #1f2125;
  border: 1rpx solid #373b43;
  border-radius: 12rpx;
  padding: 16rpx 24rpx;
  box-sizing: border-box;
}

.timeSelectLabel {
  font-size: 24rpx;
  font-weight: 600;
  color: #ffffff;
}

.timeSelectArrow {
  font-size: 24rpx;
  color: #9ca3af;
}

/* 心愿单工具条 (支持按游戏切换过滤) */
.favBatchBar {
  background: #1f2125;
  border: 1rpx solid #da6b17;
  border-radius: 12rpx;
  padding: 20rpx;
  margin-bottom: 24rpx;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.favScopeRow {
  display: flex;
  align-items: center;
  gap: 14rpx;
  border-bottom: 1rpx dashed #353a46;
  padding-bottom: 16rpx;
  overflow-x: auto;
  white-space: nowrap;
}

.favScopePill {
  display: flex;
  align-items: center;
  background-color: #2a2e38;
  border: 1rpx solid #3c4250;
  border-radius: 20rpx;
  padding: 8rpx 20rpx;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.favScopePill.active {
  background-color: #da6b17;
  border-color: #da6b17;
}

.favScopeText {
  font-size: 22rpx;
  font-weight: 600;
  color: #d1d5db;
}

.favScopePill.active .favScopeText {
  color: #ffffff;
  font-weight: 700;
}

.favSummaryText {
  display: flex;
  flex-direction: column;
}

.favCountNum {
  font-size: 24rpx;
  font-weight: 700;
  color: #da6b17;
}

.favTipText {
  font-size: 20rpx;
  color: #9ca3af;
  margin-top: 4rpx;
}

.favBatchActions {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.favExportBtn {
  background-color: #2a2e37;
  border: none;
  border-radius: 8rpx;
  padding: 10rpx 18rpx;
  margin: 0;
  line-height: 1.4;
}

.favExportBtnText {
  font-size: 22rpx;
  color: #ffffff;
}

.favBatchPushBtn {
  background: #da6b17;
  color: #ffffff;
  border-radius: 8rpx;
  border: none;
  padding: 10rpx 20rpx;
  margin: 0;
  line-height: 1.4;
}

.favBatchBtnText {
  font-size: 22rpx;
  font-weight: 700;
}

/* 双列 Mod 卡片网格 (对标图 2) */
.modsGrid {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 24rpx 0;
}

.modCard {
  width: 48.2%;
  background-color: #1f2125;
  border: 1rpx solid #2d3139;
  border-radius: 12rpx;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.4);
}

.modCoverBox {
  position: relative;
  width: 100%;
  height: 200rpx;
  background-color: #121212;
}

.modCoverImg {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.modGameBadge {
  position: absolute;
  top: 10rpx;
  left: 10rpx;
  background: rgba(18, 18, 18, 0.85);
  border: 1rpx solid rgba(255, 255, 255, 0.15);
  border-radius: 6rpx;
  padding: 2rpx 10rpx;
  max-width: 65%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.modGameBadgeText {
  font-size: 18rpx;
  font-weight: 700;
  color: #da6b17;
  white-space: nowrap;
}

.modActionBtn {
  position: absolute;
  top: 10rpx;
  right: 10rpx;
  width: 44rpx;
  height: 44rpx;
  border-radius: 50%;
  background: rgba(18, 18, 18, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
}

.actionDotText {
  font-size: 22rpx;
  color: #ffffff;
}

.modBody {
  padding: 16rpx;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.modTitleText {
  font-size: 26rpx;
  font-weight: 700;
  color: #ffffff;
  line-height: 1.35;
  height: 70rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.modAuthorRow {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-top: 8rpx;
}

.authorGlyph {
  font-size: 20rpx;
}

.authorNameText {
  font-size: 22rpx;
  font-weight: 600;
  color: #d4a373; /* Nexus 暖金色 */
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.modCategoryText {
  font-size: 20rpx;
  color: #8c9099;
  margin-top: 6rpx;
}

.modTimeRow {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
  margin-top: 8rpx;
}

.timeCol {
  display: flex;
  align-items: center;
  gap: 6rpx;
}

.timeIcon {
  font-size: 18rpx;
  color: #6b7280;
}

.timeVal {
  font-size: 18rpx;
  color: #6b7280;
}

.modSummaryText {
  font-size: 20rpx;
  color: #9ca3af;
  line-height: 1.3;
  height: 52rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  margin-top: 10rpx;
}

.modFooterRow {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1rpx solid #2a2e37;
  padding-top: 14rpx;
  margin-top: 14rpx;
}

.modStatsLeft {
  display: flex;
  align-items: center;
  gap: 14rpx;
}

.footerMetric {
  font-size: 20rpx;
  color: #9ca3af;
}

.nexusPushBtn {
  background-color: #da6b17;
  border-radius: 8rpx;
  padding: 6rpx 16rpx;
  line-height: 1.4;
  margin: 0;
  border: none;
}

.nexusPushBtnText {
  font-size: 20rpx;
  font-weight: 700;
  color: #ffffff;
}

/* 加载与空结果 */
.loadingBox {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80rpx 0;
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

.loadingText {
  font-size: 24rpx;
  color: #9ca3af;
}

.emptyBox {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80rpx 0;
  gap: 16rpx;
}

.emptyIcon {
  font-size: 56rpx;
}

.emptyText {
  font-size: 24rpx;
  color: #9ca3af;
}

.retryBtn {
  background-color: #da6b17;
  color: #ffffff;
  border-radius: 8rpx;
  font-size: 22rpx;
  padding: 8rpx 24rpx;
  margin-top: 10rpx;
}

.bottomNotice {
  text-align: center;
  padding: 30rpx 0;
}

.bottomText {
  font-size: 22rpx;
  color: #6b7280;
}

/* ---------------------------------------------------------------------------- */
/* 区域 4：侧边滑出抽屉 (☰) */
/* ---------------------------------------------------------------------------- */
.drawerMask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  z-index: 999;
}

.drawerBody {
  width: 580rpx;
  height: 100%;
  background-color: #181a1e;
  border-right: 1rpx solid #2c2f38;
  padding: 40rpx 30rpx;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.drawerHeaderRow {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 24rpx;
  border-bottom: 1rpx solid #2c2f38;
}

.drawerBrandBox {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.drawerLogo {
  font-size: 38rpx;
  color: #da6b17;
}

.drawerBrandTitle {
  font-size: 30rpx;
  font-weight: 800;
  color: #ffffff;
}

.drawerCloseBtn {
  font-size: 32rpx;
  color: #9ca3af;
  padding: 8rpx;
  cursor: pointer;
}

/* 100% 对标图 2：当前选中游戏卡片 */
.drawerActiveGameCard {
  display: flex;
  align-items: center;
  gap: 16rpx;
  background-color: #20232a;
  border: 1rpx solid #323744;
  border-radius: 12rpx;
  padding: 16rpx;
  margin-top: 24rpx;
  margin-bottom: 10rpx;
}

.activeGameThumb {
  width: 72rpx;
  height: 72rpx;
  border-radius: 8rpx;
  background-color: #111215;
  flex-shrink: 0;
  object-fit: cover;
}

.activeGameMetaBox {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  cursor: pointer;
}

.activeGameNameText {
  font-size: 26rpx;
  font-weight: 700;
  color: #ffffff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.activeGameZhSubText {
  font-size: 20rpx;
  color: #da6b17;
  margin-top: 4rpx;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.clearActiveGameBtn {
  width: 44rpx;
  height: 44rpx;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
}

.clearActiveGameIcon {
  font-size: 22rpx;
  color: #ffffff;
  font-weight: 800;
}

/* 未选游戏时的全网状态卡片 */
.drawerNoGameCard {
  display: flex;
  align-items: center;
  gap: 16rpx;
  background-color: #1a1d24;
  border: 1rpx dashed #323744;
  border-radius: 12rpx;
  padding: 16rpx;
  margin-top: 24rpx;
  margin-bottom: 10rpx;
  cursor: pointer;
}

.noGameIconBox {
  width: 72rpx;
  height: 72rpx;
  border-radius: 8rpx;
  background-color: rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.noGameGlyph {
  font-size: 36rpx;
}

.noGameMetaBox {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.noGameMainText {
  font-size: 24rpx;
  font-weight: 700;
  color: #ffffff;
}

.noGameSubText {
  font-size: 20rpx;
  color: #9ca3af;
  margin-top: 4rpx;
}

.drawerPcCard {
  background-color: #121316;
  border: 1rpx solid #2c2f38;
  border-radius: 12rpx;
  padding: 20rpx;
  margin: 20rpx 0;
}

.pcCardTop {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pcCardTitle {
  font-size: 24rpx;
  font-weight: 700;
  color: #ffffff;
}

.pcStatusBadge {
  background-color: #374151;
  border-radius: 6rpx;
  padding: 2rpx 10rpx;
}

.pcStatusBadge.online {
  background-color: #065f46;
}

.pcStatusText {
  font-size: 18rpx;
  font-weight: 700;
  color: #ffffff;
}

.pcIpText {
  font-size: 20rpx;
  color: #9ca3af;
  margin-top: 8rpx;
}

.pcActionsRow {
  display: flex;
  gap: 12rpx;
  margin-top: 14rpx;
}

.pcActionBtn {
  flex: 1;
  background-color: #242832;
  border: 1rpx solid #373b43;
  border-radius: 8rpx;
  padding: 8rpx 0;
  margin: 0;
  line-height: 1.4;
}

.pcActionBtn.primary {
  background-color: #da6b17;
  border-color: #da6b17;
}

.pcActionBtn .btnText {
  font-size: 20rpx;
  color: #ffffff;
  font-weight: 600;
}

.drawerNavList {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  margin-top: 10rpx;
  flex: 1;
}

.drawerNavItem {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 22rpx 20rpx;
  border-radius: 10rpx;
  background-color: #1e2127;
  cursor: pointer;
}

.navItemLeft {
  display: flex;
  align-items: center;
  gap: 16rpx;
  flex: 1;
}

.navItemRight {
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.drawerNavItem .itemIcon {
  font-size: 28rpx;
}

.drawerNavItem .itemText {
  font-size: 24rpx;
  font-weight: 600;
  color: #e5e7eb;
}

.drawerNavArrow {
  font-size: 28rpx;
  color: #6b7280;
  font-weight: 600;
}

.currentTag {
  font-size: 18rpx;
  background-color: rgba(218, 107, 23, 0.2);
  color: #da6b17;
  border-radius: 6rpx;
  padding: 2rpx 8rpx;
  max-width: 140rpx;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.drawerNavItem .itemBadge {
  background-color: #da6b17;
  color: #ffffff;
  font-size: 18rpx;
  font-weight: 800;
  padding: 2rpx 10rpx;
  border-radius: 20rpx;
}

.drawerNavItem .itemSwitchTag {
  font-size: 20rpx;
  color: #9ca3af;
}

.drawerNavItem .itemSwitchTag.on {
  color: #10b981;
  font-weight: 700;
}

.drawerFooter {
  padding-top: 20rpx;
  border-top: 1rpx solid #2c2f38;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.footerVersion {
  font-size: 20rpx;
  color: #9ca3af;
}

.footerSub {
  font-size: 18rpx;
  color: #6b7280;
}

/* ---------------------------------------------------------------------------- */
/* 区域 5 & 6：设备弹窗与历史任务弹窗 */
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

.deviceModalContent,
.historyDrawerContent {
  width: 90%;
  max-width: 650rpx;
  background: #181a1e;
  border: 1rpx solid #2d3139;
  border-radius: 20rpx;
  padding: 32rpx;
  box-sizing: border-box;
}

.deviceModalHeader,
.drawerHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}

.modalTitle,
.drawerTitle {
  font-size: 30rpx;
  font-weight: 800;
  color: #ffffff;
}

.drawerSub {
  font-size: 20rpx;
  color: #9ca3af;
  margin-top: 4rpx;
}

.modalCloseBtn {
  font-size: 30rpx;
  color: #9ca3af;
  padding: 6rpx;
  cursor: pointer;
}

.scanCodeBtn {
  background: #242832;
  border: 1rpx solid #373b43;
  color: #ffffff;
  border-radius: 12rpx;
  font-size: 24rpx;
  padding: 16rpx 0;
  margin-bottom: 20rpx;
}

.scanCodeBtnText {
  color: #ffffff;
  font-weight: 600;
}

.formDividerRow {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin: 16rpx 0;
}

.dividerLine {
  flex: 1;
  height: 1rpx;
  background-color: #2c2f38;
}

.dividerText {
  font-size: 20rpx;
  color: #6b7280;
}

.formItem {
  margin-bottom: 18rpx;
}

.formLabel {
  font-size: 22rpx;
  color: #9ca3af;
  margin-bottom: 8rpx;
  display: block;
}

.formInput {
  background: #121316;
  border: 1rpx solid #2c2f38;
  border-radius: 10rpx;
  padding: 14rpx 18rpx;
  font-size: 24rpx;
  color: #ffffff;
}

.testConnBtn {
  background: #242832;
  border: 1rpx solid #373b43;
  color: #ffffff;
  border-radius: 10rpx;
  font-size: 24rpx;
  padding: 14rpx 0;
  margin-top: 14rpx;
}

.testBtnText {
  color: #ffffff;
}

.saveConfigBtn {
  background: #da6b17;
  color: #ffffff;
  border-radius: 10rpx;
  font-size: 24rpx;
  font-weight: 700;
  padding: 14rpx 0;
  margin-top: 14rpx;
}

.saveBtnText {
  color: #ffffff;
}

.historyScrollList {
  max-height: 600rpx;
}

.historyEmpty {
  text-align: center;
  padding: 60rpx 0;
}

.emptyTipIcon {
  font-size: 48rpx;
}

.emptyTipText {
  font-size: 22rpx;
  color: #9ca3af;
  margin-top: 8rpx;
  display: block;
}

.historyItem {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 16rpx 0;
  border-bottom: 1rpx solid #252830;
}

.historyThumb {
  width: 90rpx;
  height: 90rpx;
  border-radius: 8rpx;
  object-fit: cover;
  background-color: #121212;
}

.historyBody {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.historyTitle {
  font-size: 24rpx;
  font-weight: 700;
  color: #ffffff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.historyMeta {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.historyGame,
.historyChannelTag,
.historyTime {
  font-size: 18rpx;
  color: #9ca3af;
}

.rePushBtn {
  background: #da6b17;
  color: #ffffff;
  border-radius: 6rpx;
  padding: 6rpx 16rpx;
  margin: 0;
  line-height: 1.4;
  border: none;
}

.rePushText {
  font-size: 20rpx;
  font-weight: 700;
  color: #ffffff;
}

.clearHistoryText {
  font-size: 22rpx;
  color: #ef4444;
  margin-right: 16rpx;
  cursor: pointer;
}
</style>
