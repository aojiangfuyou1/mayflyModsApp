<script>
export default {
  onLaunch: function() {
    console.log('[Mayfly] App Launch');
  },
  onShow: function() {
    console.log('[Mayfly] App Show');
  },
  onHide: function() {
    console.log('[Mayfly] App Hide');
  }
};
</script>

<style>
/* ============================================================================ */
/* 全局样式基底：彻底隐藏原生滚动条，保持纯粹移动端体验与暗黑质感 */
/* ============================================================================ */

/* 彻底隐藏浏览器全平台原生滚动条 */
::-webkit-scrollbar {
  display: none !important;
  width: 0 !important;
  height: 0 !important;
  -webkit-appearance: none !important;
  background: transparent !important;
}

* {
  scrollbar-width: none !important;
  -ms-overflow-style: none !important;
  box-sizing: border-box;
}

/* 兼容 uni-app 各端 scroll-view 伪元素 */
uni-scroll-view .uni-scroll-view::-webkit-scrollbar,
.uni-scroll-view::-webkit-scrollbar,
scroll-view::-webkit-scrollbar {
  display: none !important;
  width: 0 !important;
  height: 0 !important;
  color: transparent !important;
  background: transparent !important;
}

/* ============================================================================ */
/* 全局系统级轻提示与模态弹窗最高层级保障 (确保 Toast 与 Modal 绝不被任何浮层遮挡) */
/* ============================================================================ */
uni-toast,
.uni-sample-toast,
.uni-toast,
uni-modal,
.uni-modal,
uni-actionsheet,
.uni-actionsheet {
  z-index: 999999 !important;
}
</style>
