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
  'pages/index/index.vue'
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

if (hasError) {
  console.error('[MayflyBuild] 构建检查未通过，请检查上述错误。');
  process.exit(1);
}

console.log('[MayflyBuild] 🎉 MayflyMods 移动端构建与校验全部通过！');
process.exit(0);
