<template>
  <!-- ======================================================================== -->
  <!-- 电脑端 Mayfly 局域网配对与连接设置弹窗组件 (DevicePairModal.vue)         -->
  <!-- ======================================================================== -->
  <view class="modalOverlay" v-if="visible" @click="close">
    <view class="deviceModalContent" @click.stop>
      <!-- -------------------------------------------------------------------- -->
      <!-- 区域一：弹窗头部与关闭按钮                                           -->
      <!-- -------------------------------------------------------------------- -->
      <view class="deviceModalHeader">
        <view class="headerTitleRow">
          <text class="modalTitle">💻 配对电脑端 Mayfly</text>
          <text class="lanBadge">同 WiFi 直连</text>
        </view>
        <view class="modalCloseBtn" @click="close">✕</view>
      </view>

      <view class="deviceModalBody">
        <!-- ------------------------------------------------------------------ -->
        <!-- 区域二：局域网雷达探测状态卡片                                     -->
        <!-- ------------------------------------------------------------------ -->
        <view class="radarCard" :class="{ isOnline: desktopOnline }">
          <view class="radarStatusRow">
            <view class="radarDot" :class="{ pulse: testingConnection, online: desktopOnline }"></view>
            <text class="radarStatusText">
              {{ testingConnection ? '正在探测局域网电脑端...' : (desktopOnline ? (isPairedAndOnline ? `电脑已连接 (${detectedHostname || form.host})` : `已发现电脑 (${detectedHostname || form.host}) · 待安全验证`) : '未检测到电脑端 (请确保在同 WiFi 下)') }}
            </text>
          </view>
          <view class="radarActionRow">
            <view class="radarHostRow">
              <text class="radarSubText">端口: {{ form.port }} · {{ form.host }}</text>
              <view v-if="form.host !== '10.204.160.22'" class="quickSwitchHostBtn" @click="useDirectHost('10.204.160.22')">
                <text class="quickSwitchHostText">👉 填入电脑IP 10.204.160.22</text>
              </view>
            </view>
            <view class="radarRefreshBtn" @click="runAutoRadarProbe">
              <text class="radarRefreshText">🔄 重新探测</text>
            </view>
          </view>
        </view>

        <!-- ------------------------------------------------------------------ -->
        <!-- 区域三：分支 A - 已配对成功状态卡片 (连接成功无需重复输动态码)       -->
        <!-- ------------------------------------------------------------------ -->
        <view class="connectedStatusCard" v-if="isPairedAndOnline && !showRePairBox">
          <view class="connHeaderRow">
            <view class="connTitleCol">
              <text class="connTitle">已安全连接至电脑</text>
              <text class="connSub">主机：{{ detectedHostname || 'Mayfly-PC' }} ({{ form.host }}:{{ form.port }})</text>
            </view>
            <text class="connBadge">已就绪</text>
          </view>
          <view class="connDescBox">
            <text class="connDescText">✅ 设备已完成安全配对。现在在手机上浏览模组，点击一键安装即可秒级投递到电脑端 Mayfly 自动下载与部署！</text>
          </view>
          <view class="connActionsRow">
            <button class="connTestBtn" :loading="testingConnection" @click="runTestConnection">
              <text class="connTestText">{{ testingConnection ? '正在测试...' : '⚡ 测试当前连接' }}</text>
            </button>
            <view class="rePairTriggerBtn" @click="showRePairBox = true">
              <text class="rePairTriggerText">🔄 重新配对</text>
            </view>
          </view>
        </view>

        <!-- ------------------------------------------------------------------ -->
        <!-- 区域三：分支 B - 首次安全验证码 (PIN) 输入卡片 (解释防骚扰机制)       -->
        <!-- ------------------------------------------------------------------ -->
        <view class="pinPairCard" v-else>
          <view class="pinHeaderRow">
            <view class="pinTitleCol">
              <text class="pinCardTitle">🔑 电脑 6 位配对动态码 (PIN)</text>
              <text class="pinCardTip">安全验证机制 · 仅需首次配对一次</text>
            </view>
            <text class="cancelRePairBtn" v-if="isPairedAndOnline && showRePairBox" @click="showRePairBox = false">取消</text>
          </view>
          <view class="pinExplainBox">
            <text class="pinExplainText">💡 为防止局域网内其他人向您的电脑推送文件，请在电脑端 Mayfly 弹出的窗口中查看 6 位动态码，输入一次即可永久免密直连：</text>
          </view>
          <view class="pinInputBox">
            <input
              class="pinInputField"
              type="number"
              maxlength="6"
              v-model="pinInput"
              placeholder="请输入电脑显示的 6 位动态码"
              placeholder-class="pinPlaceholder"
              @confirm="handlePinPair"
            />
          </view>
          <!-- 一键配对主按钮 -->
          <button
            class="primaryPairBtn"
            :disabled="pairingWithPin || !pinInput.trim()"
            @click="handlePinPair"
          >
            <text class="primaryBtnText">{{ pairingWithPin ? '正在验证配对...' : '✨ 一键配对并连接电脑' }}</text>
          </button>
        </view>

        <!-- ------------------------------------------------------------------ -->
        <!-- 区域四：快捷方式 - 测试连接、剪贴板识别与扫码                         -->
        <!-- ------------------------------------------------------------------ -->
        <view class="quickToolsRow">
          <button class="quickToolBtn primaryTool" :disabled="testingConnection" @click="runTestConnection">
            <text class="quickToolText">{{ testingConnection ? '⚡ 测试中...' : '⚡ 测试连接' }}</text>
          </button>
          <button class="quickToolBtn" @click="handlePasteLink">
            <text class="quickToolText">📋 粘贴链接</text>
          </button>
          <button class="quickToolBtn" @click="handleScanCodePair">
            <text class="quickToolText">📷 扫码</text>
          </button>
        </view>

        <!-- ------------------------------------------------------------------ -->
        <!-- 区域五：电脑端 Mayfly 客户端官方下载 (夸克网盘官方通道)              -->
        <!-- ------------------------------------------------------------------ -->
        <view class="clientDownloadBanner" @click="openClientDownload">
          <view class="downloadBannerLeft">
            <text class="downloadBannerIcon">💻</text>
            <view class="downloadBannerMeta">
              <text class="downloadBannerTitle">还没有电脑端 Mayfly？</text>
              <text class="downloadBannerSub">夸克网盘官方通道 · 点击唤起浏览器下载安装</text>
            </view>
          </view>
          <text class="downloadBannerAction">前往下载 ›</text>
        </view>
      </view>
    </view>

    <!-- 自研暗黑对话框 / 确认弹窗组件 (完全替代原生白色 uni.showModal) -->
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
// DevicePairModal 逻辑：局域网雷达探测、6 位 PIN 码一键配对与剪贴板识别
// ============================================================================
import {
  testDesktopConnection,
  verifyDesktopPin,
  scanLanDesktopCandidates,
  saveDesktopConfig,
  getDesktopConfig,
  DEFAULT_DESKTOP_CONFIG
} from '../services/nexus.js';
import NexusModal from './NexusModal.vue';

