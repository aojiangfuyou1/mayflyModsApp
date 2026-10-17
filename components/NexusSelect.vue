<template>
  <!-- ======================================================================== -->
  <!-- 组件名称：NexusSelect 暗黑自研下拉与底栏选择器组件                     -->
  <!-- 功能描述：完全替代原生丑陋的白色滚轮 Picker，提供与 Mayfly 暗黑风格   -->
  <!--           无缝契合的 Floating Dropdown 与 Bottom Action Sheet 两种形态 -->
  <!-- ======================================================================== -->
  <view class="nexusSelectContainer" :class="[modeClass]">
    <!-- 1. 触发区 (支持插槽自定义触发，或默认暗黑按钮触发) -->
    <view class="selectTriggerWrap" @click="handleToggleOpen">
      <slot>
        <view class="defaultTriggerBtn" :class="{ active: isOpen, disabled: disabled }">
          <NexusIcon :name="icon" size="24rpx" color="#cbd5e1" style="margin-right: 8rpx;" v-if="icon" />
          <text class="defaultTriggerText">{{ selectedLabel }}</text>
          <text class="defaultTriggerArrow" :class="{ rotate: isOpen }">⌄</text>
        </view>
      </slot>
    </view>

    <!-- -------------------------------------------------------------------- -->
    <!-- 2A. 形态一：Floating Dropdown 浮动下拉浮层 (适用于紧凑工具栏)         -->
    <!-- -------------------------------------------------------------------- -->
    <block v-if="mode === 'dropdown' && isOpen">
      <!-- 极轻量遮罩层 (点击任意处收起) -->
      <view class="dropdownBackdrop" @click="closeMenu" @touchmove.stop.prevent></view>

      <!-- 下拉菜单列表容器 -->
      <view class="dropdownMenuCard" :style="dropdownStyle">
        <view
          class="dropdownItem"
          v-for="(opt, idx) in normalizedOptions"
          :key="idx"
          :class="{ active: isOptionSelected(opt, idx) }"
          @click.stop="handleSelect(opt, idx)"
        >
          <view class="dropdownItemLeft">
            <NexusIcon :name="opt.icon" size="22rpx" :color="isOptionSelected(opt, idx) ? '#da6b17' : '#94a3b8'" style="margin-right: 10rpx;" v-if="opt.icon" />
            <text class="dropdownItemLabel">{{ opt.label }}</text>
          </view>
          <text class="dropdownCheckmark" v-if="isOptionSelected(opt, idx)">✓</text>
        </view>
      </view>
    </block>

    <!-- -------------------------------------------------------------------- -->
    <!-- 2B. 形态二：Bottom Action Sheet 暗黑半屏底栏 (移动端高保真大屏触控)   -->
    <!-- -------------------------------------------------------------------- -->
    <block v-if="mode === 'sheet' && isOpen">
      <!-- 暗黑半透明磨砂遮罩 -->
      <view class="sheetBackdrop" @click="closeMenu" @touchmove.stop.prevent></view>

      <!-- 从底部滑出面板 -->
      <view class="sheetActionCard">
        <!-- 头部标题栏 -->
        <view class="sheetHeaderRow">
          <text class="sheetHeaderTitle">{{ title || '请选择' }}</text>
          <view class="sheetCloseBtn" @click="closeMenu">
            <text class="sheetCloseIcon">✕</text>
          </view>
        </view>

        <!-- 选项列表 -->
        <scroll-view class="sheetOptionsScroll" scroll-y>
          <view
            class="sheetOptionItem"
            v-for="(opt, idx) in normalizedOptions"
            :key="idx"
            :class="{ active: isOptionSelected(opt, idx) }"
            @click="handleSelect(opt, idx)"
          >
            <view class="sheetItemLeft">
              <NexusIcon :name="opt.icon" size="28rpx" :color="isOptionSelected(opt, idx) ? '#da6b17' : '#94a3b8'" style="margin-right: 14rpx;" v-if="opt.icon" />
              <text class="sheetOptionText">{{ opt.label }}</text>
            </view>
            <view class="sheetRadioCircle" :class="{ checked: isOptionSelected(opt, idx) }">
              <text class="sheetRadioCheckmark" v-if="isOptionSelected(opt, idx)">✓</text>
            </view>
          </view>
        </scroll-view>

        <!-- 底部取消按钮 -->
        <view class="sheetCancelRow">
          <button class="sheetCancelBtn" @click="closeMenu">
            <text class="sheetCancelBtnText">取消</text>
          </button>
        </view>
      </view>
    </block>
  </view>
