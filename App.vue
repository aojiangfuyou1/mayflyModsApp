<script>
import {
  getNexusApiKey,
  getDesktopConfig,
  saveDesktopConfig,
  testDesktopConnection
} from './services/nexus.js';
import { checkAppUpgrade } from './services/upgrade.js';

export default {
  onLaunch: function() {
    console.log('[Mayfly] App Launch');
    // 净化机制：未登录 Nexus 账号时彻底清除旧版写入的 18 款假数据与本地残留测试收藏
    try {
      const key = getNexusApiKey();
      if (!key) {
        uni.removeStorageSync('mayfly_my_games');
        uni.removeStorageSync('mayfly_mod_favorites');
        uni.removeStorageSync('mayfly_nexus_tracked_raw');
      }
    } catch (e) {}

    // 启动时静默检查版本更新 (延时 2 秒，避开首屏加载网络竞争)
    setTimeout(async () => {
      try {
        const { hasUpdate, updateInfo } = await checkAppUpgrade({ showTip: false });
        if (hasUpdate && updateInfo) {
          uni.$emit('show-upgrade-modal', updateInfo);
        }
      } catch (err) {}
    }, 2000);
  },
  onShow: function() {
    console.log('[Mayfly] App Show');
    // App 切到前台时，自动向电脑端发送连通性心跳，校准在线状态并通知电脑端
    try {
      const cfg = getDesktopConfig();
      if (cfg && cfg.host) {
        testDesktopConnection(cfg).then((res) => {
          const isOnline = Boolean(res && (res.online || res === true));
          if (cfg.connected !== isOnline) {
            cfg.connected = isOnline;
            saveDesktopConfig(cfg);
          }
        }).catch(() => {});
      }
    } catch (e) {}
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