export default {
  name: 'DevicePairModal',
  components: {
    NexusModal
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    config: {
      type: Object,
      default: () => ({})
    }
  },

  data() {
    return {
      confirmModal: {
        visible: false,
        title: '提示',
        content: '',
        type: 'warning',
        icon: '',
        confirmText: '我知道了',
        cancelText: '',
        showCancel: false,
        onConfirm: null
      },
      form: {
        host: '10.204.160.22',
        port: 28888,
        deviceToken: ''
      },
      pinInput: '',
      desktopOnline: false,
      detectedHostname: '',
      testingConnection: false,
      pairingWithPin: false,
      showRePairBox: false
    };
  },

  computed: {
    /**
     * 判断当前设备是否已完成配对且保持在线
     */
    isPairedAndOnline() {
      return Boolean(this.desktopOnline && this.form.deviceToken);
    }
  },

  watch: {
    visible: {
      immediate: true,
      handler(val) {
        if (val) {
          const cfg = this.config && this.config.host ? this.config : getDesktopConfig();
          let host = (cfg.host || '').trim();
          let port = Number(cfg.port) || 28888;
          // 强制过滤早期占位假数据 192.168.1.100 和旧端口 9876
          if (!host || host === '192.168.1.100') {
            host = DEFAULT_DESKTOP_CONFIG.host || '10.204.160.22';
          }
          if (!port || port === 9876) {
            port = DEFAULT_DESKTOP_CONFIG.port || 28888;
          }
          this.form = {
            host,
            port,
            deviceToken: cfg.deviceToken || ''
          };
          this.pinInput = '';
          this.showRePairBox = false;

          // 弹窗唤起时：自动检测剪贴板中是否有电脑访问链接 + 自动触发局域网雷达并发探活
          this.$nextTick(() => {
            this.checkClipboardOnOpen();
            this.runAutoRadarProbe();
          });
        }
      }
    }
  },

  methods: {
    /**
     * 打开电脑端 Mayfly 客户端官方网盘下载地址 (夸克网盘)
     */
    openClientDownload() {
      const downloadUrl = 'https://pan.quark.cn/s/37d038a566a0';
      // #ifdef APP-PLUS
      plus.runtime.openURL(downloadUrl);
      // #endif
      // #ifndef APP-PLUS
      if (typeof window !== 'undefined') {
        window.open(downloadUrl, '_blank');
      }
      // #endif
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

    /**
     * 关闭弹窗
     */
    close() {
      this.$emit('close');
    },

    /**
     * 一键切换到当前电脑实际检测 IP (10.204.160.22)
     */
    useDirectHost(ip = '10.204.160.22') {
      this.form.host = ip;
      this.form.port = 28888;
      this.runAutoRadarProbe();
    },

    /**
     * 弹窗打开时尝试静默识别剪贴板中的电脑访问链接
     */
    checkClipboardOnOpen() {
      try {
        uni.getClipboardData({
          success: (res) => {
            const text = (res.data || '').trim();
            if (text && (text.includes(':28888') || text.includes('token=') || text.includes('10.204.160.22'))) {
              this.parseAndApplyUrl(text, true);
            }
          }
        });
      } catch (e) {}
    },

    /**
     * 局域网雷达自动探测电脑在线状态 (并发探测当前 IP 与优先候选 IP)
     */
    async runAutoRadarProbe() {
      this.testingConnection = true;
      try {
        const candidateList = [
          this.form.host,
          '10.204.160.22',
          DEFAULT_DESKTOP_CONFIG.host
        ];
        if (typeof window !== 'undefined' && window.location && window.location.hostname) {
          candidateList.push(window.location.hostname);
        }

        const scanRes = await scanLanDesktopCandidates(candidateList, Number(this.form.port) || 28888);
        if (scanRes && scanRes.found) {
          this.desktopOnline = true;
          this.form.host = scanRes.host || this.form.host;
          this.form.port = scanRes.port || 28888;
          this.detectedHostname = scanRes.hostname || '';
          if (scanRes.token) {
            this.form.deviceToken = scanRes.token;
          }
          if (scanRes.pin && !this.pinInput) {
            this.pinInput = scanRes.pin;
          }

          // 同步落盘保存探测到的真实可用电脑 IP 与连接态 (保持弹窗常驻打开，严禁在此自动触发 saved 关闭弹窗)
          const isConnected = Boolean(this.form.deviceToken);
          const newCfg = {
            host: this.form.host,
            port: this.form.port,
            deviceToken: this.form.deviceToken,
            hostname: this.detectedHostname,
            connected: isConnected
          };
          saveDesktopConfig(newCfg);
        } else {
          // 单独尝试一次当前指定的主机
          const singleRes = await testDesktopConnection(this.form.host, this.form.port, this.form.deviceToken);
          const isOk = Boolean(singleRes && (singleRes.online || singleRes === true));
          this.desktopOnline = isOk;
          if (isOk && singleRes && typeof singleRes === 'object') {
            if (singleRes.hostname) this.detectedHostname = singleRes.hostname;
            if (singleRes.token && !this.form.deviceToken) {
              this.form.deviceToken = singleRes.token;
              saveDesktopConfig({
                host: this.form.host,
                port: this.form.port,
                deviceToken: this.form.deviceToken,
                hostname: this.detectedHostname,
                connected: true
              });
            }
          }
        }
      } catch (e) {
        this.desktopOnline = false;
      } finally {
        this.testingConnection = false;
      }
    },

    /**
     * 使用 6 位 PIN 码一键配对握手换取永久 Token
     */
    async handlePinPair() {
      const pin = this.pinInput.trim();
      let host = (this.form.host || '').trim();
      let port = Number(this.form.port) || 28888;
      if (host === '192.168.1.100') {
        host = '10.204.160.22';
        this.form.host = host;
      }

      if (!host) {
        uni.showToast({ title: '请填写电脑 IP', icon: 'none' });
        return;
      }
      if (!pin) {
        uni.showToast({ title: '请输入 6 位 PIN 码', icon: 'none' });
        return;
      }

      this.pairingWithPin = true;
      try {
        // 1. 优先尝试当前设置的主机
        let verifyRes = await verifyDesktopPin(host, port, pin);

        // 2. 若当前 host 校验失败且当前不是 10.204.160.22，自动尝试真实电脑局域网 IP 回退
        if (!verifyRes.success && host !== '10.204.160.22') {
          const fallbackRes = await verifyDesktopPin('10.204.160.22', 28888, pin);
          if (fallbackRes.success) {
            verifyRes = fallbackRes;
            host = '10.204.160.22';
            port = 28888;
            this.form.host = host;
            this.form.port = port;
          }
        }

        if (verifyRes.success && verifyRes.token) {
          this.form.deviceToken = verifyRes.token;
          this.desktopOnline = true;

          const newConfig = {
            host,
            port,
            deviceToken: verifyRes.token,
            connected: true
          };
          saveDesktopConfig(newConfig);
          this.$emit('saved', newConfig);

          uni.showToast({
            title: '🎉 配对成功！已连接电脑',
            icon: 'success'
          });
          setTimeout(() => {
            this.close();
          }, 800);
        } else {
          this.confirmModal = {
            visible: true,
            title: '配对未成功',
            content: verifyRes.message || 'PIN 码不正确或连接超时，请确认电脑端弹窗显示的 6 位 PIN 码',
            type: 'warning',
            icon: 'warning',
            confirmText: '我知道了',
            cancelText: '',
            showCancel: false,
            onConfirm: null
          };
        }
      } catch (err) {
        uni.showToast({
          title: '连接超时，请检查网络',
          icon: 'none'
        });
      } finally {
        this.pairingWithPin = false;
      }
    },

    /**
     * 智能识别剪贴板或用户输入的访问链接 (如 http://10.204.160.22:28888/?token=xxx)
     */
    handlePasteLink() {
      uni.getClipboardData({
        success: (res) => {
          const text = (res.data || '').trim();
          if (!text) {
            this.promptManualPaste();
            return;
          }
          this.parseAndApplyUrl(text);
        },
        fail: () => {
          this.promptManualPaste();
        }
      });
    },

    /**
     * 弹框手动输入链接进行解析
     */
    promptManualPaste() {
      // #ifdef H5
      const url = window.prompt('请粘贴电脑端复制的访问链接 (例如 http://10.204.160.22:28888/?token=...):');
      if (url) {
        this.parseAndApplyUrl(url);
      }
      // #endif
      // #ifndef H5
      uni.showToast({
        title: '请在电脑端 Mayfly 复制局域网访问链接后再点击识别',
        icon: 'none',
        duration: 3000
      });
      // #endif
    },

    /**
     * 解析 URL 并自动填入 host, port, token
     */
    parseAndApplyUrl(rawUrl, silent = false) {
      try {
        const text = String(rawUrl || '').trim();
        let targetHost = '';
        let targetPort = 28888;
        let targetToken = '';

        // 匹配完整 URL 格式
        const match = text.match(/https?:\/\/([^:/]+)(?::(\d+))?(?:\/?\?token=([a-zA-Z0-9_-]+))?/);
        if (match) {
          targetHost = match[1];
          if (match[2]) targetPort = parseInt(match[2], 10);
          if (match[3]) targetToken = match[3];
        } else {
          // 匹配 host:port
          const parts = text.split(':');
          if (parts.length >= 2) {
            targetHost = parts[0].trim();
            targetPort = parseInt(parts[1], 10) || 28888;
          }
        }

        if (targetHost) {
          this.form.host = targetHost;
          this.form.port = targetPort;
          if (targetToken) {
            this.form.deviceToken = targetToken;
          }

          uni.showToast({
            title: '已自动识别电脑配置！',
            icon: 'success'
          });

          // 自动触发一次探测验证
          this.runTestConnection();
          return;
        }
      } catch (e) {}

      if (!silent) {
        uni.showToast({
          title: '未能识别出有效的 Mayfly 链接',
          icon: 'none'
        });
      }
    },

    /**
     * 扫一扫二维码自动填入配对配置
     */
    handleScanCodePair() {
      // #ifdef H5
      this.confirmModal = {
        visible: true,
        title: '扫码提示',
        content: '网页端暂不支持摄像头扫码，建议在上方直接输入电脑端显示的 6 位 PIN 码配对，或点击「粘贴电脑链接识别」。',
        type: 'info',
        icon: 'info',
        confirmText: '我知道了',
        cancelText: '',
        showCancel: false,
        onConfirm: null
      };
      // #endif
      // #ifndef H5
      uni.scanCode({
        success: (res) => {
          if (res.result) {
            this.parseAndApplyUrl(res.result);
          }
        },
        fail: () => {
          uni.showToast({
            title: '扫码已取消',
            icon: 'none'
          });
        }
      });
      // #endif
    },

    /**
     * 测试局域网连通性 (测试完成后更新配置与状态，弹窗常驻不退出)
     */
    async runTestConnection() {
      const host = (this.form.host || '').trim();
      const port = Number(this.form.port) || 28888;

      if (!host) {
        uni.showToast({
          title: '请先填写电脑局域网 IP',
          icon: 'none'
        });
        return;
      }

      this.testingConnection = true;
      try {
        const res = await testDesktopConnection(host, port, this.form.deviceToken);
        const isOk = Boolean(res && (res.online || res === true));
        if (isOk) {
          this.desktopOnline = true;
          if (res && typeof res === 'object') {
            if (res.hostname) this.detectedHostname = res.hostname;
            if (res.token && !this.form.deviceToken) this.form.deviceToken = res.token;
          }
          saveDesktopConfig({
            host: this.form.host,
            port: this.form.port,
            deviceToken: this.form.deviceToken,
            hostname: this.detectedHostname,
            connected: Boolean(this.form.deviceToken)
          });
          uni.showToast({
            title: '🎉 电脑端连接正常，通信畅通！',
            icon: 'success'
          });
        } else {
          this.desktopOnline = false;
          uni.showToast({
            title: '未连通，请确认电脑端 Mayfly 保持开启',
            icon: 'none'
          });
        }
      } catch (err) {
        uni.showToast({
          title: '探测超时',
          icon: 'none'
        });
      } finally {
        this.testingConnection = false;
      }
    },

    /**
     * 保存配对设置并持久化
     */
    async saveDeviceSettings() {
      const host = (this.form.host || '').trim();
      const port = Number(this.form.port) || 28888;
      const deviceToken = (this.form.deviceToken || '').trim();

      if (!host) {
        uni.showToast({
          title: 'IP 地址不能为空',
          icon: 'none'
        });
        return;
      }

      const res = await testDesktopConnection(host, port, deviceToken);
      const isOnline = Boolean(res && (res.online || res === true));
      const newConfig = {
        host,
        port,
        deviceToken: (res && res.token) ? res.token : deviceToken,
        connected: isOnline
      };

      saveDesktopConfig(newConfig);
      this.$emit('saved', newConfig);
      this.close();

      uni.showToast({
        title: isOnline ? '配对成功并已连接' : '配置已保存 (设备待机中)',
        icon: isOnline ? 'success' : 'none'
      });
    }
  }
};
</script>

<style scoped>
/* ============================================================================ */
/* DevicePairModal 弹窗样式 (移动端 + H5 自适应，防变形加固)                     */
/* ============================================================================ */
.modalOverlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.78);
  backdrop-filter: blur(10px);
  z-index: 99999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32rpx;
  box-sizing: border-box;
}

