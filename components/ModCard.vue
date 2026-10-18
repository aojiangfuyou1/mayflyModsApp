<template>
  <!-- ======================================================================== -->
  <!-- 区域 1：模组卡片外层容器 (双列高保真网格卡片，极简暗黑质感 + 移动端自适应)  -->
  <!-- ======================================================================== -->
  <view
    class="modCard"
    :class="{ 'card-selectable': selectable, 'is-selected': isSelected }"
    @click="handleCardClick"
  >
    <!-- -------------------------------------------------------------------- -->
    <!-- 区域 1.1：封面大图 (16:9) + 渐变过渡 + 多选标记 + 游戏短角标 + 收藏按钮 -->
    <!-- -------------------------------------------------------------------- -->
    <view class="modCoverBox">
      <image
        class="modCoverImg"
        :src="item.coverImageUrl || '/static/logo.png'"
        mode="aspectFill"
        lazy-load
      ></image>

      <!-- 底部暗黑微弱渐变：加强封面与卡片底色的视觉融合度 -->
      <view class="modCoverGradient"></view>

      <!-- 多选模式下的圆形复选标记 -->
      <view
        class="modSelectBadge"
        :class="{ checked: isSelected }"
        v-if="selectable"
        @click.stop="$emit('select', item)"
      >
        <text class="modSelectIcon">{{ isSelected ? '✓' : '' }}</text>
      </view>

      <!-- 全网专区模式下显示紧凑游戏短名 (防换行挤压) -->
      <view class="modGameBadge" v-else-if="!selectedGameDomain && item.game">
        <text class="modGameBadgeText">{{ item.game.shortZhName || item.game.name }}</text>
      </view>

      <!-- 18+ 成人内容警示角标 (醒目安全提示，多选模式自适应右移) -->
      <view
        class="modAdultBadge"
        :class="{ 'with-selectable': selectable }"
        v-if="item.adultContent"
      >
        <text class="modAdultBadgeText">18+</text>
      </view>

      <!-- 右上角心愿单快速加藏按钮 -->
      <view class="modActionBtn" @click.stop="$emit('favorite', item)">
        <NexusIcon
          :name="isFavorited ? 'heart-fill' : 'heart'"
          size="28rpx"
          :color="isFavorited ? '#ef4444' : '#ffffff'"
        />
      </view>
    </view>

    <!-- -------------------------------------------------------------------- -->
    <!-- 区域 2：卡片信息主体 (层级分明、严控间距、杜绝断字折行)                -->
    <!-- -------------------------------------------------------------------- -->
    <view class="modBody">
      <!-- 2.1 标题 (白色加粗，限制2行并保证最小对称高度) -->
      <text class="modTitleText">
        {{ displayTitle }}
      </text>

      <!-- 2.2 创作者与分类标签行 (合并排版：左侧创作者金色高亮，右侧分类胶囊) -->
      <view class="modMetaRow">
        <view class="authorCol">
          <text class="authorGlyph">❖</text>
          <text class="authorNameText">{{ item.author || '未知作者' }}</text>
        </view>
        <view class="categoryTag" v-if="displayCategory">
          <text class="categoryTagText">{{ displayCategory }}</text>
        </view>
      </view>

      <!-- 2.3 紧凑时间行 (左侧相对更新，右侧紧凑首发日期，100% 绝对防折行) -->
      <view class="modTimeRow">
        <view class="timeCol freshnessCol">
          <text class="timeIcon">⟳</text>
          <text class="timeVal">{{ item.timeAgo || (enableAutoTranslate ? '刚刚' : 'recently') }}</text>
        </view>
        <view class="timeCol releaseCol" v-if="formattedReleaseDate">
          <text class="timeIcon">⬆</text>
          <text class="timeVal">{{ formattedReleaseDate }}</text>
        </view>
      </view>

      <!-- 2.4 简介摘要预览 (灰色两行，智能过滤与标题机械雷同的内容) -->
      <text class="modSummaryText">{{ displaySummary }}</text>

      <!-- -------------------------------------------------------------------- -->
      <!-- 区域 3：底部数据与快捷推送按钮                                       -->
      <!-- -------------------------------------------------------------------- -->
      <view class="modFooterRow">
        <view class="modStatsLeft">
          <view class="metricItem">
            <NexusIcon name="like" size="22rpx" color="#94a3b8" />
            <text class="metricNumText">{{ formattedLikes }}</text>
          </view>
          <view class="metricItem">
            <NexusIcon name="download" size="22rpx" color="#94a3b8" />
            <text class="metricNumText">{{ formattedDownloads }}</text>
          </view>
        </view>
        <button
          class="nexusPushBtn"
          :class="{ 'is-pushing': isPushing }"
          :disabled="isPushing"
          @click.stop="$emit('push', item)"
        >
          <text class="nexusPushBtnText">{{ isPushing ? '推送中' : '推送' }}</text>
        </button>
      </view>
    </view>
  </view>
