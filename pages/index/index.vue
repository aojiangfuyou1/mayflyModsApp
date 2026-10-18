<template>
  <view class="nexusPage">
    <!-- ==================================================================== -->
    <!-- 区域 1：Games 视角 (N网官方全库游戏流，默认按总下载量从高到低排序)    -->
    <!-- ==================================================================== -->
    <view class="gamesContainer" v-if="currentView === 'games'">
      <!-- 区域 1A：顶部吸顶控制台 (状态栏安全区 + 搜索胶囊 + 双 Tab 胶囊) -->
      <view class="gamesStickyHeader">
        <!-- 现代高级一体化搜索胶囊舱 -->
        <view class="modernSearchCapsule">
          <NexusIcon name="search" size="32rpx" color="#da6b17" style="margin-right: 14rpx; flex-shrink: 0;" />
          <input
            class="modernSearchInput"
            v-model="gameSearchText"
            placeholder="搜索全网 5500+ 款游戏 (支持中英文双语)..."
            placeholder-class="modernSearchPlaceholder"
            confirm-type="search"
          />
          <view v-if="gameSearchText" class="modernClearBtn" @click="gameSearchText = ''">
            <text class="modernClearIcon">✕</text>
          </view>
        </view>

        <!-- 模式切换与快捷流入口 -->
        <view class="gamesFilterNavRow">
          <view class="gamesTabPills">
            <view
              class="gameTabPill"
              :class="{ active: gamesActiveTab === 'all' }"
              @click="gamesActiveTab = 'all'"
            >
              <NexusIcon name="fire" size="26rpx" :color="gamesActiveTab === 'all' ? '#da6b17' : '#94a3b8'" />
              <text class="gameTabPillText">全网热门榜</text>
              <text class="gameTabCountBadge">{{ gamesTotalCount ? `${gamesTotalCount}+` : '5500+' }}</text>
            </view>

            <view
              class="gameTabPill"
              :class="{ active: gamesActiveTab === 'my' }"
              @click="gamesActiveTab = 'my'"
            >
              <NexusIcon name="heart-fill" size="26rpx" :color="gamesActiveTab === 'my' ? '#da6b17' : '#94a3b8'" />
              <text class="gameTabPillText">我的收藏</text>
              <text class="gameTabCountBadge" v-if="myGamesList.length > 0">{{ myGamesList.length }}</text>
            </view>
          </view>

          <!-- 右侧跳转至全网模组瀑布流 -->
          <view class="gamesStreamLinkBtn" @click="switchView('mods')">
            <text class="gamesStreamLinkText">精选模组流 ›</text>
          </view>
        </view>
      </view>

      <!-- 区域 1B：内容展示区 -->
      <view class="gamesMainContent">
        <!-- ------------------------------------------------------------------ -->
        <!-- 视窗 A：全网热门榜 (默认核心视窗，100% 对标 N网首屏，按总下载量从高到低) -->
        <!-- ------------------------------------------------------------------ -->
        <view class="allGamesSection" v-if="gamesActiveTab === 'all'">
          <!-- 我的收藏快捷横向滑轨 (仅当有收藏且未处于搜索时展示，方便极速进入) -->
          <view class="myFavoritesShelf" v-if="myGamesList.length > 0 && !gameSearchText">
            <view class="shelfHeaderRow">
              <view class="shelfHeaderLeft">
                <text class="shelfBadgeIcon">🔖</text>
                <text class="shelfTitle">我的收藏快捷通道</text>
                <text class="shelfCount">({{ myGamesList.length }} 款已标记)</text>
              </view>
              <text class="shelfViewAllBtn" @click="gamesActiveTab = 'my'">查看全部 ›</text>
            </view>
            <scroll-view class="shelfScrollView" scroll-x enable-flex>
              <view
                class="shelfItemCard"
                v-for="game in sortedMyGames"
                :key="game.id || game.domain"
                @click="selectGameAndJumpMods(game)"
              >
                <view class="shelfCoverBox">
                  <image class="shelfCoverImg" :src="game.tileUrl" mode="aspectFill" lazy-load />
                </view>
                <text class="shelfGameTitle">{{ getGameDisplayTitle(game) }}</text>
              </view>
            </scroll-view>
          </view>

          <!-- 热门榜单标题栏 -->
          <view class="gamesHeaderRow">
            <view class="gamesHeaderLeft">
              <text class="sectionBadgeIcon">🔥</text>
              <text class="gamesTitle">全网热门游戏</text>
              <text class="gamesCountSub">(按总下载量从高到低排序)</text>
            </view>
            <text class="gamesMetaCountSub">已载入 {{ filteredAllGames.length }} 款</text>
          </view>

          <!-- 加载动画 (初次载入) -->
          <view class="loadingBox" v-if="gamesLoading && gamesList.length === 0">
            <view class="loadingSpinner"></view>
            <text class="loadingText">正在从 NexusMods 动态抓取热门游戏数据...</text>
          </view>

          <!-- 全网游戏海报网格 (对标图 2：Skyrim SE, Fallout 4, Skyrim, Cyberpunk...) -->
          <view class="gamesGrid" v-else>
            <view
              class="gamePosterCard"
              v-for="game in filteredAllGames"
              :key="game.id || game.domain"
              @click="selectGameAndJumpMods(game)"
            >
              <!-- 竖版封面 (2:3比例) + 动态书签角标 -->
              <view class="gameCoverBox">
                <image
                  class="gameCoverImg"
                  :src="game.tileUrl"
                  mode="aspectFill"
                  lazy-load
                />
                <view
                  class="gameBookmarkBadge"
                  :class="{ isBookmarked: isGameBookmarked(game) }"
                  :title="isGameBookmarked(game) ? '已在我的收藏' : '点击加入收藏'"
                  @click.stop="handleToggleBookmark(game)"
                >
                  <text class="bookmarkIcon">🔖</text>
                </view>
              </view>

              <!-- 游戏主标题 (中文名优先) -->
              <text class="gameTitleText">{{ getGameDisplayTitle(game) }}</text>
              <!-- 英文原名副标 -->
              <text class="gameOriginalNameText" v-if="getGameDisplayTitle(game) !== game.name">{{ game.name }}</text>

              <!-- 统计指标行 (◆ 模组数  ▤ 关注数  ⬇ 下载量) -->
              <view class="gameStatsRow">
                <view class="statMetricItem">
                  <text class="statGlyph">◆</text>
                  <text class="statMetricVal">{{ game.stats ? game.stats.mods : formatCount(game.modCount) }}</text>
                </view>
                <view class="statMetricItem">
                  <text class="statGlyph">▤</text>
                  <text class="statMetricVal">{{ game.stats ? game.stats.tracking : formatCount(game.collectionCount) }}</text>
                </view>
                <view class="statMetricItem">
                  <text class="statGlyph">⬇</text>
                  <text class="statMetricVal">{{ game.stats ? game.stats.downloads : formatCount(game.downloadCount) }}</text>
                </view>
              </view>
            </view>
          </view>

          <!-- 触底加载更多状态 -->
          <view class="bottomNotice" v-if="gamesList.length > 0 && !gameSearchText">
            <text class="bottomText" v-if="gamesLoading">正在加载更多热门游戏...</text>
            <text class="bottomText" v-else-if="gamesList.length >= gamesTotalCount">已载入全部 {{ gamesTotalCount }} 款热门游戏</text>
          </view>

          <!-- 空态提示：全网未检索到 -->
          <view class="emptyBox" v-if="!gamesLoading && filteredAllGames.length === 0">
            <text class="emptyEmoji">🎮</text>
            <text class="emptyTitle">未找到匹配游戏</text>
            <text class="emptySub">换个中英文关键词再试试吧</text>
          </view>
        </view>

        <!-- ------------------------------------------------------------------ -->
        <!-- 视窗 B：我的收藏 (按总热度/下载量排序展示用户标记的游戏)            -->
        <!-- ------------------------------------------------------------------ -->
        <view class="myGamesSection" v-else>
          <!-- 头部标题行 -->
          <view class="gamesHeaderRow">
            <view class="gamesHeaderLeft">
              <text class="sectionBadgeIcon">🔖</text>
              <text class="gamesTitle">我的收藏游戏</text>
              <text class="gamesCountSub">({{ filteredMyGames.length }} 款)</text>
            </view>
            <view class="syncCloudBtn" v-if="nexusUser" @click="handleSyncCloud">
              <text class="syncCloudText">{{ syncingCloud ? '同步中...' : '☁️ 云端同步' }}</text>
            </view>
          </view>

          <!-- 我的收藏海报网格 (同样采用精美 2 列海报，大作优先，无虚线占位) -->
          <view class="gamesGrid" v-if="filteredMyGames.length > 0">
            <view
              class="gamePosterCard"
              v-for="game in filteredMyGames"
              :key="game.id || game.domain"
              @click="selectGameAndJumpMods(game)"
            >
              <!-- 竖版封面 (2:3比例) + 专属已标记金光书签 (点击移出) -->
              <view class="gameCoverBox">
                <image
                  class="gameCoverImg"
                  :src="game.tileUrl"
                  mode="aspectFill"
                  lazy-load
                />
                <view
                  class="gameBookmarkBadge isBookmarked"
                  title="已加入收藏，点击移出"
                  @click.stop="promptRemoveBookmark(game)"
                >
                  <text class="bookmarkIcon">🔖</text>
                </view>
              </view>

              <!-- 游戏主标题 (中文名优先) -->
              <text class="gameTitleText">{{ getGameDisplayTitle(game) }}</text>
              <!-- 英文原名副标 -->
              <text class="gameOriginalNameText" v-if="getGameDisplayTitle(game) !== game.name">{{ game.name }}</text>

              <!-- 统计指标行 -->
              <view class="gameStatsRow">
                <view class="statMetricItem">
                  <text class="statGlyph">◆</text>
                  <text class="statMetricVal">{{ game.stats ? game.stats.mods : formatCount(game.modCount) }}</text>
                </view>
                <view class="statMetricItem">
                  <text class="statGlyph">▤</text>
                  <text class="statMetricVal">{{ game.stats ? game.stats.tracking : formatCount(game.collectionCount) }}</text>
                </view>
                <view class="statMetricItem">
                  <text class="statGlyph">⬇</text>
                  <text class="statMetricVal">{{ game.stats ? game.stats.downloads : formatCount(game.downloadCount) }}</text>
                </view>
              </view>
            </view>
          </view>

          <!-- 空态提示：未标记任何游戏 -->
          <view class="emptyBox" v-else-if="!gameSearchText">
            <text class="emptyEmoji">📭</text>
            <text class="emptyTitle">暂无收藏游戏</text>
            <text class="emptySub">在「全网热门榜」中点击游戏右上角 🔖 书签即可加入收藏</text>
            <button class="retryBtn" @click="gamesActiveTab = 'all'">去发现热门游戏 ›</button>
          </view>

          <!-- 空态提示：搜索无匹配 -->
          <view class="emptyBox" v-else>
            <text class="emptyEmoji">🔍</text>
            <text class="emptyTitle">未找到匹配的收藏游戏</text>
            <text class="emptySub">可清除搜索词，或切换至「全网热门榜」查找</text>
          </view>
        </view>
      </view>
    </view>

    <!-- ==================================================================== -->
    <!-- 区域 2B：Mods 视角 (专属游戏模组流 / 全网精选模组流)                 -->
    <!-- ==================================================================== -->
    <view class="modsContainer" v-else>
      <!-- ==================================================================== -->
      <!-- 区域 2B-1：顶部吸顶固定控制台 (返回游戏库 + 搜索框 + 筛选下拉)        -->
      <!-- ==================================================================== -->
      <view class="stickySearchBarSection">
        <!-- 区域 2B-0：返回游戏库快捷横幅 (支持一键返回游戏库 / 切换游戏) -->
        <view class="backToGamesBar" @click="returnToGamesView">
          <view class="backToGamesLeft">
            <NexusIcon name="chevron-left" size="26rpx" color="#da6b17" />
            <text class="backToGamesText">游戏库</text>
            <text class="backToGamesDivider">·</text>
            <text class="backToGamesCurrentTitle">🎮 {{ activeGameDisplayName || '全网精选模组' }}</text>
          </view>
          <view class="backToGamesRight">
            <text class="switchGameBtnText">切换游戏 ›</text>
          </view>
        </view>

        <!-- 现代高级一体化搜索胶囊舱 (单层无嵌套、微光毛玻璃高定设计) -->
        <view class="modernSearchCapsule">
          <NexusIcon name="search" size="32rpx" color="#da6b17" style="margin-right: 14rpx; flex-shrink: 0;" />
          <input
            class="modernSearchInput"
            v-model="searchInputText"
            placeholder="搜索模组 (输入中文自动转英文)"
            placeholder-class="modernSearchPlaceholder"
            confirm-type="search"
            @confirm="handleTriggerSearch"
          />
          <view v-if="searchInputText" class="modernClearBtn" @click="handleClearSearch">
            <text class="modernClearIcon">✕</text>
          </view>
          <view class="modernSearchBtn" :class="{ loading: isTranslatingSearch }" @click="handleTriggerSearch">
            <text class="modernSearchBtnText">{{ isTranslatingSearch ? '转译中' : '搜索' }}</text>
          </view>
        </view>

        <!-- 智能转译结果与纠偏微胶囊 (当输入中文且已自动转译为英文时展示) -->
        <view class="searchTranslateFeedbackPill" v-if="actualSearchQuery && hasChineseQuery">
          <view class="translateFeedbackLeft">
            <text class="translateTagBadge">自动转译</text>
            <text class="translateOriginalText">“{{ originalChineseQuery }}”</text>
            <text class="translateArrowIcon">→</text>
            <text class="translateTargetText">“{{ actualSearchQuery }}”</text>
          </view>
          <view class="translateActionBtns">
            <view class="translateActionBtn editBtn" @click="handleEditEnglishQuery">
              <text class="translateActionBtnText">✏️ 纠偏</text>
            </view>
            <view class="translateActionBtn literalBtn" @click="handleUseLiteralSearch">
              <text class="translateActionBtnText">原词</text>
            </view>
          </view>
        </view>

        <!-- ==================================================================== -->
        <!-- 统一三联下拉筛选栏 (排序方式 | 模组分类 | 时间范围，告别繁琐横向滑动) -->
        <!-- ==================================================================== -->
        <view class="filtersDropdownBar">
          <!-- 1. 排序下拉 (最新发布 / 最近更新 / 飙升排行 / 热门下载 / 心愿单) -->
          <view class="filterCol">
            <NexusSelect
              :options="sortOptions"
              :value="currentSort"
              title="选择排序方式"
              mode="dropdown"
              block
              dropdown-width="280rpx"
              @change="onSortSelectChange"
            >
              <view class="filterSelectPill" :class="{ active: currentSort !== 'createdAt' }">
                <text class="filterSelectLabel">{{ currentSortLabel }}</text>
                <text class="filterSelectArrow">▾</text>
              </view>
            </NexusSelect>
          </view>

          <!-- 2. N网官方实时分类下拉 (动态聚合，告别两排横滑) -->
          <view class="filterCol">
            <NexusSelect
              :options="categoryOptions"
              :value="selectedCategory"
              title="选择模组分类"
              mode="dropdown"
              block
              align="center"
              dropdown-width="380rpx"
              @change="onCategorySelectChange"
            >
              <view class="filterSelectPill" :class="{ active: Boolean(selectedCategory) }">
                <text class="filterSelectLabel">{{ currentCategoryLabel }}</text>
                <text class="filterSelectArrow">▾</text>
              </view>
            </NexusSelect>
          </view>

          <!-- 3. 时间范围下拉 (全部时间 / 过去 24 小时 / 过去 7 天 / 过去 30 天 等) -->
          <view class="filterCol">
            <NexusSelect
              :options="currentTimeFilterOptions"
              :value="timeFilterIndex"
              title="选择时间范围"
              mode="dropdown"
              block
              align="right"
              dropdown-width="260rpx"
              @change="onTimeFilterChange"
            >
              <view class="filterSelectPill" :class="{ active: timeFilterIndex > 0 }">
                <text class="filterSelectLabel">{{ currentTimeFilterOptions[timeFilterIndex] }}</text>
                <text class="filterSelectArrow">▾</text>
              </view>
            </NexusSelect>
          </view>
        </view>
        <!-- 吸顶控制台结束 -->
      </view>

      <!-- 收藏模式批量操作工具条 (支持按当前选中游戏过滤，杜绝跨游戏乱跑) -->
      <view class="favBatchBar" v-if="currentSort === 'favorites'">
        <!-- 范围切换胶囊 (当选定了具体游戏时展示) -->
        <view class="favScopeRow" v-if="selectedGameDomain">
          <view
            class="favScopePill"
            :class="{ active: favoritesScope === 'current' }"
            @click="favoritesScope = 'current'"
          >
            <NexusIcon name="gamepad" size="24rpx" color="#da6b17" style="margin-right: 6rpx;" />
            <text class="favScopeText">{{ activeGameDisplayName }} ({{ currentGameFavoritesList.length }})</text>
          </view>
          <view
            class="favScopePill"
            :class="{ active: favoritesScope === 'all' }"
            @click="favoritesScope = 'all'"
          >
            <NexusIcon name="globe" size="24rpx" color="#818cf8" style="margin-right: 6rpx;" />
            <text class="favScopeText">全部游戏 ({{ favoritesList.length }})</text>
          </view>
        </view>

        <view class="favSummaryText">
          <view style="display: flex; align-items: center; gap: 6rpx;">
            <NexusIcon name="heart-fill" size="26rpx" color="#ef4444" />
            <text class="favCountNum">已收藏 {{ filteredFavoritesList.length }} 个模组</text>
          </view>
          <text class="favTipText">{{ selectedGameDomain && favoritesScope === 'current' ? `当前仅展示 ${activeGameDisplayName} 模组` : '展示全游戏综合收藏' }}</text>
        </view>
        <view class="favBatchActions" v-if="filteredFavoritesList.length > 0">
          <button class="favExportBtn" @click="exportFavoritesList">
            <NexusIcon name="share" size="22rpx" color="#cbd5e1" style="margin-right: 6rpx;" />
            <text class="favExportBtnText">导出</text>
          </button>
          <button
            class="favBatchPushBtn"
            :disabled="isBatchPushing"
            @click="batchPushFavorites"
          >
            <text class="favBatchBtnText">
              {{ isBatchPushing ? '投递中...' : `批量推送 (${filteredFavoritesList.length})` }}
            </text>
          </button>
        </view>
      </view>

      <!-- 双列模组卡片网格 (100% 对标图 2，已组件化) -->
      <view class="modsGrid" v-if="streamModList.length > 0">
        <ModCard
          v-for="item in streamModList"
          :key="item.id"
          :item="item"
          :selected-game-domain="selectedGameDomain"
          :enable-auto-translate="enableAutoTranslate"
          :zh-title="zhTitleMap[item.id]"
          :zh-summary="zhSummaryMap[item.id]"
          :is-favorited="Boolean(favoriteIdMap[item.id])"
          :is-pushing="pushingModId === item.id"
          @click="openDetail(item)"
          @favorite="toggleCardFavorite(item)"
          @push="quickPushToDesktop(item)"
        />
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
    <!-- 区域 4：全局沉浸式侧边抽屉菜单 (已组件化)                           -->
    <!-- ==================================================================== -->
    <NexusDrawer
      :visible="drawerVisible"
      :nexus-user="nexusUser"
      :selected-game-domain="selectedGameDomain"
      :active-game-tile-url="activeGameTileUrl"
      :active-game-display-name="activeGameDisplayName"
      :active-game-original-name="activeGameOriginalName"
      :desktop-config="desktopConfig"
      :enable-auto-translate="enableAutoTranslate"
      :favorites-count="favoritesList.length"
      :history-count="historyList.length"
      @close="closeDrawer"
      @nav="handleDrawerNav"
      @clear-game="clearGameFilterAndBack"
      @toggle-translate="toggleAutoTranslate"
      @quick-test="runQuickTest"
    />

    <!-- ==================================================================== -->
    <!-- 区域 5：电脑端连接与配对设置弹窗 (已组件化)                         -->
    <!-- ==================================================================== -->
    <DevicePairModal
      :visible="deviceModalVisible"
      :config="desktopConfig"
      @close="closeDeviceModal"
      @saved="onDeviceConfigSaved"
    />

    <!-- ==================================================================== -->
    <!-- 区域 6：推送任务清单与历史记录抽屉 (已组件化)                       -->
    <!-- ==================================================================== -->
    <PushHistoryModal
      :visible="historyModalVisible"
      :history-list="historyList"
      @close="closeHistoryModal"
      @repush="rePushItem"
      @clear="handleClearHistory"
      @refresh="refreshHistory"
    />

    <!-- ==================================================================== -->
    <!-- 区域 7：NexusMods 官方账户中心与 API 授权弹窗 (已组件化)            -->
    <!-- ==================================================================== -->
    <NexusAuthModal
      :visible="nexusAuthModalVisible"
      :nexus-user="nexusUser"
      :desktop-config="desktopConfig"
      @close="closeNexusAuthModal"
      @login-success="onNexusLoginSuccess"
      @logout="onNexusLogout"
    />

    <!-- ==================================================================== -->
    <!-- 区域 8：全局手机 App 底部导航栏 (已组件化)                         -->
    <!-- ==================================================================== -->
    <NexusTabBar
      active-tab="home"
      :favorites-count="favoritesList.length"
      :history-count="historyList.length"
      :desktop-connected="desktopConfig && desktopConfig.connected"
      :nexus-user="nexusUser"
      @tab-refresh="handleTabBarHomeClick"
    />

    <!-- ==================================================================== -->
    <!-- 区域 9：自研暗黑对话框 / 确认弹窗组件 (完全替代原生白色 uni.showModal)-->
    <!-- ==================================================================== -->
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
// 脚本逻辑：首页 Nexus 动态数据流控制与交互
// ============================================================================
import {
  fetchNexusMods,
  fetchNexusGames,
  pushModToDesktop,
  getDesktopConfig,
  saveDesktopConfig,
  testDesktopConnection,
  getNexusUser,
  getNexusApiKey
} from '../../services/nexus.js';
import {
  batchTranslateToZh,
  getCategoryZhName,
  batchTranslateModList,
  translateZhToEn
} from '../../services/translate.js';
import { getPushHistory, clearPushHistory } from '../../services/history.js';
import { getFavorites, toggleFavorite, syncFavoritesFromNexus } from '../../services/favorites.js';
import {
  getMyGames,
  isGameBookmarked,
  toggleGameBookmark,
  fetchNexusFavouriteGames
} from '../../services/games.js';
import { formatFavoritesShareText } from '../../services/poster.js';
import NexusHeader from '../../components/NexusHeader.vue';
import NexusDrawer from '../../components/NexusDrawer.vue';
import ModCard from '../../components/ModCard.vue';
import DevicePairModal from '../../components/DevicePairModal.vue';
import PushHistoryModal from '../../components/PushHistoryModal.vue';
import NexusAuthModal from '../../components/NexusAuthModal.vue';
import NexusTabBar from '../../components/NexusTabBar.vue';
import NexusIcon from '../../components/NexusIcon.vue';
import NexusSelect from '../../components/NexusSelect.vue';
import NexusModal from '../../components/NexusModal.vue';

