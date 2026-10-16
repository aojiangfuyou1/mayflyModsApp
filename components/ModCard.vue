<template>
  <!-- ======================================================================== -->
  <!-- 模组卡片组件 (双列网格流卡片，对标 Nexus 移动端标准卡片)               -->
  <!-- ======================================================================== -->
  <view class="modCard" @click="$emit('click', item)">
    <!-- 封面大图 (16:9) + 游戏短角标 + 右上角操作点 -->
    <view class="modCoverBox">
      <image
        class="modCoverImg"
        :src="item.coverImageUrl || '/static/logo.png'"
        mode="aspectFill"
        lazy-load
      />
      <view class="modGameBadge" v-if="!selectedGameDomain && item.game">
        <text class="modGameBadgeText">{{ item.game.shortZhName || item.game.name }}</text>
      </view>
      <view class="modActionBtn" @click.stop="$emit('favorite', item)">
        <text class="actionDotText">{{ isFavorited ? '❤️' : '···' }}</text>
      </view>
    </view>

    <!-- 卡片信息主体 -->
    <view class="modBody">
      <!-- 标题 (白字加粗) -->
      <text class="modTitleText">
        {{ displayTitle }}
      </text>

      <!-- 作者信息 (Nexus 经典暖金色 #d4a373) -->
      <view class="modAuthorRow">
        <text class="authorGlyph">❖</text>
        <text class="authorNameText">{{ item.author || '未知作者' }}</text>
      </view>

      <!-- 模组类型 (对标 Patches, Audio 等，中文友好映射) -->
      <text class="modCategoryText">{{ displayCategory }}</text>

      <!-- 更新与创建时间 (跟随本地化显示) -->
      <view class="modTimeRow">
        <view class="timeCol">
          <text class="timeIcon">⟳</text>
          <text class="timeVal">{{ item.timeAgo || (enableAutoTranslate ? '刚刚' : 'recently') }}</text>
        </view>
        <view class="timeCol" v-if="item.formattedDate">
          <text class="timeIcon">⬆</text>
          <text class="timeVal">{{ item.formattedDate }}</text>
        </view>
      </view>

      <!-- 简介摘要预览 (灰色两行，自动中文翻译呈现) -->
      <text class="modSummaryText">{{ displaySummary }}</text>

      <!-- 底部统计与推送 (对标图 2: 👍 0  📥 0  + Mayfly 独有推送到电脑) -->
      <view class="modFooterRow">
        <view class="modStatsLeft">
          <text class="footerMetric">👍 {{ item.likes || 0 }}</text>
          <text class="footerMetric">📥 {{ formattedDownloads }}</text>
        </view>
        <button
          class="nexusPushBtn"
          :disabled="isPushing"
          @click.stop="$emit('push', item)"
        >
          <text class="nexusPushBtnText">{{ isPushing ? '推送中...' : '推送到电脑' }}</text>
        </button>
      </view>
    </view>
  </view>
</template>

<script>
// ============================================================================
// ModCard 组件逻辑：模组双列海报卡片与统计指标渲染
// ============================================================================
import { getCategoryZhName } from '../services/translate.js';

export default {
  name: 'ModCard',
  props: {
    item: {
      type: Object,
      required: true
    },
    selectedGameDomain: {
      type: String,
      default: ''
    },
    enableAutoTranslate: {
      type: Boolean,
      default: true
    },
    zhTitle: {
      type: String,
      default: ''
    },
    zhSummary: {
      type: String,
      default: ''
    },
    isFavorited: {
      type: Boolean,
      default: false
    },
    isPushing: {
      type: Boolean,
      default: false
    }
  },

  computed: {
    displayTitle() {
      if (this.enableAutoTranslate && this.zhTitle) {
        return this.zhTitle;
      }
      return this.item.title || '未命名模组';
    },

    displayCategory() {
      if (!this.item.category) return '综合模组';
      if (this.enableAutoTranslate) {
        return getCategoryZhName(this.item.category);
      }
      return this.item.category;
    },

    displaySummary() {
      if (this.enableAutoTranslate && this.zhSummary) {
        return this.zhSummary;
      }
      return this.item.summary || (this.enableAutoTranslate ? '作者暂未提供简介摘要' : 'No description provided.');
    },

    formattedDownloads() {
      const num = Number(this.item.downloads) || 0;
      if (num >= 1000000000) return `${(num / 1000000000).toFixed(1)}b`;
      if (num >= 1000000) return `${(num / 1000000).toFixed(1)}m`;
      if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
      return String(num);
    }
  }
};
</script>

<style scoped>
/* ============================================================================ */
/* ModCard 卡片样式 (100% 对标 Nexus 移动端标准卡片)                           */
/* ============================================================================ */
.modCard {
  background-color: #191b1f;
  border-radius: 16rpx;
  overflow: hidden;
  border: 1rpx solid #232731;
  display: flex;
  flex-direction: column;
  transition: transform 0.2s ease, border-color 0.2s ease;
}

.modCoverBox {
  position: relative;
  width: 100%;
  padding-top: 56.25%; /* 16:9 比例 */
  background-color: #121316;
  overflow: hidden;
}

.modCoverImg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.modGameBadge {
  position: absolute;
  bottom: 12rpx;
  left: 12rpx;
  background-color: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(4px);
  padding: 4rpx 12rpx;
  border-radius: 6rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.15);
}

.modGameBadgeText {
  font-size: 18rpx;
  color: #e5e7eb;
  font-weight: 600;
}

.modActionBtn {
  position: absolute;
  top: 12rpx;
  right: 12rpx;
  width: 44rpx;
  height: 44rpx;
  background-color: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(4px);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.actionDotText {
  color: #e5e7eb;
  font-size: 22rpx;
  line-height: 1;
}

.modBody {
  padding: 16rpx;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.modTitleText {
  font-size: 24rpx;
  font-weight: 700;
  color: #ffffff;
  line-height: 1.35;
  margin-bottom: 8rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  min-height: 64rpx;
}

.modAuthorRow {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-bottom: 8rpx;
}

.authorGlyph {
  font-size: 20rpx;
  color: #da6b17;
}

.authorNameText {
  font-size: 20rpx;
  color: #d4a373;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.modCategoryText {
  font-size: 19rpx;
  color: #9ca3af;
  margin-bottom: 8rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.modTimeRow {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 10rpx;
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
  color: #9ca3af;
}

.modSummaryText {
  font-size: 20rpx;
  color: #9ca3af;
  line-height: 1.4;
  margin-bottom: 16rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  flex: 1;
}

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

.footerMetric {
  font-size: 20rpx;
  color: #9ca3af;
}

.nexusPushBtn {
  background-color: #da6b17;
  color: #ffffff;
  border-radius: 8rpx;
  padding: 8rpx 18rpx;
  font-size: 20rpx;
  font-weight: 700;
  margin: 0;
  line-height: 1.4;
  border: none;
}

.nexusPushBtnText {
  color: #ffffff;
}

.nexusPushBtn[disabled] {
  opacity: 0.5;
}
</style>
