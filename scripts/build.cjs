// ============================================================================
// 模块名称：MayflyMods 移动端极速构建与静态检查脚本 (Build Script)
// 功能描述：验证项目静态文件、页面配置与语法完整性，确保构建合规
// ============================================================================

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

console.log('[MayflyBuild] 开始执行 MayflyMods 移动端工程构建检查...');

// 1. 检查必要核心文件
const requiredFiles = [
  'pages.json',
  'manifest.json',
  'App.vue',
  'main.js',
  'pages/index/index.vue',
  'pages/games/games.vue',
  'pages/favorites/favorites.vue',
  'pages/history/history.vue',
  'pages/detail/detail.vue',
  'components/NexusHeader.vue',
  'components/NexusDrawer.vue',
  'components/NexusAuthModal.vue',
  'components/DevicePairModal.vue',
  'components/PushHistoryModal.vue',
  'components/ModCard.vue',
  'services/nexus.js',
  'services/translate.js',
  'services/remote-channel.js',
  'services/history.js',
  'services/favorites.js',
  'services/poster.js'
];

let hasError = false;

for (const file of requiredFiles) {
  const fullPath = path.join(rootDir, file);
  if (!fs.existsSync(fullPath)) {
    console.error(`[MayflyBuild] ❌ 缺失关键文件: ${file}`);
    hasError = true;
  } else {
    console.log(`[MayflyBuild] ✓ 文件校验通过: ${file}`);
  }
}

// 2. 检查 pages.json 合法性
try {
  const pagesJsonPath = path.join(rootDir, 'pages.json');
  const pagesContent = fs.readFileSync(pagesJsonPath, 'utf8');
  // 简易去除注释并解析 JSON
  const cleanJson = pagesContent.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
  const parsed = JSON.parse(cleanJson);
  if (!parsed.pages || !Array.isArray(parsed.pages)) {
    throw new Error('pages.json 缺少有效的 pages 数组配置');
  }
  console.log(`[MayflyBuild] ✓ 页面路由解析成功，共注册 ${parsed.pages.length} 个页面`);
} catch (err) {
  console.error('[MayflyBuild] ❌ pages.json 解析失败:', err.message);
  hasError = true;
}

// 3. 严格校验所有 Vue 文件的模板标签匹配与闭合完整性 (防止 Invalid end tag)
const vueFiles = [
  'App.vue',
  'pages/index/index.vue',
  'pages/games/games.vue',
  'pages/favorites/favorites.vue',
  'pages/history/history.vue',
  'pages/detail/detail.vue',
  'components/NexusHeader.vue',
  'components/NexusDrawer.vue',
  'components/NexusAuthModal.vue',
  'components/DevicePairModal.vue',
  'components/PushHistoryModal.vue',
  'components/ModCard.vue'
];
for (const vFile of vueFiles) {
  try {
    const fullPath = path.join(rootDir, vFile);
    if (!fs.existsSync(fullPath)) continue;
    const vContent = fs.readFileSync(fullPath, 'utf8');
    const tMatch = vContent.match(/<template>([\s\S]*?)<\/template>/);
    if (!tMatch) continue;

    const tStr = tMatch[1];
    const stack = [];
    const tagReg = /<(\/)?([a-zA-Z0-9_-]+)([\s\S]*?)>/g;
    let m;
    while ((m = tagReg.exec(tStr)) !== null) {
      const isClose = Boolean(m[1]);
      const tagName = m[2];
      const attrs = m[3];
      const isSelf = attrs.trim().endsWith('/') || ['input'].includes(tagName);

      if (isSelf && !isClose) continue;

      if (isClose) {
        if (stack.length === 0) {
          throw new Error(`在标签闭合时发现多余的 </${tagName}>，标签栈为空！`);
        }
        const top = stack.pop();
        if (top !== tagName) {
          throw new Error(`标签不匹配：期望 </${top}>，但遇到 </${tagName}>！`);
        }
      } else {
        stack.push(tagName);
      }
    }

    if (stack.length > 0) {
      throw new Error(`存在未闭合的标签: ${stack.join(', ')}`);
    }

    console.log(`[MayflyBuild] ✓ Vue 模板标签闭合验证通过: ${vFile}`);
  } catch (tErr) {
    console.error(`[MayflyBuild] ❌ ${vFile} 模板解析异常:`, tErr.message);
    hasError = true;
  }
}

if (hasError) {
  console.error('[MayflyBuild] 构建检查未通过，请检查上述错误。');
  process.exit(1);
}

console.log('[MayflyBuild] 🎉 MayflyMods 移动端构建与校验全部通过！');
process.exit(0);