.deviceModalContent {
  width: 100%;
  max-width: 660rpx;
  background: #16181e;
  border: 1rpx solid #2b313d;
  border-radius: 28rpx;
  padding: 32rpx;
  box-shadow: 0 24rpx 64rpx rgba(0, 0, 0, 0.85);
  box-sizing: border-box;
  animation: modalPopIn 0.22s cubic-bezier(0.16, 1, 0.3, 1);
  display: flex;
  flex-direction: column;
}

@keyframes modalPopIn {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(20rpx);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* 顶栏 */
.deviceModalHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
  padding-bottom: 16rpx;
  border-bottom: 1rpx solid #232731;
}

.headerTitleRow {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.modalTitle {
  font-size: 32rpx;
  font-weight: 700;
  color: #ffffff;
}

.lanBadge {
  font-size: 20rpx;
  font-weight: 600;
  color: #34d399;
  background: rgba(16, 185, 129, 0.15);
  border: 1rpx solid rgba(52, 211, 153, 0.35);
  padding: 2rpx 10rpx;
  border-radius: 8rpx;
}

.modalCloseBtn {
  font-size: 34rpx;
  color: #9ca3af;
  padding: 8rpx 12rpx;
  cursor: pointer;
}

.deviceModalBody {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

/* 局域网雷达探测卡片 */
.radarCard {
  background: rgba(255, 255, 255, 0.03);
  border: 1rpx solid #262b35;
  border-radius: 16rpx;
  padding: 18rpx 20rpx;
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.radarCard.isOnline {
  background: rgba(16, 185, 129, 0.08);
  border-color: rgba(52, 211, 153, 0.4);
}

.radarStatusRow {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.radarDot {
  width: 14rpx;
  height: 14rpx;
  border-radius: 50%;
  background: #64748b;
}

.radarDot.online {
  background: #10b981;
  box-shadow: 0 0 10rpx #10b981;
}

.radarDot.pulse {
  background: #f59e0b;
  animation: radarPulse 1s infinite;
}

@keyframes radarPulse {
  0% { opacity: 0.4; }
  50% { opacity: 1; }
  100% { opacity: 0.4; }
}

.radarStatusText {
  font-size: 24rpx;
  font-weight: 600;
  color: #e2e8f0;
}

.radarActionRow {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10rpx;
}

.radarHostRow {
  display: flex;
  align-items: center;
  gap: 12rpx;
  flex-wrap: wrap;
}

.quickSwitchHostBtn {
  background: rgba(218, 107, 23, 0.18);
  border: 1rpx solid rgba(218, 107, 23, 0.45);
  border-radius: 8rpx;
  padding: 2rpx 10rpx;
  cursor: pointer;
}

.quickSwitchHostBtn:active {
  background: rgba(218, 107, 23, 0.35);
}

.quickSwitchHostText {
  font-size: 19rpx;
  font-weight: 600;
  color: #fb923c;
}

.radarSubText {
  font-size: 20rpx;
  color: #64748b;
  font-family: monospace;
}

.radarRefreshBtn {
  cursor: pointer;
  padding: 4rpx 10rpx;
}

.radarRefreshText {
  font-size: 20rpx;
  color: #60a5fa;
}

/* 6 位 PIN 码配对卡片 */
.pinPairCard {
  background: rgba(218, 107, 23, 0.08);
  border: 1rpx solid rgba(218, 107, 23, 0.35);
  border-radius: 20rpx;
  padding: 24rpx 20rpx;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.pinHeaderRow {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.pinCardTitle {
  font-size: 26rpx;
  font-weight: 700;
  color: #fb923c;
}

.pinCardTip {
  font-size: 20rpx;
  color: #9ca3af;
}

.pinInputBox {
  background: #0f1116;
  border: 1rpx solid rgba(251, 146, 60, 0.4);
  border-radius: 14rpx;
  padding: 12rpx 16rpx;
}

.pinInputField {
  font-size: 38rpx;
  font-weight: 800;
  color: #ffffff;
  text-align: center;
  letter-spacing: 12rpx;
  height: 64rpx;
  line-height: 64rpx;
}

.pinPlaceholder {
  color: #4b5563;
  letter-spacing: 2rpx;
  font-size: 26rpx;
  font-weight: 500;
}

/* 一键配对主按钮 (强化宽高与居中排版) */
.primaryPairBtn {
  width: 100% !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  box-sizing: border-box !important;
  height: 84rpx !important;
  line-height: normal !important;
  background: linear-gradient(135deg, #da6b17, #ea580c) !important;
  border-radius: 14rpx !important;
  border: none !important;
  margin: 0 !important;
  padding: 0 !important;
  box-shadow: 0 8rpx 20rpx rgba(218, 107, 23, 0.35);
}

.primaryPairBtn:active {
  transform: scale(0.98);
  filter: brightness(1.1);
}

.primaryPairBtn[disabled] {
  opacity: 0.55;
  filter: grayscale(0.5);
}

.primaryBtnText {
  color: #ffffff;
  font-size: 26rpx;
  font-weight: 700;
}

/* 快捷方式行 */
.quickToolsRow {
  display: flex;
  gap: 16rpx;
}

.quickToolBtn {
  flex: 1;
  width: 100% !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  box-sizing: border-box !important;
  height: 72rpx !important;
  line-height: normal !important;
  background: #20242e !important;
  border: 1rpx solid #373f50 !important;
  border-radius: 12rpx !important;
  margin: 0 !important;
  padding: 0 !important;
}

.quickToolBtn:active {
  background: #282e3b !important;
}

.quickToolText {
  font-size: 22rpx;
  font-weight: 600;
  color: #cbd5e1;
}

/* ============================================================================ */
/* 已连接就绪状态卡片样式                                                       */
/* ============================================================================ */
.connectedStatusCard {
  background: rgba(16, 185, 129, 0.08);
  border: 1rpx solid rgba(52, 211, 153, 0.35);
  border-radius: 20rpx;
  padding: 24rpx 20rpx;
  display: flex;
  flex-direction: column;
  gap: 14rpx;
}

.connHeaderRow {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.connTitleCol {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.connTitle {
  font-size: 28rpx;
  font-weight: 700;
  color: #34d399;
}

.connSub {
  font-size: 20rpx;
  color: #94a3b8;
  font-family: monospace;
}

.connBadge {
  font-size: 18rpx;
  font-weight: 700;
  color: #10b981;
  background: rgba(16, 185, 129, 0.18);
  border: 1rpx solid rgba(52, 211, 153, 0.4);
  padding: 2rpx 10rpx;
  border-radius: 6rpx;
}

.connDescBox {
  background: rgba(0, 0, 0, 0.25);
  border-radius: 12rpx;
  padding: 14rpx 16rpx;
}

.connDescText {
  font-size: 22rpx;
  color: #cbd5e1;
  line-height: 1.5;
}

.connActionsRow {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-top: 6rpx;
}

.connTestBtn {
  flex: 1;
  height: 68rpx !important;
  background: rgba(56, 189, 248, 0.15) !important;
  border: 1rpx solid rgba(56, 189, 248, 0.4) !important;
  border-radius: 12rpx !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  padding: 0 !important;
  margin: 0 !important;
}

.connTestBtn:active {
  background: rgba(56, 189, 248, 0.28) !important;
}

.connTestText {
  font-size: 24rpx;
  font-weight: 700;
  color: #38bdf8;
}

.rePairTriggerBtn {
  padding: 12rpx 16rpx;
  background: #20242e;
  border: 1rpx solid #373f50;
  border-radius: 12rpx;
  cursor: pointer;
}

.rePairTriggerBtn:active {
  background: #282e3b;
}

.rePairTriggerText {
  font-size: 22rpx;
  color: #94a3b8;
  font-weight: 500;
}

.quickToolBtn.primaryTool {
  background: rgba(56, 189, 248, 0.15) !important;
  border-color: rgba(56, 189, 248, 0.45) !important;
}

.quickToolBtn.primaryTool .quickToolText {
  color: #38bdf8;
  font-weight: 700;
}

/* ============================================================================ */
/* PIN 码辅助说明与取消切换                                                     */
/* ============================================================================ */
.pinTitleCol {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.pinCardSub {
  font-size: 20rpx;
  color: #9ca3af;
}

.pinExplainBox {
  background: rgba(0, 0, 0, 0.25);
  border-radius: 12rpx;
  padding: 12rpx 14rpx;
}

.pinExplainText {
  font-size: 21rpx;
  color: #cbd5e1;
  line-height: 1.4;
}

.cancelRePairBtn {
  font-size: 22rpx;
  color: #94a3b8;
  padding: 4rpx 10rpx;
  cursor: pointer;
}

/* ============================================================================ */
/* 电脑端 Mayfly 客户端官方网盘下载横幅                                         */
/* ============================================================================ */
.clientDownloadBanner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #171a22;
  border: 1rpx solid #2a3140;
  border-radius: 16rpx;
  padding: 18rpx 20rpx;
  cursor: pointer;
  margin-top: 4rpx;
  transition: all 0.2s;
}

.clientDownloadBanner:active {
  background: #1f232e;
  border-color: #38bdf8;
}

.downloadBannerLeft {
  display: flex;
  align-items: center;
  gap: 14rpx;
  flex: 1;
}

.downloadBannerIcon {
  font-size: 36rpx;
}

.downloadBannerMeta {
  display: flex;
  flex-direction: column;
  gap: 2rpx;
}

.downloadBannerTitle {
  font-size: 24rpx;
  font-weight: 700;
  color: #f1f5f9;
}

.downloadBannerSub {
  font-size: 19rpx;
  color: #64748b;
}

.downloadBannerAction {
  font-size: 22rpx;
  font-weight: 700;
  color: #38bdf8;
  flex-shrink: 0;
}
</style>