</template>

<script>
// ============================================================================
// NexusSelect 脚本逻辑：暗黑风格自定义下拉选择器
// ============================================================================
import NexusIcon from './NexusIcon.vue';

export default {
  name: 'NexusSelect',
  components: {
    NexusIcon
  },
  props: {
    /** 选项数组 (支持 string[] 或 { label, value, icon }[]) */
    options: {
      type: Array,
      default: () => []
    },
    /** 当前选中值 (可为 index 数字，或匹配 value 的字符串) */
    value: {
      type: [Number, String],
      default: 0
    },
    /** 弹出半屏底栏时的标题 */
    title: {
      type: String,
      default: ''
    },
    /** 展示模式: 'dropdown' (浮动下拉) | 'sheet' (暗黑半屏底栏) */
    mode: {
      type: String,
      default: 'dropdown'
    },
    /** 自定义触发按钮的前置图标 */
    icon: {
      type: String,
      default: ''
    },
    /** 占位文案 */
    placeholder: {
      type: String,
      default: '请选择'
    },
    /** 是否禁用 */
    disabled: {
      type: Boolean,
      default: false
    },
    /** 自定义下拉浮层宽度 (如 '280rpx') */
    dropdownWidth: {
      type: String,
      default: ''
    }
  },

  data() {
    return {
      isOpen: false
    };
  },

  computed: {
    modeClass() {
      return `mode-${this.mode}`;
    },

    dropdownStyle() {
      if (this.dropdownWidth) {
        return `min-width: ${this.dropdownWidth};`;
      }
      return '';
    },

    normalizedOptions() {
      if (!Array.isArray(this.options)) return [];
      return this.options.map((opt, idx) => {
        if (typeof opt === 'string' || typeof opt === 'number') {
          return {
            label: String(opt),
            value: opt,
            index: idx
          };
        }
        return {
          label: opt.label || opt.text || String(opt.value !== undefined ? opt.value : idx),
          value: opt.value !== undefined ? opt.value : idx,
          icon: opt.icon || '',
          index: idx
        };
      });
    },

    selectedLabel() {
      const opts = this.normalizedOptions;
      if (opts.length === 0) return this.placeholder;

      // 1. 若入参为数字下标直接命中
      if (typeof this.value === 'number' && this.value >= 0 && this.value < opts.length) {
        return opts[this.value].label;
      }
      // 2. 按 value 键值检索
      const found = opts.find((o) => o.value === this.value);
      if (found) return found.label;

      return opts[0] ? opts[0].label : this.placeholder;
    }
  },

  methods: {
    handleToggleOpen() {
      if (this.disabled) return;
      this.isOpen = !this.isOpen;
    },

    closeMenu() {
      this.isOpen = false;
    },

    isOptionSelected(opt, idx) {
      if (typeof this.value === 'number') {
        return this.value === idx || this.value === opt.value;
      }
      return this.value === opt.value;
    },

    handleSelect(opt, idx) {
      this.closeMenu();
      // 向外抛出事件，完全兼容原生的 @change (含 e.detail.value = idx)
      this.$emit('change', {
        detail: { value: idx },
        index: idx,
        value: opt.value,
        label: opt.label
      });
      this.$emit('select', opt);
      this.$emit('input', idx);
    }
  }
};
</script>

<style scoped>
/* ============================================================================ */
/* NexusSelect 样式规范 (100% 契合 Mayfly 深黑暗金美学)                         */
/* ============================================================================ */
.nexusSelectContainer {
  position: relative;
  display: inline-block;
}

.selectTriggerWrap {
  cursor: pointer;
}

/* 默认暗黑触发按钮 */
.defaultTriggerBtn {
  display: inline-flex;
  align-items: center;
  background: #181a20;
  border: 1rpx solid #272d3b;
  border-radius: 12rpx;
  padding: 8rpx 16rpx;
  cursor: pointer;
  transition: all 0.2s ease;
}

.defaultTriggerBtn.active {
  border-color: #da6b17;
  background: #20242e;
}

.defaultTriggerBtn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.defaultTriggerText {
  font-size: 22rpx;
  color: #cbd5e1;
  font-weight: 600;
}

.defaultTriggerArrow {
  font-size: 20rpx;
  color: #94a3b8;
  margin-left: 8rpx;
  transition: transform 0.2s ease;
}