export default {
  components: {
    NexusHeader,
    NexusDrawer,
    ModCard,
    DevicePairModal,
    PushHistoryModal,
    NexusAuthModal,
    NexusTabBar,
    NexusIcon,
    NexusSelect,
    NexusModal
  },

  data() {
    return {
      // 我的游戏标记状态
      myGamesList: [],
      myGamesMap: {},
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
      // 当前主视角: 默认优先展示全部游戏专区 ('games')，点击后进入对应游戏模组流 ('mods')
      currentView: 'games',

      // 游戏库控制台与状态 (默认优先展示全网热门榜，从高到低排序)
      gamesActiveTab: 'all',
      gamesTotalCount: 5569,
      gameSearchText: '',
      syncingCloud: false,

      // 动态游戏列表数据 (100% 动态，来自 Nexus 官方 GraphQL，按总下载量降序)
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
      gameCategoriesCache: {}, // 缓存各游戏的全量官方分类集合，防止切换分类时分类条消失

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

      // 智能搜索与中英文自动转译控制 (输入中文自动转换为英文检索 N网)
      searchInputText: '',
      actualSearchQuery: '',
      originalChineseQuery: '',
      hasChineseQuery: false,
      isTranslatingSearch: false,
      quickKeywords: [
        { zh: '护甲', en: 'Armor' },
        { zh: '武器', en: 'Weapon' },
        { zh: '随从', en: 'Follower' },
        { zh: '发型', en: 'Hair' },
        { zh: '美化', en: 'Preset' },
        { zh: '动作', en: 'Animation' },
        { zh: '界面UI', en: 'UI' },
        { zh: '大修重制', en: 'Overhaul' }
      ],
      searchText: '',
      searchExpanded: false,

      // 侧边抽屉与弹窗状态
      drawerVisible: false,
      pushingModId: null,

      // 推送历史与任务清单 (弹窗已组件化)
      historyModalVisible: false,
      historyList: [],
      pushedIdMap: {},
      isBatchPushing: false,
      lastHandledClipboard: '',

      // 设备配对设置 (弹窗已组件化)
      deviceModalVisible: false,
      desktopConfig: {
        host: '10.204.160.22',
        port: 28888,
        deviceToken: '',
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
    },

    /**
     * 游戏元数据索引 Map，用于为「我的收藏」补齐真实热度指标与下载量
     */
    gamesMetaMap() {
      const map = Object.create(null);
      this.gamesList.forEach((g) => {
        if (!g) return;
        if (g.id) map[String(g.id)] = g;
        if (g.domain) map[String(g.domain).toLowerCase()] = g;
      });
      return map;
    },

    /**
     * 规范化并强化「我的收藏」游戏列表 (补充真实热度数据并按下载量从高到低排序)
     */
    sortedMyGames() {
      const list = this.myGamesList.map((g) => {
        const idKey = g.id ? String(g.id) : '';
        const domainKey = g.domain ? String(g.domain).toLowerCase() : '';
        const meta = this.gamesMetaMap[idKey] || this.gamesMetaMap[domainKey];
        if (meta) {
          return {
            ...g,
            modCount: meta.modCount || g.modCount,
            downloadCount: meta.downloadCount || g.downloadCount,
            collectionCount: meta.collectionCount || g.collectionCount,
            stats: {
              mods: meta.stats?.mods || (g.stats?.mods || this.formatCount(g.modCount)),
              tracking: meta.stats?.tracking || (g.stats?.tracking || this.formatCount(g.collectionCount)),
              downloads: meta.stats?.downloads || (g.stats?.downloads && g.stats.downloads !== '0' ? g.stats.downloads : this.formatCount(g.downloadCount))
            }
          };
        }
        return g;
      });

      // 强制按下载量从高到低降序排列，大作永远优先排在前面！
      return list.sort((a, b) => {
        const dlA = Number(a.downloadCount) || Number(a.modCount) || 0;
        const dlB = Number(b.downloadCount) || Number(b.modCount) || 0;
        return dlB - dlA;
      });
    },

    /**
     * 过滤后的「我的收藏」列表 (按热度从高到低排序，支持双语即时搜索)
     */
    filteredMyGames() {
      const source = this.sortedMyGames;
      if (!this.gameSearchText.trim()) return source;
      const kw = this.gameSearchText.trim().toLowerCase();
      return source.filter((g) => {
        const en = (g.name || '').toLowerCase();
        const zh = (this.zhGameNameMap[g.id] || g.zhName || '').toLowerCase();
        return en.includes(kw) || zh.includes(kw);
      });
    },

    /**
     * 过滤后的「全网热门游戏」列表 (100% N网全库数据，按总下载量从高到低排序)
     */
    filteredAllGames() {
      if (!this.gameSearchText.trim()) return this.gamesList;
      const kw = this.gameSearchText.trim().toLowerCase();
      return this.gamesList.filter((g) => {
        const en = (g.name || '').toLowerCase();
        const zh = (this.zhGameNameMap[g.id] || g.zhName || '').toLowerCase();
        return en.includes(kw) || zh.includes(kw);
      });
    },

    /**
     * 排序下拉选项列表
     */
    sortOptions() {
      const isZh = this.enableAutoTranslate;
      return [
        { label: isZh ? '最新发布' : 'New', value: 'createdAt', icon: 'sparkle' },
        { label: isZh ? '最近更新' : 'Updated', value: 'updatedAt', icon: 'refresh' },
        { label: isZh ? '飙升排行' : 'Trending', value: 'trending', icon: 'fire' },
        { label: isZh ? '热门下载' : 'Popular', value: 'downloads', icon: 'download' },
        {
          label: (isZh ? '我的收藏' : 'Favorites') + (this.favoritesCount > 0 ? ` (${this.favoritesCount})` : ''),
          value: 'favorites',
          icon: 'heart-fill'
        }
      ];
    },

    /**
     * 当前选中的排序文本展示
     */
    currentSortLabel() {
      const found = this.sortOptions.find((o) => o.value === this.currentSort);
      return found ? found.label : (this.enableAutoTranslate ? '最新发布' : 'New');
    },

    /**
     * 官方动态分类下拉选项列表
     */
    categoryOptions() {
      const isZh = this.enableAutoTranslate;
      const allLabel = isZh ? '全部分类' : 'All Categories';
      const list = [{ label: allLabel, value: '' }];

      if (Array.isArray(this.dynamicCategories)) {
        this.dynamicCategories.forEach((cat) => {
          if (!cat || !cat.name) return;
          const count = cat.count ? ` (${this.formatCount(cat.count)})` : '';
          const name = this.getCategoryPillTitle(cat) || cat.name;
          list.push({
            label: `${name}${count}`,
            value: cat.name
          });
        });
      }
      return list;
    },

    /**
     * 当前选中的分类文本展示
     */
    currentCategoryLabel() {
      if (!this.selectedCategory) {
        return this.enableAutoTranslate ? '全部分类' : 'All Categories';
      }
      const match = this.dynamicCategories.find((c) => c.name === this.selectedCategory);
      if (match) {
        return this.getCategoryPillTitle(match);
      }
      return this.selectedCategory;
    },

    /**
     * 当前时间筛选文案 (跟随智能翻译模式，杜绝硬编码英文)
     */
    currentTimeFilterOptions() {
      if (this.enableAutoTranslate) {
        return ['全部时间', '过去 24 小时', '过去 7 天', '过去 14 天', '过去 30 天', '过去 1 年'];
      }
      return ['All time', 'Last 24 hours', 'Last 7 days', 'Last 14 days', 'Last 30 days', '1 year'];
    }
  },

  onLoad(query) {
    this.initDesktopConfig();
    this.refreshHistory();
    this.refreshFavorites();
    this.refreshNexusUser();

    // 优先处理由独立专区页面 (如 games.vue) 或外部链接传入的游戏查询参数
    if (query && query.domain) {
      this.selectedGameDomain = query.domain;
      this.selectedGameName = query.name ? decodeURIComponent(query.name) : query.domain;
      this.selectedGameZhName = query.zhName ? decodeURIComponent(query.zhName) : this.selectedGameName;
      this.selectedGameTileUrl = query.tileUrl ? decodeURIComponent(query.tileUrl) : '';
      this.currentView = 'mods';
      this.favoritesScope = 'current';

      try {
        uni.setStorageSync('mayfly_active_game', {
          domain: query.domain,
          name: this.selectedGameName,
          zhName: this.selectedGameZhName,
          tileUrl: this.selectedGameTileUrl
        });
      } catch (e) {}
    } else if (query && query.view) {
      this.currentView = query.view;
    } else {
      // 方案 A 核心规范：默认打开首页即展示游戏库大厅 ('games')
      this.currentView = 'games';
      // 预先恢复上次激活游戏元数据备用，但保持在游戏库大厅
      try {
        const savedGame = uni.getStorageSync('mayfly_active_game');
        if (savedGame && savedGame.domain) {
          this.selectedGameDomain = savedGame.domain;
          this.selectedGameName = savedGame.name || '';
          this.selectedGameZhName = savedGame.zhName || '';
          this.selectedGameTileUrl = savedGame.tileUrl || '';
        }
      } catch (e) {}
    }

    // 首次进入动态加载游戏列表与模组列表
    this.refreshMyGames();
    this.loadGames();
    this.loadMods();

    // 跨页面监听我的游戏标记变动
    uni.$on('mayfly-games-updated', () => {
      this.refreshMyGames();
    });

    // 若用户已绑定 N网 Key，静默在后台同步一次云端收藏游戏
    if (this.nexusApiKey) {
      this.silentSyncCloud();
    }
  },

  onShow() {
    this.refreshHistory();
    this.refreshFavorites();
    this.refreshMyGames();
    this.refreshNexusUser();
    if (this.nexusApiKey) {
      syncFavoritesFromNexus(this.nexusApiKey).then((list) => {
        if (Array.isArray(list)) {
          this.refreshFavorites();
        }
      }).catch(() => {});
    }
  },

  onPullDownRefresh() {
    if (this.currentView === 'games') {
      if (this.gamesActiveTab === 'my') {
        this.refreshMyGames();
        uni.stopPullDownRefresh();
      } else {
        this.loadAllGames(() => {
          uni.stopPullDownRefresh();
        });
      }
      return;
    }
    if (this.currentSort === 'favorites') {
      if (this.nexusApiKey) {
        syncFavoritesFromNexus(this.nexusApiKey).then(() => {
          this.refreshFavorites();
          uni.stopPullDownRefresh();
        }).catch(() => {
          this.refreshFavorites();
          uni.stopPullDownRefresh();
        });
      } else {
        this.refreshFavorites();
        uni.stopPullDownRefresh();
      }
      return;
    }
    this.resetAndLoad(() => {
      uni.stopPullDownRefresh();
    });
  },

  onReachBottom() {
    if (this.currentView === 'games') {
      if (this.gamesActiveTab === 'all') {
        this.loadMoreGames();
      }
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
     * 处理全局抽屉菜单路由导航 (支持下钻独立子页面与弹窗)
     */
    handleDrawerNav(target) {
      this.drawerVisible = false;
      if (target === 'home') {
        this.currentView = 'games';
      } else if (target === 'games') {
        this.currentView = 'games';
      } else if (target === 'favorites') {
        uni.reLaunch({
          url: '/pages/favorites/favorites'
        });
      } else if (target === 'history') {
        uni.reLaunch({
          url: '/pages/history/history'
        });
      } else if (target === 'profile') {
        uni.reLaunch({
          url: '/pages/profile/profile'
        });
      } else if (target === 'auth') {
        this.openNexusAuthModal();
      } else if (target === 'device') {
        this.openDeviceModal();
      }
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

      // 预先载入已缓存的当前游戏全量分类，避免界面分类闪烁或空白
      const cached = this.gameCategoriesCache[game.domain];
      if (cached && cached.length > 0) {
        this.dynamicCategories = cached;
      }

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

      const cached = this.gameCategoriesCache['all_games'];
      this.dynamicCategories = cached && cached.length > 0 ? cached : [];

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
     * 排序下拉选项响应
     */
    onSortSelectChange(e) {
      const targetVal = e.value !== undefined ? e.value : (this.sortOptions[e.index]?.value || 'createdAt');
      this.changeSort(targetVal);
    },

    /**
     * 分类下拉选项响应
     */
    onCategorySelectChange(e) {
      const targetCat = e.value !== undefined ? e.value : (this.categoryOptions[e.index]?.value ?? '');
      this.selectCategory(targetCat);
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
          searchText: (this.actualSearchQuery || this.searchInputText || this.searchText || '').trim(),
          gameDomain: this.selectedGameDomain || '',
          categoryName: this.selectedCategory || ''
        });

        this.modList = result.items || [];
        this.totalCount = result.totalCount || 0;
        this.hasMore = result.hasMore;

        if (result.dynamicCategories && result.dynamicCategories.length > 0) {
          const domainKey = this.selectedGameDomain || 'all_games';
          if (!this.selectedCategory) {
            // 当前处于无分类全量模式，返回的是该游戏官方完整全量分类集合
            this.gameCategoriesCache[domainKey] = result.dynamicCategories;
            this.dynamicCategories = result.dynamicCategories;
          } else {
            // 当前处于具体某个分类下，GraphQL facets 仅返回当前分类，必须保留全量分类集合，杜绝分类条消失
            if (this.gameCategoriesCache[domainKey] && this.gameCategoriesCache[domainKey].length > 0) {
              this.dynamicCategories = this.gameCategoriesCache[domainKey];
            } else {
              const map = new Map(this.dynamicCategories.map((c) => [c.name, c]));
              result.dynamicCategories.forEach((c) => map.set(c.name, c));
              this.dynamicCategories = Array.from(map.values());
            }
          }

          if (this.enableAutoTranslate) {
            this.autoTranslateCategories(this.dynamicCategories);
          }
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
          searchText: (this.actualSearchQuery || this.searchInputText || this.searchText || '').trim(),
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
        if (this.nexusApiKey) {
          syncFavoritesFromNexus(this.nexusApiKey).then((list) => {
            if (Array.isArray(list)) {
              this.refreshFavorites();
            }
          }).catch(() => {});
        }
        return;
      }
      this.resetAndLoad();
    },

    // ------------------------------------------------------------------------
    // 智能搜索与中英文自动转译 (对标用户需求：输入中文自动转英文检索 + 支持手动纠偏自定义)
    // ------------------------------------------------------------------------

    /**
     * 触发智能检索 (支持中文自动转译为英文关键词，精确打穿 N网 原生英文库)
     */
    async handleTriggerSearch() {
      this.currentView = 'mods';
      const raw = (this.searchInputText || '').trim();
      if (!raw) {
        this.actualSearchQuery = '';
        this.originalChineseQuery = '';
        this.hasChineseQuery = false;
        this.resetAndLoad();
        return;
      }

      this.originalChineseQuery = raw;

      // 智能探测：若含有中文字符，自动转译为英文检索词
      if (/[\u4e00-\u9fa5]/.test(raw)) {
        this.hasChineseQuery = true;
        this.isTranslatingSearch = true;
        try {
          const en = await translateZhToEn(raw);
          this.actualSearchQuery = en || raw;
        } catch (e) {
          this.actualSearchQuery = raw;
        } finally {
          this.isTranslatingSearch = false;
        }
      } else {
        // 纯英文/拼音/代号直接检索
        this.hasChineseQuery = false;
        this.actualSearchQuery = raw;
      }

      this.resetAndLoad();
    },

    /**
     * 用户点击「✏️ 自定义英文」纠偏：允许用户直接在输入框编辑精准英文
     */
    handleEditEnglishQuery() {
      if (this.actualSearchQuery) {
        this.searchInputText = this.actualSearchQuery;
        this.hasChineseQuery = false;
        uni.showToast({
          title: '已填入英文，可直接修改',
          icon: 'none'
        });
      }
    },

    /**
     * 用户点击「原词直搜」：绕过转译直接以原文检索
     */
    handleUseLiteralSearch() {
      if (this.originalChineseQuery) {
        this.actualSearchQuery = this.originalChineseQuery;
        this.hasChineseQuery = false;
        uni.showToast({
          title: '已切换为原词检索',
          icon: 'none'
        });
        this.resetAndLoad();
      }
    },

    /**
     * 清空搜索词
     */
    handleClearSearch() {
      this.searchInputText = '';
      this.actualSearchQuery = '';
      this.originalChineseQuery = '';
      this.hasChineseQuery = false;
      this.searchText = '';
      this.resetAndLoad();
    },

    /**
     * 点击常用模组高频快捷词 (秒转对应英文极速检索)
     */
    handleSelectQuickKeyword(kw) {
      if (!kw) return;
      this.searchInputText = kw.zh;
      this.originalChineseQuery = kw.zh;
      this.actualSearchQuery = kw.en.toLowerCase();
      this.hasChineseQuery = true;
      this.currentView = 'mods';
      this.resetAndLoad();
    },

    onSearchConfirm() {
      this.handleTriggerSearch();
    },

    clearSearch() {
      this.handleClearSearch();
    },

    // ========================================================================
    // 游戏专区与「我的游戏」书签标记 (100% 对标 N网 My Games 与书签功能)
    // ========================================================================

    /**
     * 本地高速读取「我的游戏」列表并更新 O(1) 检索 Map
     */
    refreshMyGames() {
      const list = getMyGames();
      this.myGamesList = list;
      const map = {};
      list.forEach((g) => {
        if (g.id) map[String(g.id)] = true;
        if (g.domain) map[String(g.domain).toLowerCase()] = true;
      });
      this.myGamesMap = map;
      if (this.enableAutoTranslate) {
        this.autoTranslateGameNames(list);
      }
    },

    /**
     * 切换到「发现全网游戏」板块并按需加载数据
     */
    switchToAllGamesTab() {
      this.gamesActiveTab = 'all';
      if (this.allGamesList.length === 0) {
        this.loadAllGames();
      }
    },

    /**
     * 从 Nexus 官方 GraphQL 动态加载热门游戏库
     */
    async loadAllGames(callback) {
      this.loadingAllGames = true;
      try {
        const res = await fetchNexusGames();
        const list = Array.isArray(res) ? res : (res && res.games ? res.games : []);
        this.allGamesList = list;
        this.allGamesTotalCount = res && res.totalCount ? res.totalCount : list.length;
        if (this.enableAutoTranslate) {
          this.autoTranslateGameNames(list);
        }
      } catch (err) {
        uni.showToast({ title: '加载全网游戏库失败', icon: 'none' });
      } finally {
        this.loadingAllGames = false;
        if (typeof callback === 'function') callback();
      }
    },

    /**
     * 静默后台与 NexusMods 官方 Favourite Games 云端同步
     */
    async silentSyncCloud() {
      if (!this.nexusApiKey) return;
      try {
        const cloudGames = await fetchNexusFavouriteGames(this.nexusApiKey);
        if (Array.isArray(cloudGames) && cloudGames.length > 0) {
          this.myGamesList = cloudGames;
          this.refreshMyGames();
        }
      } catch (e) {
        console.warn('[MayflyIndex] 静默同步云端收藏游戏异常:', e);
      }
    },

    /**
     * 手动触发云端同步「我的游戏」
     */
    async handleSyncCloud() {
      if (!this.nexusApiKey) {
        this.openNexusAuthModal();
        return;
      }
      this.syncingCloud = true;
      try {
        const list = await fetchNexusFavouriteGames(this.nexusApiKey);
        if (Array.isArray(list)) {
          this.myGamesList = list;
          this.refreshMyGames();
          uni.showToast({
            title: `已与 N网 云端同步 (${list.length} 款)`,
            icon: 'success'
          });
        }
      } catch (err) {
        uni.showToast({ title: '云端同步失败，请检查网络', icon: 'none' });
      } finally {
        this.syncingCloud = false;
      }
    },

    /**
     * 展开 / 收起游戏搜索框
     */
    toggleGameSearch() {
      this.gameSearchExpanded = !this.gameSearchExpanded;
    },

    /**
     * 判断指定游戏是否已被标记为「我的游戏」
     */
    isGameBookmarked(game) {
      if (!game) return false;
      const idKey = game.id ? String(game.id) : '';
      const domainKey = game.domain ? String(game.domain).toLowerCase() : '';
      return !!(this.myGamesMap[idKey] || this.myGamesMap[domainKey]);
    },

    /**
     * 点击书签图标切换标记状态
     */
    async handleToggleBookmark(game) {
      if (!game) return;
      const isCurrentlyBookmarked = this.isGameBookmarked(game);
      if (this.gamesActiveTab === 'my' && isCurrentlyBookmarked) {
        this.promptRemoveBookmark(game);
        return;
      }
      const res = await toggleGameBookmark(game, this.nexusApiKey);
      this.refreshMyGames();
      uni.showToast({
        title: res.message,
        icon: res.bookmarked ? 'success' : 'none'
      });
    },

    /**
     * 兼容旧版命名
     */
    async handleToggleGameBookmark(game) {
      await this.handleToggleBookmark(game);
    },

    /**
     * 唤起移出「我的游戏」确认弹窗
     */
    promptRemoveBookmark(game) {
      if (!game) return;
      const title = this.getGameDisplayTitle(game);
      this.confirmModal = {
        visible: true,
        title: '移出「我的游戏」',
        content: `确定将《${title}》从「我的游戏」中移除吗？移除后仍可在「发现全网游戏」中重新添加。`,
        type: 'warning',
        icon: 'alert',
        confirmText: '确认移出',
        cancelText: '保留',
        showCancel: true,
        onConfirm: async () => {
          const res = await toggleGameBookmark(game, this.nexusApiKey);
          this.refreshMyGames();
          uni.showToast({
            title: '已移出「我的游戏」',
            icon: 'none'
          });
        }
      };
    },

    /**
     * 一键从模组流返回游戏库大厅
     */
    returnToGamesView() {
      this.currentView = 'games';
      uni.pageScrollTo({ scrollTop: 0, duration: 200 });
    },

    /**
     * 底部 TabBar 点击首页事件：若在模组流则一键返回游戏库，若在游戏库则触发刷新
     */
    handleTabBarHomeClick() {
      if (this.currentView === 'mods') {
        this.returnToGamesView();
      } else {
        if (this.gamesActiveTab === 'my') {
          this.refreshMyGames();
          uni.showToast({ title: '已刷新我的游戏', icon: 'none' });
        } else {
          this.loadAllGames(() => {
            uni.showToast({ title: '已刷新全网游戏', icon: 'none' });
          });
        }
      }
    },

    // ------------------------------------------------------------------------
    // 收藏与心愿单 (全面对接 NexusMods 官方云端追踪 Tracked Mods)
    // ------------------------------------------------------------------------

    refreshFavorites() {
      this.favoritesList = getFavorites();
      const map = {};
      this.favoritesList.forEach((item) => {
        map[item.id] = true;
      });
      this.favoriteIdMap = map;
    },

    /**
     * 自研暗黑对话框操作确认响应
     */
    onConfirmModalAction() {
      this.confirmModal.visible = false;
      if (typeof this.confirmModal.onConfirm === 'function') {
        this.confirmModal.onConfirm();
      }
    },

    async toggleCardFavorite(item) {
      if (!item || !item.id) return;
      // 补齐游戏元数据，杜绝无归属模组导致跨游戏乱跑
      if ((!item.game || !item.game.domainName) && this.selectedGameDomain) {
        item.game = item.game || {};
        item.game.domainName = this.selectedGameDomain;
        item.game.name = this.selectedGameName || this.selectedGameDomain;
      }
      const res = await toggleFavorite(item);
      if (res && res.needLogin) {
        this.confirmModal = {
          visible: true,
          title: '需要登录 NexusMods',
          content: '收藏模组将直接与您的 N网 官方账号“追踪历史 (Tracked Mods)”实时云端同步。请先登录您的 N网 账号。',
          type: 'info',
          icon: 'user',
          confirmText: '去登录',
          cancelText: '取消',
          showCancel: true,
          onConfirm: () => {
            this.openNexusAuthModal();
          }
        };
        return;
      }
      this.refreshFavorites();
      uni.showToast({
        title: res.message || (res.favorited ? '已加入 N网追踪' : '已取消 N网追踪'),
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
            title: '收藏清单口令已复制到剪贴板',
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
          const pushItem = {
            ...mod,
            zhTitle: this.zhTitleMap[mod.id] || mod.zhTitle || ''
          };
          const res = await pushModToDesktop(pushItem, this.desktopConfig);
          if (res.success) {
            okCount++;
            this.pushedIdMap[mod.id] = true;
          }
        } catch (e) {
          console.warn('[MayflyIndex] 批量推送异常:', e);
        }
      }
      this.isBatchPushing = false;
      this.confirmModal = {
        visible: true,
        title: '批量推送完成',
        content: `成功投递 ${okCount} / ${targetList.length} 个模组到电脑端 Mayfly。`,
        type: 'success',
        icon: 'check',
        confirmText: '太棒了',
        cancelText: '',
        showCancel: false,
        onConfirm: null
      };
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
     * 快捷一键推送到电脑端 Mayfly 安装 (附带中文翻译标题)
     */
    async quickPushToDesktop(item) {
      if (!item || !item.id) return;
      this.pushingModId = item.id;

      uni.showLoading({
        title: '正在投递信令...'
      });

      try {
        const pushItem = {
          ...item,
          zhTitle: this.zhTitleMap[item.id] || item.zhTitle || ''
        };
        const res = await pushModToDesktop(pushItem, this.desktopConfig);
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
          this.confirmModal = {
            visible: true,
            title: '推送未完成',
            content: res.message || '电脑端连接超时，请确认电脑已开启 Mayfly 并连接同一局域网。',
            type: 'warning',
            icon: 'warning',
            confirmText: '去配对',
            cancelText: '取消',
            showCancel: true,
            onConfirm: () => {
              this.openDeviceModal();
            }
          };
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
     * 获取分类胶囊显示的纯净友好中文标题 (不含数量，数量通过独立胶囊徽标展示)
     */
    getCategoryPillTitle(cat) {
      if (!cat || !cat.name) return '';
      if (this.enableAutoTranslate) {
        if (this.zhCategoryMap[cat.name]) {
          return this.zhCategoryMap[cat.name];
        }
        const zh = getCategoryZhName(cat.name);
        if (zh && zh !== cat.name) {
          return zh;
        }
      }
      return cat.name;
    },

    /**
     * 动态分类胶囊显示的中文与统计标签
     */
    getCategoryPillLabel(cat) {
      if (!cat || !cat.name) return '';
      const countStr = this.formatCount(cat.count);
      if (this.enableAutoTranslate) {
        if (this.zhCategoryMap[cat.name]) {
          return `${this.zhCategoryMap[cat.name]} (${countStr})`;
        }
        const zh = getCategoryZhName(cat.name);
        if (zh && zh !== cat.name) {
          return `${zh} (${countStr})`;
        }
      }
      return `${cat.name} (${countStr})`;
    },

    /**
     * 后台静默为 N网 动态返回的未识别官方分类并发翻译
     */
    async autoTranslateCategories(categories) {
      if (!Array.isArray(categories) || categories.length === 0) return;
      const unmapped = [];
      categories.forEach((c) => {
        if (!c.name) return;
        const zh = getCategoryZhName(c.name);
        if (zh && zh !== c.name) {
          this.zhCategoryMap[c.name] = zh;
        } else if (!this.zhCategoryMap[c.name]) {
          unmapped.push(c.name);
        }
      });

      if (unmapped.length === 0) return;

      try {
        const transMap = await batchTranslateToZh(unmapped);
        const nextMap = { ...this.zhCategoryMap };
        unmapped.forEach((name) => {
          if (transMap.has(name)) {
            nextMap[name] = transMap.get(name);
          }
        });
        this.zhCategoryMap = nextMap;
      } catch (e) {
        console.warn('[MayflyIndex] 动态分类并发翻译提示:', e);
      }
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
        await this.autoTranslateCategories(this.dynamicCategories);
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
      this.deviceModalVisible = true;
    },

    closeDeviceModal() {
      this.deviceModalVisible = false;
    },

    onDeviceConfigSaved(newConfig) {
      this.desktopConfig = { ...newConfig };
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
      this.confirmModal = {
        visible: true,
        title: '清空历史任务？',
        content: '确定清空所有推送历史任务记录吗？不会影响电脑端已下载落盘的文件。',
        type: 'danger',
        icon: 'trash',
        confirmText: '清空',
        cancelText: '取消',
        showCancel: true,
        onConfirm: () => {
          clearPushHistory();
          this.refreshHistory();
        }
      };
    },

    async rePushItem(item) {
      if (!item) return;
      uni.showLoading({ title: '重新推送中...' });
      const res = await pushModToDesktop(
        {
          id: item.modId || item.id,
          modId: item.modId || item.id,
          title: item.title,
          zhTitle: item.zhTitle || '',
          coverImageUrl: item.coverImageUrl || '',
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
    },

    // ------------------------------------------------------------------------
    // NexusMods 官方账户中心与授权方法
    // ------------------------------------------------------------------------

    refreshNexusUser() {
      this.nexusUser = getNexusUser();
      this.nexusApiKey = getNexusApiKey();
    },

    openNexusAuthModal() {
      if (this.drawerVisible) {
        this.drawerVisible = false;
      }
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
/* 样式体系：100% 对标 NexusMods 官方移动端纯粹暗黑风格 (Screenshot 1 & 2) */
/* ============================================================================ */

.nexusPage {
  min-height: 100vh;
  background-color: #121212;
  color: #e5e7eb;
  padding: 0 0 160rpx 0;
  box-sizing: border-box;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}

/* ---------------------------------------------------------------------------- */
/* 区域 1：手机沉浸式纯黑状态栏安全占位 (告别全屏叠加与挖孔遮挡)             */
/* ---------------------------------------------------------------------------- */
.safeStatusBarSpacer {
  width: 100%;
  height: var(--status-bar-height, 25px);
  background-color: #121212;
  box-sizing: border-box;
}

/* ---------------------------------------------------------------------------- */
/* 区域 1B：Nexus 官方顶栏 (保留备用)                                           */
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
/* 区域 2A：Games 视角 (100% 对标 N网官方游戏库、双 Tab、海报网格与书签)          */
/* ---------------------------------------------------------------------------- */
.gamesContainer {
  padding: 24rpx 24rpx 160rpx 24rpx;
  box-sizing: border-box;
}

/* 双 Segment Tab 控制栏 (我的游戏 vs 发现全网游戏) */
.gamesSegmentTabs {
  display: flex;
  align-items: center;
  background: #181a1f;
  border-radius: 16rpx;
  padding: 8rpx;
  margin-bottom: 24rpx;
  border: 1rpx solid #282c35;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.4);
}

.segmentTab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 14rpx 0;
  border-radius: 12rpx;
  gap: 12rpx;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
}

.segmentTab.active {
  background: linear-gradient(135deg, #262933, #1f222b);
  border: 1rpx solid #3a3f4d;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.45);
}

.segmentTabText {
  font-size: 26rpx;
  font-weight: 600;
  color: #94a3b8;
}

.segmentTab.active .segmentTabText {
  color: #ffffff;
  font-weight: 700;
}

.segmentCountBadge {
  padding: 2rpx 12rpx;
  border-radius: 20rpx;
  background: #2a2e38;
  font-size: 20rpx;
  color: #9ca3af;
  font-weight: 600;
}

.segmentTab.active .segmentCountBadge {
  background: #da6b17;
  color: #ffffff;
  font-weight: 700;
}

.segmentSearchBtn {
  width: 64rpx;
  height: 64rpx;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 8rpx;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.04);
  border: 1rpx solid rgba(255, 255, 255, 0.06);
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.segmentSearchBtn:active {
  transform: scale(0.96);
}

.segmentSearchBtn.active {
  background: rgba(218, 107, 23, 0.15);
  border-color: rgba(218, 107, 23, 0.5);
}

/* 标题统计与快捷操作行 */
.gamesHeaderRow {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 22rpx;
  padding: 0 4rpx;
}

.gamesHeaderLeft {
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.sectionBadgeIcon {
  font-size: 30rpx;
}

.gamesTitle {
  font-size: 30rpx;
  font-weight: 800;
  color: #ffffff;
}

.gamesCountSub {
  font-size: 22rpx;
  color: #848d9a;
  margin-left: 4rpx;
}

.syncCloudBtn {
  background: rgba(218, 107, 23, 0.12);
  border: 1rpx solid rgba(218, 107, 23, 0.35);
  border-radius: 20rpx;
  padding: 8rpx 18rpx;
}

.syncCloudText {
  font-size: 22rpx;
  color: #f59e0b;
  font-weight: 600;
}

.gamesViewAllLink {
  font-size: 24rpx;
  color: #da6b17;
  font-weight: 600;
  cursor: pointer;
}

/* 游戏海报网格与卡片流 (2:3 纵向海报) */
.gamesGrid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
}

/* 「+ 添加新游戏」虚线导流卡片 */
.addGameCard {
  background: rgba(25, 27, 31, 0.6);
  border: 2rpx dashed #3a3f4e;
  border-radius: 16rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 480rpx;
  padding: 30rpx 20rpx;
  box-sizing: border-box;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.addGameCard:active {
  border-color: #da6b17;
  background: rgba(218, 107, 23, 0.08);
  transform: scale(0.98);
}

.addGamePlusBox {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background: #252830;
  border: 2rpx solid #474d5d;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20rpx;
}

.addGamePlusIcon {
  font-size: 48rpx;
  line-height: 1;
  color: #da6b17;
  font-weight: 300;
}

.addGameCardTitle {
  font-size: 26rpx;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 8rpx;
}

.addGameCardSub {
  font-size: 20rpx;
  color: #848d9a;
  text-align: center;
  line-height: 1.4;
  padding: 0 10rpx;
}

/* 游戏海报卡片 */
.gamePosterCard {
  background-color: #191b1f;
  border-radius: 16rpx;
  overflow: hidden;
  border: 1rpx solid #232731;
  display: flex;
  flex-direction: column;
  padding-bottom: 14rpx;
  transition: transform 0.2s ease, border-color 0.2s ease;
}

.gamePosterCard:active {
  transform: scale(0.98);
  border-color: #da6b17;
}

.gameCoverBox {
  position: relative;
  width: 100%;
  padding-top: 150%; /* 2:3 纵向海报比例 */
  background-color: #121316;
  overflow: hidden;
}

.gameCoverImg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

/* 书签角标 (Bookmark Badge) 按钮 */
.gameBookmarkBadge {
  position: absolute;
  top: 12rpx;
  right: 12rpx;
  width: 50rpx;
  height: 50rpx;
  background-color: rgba(18, 18, 20, 0.75);
  backdrop-filter: blur(8px);
  border: 1rpx solid rgba(255, 255, 255, 0.16);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 5;
}

.gameBookmarkBadge.isBookmarked {
  background: linear-gradient(135deg, rgba(218, 107, 23, 0.95), rgba(245, 158, 11, 0.95));
  border-color: #fbbf24;
  box-shadow: 0 4rpx 14rpx rgba(218, 107, 23, 0.45);
  transform: scale(1.05);
}

.gameBookmarkBadge:active {
  transform: scale(0.88);
}

.bookmarkIcon {
  font-size: 24rpx;
  line-height: 1;
}

/* 标题与副标 */
.gameTitleText {
  font-size: 24rpx;
  font-weight: 700;
  color: #ffffff;
  padding: 14rpx 14rpx 2rpx 14rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.gameOriginalNameText {
  font-size: 19rpx;
  color: #838a96;
  padding: 0 14rpx 8rpx 14rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 统计数据行 */
.gameStatsRow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8rpx 14rpx 0 14rpx;
  border-top: 1rpx solid #232731;
}

.statMetricItem {
  display: flex;
  align-items: center;
  gap: 4rpx;
}

.statGlyph {
  font-size: 18rpx;
  color: #9ca3af;
}

.statMetricVal {
  font-size: 19rpx;
  color: #d1d5db;
  font-weight: 600;
}

/* 空态与加载指示器 */
.emptyEmoji {
  font-size: 64rpx;
  margin-bottom: 16rpx;
}

.emptyTitle {
  font-size: 28rpx;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 8rpx;
}

.emptySub {
  font-size: 22rpx;
  color: #848d9a;
  line-height: 1.5;
}

/* ---------------------------------------------------------------------------- */
/* 区域 2B-0：返回游戏库快捷横幅 (支持一键返回游戏库 / 切换游戏)              */
/* ---------------------------------------------------------------------------- */
.backToGamesBar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(255, 255, 255, 0.04);
  border: 1rpx solid rgba(255, 255, 255, 0.08);
  border-radius: 14rpx;
  padding: 10rpx 18rpx;
  margin-bottom: 14rpx;
  cursor: pointer;
  transition: all 0.2s ease;
}

.backToGamesBar:active {
  background: rgba(218, 107, 23, 0.12);
  border-color: rgba(218, 107, 23, 0.4);
}

.backToGamesLeft {
  display: flex;
  align-items: center;
  gap: 8rpx;
  overflow: hidden;
}

.backToGamesText {
  font-size: 22rpx;
  font-weight: 700;
  color: #da6b17;
}

.backToGamesDivider {
  font-size: 22rpx;
  color: #64748b;
}

.backToGamesCurrentTitle {
  font-size: 22rpx;
  font-weight: 600;
  color: #e2e8f0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 360rpx;
}

.backToGamesRight {
  display: flex;
  align-items: center;
}

.switchGameBtnText {
  font-size: 20rpx;
  font-weight: 600;
  color: #94a3b8;
  padding: 4rpx 12rpx;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 20rpx;
}

/* ---------------------------------------------------------------------------- */
/* 区域 3B：Mods 视角 (100% 对标图 2) */
/* ---------------------------------------------------------------------------- */
.modsContainer {
  padding: 0 24rpx 24rpx 24rpx;
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
  background-color: #242833;
  border: 1rpx solid #373e4d;
  border-radius: 999px;
  padding: 8rpx 20rpx;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.clearGamePillBtn:active {
  background-color: #2d323f;
}

.clearGamePillIcon {
  font-size: 20rpx;
  color: #9ca3af;
}

.clearGamePillText {
  font-size: 22rpx;
  color: #e5e7eb;
  font-weight: 600;
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

/* N网官方实时动态分类胶囊栏 (100% 精致暗黑胶囊流) */
.categoryPillsScroll {
  width: 100%;
  white-space: nowrap;
  margin-bottom: 24rpx;
  scrollbar-width: none !important;
  -ms-overflow-style: none !important;
}

.categoryPillsScroll::-webkit-scrollbar {
  display: none !important;
  width: 0 !important;
  height: 0 !important;
}

.categoryPillsList {
  display: inline-flex;
  gap: 12rpx;
  padding: 6rpx 0;
}

.catPill {
  display: inline-flex;
  align-items: center;
  gap: 10rpx;
  background-color: #1a1d24;
  border: 1rpx solid #2d3340;
  border-radius: 999px;
  padding: 10rpx 22rpx;
  white-space: nowrap;
  flex-shrink: 0;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.catPill:active {
  transform: scale(0.96);
}

.catPill.active {
  background-color: #da6b17;
  border-color: #da6b17;
  box-shadow: 0 4rpx 14rpx rgba(218, 107, 23, 0.35);
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

.catPillCount {
  font-size: 18rpx;
  font-weight: 700;
  color: #6b7280;
  background: rgba(255, 255, 255, 0.08);
  padding: 2rpx 12rpx;
  border-radius: 999px;
}

.catPill.active .catPillCount {
  color: #ffffff;
  background: rgba(0, 0, 0, 0.25);
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

/* Filter Pills: ☀ New | ⟳ Updated | ↗ Trending | ★ Popular (对标图 2) */
.filterPillsScroll {
  width: 100%;
  white-space: nowrap;
  margin-bottom: 24rpx;
  padding-bottom: 16rpx;
  border-bottom: 1rpx solid #20242c;
  scrollbar-width: none !important;
  -ms-overflow-style: none !important;
}

.filterPillsScroll::-webkit-scrollbar {
  display: none !important;
  width: 0 !important;
  height: 0 !important;
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
  background-color: #17191e;
  border: 1rpx solid #2b3038;
  border-radius: 999px;
  padding: 12rpx 28rpx;
  white-space: nowrap;
  flex-shrink: 0;
  cursor: pointer;
  transition: all 0.2s ease;
}

.filterPill:active {
  transform: scale(0.96);
}

.filterPill.active {
  background-color: #ffffff;
  border-color: #ffffff;
}

.pillIcon {
  font-size: 24rpx;
  color: #9ca3af;
}

.filterPill.active .pillIcon {
  color: #121212;
}

.pillLabel {
  font-size: 24rpx;
  font-weight: 600;
  color: #9ca3af;
}

.filterPill.active .pillLabel {
  color: #121212;
  font-weight: 800;
}

/* ============================================================================ */
/* 区域 2B-1：顶部吸顶固定控制台 (搜索框 + 排序分类时间下拉，吸顶固定不随列表滚走) */
/* ============================================================================ */
.stickySearchBarSection {
  position: sticky;
  top: 0;
  z-index: 95;
  background-color: rgba(18, 18, 18, 0.96);
  backdrop-filter: blur(20px);
  padding: calc(var(--status-bar-height, 0px) + 12rpx) 24rpx 14rpx 24rpx;
  margin: 0 -24rpx 20rpx -24rpx;
  border-bottom: 1rpx solid rgba(255, 255, 255, 0.06);
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.45);
}

/* ============================================================================ */
/* 现代高级一体化搜索胶囊舱 (单层无嵌套、微光毛玻璃设计)                         */
/* ============================================================================ */
.modernSearchCapsule {
  display: flex;
  align-items: center;
  background-color: #191c24;
  border: 1rpx solid #2d3342;
  border-radius: 40rpx;
  height: 76rpx;
  padding: 0 8rpx 0 24rpx;
  box-sizing: border-box;
  box-shadow: inset 0 2rpx 6rpx rgba(0, 0, 0, 0.3);
  transition: all 0.25s ease;
}

.modernSearchCapsule:focus-within {
  border-color: rgba(218, 107, 23, 0.7);
  background-color: #1c202a;
  box-shadow: 0 0 16rpx rgba(218, 107, 23, 0.15), inset 0 2rpx 6rpx rgba(0, 0, 0, 0.3);
}

.modernSearchInput {
  flex: 1;
  font-size: 24rpx;
  color: #f1f5f9;
  height: 100%;
}

.modernSearchPlaceholder {
  color: #64748b;
  font-size: 23rpx;
}

.modernClearBtn {
  width: 44rpx;
  height: 44rpx;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12rpx;
  cursor: pointer;
  flex-shrink: 0;
}

.modernClearIcon {
  font-size: 20rpx;
  color: #94a3b8;
  line-height: 1;
}

.modernSearchBtn {
  background: linear-gradient(135deg, #f59e0b 0%, #da6b17 100%);
  border-radius: 32rpx;
  height: 60rpx;
  padding: 0 26rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4rpx 14rpx rgba(218, 107, 23, 0.35);
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.modernSearchBtn:active {
  transform: scale(0.96);
  opacity: 0.9;
}

.modernSearchBtn.loading {
  background: #475569;
  box-shadow: none;
}

.modernSearchBtnText {
  font-size: 23rpx;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: 1rpx;
}

/* 智能转译结果与纠偏微胶囊 */
.searchTranslateFeedbackPill {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: rgba(218, 107, 23, 0.08);
  border: 1rpx solid rgba(218, 107, 23, 0.25);
  border-radius: 20rpx;
  padding: 10rpx 18rpx;
  margin-top: 12rpx;
  flex-wrap: wrap;
  gap: 8rpx;
}

.translateFeedbackLeft {
  display: flex;
  align-items: center;
  gap: 8rpx;
  flex-wrap: wrap;
}

.translateTagBadge {
  font-size: 18rpx;
  color: #da6b17;
  background-color: rgba(218, 107, 23, 0.2);
  border-radius: 6rpx;
  padding: 2rpx 8rpx;
  font-weight: 700;
}

.translateOriginalText {
  font-size: 21rpx;
  color: #cbd5e1;
}

.translateArrowIcon {
  font-size: 18rpx;
  color: #94a3b8;
}

.translateTargetText {
  font-size: 22rpx;
  color: #f59e0b;
  font-weight: 700;
}

.translateActionBtns {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.translateActionBtn {
  background-color: #242935;
  border: 1rpx solid #3c4456;
  border-radius: 20rpx;
  padding: 4rpx 14rpx;
  cursor: pointer;
}

.translateActionBtn.editBtn {
  border-color: rgba(218, 107, 23, 0.5);
  background-color: rgba(218, 107, 23, 0.15);
}

.translateActionBtnText {
  font-size: 19rpx;
  color: #e2e8f0;
  font-weight: 600;
}

/* ============================================================================ */
/* 统一三联下拉筛选栏 (排序方式 | 模组分类 | 时间范围，告别繁琐横滑)             */
/* ============================================================================ */
.filtersDropdownBar {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-top: 14rpx;
  width: 100%;
  box-sizing: border-box;
}

.filterCol {
  flex: 1;
  min-width: 0;
}

.filterSelectPill,
.filterSelectBox {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #191c24;
  border: 1rpx solid #2d3342;
  border-radius: 30rpx;
  height: 58rpx;
  padding: 0 16rpx;
  box-sizing: border-box;
  width: 100%;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.filterSelectPill:active,
.filterSelectBox:active {
  background-color: #242a38;
}

.filterSelectPill.active,
.filterSelectBox.active {
  background-color: rgba(218, 107, 23, 0.12);
  border-color: rgba(218, 107, 23, 0.6);
  box-shadow: 0 0 12rpx rgba(218, 107, 23, 0.15);
}

.filterSelectLabel {
  font-size: 22rpx;
  font-weight: 600;
  color: #94a3b8;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: center;
  margin-right: 6rpx;
}

.filterSelectPill.active .filterSelectLabel,
.filterSelectBox.active .filterSelectLabel {
  color: #f59e0b;
  font-weight: 700;
}

.filterSelectArrow {
  font-size: 18rpx;
  color: #64748b;
  flex-shrink: 0;
  transition: transform 0.2s ease;
}

.filterSelectPill.active .filterSelectArrow,
.filterSelectBox.active .filterSelectArrow {
  color: #da6b17;
}

/* 兼容保留旧类名 */
.timeFilterRow {
  margin-bottom: 24rpx;
}

.timeSelectBox {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #16181d;
  border: 1rpx solid #272c36;
  border-radius: 10rpx;
  padding: 14rpx 22rpx;
  box-sizing: border-box;
}

.timeSelectLabel {
  font-size: 24rpx;
  font-weight: 600;
  color: #d1d5db;
}

.timeSelectArrow {
  font-size: 22rpx;
  color: #6b7280;
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

/* ============================================================================ */
/* 双列 Mod 卡片网格：纯 CSS Grid 现代对称布局 (完美对齐子组件 ModCard)          */
/* ============================================================================ */
.modsGrid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
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

/* NexusMods 官方账户抽屉卡片 */
.drawerNexusCard {
  display: flex;
  align-items: center;
  gap: 16rpx;
  border-radius: 14rpx;
  padding: 16rpx 20rpx;
  margin-top: 20rpx;
  margin-bottom: 8rpx;
  cursor: pointer;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.3);
  transition: background-color 0.2s ease;
}

.drawerNexusCard.guest {
  background: linear-gradient(135deg, #1f232b 0%, #17191e 100%);
  border: 1rpx solid #363b47;
}

.drawerNexusCard.logged {
  background: linear-gradient(135deg, #261f18 0%, #1a1b20 100%);
  border: 1rpx solid #633e19;
}

.nexusAvatarBox {
  position: relative;
  width: 76rpx;
  height: 76rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background-color: #2b2f3a;
}

.nexusAvatarBox.guest {
  background-color: #2b303c;
  border: 1rpx dashed #4b5563;
}

.nexusAvatarImg {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.nexusAvatarGlyph,
.nexusAvatarIcon {
  font-size: 38rpx;
}

.premiumCrownBadge {
  position: absolute;
  top: -6rpx;
  right: -6rpx;
  font-size: 22rpx;
}

.nexusCardInfo {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.nexusCardTitleRow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10rpx;
}

.nexusCardTitle {
  font-size: 26rpx;
  font-weight: 700;
  color: #ffffff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.nexusLoginPill {
  font-size: 18rpx;
  color: #da6b17;
  font-weight: 700;
  background: rgba(218, 107, 23, 0.15);
  padding: 2rpx 10rpx;
  border-radius: 20rpx;
}

.userPremiumTag {
  font-size: 18rpx;
  font-weight: 800;
  color: #fbbf24;
  background: rgba(251, 191, 36, 0.18);
  border: 1rpx solid rgba(251, 191, 36, 0.4);
  padding: 2rpx 10rpx;
  border-radius: 6rpx;
}

.userSupporterTag {
  font-size: 18rpx;
  font-weight: 800;
  color: #38bdf8;
  background: rgba(56, 189, 248, 0.18);
  border: 1rpx solid rgba(56, 189, 248, 0.4);
  padding: 2rpx 10rpx;
  border-radius: 6rpx;
}

.userMemberTag {
  font-size: 18rpx;
  color: #9ca3af;
  background: rgba(255, 255, 255, 0.08);
  padding: 2rpx 8rpx;
  border-radius: 6rpx;
}

.nexusCardSub {
  font-size: 20rpx;
  color: #9ca3af;
  margin-top: 4rpx;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.nexusNavTag {
  font-size: 20rpx;
  color: #da6b17;
  font-weight: 600;
}

.nexusNavTag.authed {
  color: #10b981;
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

/* ---------------------------------------------------------------------------- */
/* 区域 7：NexusMods 账户与授权弹窗样式 */
/* ---------------------------------------------------------------------------- */
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