</template>

<script>
// ============================================================================
// 区域 3：ModCard 组件逻辑 (数据映射、紧凑日期换算与防冗余处理)
// ============================================================================
import { getCategoryZhName } from '../services/translate.js';
import NexusIcon from './NexusIcon.vue';

export default {
  name: 'ModCard',
  components: {
    NexusIcon
  },
  props: {
    // 模组元数据对象
    item: {
      type: Object,
      required: true
    },
    // 当前激活游戏域名 (有值时隐藏封面游戏角标)
    selectedGameDomain: {
      type: String,
      default: ''
    },
    // 是否开启自动中文翻译
    enableAutoTranslate: {
      type: Boolean,
      default: true
    },
    // 异步翻译标题映射
    zhTitle: {
      type: String,
      default: ''
    },
    // 异步翻译摘要映射
    zhSummary: {
      type: String,
      default: ''
    },
    // 是否已加入心愿单
    isFavorited: {
      type: Boolean,
      default: false
    },
    // 是否正处于推送信令发送状态
    isPushing: {
      type: Boolean,
      default: false
    },
    // 是否处于多选模式
    selectable: {
      type: Boolean,
      default: false
    },
    // 当前是否被勾选
    isSelected: {
      type: Boolean,
      default: false
    }
  },

  computed: {
    /**
     * 计算呈现标题 (优先使用中文映射，否则使用原始英文名)
     * @returns {string}
     */
    displayTitle() {
      if (this.enableAutoTranslate) {
        if (this.zhTitle) return this.zhTitle;
        if (this.item && this.item.zhTitle) return this.item.zhTitle;
        if (this.item && this.item.zhName) return this.item.zhName;
      }
      return this.item.title || '未命名模组';
    },

    /**
     * 计算友好中文分类名称
     * @returns {string}
     */
    displayCategory() {
      if (!this.item.category) return '综合模组';
      if (this.enableAutoTranslate) {
        return getCategoryZhName(this.item.category);
      }
      return this.item.category;
    },

    /**
     * 计算并过滤模组简介 (防止简介与标题完全机械重复造成的视觉尴尬)
     * @returns {string}
     */
    displaySummary() {
      let summary = '';
      if (this.enableAutoTranslate) {
        if (this.zhSummary) {
          summary = this.zhSummary;
        } else if (this.item && this.item.zhSummary) {
          summary = this.item.zhSummary;
        } else {
          summary = this.item.summary || '';
        }
      } else {
        summary = this.item.summary || '';
      }
      summary = (summary || '').trim();
      const cleanTitle = (this.displayTitle || '').trim();
      // 当简介内容与标题 100% 相同或为空时，展示更精致的兜底说明
      if (!summary || summary.toLowerCase() === cleanTitle.toLowerCase()) {
        if (this.item.summary && this.item.summary.trim().toLowerCase() !== cleanTitle.toLowerCase()) {
          return this.item.summary.trim();
        }
        return this.enableAutoTranslate ? '作者暂未提供更多介绍' : 'No description provided.';
      }
      return summary;
    },

    /**
     * 紧凑格式化首发日期 (如当年展示 "10-18"，往年展示 "25-10-18")
     * 核心优化：彻底解决 "2026年10月18日" 11个全角字符在移动端双列卡片中导致 "日" 单独折行的丑陋问题
     * @returns {string} 紧凑日期字符串
     */
    formattedReleaseDate() {
      const dateStr = this.item.createdAt;
      if (!dateStr) return '';
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '';
      const now = new Date();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      // 当年仅展示 MM-DD 极简 5 字符；跨年则展示 YY-MM-DD
      if (d.getFullYear() === now.getFullYear()) {
        return `${month}-${day}`;
      }
      return `${String(d.getFullYear()).slice(-2)}-${month}-${day}`;
    },

    /**
     * 格式化点赞数量 (大于 1000 显示 1.2k)
     * @returns {string}
     */
    formattedLikes() {
      const num = Number(this.item.likes) || 0;
      if (num >= 1000000) return `${(num / 1000000).toFixed(1)}m`;
      if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
      return String(num);
    },

    /**
     * 格式化下载数量 (转为 k / m / b)
     * @returns {string}
     */
    formattedDownloads() {
      const num = Number(this.item.downloads) || 0;
      if (num >= 1000000000) return `${(num / 1000000000).toFixed(1)}b`;
      if (num >= 1000000) return `${(num / 1000000).toFixed(1)}m`;
      if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
      return String(num);
    }
  },

  methods: {
    /**
     * 处理整卡点击 (多选模式下切换勾选，普通模式下进入详情)
     */
    handleCardClick() {
      if (this.selectable) {
        this.$emit('select', this.item);
      } else {
        this.$emit('click', this.item);
      }
    }
  }
};
</script>

