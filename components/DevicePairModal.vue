<template>
  <!-- ======================================================================== -->
  <!-- 电脑端 Mayfly 局域网配对与连接设置弹窗组件 (多页面复用)                 -->
  <!-- ======================================================================== -->
  <view class="modalOverlay" v-if="visible" @click="close">
    <view class="deviceModalContent" @click.stop>
      <!-- 弹窗顶栏 -->
      <view class="deviceModalHeader">
        <text class="modalTitle">💻 配对电脑端 Mayfly</text>
        <view class="modalCloseBtn" @click="close">✕</view>
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
            v-model="form.host"
            placeholder="例如 192.168.1.100"
          />
        </view>

        <view class="formItem">
          <text class="formLabel">通信端口</text>
          <input
            class="formInput"
            type="number"
            v-model="form.port"
            placeholder="默认 28888 或 9876"
          />
        </view>

        <view class="formItem">
          <text class="formLabel">设备配对 Token / Pin</text>
          <input
            class="formInput"
            v-model="form.deviceToken"
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
</template>

<script>
// ============================================================================
// DevicePairModal 组件逻辑：扫码与手动配置电脑端连接
// ============================================================================
import {
  testDesktopConnection,
  saveDesktopConfig,
  getDesktopConfig
} from '../services/nexus.js';

export default {
  name: 'DevicePairModal',
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
      form: {
        host: '',
        port: 9876,
        deviceToken: ''
      },
      testingConnection: false
    };
  },

  watch: {
    visible: {
      immediate: true,
      handler(val) {
        if (val) {
          const cfg = this.config && this.config.host ? this.config : getDesktopConfig();
          this.form = {
            host: cfg.host || '',
            port: cfg.port || 9876,
            deviceToken: cfg.deviceToken || 'MF-PC-8891'
          };
        }
      }
    }
  },

  methods: {
    /**
     * 关闭弹窗
     */
    close() {
      this.$emit('close');
    },

    /**
     * 扫一扫二维码自动填入配对配置
     */
    handleScanCodePair() {
      // #ifdef H5
      uni.showModal({
        title: '提示',
        content: '网页端暂不支持摄像头扫码，请在手机端 App 或小程序中使用，或直接在下方手动输入电脑 IP 与 Token。',
        showCancel: false
      });
      // #endif
      // #ifndef H5
      uni.scanCode({
        success: (res) => {
          if (res.result) {
            try {
              const data = JSON.parse(res.result);
              if (data.host) {
                this.form.host = data.host;
                this.form.port = data.port || 9876;
                this.form.deviceToken = data.deviceToken || '';
                uni.showToast({
                  title: '扫码配对成功！',
                  icon: 'success'
                });
                return;
              }
            } catch (e) {
              // 非 JSON 格式，尝试 host:port 格式
              const parts = res.result.split(':');
              if (parts.length >= 2) {
                this.form.host = parts[0];
                this.form.port = parseInt(parts[1], 10) || 9876;
                uni.showToast({
                  title: '已解析主机地址',
                  icon: 'none'
                });
                return;
              }
            }
            uni.showToast({
              title: '未识别出 Mayfly 配对码',
              icon: 'none'
            });
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
     * 测试局域网连通性
     */
    async runTestConnection() {
      const host = (this.form.host || '').trim();
      const port = Number(this.form.port) || 9876;

      if (!host) {
        uni.showToast({
          title: '请先填写电脑局域网 IP',
          icon: 'none'
        });
        return;
      }

      this.testingConnection = true;
      try {
        const isOk = await testDesktopConnection(host, port);
        if (isOk) {
          uni.showToast({
            title: '连接成功！电脑在线',
            icon: 'success'
          });
        } else {
          uni.showModal({
            title: '连接未成功',
            content: `无法连接到 ${host}:${port}。请确保：\n1. 手机与电脑在同一 WiFi 局域网\n2. 电脑端 Mayfly 已开启伴侣模式\n3. 电脑防火墙未阻止 9876 端口`,
            showCancel: false
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
      const port = Number(this.form.port) || 9876;
      const deviceToken = (this.form.deviceToken || '').trim();

      if (!host) {
        uni.showToast({
          title: 'IP 地址不能为空',
          icon: 'none'
        });
        return;
      }

      const isOnline = await testDesktopConnection(host, port);
      const newConfig = {
        host,
        port,
        deviceToken,
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
/* DevicePairModal 弹窗样式                                                     */
/* ============================================================================ */
.modalOverlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(8px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32rpx;
  box-sizing: border-box;
}

.deviceModalContent {
  width: 100%;
  max-width: 640rpx;
  background: #181a1f;
  border: 1rpx solid #2d3340;
  border-radius: 24rpx;
  padding: 32rpx;
  box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.8);
  box-sizing: border-box;
  animation: modalIn 0.25s ease-out;
}

@keyframes modalIn {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(20rpx);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.deviceModalHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
  padding-bottom: 16rpx;
  border-bottom: 1rpx solid #232731;
}

.modalTitle {
  font-size: 30rpx;
  font-weight: 700;
  color: #ffffff;
}

.modalCloseBtn {
  font-size: 32rpx;
  color: #9ca3af;
  padding: 8rpx;
  cursor: pointer;
}

.deviceForm {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.scanCodeBtn {
  background: #252a35;
  border: 1rpx solid #3d4556;
  border-radius: 12rpx;
  padding: 18rpx 0;
  margin: 0;
}

.scanCodeBtnText {
  font-size: 24rpx;
  font-weight: 700;
  color: #e5e7eb;
}

.formDividerRow {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin: 4rpx 0;
}

.dividerLine {
  flex: 1;
  height: 1rpx;
  background: #262b36;
}

.dividerText {
  font-size: 20rpx;
  color: #64748b;
}

.formItem {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.formLabel {
  font-size: 22rpx;
  font-weight: 600;
  color: #9ca3af;
}

.formInput {
  background: #1f232b;
  border: 1rpx solid #363c4a;
  border-radius: 12rpx;
  padding: 16rpx 20rpx;
  font-size: 24rpx;
  color: #ffffff;
}

.testConnBtn {
  background: #20242e;
  border: 1rpx solid #373f50;
  color: #e5e7eb;
  border-radius: 12rpx;
  font-size: 24rpx;
  font-weight: 600;
  padding: 16rpx 0;
  margin-top: 10rpx;
}

.testBtnText {
  color: #e5e7eb;
}

.saveConfigBtn {
  background: #da6b17;
  color: #ffffff;
  border-radius: 12rpx;
  font-size: 26rpx;
  font-weight: 700;
  padding: 18rpx 0;
  margin-top: 6rpx;
  border: none;
}

.saveBtnText {
  color: #ffffff;
}
</style>
