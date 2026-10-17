<template>
  <!-- ======================================================================== -->
  <!-- NexusIcon：移动端全局高保真极简矢量图标组件 (纯 SVG 渲染，告别廉价 Emoji)   -->
  <!-- ======================================================================== -->
  <view
    class="nexusIconWrap"
    :style="{
      width: actualSize,
      height: actualSize,
      color: color || 'currentColor'
    }"
  >
    <!-- -------------------------------------------------------------------- -->
    <!-- 1. AI 智能灵动双星 (优雅星芒，对标 Apple Intelligence / Gemini)      -->
    <!-- -------------------------------------------------------------------- -->
    <svg
      v-if="name === 'ai' || name === 'sparkles'"
      class="svgIcon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <!-- 主星芒 (精致四芒星) -->
      <path
        d="M12 2C12 7.5 7.5 12 2 12C7.5 12 12 16.5 12 22C12 16.5 16.5 12 22 12C16.5 12 12 7.5 12 2Z"
        fill="currentColor"
        fill-opacity="0.2"
      />
      <!-- 伴生微星 -->
      <path
        d="M19 2C19 4 17.5 5.5 15.5 5.5C17.5 5.5 19 7 19 9C19 7 20.5 5.5 22.5 5.5C20.5 5.5 19 4 19 2Z"
        fill="currentColor"
      />
    </svg>

    <!-- -------------------------------------------------------------------- -->
    <!-- 2. 首页 / 模组主入口 (精致几何菱形晶体 + 模块架构)                  -->
    <!-- -------------------------------------------------------------------- -->
    <svg
      v-else-if="name === 'home' || name === 'mods'"
      class="svgIcon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M3 9.5L12 2.5L21 9.5V20.5C21 21.05 20.55 21.5 20 21.5H15V14.5H9V21.5H4C3.45 21.5 3 21.05 3 20.5V9.5Z" />
    </svg>

    <!-- -------------------------------------------------------------------- -->
    <!-- 3. 游戏专区 (现代科技极简手柄，绝无卡通感)                          -->
    <!-- -------------------------------------------------------------------- -->
    <svg
      v-else-if="name === 'game' || name === 'gamepad'"
      class="svgIcon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <rect x="2" y="6" width="20" height="12" rx="6" />
      <path d="M6 12H10M8 10V14" />
      <circle cx="15.5" cy="10.5" r="1" fill="currentColor" />
      <circle cx="17.5" cy="13.5" r="1" fill="currentColor" />
    </svg>

    <!-- -------------------------------------------------------------------- -->
    <!-- 4. 装机心愿单 (纤细轻盈爱心轮廓)                                     -->
    <!-- -------------------------------------------------------------------- -->
    <svg
      v-else-if="name === 'heart'"
      class="svgIcon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>

    <!-- 4.1 装机心愿单已收藏 (饱满实心爱心) -->
    <svg
      v-else-if="name === 'heart-fill'"
      class="svgIcon"
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="none"
    >
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>

    <!-- -------------------------------------------------------------------- -->
    <!-- 5. 任务清单 (现代极简带勾便签板)                                     -->
    <!-- -------------------------------------------------------------------- -->
    <svg
      v-else-if="name === 'task' || name === 'history'"
      class="svgIcon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1.5" />
      <path d="M9 14l2 2 4-4" />
    </svg>

    <!-- -------------------------------------------------------------------- -->
    <!-- 6. 个人中心 / 我的 (纤细圆润用户剪影)                                -->
    <!-- -------------------------------------------------------------------- -->
    <svg
      v-else-if="name === 'user' || name === 'profile'"
      class="svgIcon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <circle cx="12" cy="8" r="4.5" />
      <path d="M5 20.5C5 16.91 8.13 14 12 14C15.87 14 19 16.91 19 20.5" />
    </svg>

    <!-- -------------------------------------------------------------------- -->
    <!-- 7. 搜索放大镜 (极简轻质感线性镜片)                                  -->
    <!-- -------------------------------------------------------------------- -->
    <svg
      v-else-if="name === 'search'"
      class="svgIcon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <circle cx="11" cy="11" r="7.5" />
      <path d="M21 21L16.35 16.35" />
    </svg>

    <!-- -------------------------------------------------------------------- -->
    <!-- 8. 电脑端连接 (超薄液晶显示器与底座)                                 -->
    <!-- -------------------------------------------------------------------- -->
    <svg
      v-else-if="name === 'desktop' || name === 'pc'"
      class="svgIcon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <rect x="2.5" y="3.5" width="19" height="13" rx="2" />
      <path d="M8 20.5H16M12 16.5V20.5" />
    </svg>

    <!-- -------------------------------------------------------------------- -->
    <!-- 9. 点赞 / 赞同荐标 (极简大拇指矢量)                                 -->
    <!-- -------------------------------------------------------------------- -->
    <svg
      v-else-if="name === 'like' || name === 'thumb'"
      class="svgIcon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
    </svg>

    <!-- -------------------------------------------------------------------- -->
    <!-- 10. 下载下载量 (极简托盘下箭头)                                      -->
    <!-- -------------------------------------------------------------------- -->
    <svg
      v-else-if="name === 'download'"
      class="svgIcon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>

    <!-- -------------------------------------------------------------------- -->
    <!-- 11. 配对设置 / 齿轮 (精密科技齿轮)                                   -->
    <!-- -------------------------------------------------------------------- -->
    <svg
      v-else-if="name === 'gear' || name === 'settings'"
      class="svgIcon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>

    <!-- -------------------------------------------------------------------- -->
    <!-- 12. 信号 / 测试连接 (三级无线波束)                                   -->
    <!-- -------------------------------------------------------------------- -->
    <svg
      v-else-if="name === 'wifi' || name === 'signal'"
      class="svgIcon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M5 12.55a11 11 0 0 1 14.08 0" />
      <path d="M1.42 9a16 16 0 0 1 21.16 0" />
      <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
      <line x1="12" y1="20" x2="12.01" y2="20" stroke-width="2.5" />
    </svg>

    <!-- -------------------------------------------------------------------- -->
    <!-- 13. 全网专区模式 / 经纬星环 (优雅星际经纬度球)                       -->
    <!-- -------------------------------------------------------------------- -->
    <svg
      v-else-if="name === 'globe' || name === 'world'"
      class="svgIcon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>

    <!-- -------------------------------------------------------------------- -->
    <!-- 14. 分享 / 导出 (极简上出箭头)                                       -->
    <!-- -------------------------------------------------------------------- -->
    <svg
      v-else-if="name === 'share'"
      class="svgIcon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>

    <!-- 默认兜底：Nexus 方形徽标 -->
    <text v-else class="fallbackGlyph">❖</text>
  </view>
</template>

<script>
// ============================================================================
// NexusIcon 组件逻辑：响应式尺寸与全局矢量渲染
// ============================================================================
export default {
  name: 'NexusIcon',
  props: {
    // 图标名称
    name: {
      type: String,
      required: true
    },
    // 图标尺寸 (支持 36rpx、20px、或者数字)
    size: {
      type: [String, Number],
      default: '36rpx'
    },
    // 自定义颜色 (默认继承父级 currentColor)
    color: {
      type: String,
      default: ''
    }
  },

  computed: {
    /**
     * 计算实际尺寸字符串
     */
    actualSize() {
      if (typeof this.size === 'number') {
        return `${this.size}rpx`;
      }
      return this.size || '36rpx';
    }
  }
};
</script>

<style scoped>
/* ============================================================================ */
/* NexusIcon 矢量图标样式                                                       */
/* ============================================================================ */
.nexusIconWrap {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  vertical-align: middle;
  flex-shrink: 0;
}

.svgIcon {
  width: 100%;
  height: 100%;
  display: block;
}

.fallbackGlyph {
  font-size: 32rpx;
  line-height: 1;
}
</style>
