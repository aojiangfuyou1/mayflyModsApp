<template>
  <!-- ======================================================================== -->
  <!-- 区域 1：矢量图标容器 (Uni-app App-plus / Android APK / H5 全端原生渲染)    -->
  <!-- 说明：改用 Uni-app 核心 image 组件配合 Base64 Data URI 动态矢量渲染，      -->
  <!--       彻底解决移动端真机打包 APK 下无法解析原生 SVG 标签导致图标空白的问题   -->
  <!-- ======================================================================== -->
  <view
    class="nexusIconWrap"
    :style="{
      width: actualSize,
      height: actualSize
    }"
  >
    <!-- 1.1 主矢量图标：通过 Base64 Data URI 的原生 image 组件呈现 -->
    <image
      v-if="iconSrc"
      class="nexusIconImg"
      :src="iconSrc"
      mode="aspectFit"
    ></image>

    <!-- 1.2 兜底缺省符：当图标名称未匹配时显示方块微标 -->
    <text
      v-else
      class="fallbackGlyph"
      :style="{ color: resolvedColor }"
    >❖</text>
  </view>
</template>

<script>
// ============================================================================
// 区域 2：纯 JavaScript 高性能 UTF-8 转 Base64 编码器
// 优势：无需借助 window.btoa 或 Buffer，完全兼容 Uni-app 小程序、App、H5 各端环境
// ============================================================================
const B64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/**
 * 将 UTF-8 字符串转换为 Base64 字符串
 * @param {string} str - 原始 SVG 字符串
 * @returns {string} Base64 编码后的文本
 */
function toBase64(str) {
  if (!str) return '';
  const utf8Bytes = [];
  // 逐字符转换为 UTF-8 字节序列
  for (let i = 0; i < str.length; i++) {
    let charCode = str.charCodeAt(i);
    if (charCode < 0x80) {
      utf8Bytes.push(charCode);
    } else if (charCode < 0x800) {
      utf8Bytes.push(0xc0 | (charCode >> 6), 0x80 | (charCode & 0x3f));
    } else if (charCode < 0xd800 || charCode >= 0xe000) {
      utf8Bytes.push(0xe0 | (charCode >> 12), 0x80 | ((charCode >> 6) & 0x3f), 0x80 | (charCode & 0x3f));
    } else {
      // 代理对 (Surrogate Pairs)
      i++;
      charCode = 0x10000 + (((charCode & 0x3ff) << 10) | (str.charCodeAt(i) & 0x3ff));
      utf8Bytes.push(
        0xf0 | (charCode >> 18),
        0x80 | ((charCode >> 12) & 0x3f),
        0x80 | ((charCode >> 6) & 0x3f),
        0x80 | (charCode & 0x3f)
      );
    }
  }

  // 3 字节转 4 字符的标准 Base64 算法
  let result = '';
  let i = 0;
  const len = utf8Bytes.length;
  while (i < len) {
    const b0 = utf8Bytes[i++];
    const b1 = i < len ? utf8Bytes[i++] : NaN;
    const b2 = i < len ? utf8Bytes[i++] : NaN;

    const enc1 = b0 >> 2;
    const enc2 = ((b0 & 3) << 4) | (isNaN(b1) ? 0 : b1 >> 4);
    const enc3 = isNaN(b1) ? 64 : ((b1 & 15) << 2) | (isNaN(b2) ? 0 : b2 >> 6);
    const enc4 = isNaN(b2) ? 64 : b2 & 63;

    result +=
      B64_CHARS.charAt(enc1) +
      B64_CHARS.charAt(enc2) +
      (enc3 === 64 ? '=' : B64_CHARS.charAt(enc3)) +
      (enc4 === 64 ? '=' : B64_CHARS.charAt(enc4));
  }
  return result;
}

