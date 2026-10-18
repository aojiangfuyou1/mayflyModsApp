// ============================================================================
// 模块名称：MayflyMods 自动检测更新与资源热更新服务 (Upgrade Service)
// 功能描述：提供 wgt 资源热更新与 APK 整包增量升级，支持静默启动检测、手动检查与原生安装
// ============================================================================

// ----------------------------------------------------------------------------
// 区域 1：常量配置与默认更新服务端点
// ----------------------------------------------------------------------------

/** 默认的云端更新描述配置文件 URL (可自由配置为个人自建服务器、Gitee/GitHub Releases 或电脑宿主) */
export const DEFAULT_UPDATE_CHECK_URL = 'https://raw.githubusercontent.com/mayfly-mod/mayflymods-app/master/version.json';

/** 本地持久化更新配置 Key */
export const STORAGE_KEY_UPGRADE_CONFIG = 'mayfly_upgrade_config';

// ----------------------------------------------------------------------------
// 区域 2：本地运行环境版本信息读取
// ----------------------------------------------------------------------------

/**
 * 获取本地当前运行的应用版本信息
 * 原生 App 环境通过 plus.runtime.getProperty 读取，H5/调试环境优雅降级
 * @returns {Promise<{ versionCode: number, versionName: string, appid: string }>}
 */
export function getAppLocalVersion() {
  return new Promise((resolve) => {
    // #ifdef APP-PLUS
    try {
      plus.runtime.getProperty(plus.runtime.appid, (wgtInfo) => {
        resolve({
          versionCode: Number(wgtInfo.versionCode) || 100,
          versionName: wgtInfo.version || '1.0.0',
          appid: wgtInfo.appid || plus.runtime.appid || '__UNI__87B2EBC'
        });
      });
      return;
    } catch (e) {
      console.warn('[MayflyUpgrade] 获取 plus.runtime.getProperty 异常:', e);
    }
    // #endif

    // H5 / 小程序 / 浏览器开发环境兜底默认值
    resolve({
      versionCode: 100,
      versionName: '1.0.0',
      appid: '__UNI__87B2EBC'
    });
  });
}

/**
 * 获取检测更新的远程服务 URL (支持用户本地自定义覆盖)
 * @returns {string} 检测地址
 */
export function getUpdateCheckUrl() {
  try {
    const custom = uni.getStorageSync(STORAGE_KEY_UPGRADE_CONFIG);
    if (custom && custom.checkUrl && typeof custom.checkUrl === 'string') {
      return custom.checkUrl.trim();
    }
  } catch (e) {}
  return DEFAULT_UPDATE_CHECK_URL;
}

/**
 * 保存自定义更新服务器配置
 * @param {Object} config - 配置对象 { checkUrl: string }
 */
export function saveUpdateConfig(config) {
  try {
    uni.setStorageSync(STORAGE_KEY_UPGRADE_CONFIG, config);
  } catch (e) {
    console.warn('[MayflyUpgrade] 保存更新配置失败:', e);
  }
}

// ----------------------------------------------------------------------------
// 区域 3：云端版本检测与版本差异比对核心
// ----------------------------------------------------------------------------

/**
 * 检查应用版本更新
 * @param {Object} options
 * @param {boolean} [options.showTip=false] - 无更新时是否弹 Toast 提示 (手动检测传 true，冷启动静默传 false)
 * @param {string} [options.url=''] - 覆盖默认检测 URL
 * @returns {Promise<{ hasUpdate: boolean, updateInfo: Object|null, localVersion: Object }>}
 */
export async function checkAppUpgrade({ showTip = false, url = '' } = {}) {
  const localVersion = await getAppLocalVersion();
  const checkUrl = url || getUpdateCheckUrl();

  try {
    const res = await uni.request({
      url: checkUrl,
      method: 'GET',
      timeout: 9000
    });

    if (res.statusCode === 200 && res.data && typeof res.data === 'object') {
      const remote = res.data;
      const remoteCode = Number(remote.versionCode) || 0;
      const localCode = Number(localVersion.versionCode) || 100;

      // 核心判定：云端 versionCode 大于本地 versionCode 时触发升级
      if (remoteCode > localCode) {
        const updateInfo = {
          versionCode: remoteCode,
          versionName: remote.versionName || `v${remoteCode}`,
          updateType: remote.updateType === 'apk' ? 'apk' : 'wgt', // 'wgt' (热更新) 或 'apk' (整包更新)
          downloadUrl: remote.downloadUrl || '',
          isForce: Boolean(remote.isForce),
          title: remote.title || `发现新版本 v${remote.versionName || remoteCode}`,
          changelog: Array.isArray(remote.changelog)
            ? remote.changelog
            : (remote.changelog ? [String(remote.changelog)] : ['日常功能体验提升与优化']),
          size: remote.size || ''
        };
        return { hasUpdate: true, updateInfo, localVersion };
      }
    }

    if (showTip) {
      uni.showToast({
        title: `当前已是最新版本 (v${localVersion.versionName})`,
        icon: 'none'
      });
    }
  } catch (err) {
    if (showTip) {
      uni.showToast({
        title: '检测更新失败，请检查网络连接',
        icon: 'none'
      });
    }
  }

  return { hasUpdate: false, updateInfo: null, localVersion };
}