<style scoped>
/* ============================================================================ */
/* 区域 4：ModCard 卡片整体样式 (极简暗黑、平滑倒角、微光边框与触控反馈)         */
/* ============================================================================ */
.modCard {
  background-color: #191b1f;
  border-radius: 16rpx;
  overflow: hidden;
  border: 1rpx solid #262b35;
  display: flex;
  flex-direction: column;
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.25);
  box-sizing: border-box;
}

.modCard:active {
  transform: scale(0.985);
  border-color: #da6b17;
}

.modCard.is-selected {
  border-color: #da6b17;
  box-shadow: 0 0 16rpx rgba(218, 107, 23, 0.35);
}

/* ---------------------------------------------------------------------------- */
/* 区域 5：封面大图与操作角标                                                   */
/* ---------------------------------------------------------------------------- */
.modCoverBox {
  position: relative;
  width: 100%;
  padding-top: 56.25%; /* 16:9 标准比例 */
  background-color: #111317;
  overflow: hidden;
}

.modCoverImg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.modCoverGradient {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 48rpx;
  background: linear-gradient(to top, rgba(25, 27, 31, 0.8) 0%, transparent 100%);
  pointer-events: none;
}

.modGameBadge {
  position: absolute;
  bottom: 10rpx;
  left: 10rpx;
  background-color: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(4px);
  padding: 4rpx 10rpx;
  border-radius: 6rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.15);
  max-width: 65%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.modGameBadgeText {
  font-size: 18rpx;
  color: #e5e7eb;
  font-weight: 600;
  white-space: nowrap;
}

.modActionBtn {
  position: absolute;
  top: 10rpx;
  right: 10rpx;
  width: 46rpx;
  height: 46rpx;
  background-color: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(4px);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1rpx solid rgba(255, 255, 255, 0.1);
  transition: transform 0.15s ease;
}

.modActionBtn:active {
  transform: scale(0.9);
}

.modSelectBadge {
  position: absolute;
  top: 10rpx;
  left: 10rpx;
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  background: rgba(18, 20, 24, 0.85);
  border: 2rpx solid #94a3b8;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 5;
  transition: all 0.2s ease;
}

.modSelectBadge.checked {
  background: #da6b17;
  border-color: #da6b17;
}

.modSelectIcon {
  font-size: 24rpx;
  color: #ffffff;
  font-weight: 900;
  line-height: 1;
}

