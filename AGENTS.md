# AGENTS.md

本文件用于约束在本仓库中协作的 AI 编码代理行为。

## 1. 基本要求
- 默认使用中文交流，回答简洁直接。
- 优先执行用户请求，不做与需求无关的大改动。
- 修改代码前先阅读相关文件上下文，避免破坏现有逻辑。

## 2. 代码修改规范
- 仅修改与当前任务相关的文件和片段。
- 保持现有项目风格（命名、缩进、语法风格）一致。
- 不随意重构、不删除用户已有功能，除非用户明确要求。
- 如引入新依赖，必须先说明用途与影响。
- 每步修改都将功能分好区域，分割线写好，代码的注释也要写好，每个方法的注释，然后重点代码的注释
## 3. Git 规则（重要）
- 每次开始代码修改前，固定执行两条命令：`git add -A`，然后 `git commit -m "备份点"`。
- 不要在 `git commit` 后追加其他参数。
- 修改后不需要调用任何git命令做操作，我只需要修改前提交备份就行。
- 未经用户明确要求，不要运行 `git diff` 和 `git status`。
- 未经用户明确要求，不要执行 `git push`。
- 禁止使用破坏性命令（如 `git reset --hard`）回滚用户改动。
- 改完自动运行 ` npm run build`


## 4. 验证与反馈
- 回复用户时需包含：
  - 改了哪些文件
  - 做了什么改动
  - 是否已提交（如已提交则提供 `git commit` + 提交信息）

## 5. 对 uni-app/前端页面的补充约束
- 优先使用现有组件和样式体系，不擅自改动全局风格。
- 文案修改注意中文编码与显示正确，避免乱码。
- 涉及页面跳转、事件绑定时，确保模板与 `methods` 对应一致。

## 6.重要这个项目是rubick的插件项目
- 项目里面所有使用rubick的地方都改成mayfly
- mayfly才是关键项目变量

## 7. 动态规则必装前置闭环规范（重要）
- 凡是游戏生态需要必装前置（如 Script Extender、ModLoader、前置补丁，例如 BG3SE、SMAPI、Stracker's Loader、UE4SS、REFramework 等）：
- 绝不能仅做安装分拣通道，必须在动态规则单文件中同步配置好 `prerequisites` 属性！
- 必须包含完整元数据：`id`、`name`、`gameFileMarkers`（检测标记）、`requiredForModTypeIds`（关联类型）、`tutorialUrl`、`provisioning`（一键下载/静默部署配置）。
- 实现【压缩包分拣落盘 + 前置状态体检与一键下载】双重绝对闭环。

## 8. 严禁将第三方外部管理器作为必装前置（重要）
- Mayfly 本身就是全功能 Mod 管理器，严禁将任何第三方外部管理器（如 Fluffy Mod Manager、MO2、Vortex 等外部独立 EXE）作为必装前置（`prerequisites`）强判断！
- 必装前置仅限游戏引擎运行期真正的物理底层依赖（Runtime Hook、Script Extender、底座 DLL 等，如 REFramework、UE4SS、SKSE）。
- 凡是社区带有第三方管理器结构（如 Fluffy 的 `modinfo.ini`）的模组包，Mayfly 必须直接原生穿透、解构并部署游戏真实资产（如 `natives/...`、`.pak` 等），直接在原生层面替代外部管理器，绝不允许让用户产生“套娃管理器”体验或误报前置缺失！

## 9. 严禁无中生有虚构“伪前置”（重要）
- 必须严格区分【真正的物理底层运行库/Hook依赖】与【游戏原生支持目录/封包】：
  - **真正前置（必须闭环配置 `prerequisites`）**：仅限不装就无法加载 Mod 的物理底层 Hook、Script Extender 或引擎外挂（如 UE4SS、REFramework、SMAPI、SKSE、BepInEx、MelonLoader 等 DLL/Loader）。
  - **原生开箱即用（严禁配置任何伪前置，`prerequisites` 必须设为 `[]`）**：若游戏本身引擎就能直接读取模组（如放进游戏自带的 `Mods/`、`Override/`、`StreamingAssets/Mods/`、`ph/source/`、`DW/`、`~mods/` 即可生效），则属于原生开箱即用，其 `prerequisites` 必须严格设为空数组 `[]`，并导出 `detectPrerequisites` 直接返回 `[]`！
- 严禁将游戏本体已有的目录、原生数据封包容器（如 `ph/source`、`Data3.pak`）或普通文件夹捏造成所谓“加载基座/前置补丁”，防止管理器误报前置缺失！