// ----------------------------------------------------------------------------
// 区域 4：下载引擎与原生安装器调起 (wgt 热更新 / APK 整包安装)
// ----------------------------------------------------------------------------

/**
 * 执行下载并调用原生 API 执行升级安装
 * 规范：wgt 优先使用 uni.downloadFile 内存写入后热注入，apk 大包优先使用 plus.downloader 后台守护
 * @param {Object} updateInfo - 更新元数据
 * @param {Function} [onProgress] - 下载进度实时回调 (progress: 0~100)
 * @returns {Promise<{ success: boolean, message: string, needRestart?: boolean }>}
 */
export function downloadAndInstall(updateInfo, onProgress) {
  return new Promise((resolve, reject) => {
    if (!updateInfo || !updateInfo.downloadUrl) {
      reject(new Error('下载地址无效，请检查版本配置'));
      return;
    }

    // #ifdef APP-PLUS
    const isWgt = updateInfo.updateType === 'wgt';

    // 方案 A：针对 APK 整包大文件，使用原生 plus.downloader，支持断点与防息屏断流
    if (!isWgt && plus.downloader) {
      try {
        const dtask = plus.downloader.createDownload(
          updateInfo.downloadUrl,
          {
            filename: '_doc/update/'
          },
          (download, status) => {
            if (status === 200 && download && download.filename) {
              const apkPath = download.filename;
              if (typeof onProgress === 'function') onProgress(100);

              // 自动通过原生 FileProvider 调起 Android 系统覆盖安装器
              plus.runtime.install(
                apkPath,
                { force: true },
                () => {
                  resolve({ success: true, message: '已成功唤起系统安装程序' });
                },
                (e) => {
                  reject(new Error(`唤起安装失败: ${e.message || e.code || '权限受限，请开启安装未知应用权限'}`));
                }
              );
            } else {
              reject(new Error(`APK 下载失败 (网络状态码 ${status})`));
            }
          }
        );

        // 监听下载进度
        dtask.addEventListener('statechanged', (task) => {
          if (task.state === 3 && task.totalSize > 0) {
            const percent = Math.floor((task.downloadedSize / task.totalSize) * 100);
            if (typeof onProgress === 'function') {
              onProgress(Math.min(percent, 99));
            }
          }
        });

        dtask.start();
        return;
      } catch (e) {
        console.warn('[MayflyUpgrade] plus.downloader 异常，降级至 uni.downloadFile:', e);
      }
    }

    // 方案 B：wgt 资源包极速下载与热更新注入 (轻量 1~3MB)
    const downloadTask = uni.downloadFile({
      url: updateInfo.downloadUrl,
      success: (res) => {
        if (res.statusCode === 200 && res.tempFilePath) {
          if (typeof onProgress === 'function') onProgress(100);

          // 资源包热安装
          plus.runtime.install(
            res.tempFilePath,
            { force: false },
            () => {
              if (isWgt) {
                resolve({
                  success: true,
                  message: '热更新补丁已注入完成，重启应用即可生效',
                  needRestart: true
                });
              } else {
                resolve({ success: true, message: '已成功唤起安装程序' });
              }
            },
            (e) => {
              reject(new Error(e.message || `热更新安装失败 (错误码 ${e.code})`));
            }
          );
        } else {
          reject(new Error(`下载失败 (HTTP ${res.statusCode})`));
        }
      },
      fail: (err) => {
        reject(new Error(err.errMsg || '下载中断，请重试'));
      }
    });

    if (downloadTask && typeof downloadTask.onProgressUpdate === 'function') {
      downloadTask.onProgressUpdate((p) => {
        if (typeof onProgress === 'function') {
          onProgress(p.progress);
        }
      });
    }
    return;
    // #endif

    // H5 / 网页环境兜底处理：直接打开下载链接
    if (typeof window !== 'undefined') {
      window.open(updateInfo.downloadUrl, '_blank');
      resolve({ success: true, message: '已在浏览器新窗口打开下载地址' });
    } else {
      resolve({ success: false, message: '当前运行环境不支持直接安装更新' });
    }
  });
}