/* 18+ 成人内容警示角标样式 */
.modAdultBadge {
  position: absolute;
  top: 10rpx;
  left: 10rpx;
  background: rgba(220, 38, 38, 0.92);
  backdrop-filter: blur(4px);
  padding: 2rpx 10rpx;
  border-radius: 6rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.35);
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.5);
  z-index: 4;
}

.modAdultBadge.with-selectable {
  left: 58rpx;
}

.modAdultBadgeText {
  font-size: 18rpx;
  color: #ffffff;
  font-weight: 900;
  letter-spacing: 0.5rpx;
  line-height: 1.2;
}

/* ---------------------------------------------------------------------------- */
/* 区域 6：信息主体排版与防折行控制                                             */
/* ---------------------------------------------------------------------------- */
.modBody {
  padding: 16rpx 16rpx 14rpx 16rpx;
  display: flex;
  flex-direction: column;
  flex: 1;
  box-sizing: border-box;
}

/* 标题：限制2行，高度对称 */
.modTitleText {
  font-size: 24rpx;
  font-weight: 700;
  color: #f8fafc;
  line-height: 1.35;
  margin-bottom: 8rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  min-height: 64rpx;
}

/* 作者与分类标签单行排版 (节省垂直空间，对齐美观) */
.modMetaRow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8rpx;
  margin-bottom: 8rpx;
}

.authorCol {
  display: flex;
  align-items: center;
  gap: 6rpx;
  flex: 1;
  min-width: 0;
}

.authorGlyph {
  font-size: 18rpx;
  color: #da6b17;
  flex-shrink: 0;
  line-height: 1;
}

.authorNameText {
  font-size: 20rpx;
  color: #d4a373; /* Nexus 经典暖金 */
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.2;
}

.categoryTag {
  background: rgba(255, 255, 255, 0.05);
  border: 1rpx solid rgba(255, 255, 255, 0.08);
  border-radius: 6rpx;
  padding: 2rpx 8rpx;
  max-width: 130rpx;
  flex-shrink: 0;
}

.categoryTagText {
  font-size: 18rpx;
  color: #94a3b8;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: block;
  line-height: 1.2;
}

/* 核心防换行：时间行横向排列，严格不折行 */
.modTimeRow {
  display: flex;
  align-items: center;
  gap: 14rpx;
  margin-bottom: 10rpx;
  white-space: nowrap;
  overflow: hidden;
}

.timeCol {
  display: flex;
  align-items: center;
  gap: 6rpx;
  flex-shrink: 0;
  white-space: nowrap;
}

.timeIcon {
  font-size: 18rpx;
  color: #64748b;
  line-height: 1;
}

.timeVal {
  font-size: 19rpx;
  color: #94a3b8;
  white-space: nowrap;
  line-height: 1;
}

/* 简介摘要：固定2行优雅弱化展示 */
.modSummaryText {
  font-size: 20rpx;
  color: #8b949e;
  line-height: 1.45;
  margin-bottom: 14rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  min-height: 58rpx;
  flex: 1;
}

/* ---------------------------------------------------------------------------- */
/* 区域 7：底部数据统计与推送按钮                                               */
/* ---------------------------------------------------------------------------- */
.modFooterRow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 12rpx;
  border-top: 1rpx solid #232731;
}

.modStatsLeft {
  display: flex;
  align-items: center;
  gap: 14rpx;
}

.metricItem {
  display: flex;
  align-items: center;
  gap: 6rpx;
}

.metricNumText {
  font-size: 20rpx;
  color: #94a3b8;
  font-weight: 500;
  line-height: 1;
}

.nexusPushBtn {
  background: linear-gradient(135deg, #da6b17, #f97316);
  color: #ffffff;
  border-radius: 8rpx;
  padding: 6rpx 18rpx;
  font-size: 20rpx;
  font-weight: 700;
  margin: 0;
  line-height: 1.4;
  border: none;
  white-space: nowrap;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2rpx 8rpx rgba(218, 107, 23, 0.3);
  transition: all 0.2s ease;
}

.nexusPushBtnText {
  color: #ffffff;
}

.nexusPushBtn[disabled],
.nexusPushBtn.is-pushing {
  opacity: 0.6;
  background: #64748b;
  box-shadow: none;
}
</style>