// ============================================================================
// 区域 3：SVG 矢量图标字典 (注入标准 xmlns 命名空间与动态主题色)
// ============================================================================
const SVG_ICONS = {
  // --------------------------------------------------------------------------
  // 1. AI 智能灵动双星 (优雅星芒，对标 Apple Intelligence / Gemini)
  // --------------------------------------------------------------------------
  ai: (color) =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C12 7.5 7.5 12 2 12C7.5 12 12 16.5 12 22C12 16.5 16.5 12 22 12C16.5 12 12 7.5 12 2Z" fill="${color}" fill-opacity="0.2"/><path d="M19 2C19 4 17.5 5.5 15.5 5.5C17.5 5.5 19 7 19 9C19 7 20.5 5.5 22.5 5.5C20.5 5.5 19 4 19 2Z" fill="${color}"/></svg>`,
  sparkles: (color) => SVG_ICONS.ai(color),

  // --------------------------------------------------------------------------
  // 2. 首页 / 模组主入口 (精致几何建筑晶体)
  // --------------------------------------------------------------------------
  home: (color) =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9.5L12 2.5L21 9.5V20.5C21 21.05 20.55 21.5 20 21.5H15V14.5H9V21.5H4C3.45 21.5 3 21.05 3 20.5V9.5Z"/></svg>`,
  mods: (color) => SVG_ICONS.home(color),

  // --------------------------------------------------------------------------
  // 3. 游戏专区 (现代科技极简手柄)
  // --------------------------------------------------------------------------
  game: (color) =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="6"/><path d="M6 12H10M8 10V14"/><circle cx="15.5" cy="10.5" r="1" fill="${color}"/><circle cx="17.5" cy="13.5" r="1" fill="${color}"/></svg>`,
  gamepad: (color) => SVG_ICONS.game(color),

  // --------------------------------------------------------------------------
  // 4. 装机心愿单 (纤细轻盈爱心轮廓)
  // --------------------------------------------------------------------------
  heart: (color) =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`,

  // 4.1 装机心愿单已收藏 (饱满实心爱心)
  'heart-fill': (color) =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" stroke="none"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`,

  // --------------------------------------------------------------------------
  // 5. 任务清单 (现代极简带勾便签板)
  // --------------------------------------------------------------------------
  task: (color) =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1.5"/><path d="M9 14l2 2 4-4"/></svg>`,
  history: (color) => SVG_ICONS.task(color),

  // --------------------------------------------------------------------------
  // 6. 个人中心 / 我的 (纤细圆润用户剪影)
  // --------------------------------------------------------------------------
  user: (color) =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4.5"/><path d="M5 20.5C5 16.91 8.13 14 12 14C15.87 14 19 16.91 19 20.5"/></svg>`,
  profile: (color) => SVG_ICONS.user(color),

  // --------------------------------------------------------------------------
  // 7. 搜索放大镜 (极简轻质感线性镜片)
  // --------------------------------------------------------------------------
  search: (color) =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7.5"/><path d="M21 21L16.35 16.35"/></svg>`,

  // --------------------------------------------------------------------------
  // 8. 电脑端连接 (超薄液晶显示器与底座)
  // --------------------------------------------------------------------------
  desktop: (color) =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="3.5" width="19" height="13" rx="2"/><path d="M8 20.5H16M12 16.5V20.5"/></svg>`,
  pc: (color) => SVG_ICONS.desktop(color),

  // --------------------------------------------------------------------------
  // 9. 点赞 / 赞同荐标 (极简大拇指矢量)
  // --------------------------------------------------------------------------
  like: (color) =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>`,
  thumb: (color) => SVG_ICONS.like(color),

  // --------------------------------------------------------------------------
  // 10. 下载下载量 (极简托盘下箭头)
  // --------------------------------------------------------------------------
  download: (color) =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,

  // --------------------------------------------------------------------------
  // 11. 配对设置 / 齿轮 (精密科技齿轮)
  // --------------------------------------------------------------------------
  gear: (color) =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
  settings: (color) => SVG_ICONS.gear(color),

  // --------------------------------------------------------------------------
  // 12. 信号 / 测试连接 (三级无线波束)
  // --------------------------------------------------------------------------
  wifi: (color) =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20" stroke-width="2.5"/></svg>`,
  signal: (color) => SVG_ICONS.wifi(color),

  // --------------------------------------------------------------------------
  // 13. 全网专区模式 / 经纬星环 (优雅星际经纬度球)
  // --------------------------------------------------------------------------
  globe: (color) =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
  world: (color) => SVG_ICONS.globe(color),

  // --------------------------------------------------------------------------
  // 14. 分享 / 导出 (极简上出箭头)
  // --------------------------------------------------------------------------
  share: (color) =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>`,

  // --------------------------------------------------------------------------
  // 15. 垃圾桶 / 删除清空 (极简线性垃圾桶)
  // --------------------------------------------------------------------------
  trash: (color) =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>`,
  delete: (color) => SVG_ICONS.trash(color),

  // --------------------------------------------------------------------------
  // 16. 刷新 / 同步 (双环逆时针箭头)
  // --------------------------------------------------------------------------
  refresh: (color) =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>`,
  sync: (color) => SVG_ICONS.refresh(color),

  // --------------------------------------------------------------------------
  // 17. 勾选 / 完成 (极简高亮对勾)
  // --------------------------------------------------------------------------
  check: (color) =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,

  // --------------------------------------------------------------------------
  // 18. 警示 / 危险 (极简圆润三角叹号)
  // --------------------------------------------------------------------------
  alert: (color) =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  warning: (color) => SVG_ICONS.alert(color),

  // --------------------------------------------------------------------------
  // 19. 信息 / 提示 (极简圆圈 i 标)
  // --------------------------------------------------------------------------
  info: (color) =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,

  // --------------------------------------------------------------------------
  // 20. 趋势 / 热门排行 (右上折线上升箭头)
  // --------------------------------------------------------------------------
  trending: (color) =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>`,

  // --------------------------------------------------------------------------
  // 21. 返回箭头 / 左导航 (极简纤细返回箭头)
  // --------------------------------------------------------------------------
  back: (color) =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>`,
  'arrow-left': (color) => SVG_ICONS.back(color),
  'chevron-left': (color) =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>`,

  // --------------------------------------------------------------------------
  // 22. 外部超链接 / 原帖 (极简斜向外链标)
  // --------------------------------------------------------------------------
  link: (color) =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`
};

// ============================================================================
// 区域 4：Vue 组件导出与响应式计算逻辑
// ============================================================================
export default {
  name: 'NexusIcon',
  props: {
    // 图标名称 (如 'home', 'gamepad', 'heart', 'task', 'search', 'like' 等)
    name: {
      type: String,
      required: true
    },
    // 图标尺寸 (支持 36rpx、20px、或纯数字默认 rpx)
    size: {
      type: [String, Number],
      default: '36rpx'
    },
    // 渲染颜色 (十六进制如 '#da6b17'，默认保底为灰色 '#94a3b8')
    color: {
      type: String,
      default: ''
    }
  },

  computed: {
    /**
     * 计算实际外层容器尺寸
     * @returns {string} 格式化尺寸字符串
     */
    actualSize() {
      if (typeof this.size === 'number') {
        return `${this.size}rpx`;
      }
      return this.size || '36rpx';
    },

    /**
     * 计算解析后的生效颜色 (默认优雅金属灰 #94a3b8)
     * @returns {string} 有效色彩代码
     */
    resolvedColor() {
      return this.color || '#94a3b8';
    },

    /**
     * 计算并生成动态 Base64 Data URI
     * 原理：通过纯 JS 动态将 SVG 模板与主题色合成，转换为 Base64 并绑定给原生 image 组件
     * @returns {string} 'data:image/svg+xml;base64,...' 或空字符串
     */
    iconSrc() {
      if (!this.name) return '';
      const iconKey = String(this.name).toLowerCase().trim();
      const generator = SVG_ICONS[iconKey];
      if (!generator) return '';
      // 生成注入动态颜色的标准 SVG 字符串
      const svgXml = generator(this.resolvedColor);
      // 转为 Base64 Data URI
      return 'data:image/svg+xml;base64,' + toBase64(svgXml);
    }
  }
};
</script>

<style scoped>
/* ============================================================================ */
/* 区域 5：NexusIcon 基础样式 (跨端标准 Flex 布局与防拉伸)                       */
/* ============================================================================ */
.nexusIconWrap {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  vertical-align: middle;
  flex-shrink: 0;
}

/* 核心：原生 image 标签 100% 充满外层容器，保持矢量宽高比 */
.nexusIconImg {
  width: 100%;
  height: 100%;
  display: block;
}

/* 兜底字符样式 */
.fallbackGlyph {
  font-size: 32rpx;
  line-height: 1;
}
</style>