.defaultTriggerArrow.rotate {
  transform: rotate(180deg);
}

/* ---------------------------------------------------------------------------- */
/* 2A. Floating Dropdown 浮动下拉浮层                                           */
/* ---------------------------------------------------------------------------- */
.dropdownBackdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: transparent;
  z-index: 998;
}

.dropdownMenuCard {
  position: absolute;
  top: calc(100% + 8rpx);
  left: 0;
  min-width: 240rpx;
  max-width: 80vw;
  background: #181b22;
  border: 1rpx solid #2e374a;
  border-radius: 14rpx;
  box-shadow: 0 16rpx 40rpx rgba(0, 0, 0, 0.7);
  z-index: 999;
  overflow: hidden;
  animation: dropFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes dropFadeIn {
  from {
    opacity: 0;
    transform: translateY(-8rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dropdownItem {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16rpx 20rpx;
  border-bottom: 1rpx solid rgba(255, 255, 255, 0.04);
  cursor: pointer;
  transition: background 0.15s ease;
}

.dropdownItem:last-child {
  border-bottom: none;
}

.dropdownItem:hover,
.dropdownItem:active {
  background: #242935;
}

.dropdownItem.active {
  background: rgba(218, 107, 23, 0.12);
}

.dropdownItemLeft {
  display: flex;
  align-items: center;
}

.dropdownItemLabel {
  font-size: 22rpx;
  color: #cbd5e1;
  font-weight: 500;
}

.dropdownItem.active .dropdownItemLabel {
  color: #da6b17;
  font-weight: 700;
}

.dropdownCheckmark {
  font-size: 22rpx;
  color: #da6b17;
  font-weight: 900;
  margin-left: 16rpx;
}

/* ---------------------------------------------------------------------------- */
/* 2B. Bottom Action Sheet 半屏底栏                                             */
/* ---------------------------------------------------------------------------- */
.sheetBackdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.72);
  backdrop-filter: blur(8px);
  z-index: 1000;
  animation: backdropFade 0.25s ease;
}

@keyframes backdropFade {
  from { opacity: 0; }
  to { opacity: 1; }
}

.sheetActionCard {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #16181f;
  border-top: 1rpx solid #2d3648;
  border-radius: 32rpx 32rpx 0 0;
  padding: 24rpx 30rpx;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
  box-shadow: 0 -12rpx 36rpx rgba(0, 0, 0, 0.6);
  z-index: 1001;
  animation: slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

.sheetHeaderRow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 20rpx;
  border-bottom: 1rpx solid #232731;
}

.sheetHeaderTitle {
  font-size: 28rpx;
  font-weight: 700;
  color: #f1f5f9;
}

.sheetCloseBtn {
  width: 44rpx;
  height: 44rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.sheetCloseIcon {
  font-size: 28rpx;
  color: #94a3b8;
}

.sheetOptionsScroll {
  max-height: 55vh;
  margin-top: 12rpx;
}

.sheetOptionItem {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 12rpx;
  border-bottom: 1rpx solid rgba(255, 255, 255, 0.04);
  cursor: pointer;
}

.sheetOptionItem:last-child {
  border-bottom: none;
}

.sheetOptionItem.active {
  background: rgba(218, 107, 23, 0.08);
  border-radius: 12rpx;
}

.sheetItemLeft {
  display: flex;
  align-items: center;
}

.sheetOptionText {
  font-size: 26rpx;
  color: #cbd5e1;
  font-weight: 500;
}

.sheetOptionItem.active .sheetOptionText {
  color: #da6b17;
  font-weight: 700;
}

.sheetRadioCircle {
  width: 38rpx;
  height: 38rpx;
  border-radius: 50%;
  border: 2rpx solid #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.sheetRadioCircle.checked {
  background: #da6b17;
  border-color: #da6b17;
}

.sheetRadioCheckmark {
  font-size: 22rpx;
  color: #ffffff;
  font-weight: 900;
  line-height: 1;
}

.sheetCancelRow {
  padding-top: 20rpx;
}

.sheetCancelBtn {
  background: #202430;
  border-radius: 16rpx;
  padding: 16rpx 0;
  border: 1rpx solid #2e3547;
  line-height: 1.4;
  margin: 0;
}

.sheetCancelBtnText {
  font-size: 24rpx;
  color: #94a3b8;
  font-weight: 600;
}
</style>
