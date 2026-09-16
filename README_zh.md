# Tiny Dragger

[English](README.md) | [中文](README_zh.md)

Tiny Dragger 是一个 [Obsidian](https://obsidian.md/) **桌面** 插件，用来在 **当前文件里** 重排 Markdown **块**。悬停一块会显示 gutter 手柄，拖拽可移动或嵌套，点击手柄可转换 / 复制 / 剪切 / 删除。不会在文件之间拖拽。

块识别、移动、缩进和基础类型转换使用 MIT 协议的 [`md-dragger`](https://www.npmjs.com/package/md-dragger) 引擎（与 [Dragger](https://github.com/ariestar/obsidian-dragger) 同一领域）。手柄、菜单、原生多块选区、设置和翻译由本插件实现。

- **显示名称：** Tiny Dragger
- **插件 ID：** `tiny-dragger`
- **最低 Obsidian 版本：** 1.7.2
- **许可证：** [GPL-3.0](LICENSE)（依赖 `md-dragger` 为 MIT）
- **界面语言：** 跟随 Obsidian 应用语言。语言代码以 `zh` 开头时显示简体中文，其他语言显示英文。

## 安装

在 Obsidian **设置 → 社区插件** 中搜索 **Tiny Dragger**，安装并启用即可。仅桌面端。

不想走社区插件、或要装开发版时，见文末「从源码构建」。

## 使用说明

在 **源码模式** 和 **实时预览** 中可用。阅读视图没有手柄。

### 手柄

悬停一块。gutter 里会出现手柄（默认在左侧）：

- **四点组成的方块：** 点击打开块菜单；按住拖拽可移动该块。
- **上下短横线：** 悬停变成加号；点击可在上方或下方插入空行。

### 拖拽

- **单块：** 不要选中文字。悬停四点，按住左键拖拽。
- **多块：** 用编辑器原生选区选中若干块的文字，再从 **选区内** 某块的四点手柄拖拽。从选区外的手柄拖拽只移动那一块。
- **嵌套：** 拖拽列表、引用或 callout 时，横向移动可改缩进。基本竖直拖拽则保持原缩进。
- 按 **Escape** 取消。

### 块菜单

点击四点（不要拖拽）可将 **当前** 块转换为段落、H1–H6、无序 / 有序 / 任务列表、引用、`[!info]` / `[!warning]` / `[!danger]` / `[!example]`、代码块或数学公式块，或复制、剪切、删除。同类型转换无效果。菜单不会把多块选区作为一组转换。

## 设置

在 Obsidian **设置 → Tiny Dragger** 中：

| 设置项 | 说明 | 默认值 |
| ------- | ----------- | ------- |
| 手柄大小 | 12–28 像素，步进 2 | 20 |
| 手柄颜色 | 跟随主题色，或自定义颜色选择器 | 主题 |
| 手柄所在侧 | 左侧或右侧 gutter | 左侧 |
| 手柄横向偏移 | −80 到 80 像素 | 0 |

## 已知限制

- 仅桌面端。阅读视图和移动端没有手柄。
- 块边界遵循 `md-dragger`，可能与实时预览控件不完全一致。
- 菜单转换只作用于一块，不是多块选区。
- 行内 `$…$` 数学公式不是块。YAML frontmatter 不可拖拽。
- 不能跨文件或跨窗格拖拽。

## 开发说明

面向要改代码、本地安装或发版的人。插件用户可以忽略本章。

### 从源码构建

需要 Node.js。Windows 请在 Git Bash 或 WSL 中执行（PowerShell 不能直接跑 `./build.sh`）。

```bash
git clone https://github.com/exbob/obsidian-tiny-dragger.git
cd obsidian-tiny-dragger
npm install
./build.sh
```

成功后把 `tiny-dragger/` 复制到库的 `.obsidian/plugins/tiny-dragger/`。该目录含 `main.js`、`manifest.json`、`styles.css`。再在 **设置 → 社区插件** 中启用 **Tiny Dragger**。

`./build.sh clean` 只删除 `main.js`、`main.js.map`（若存在）和 `./tiny-dragger/`，不构建。`./build.sh` 与 `bash build.sh` 相同。

### 开发与检查

```bash
npm run dev       # 监听源码并重新构建
npm test          # 单元测试
npx tsc --noEmit  # 类型检查
npm run build     # 生产构建（只生成仓库根目录的 main.js）
./build.sh        # 生产构建并写入 tiny-dragger/
```

### 发布新版本

更新 `manifest.json` 和 `package.json` 的 `version`，在 `versions.json` 中补上映射，推送代码，并用 `tiny-dragger/` 里的 `main.js`、`manifest.json`、`styles.css` 创建 GitHub Release。Release 标签必须与版本号完全一致（例如 `1.0.0`，不要加 `v`）。详见 [Obsidian 插件发布文档](https://docs.obsidian.md/plugins/releasing/submit-plugin)。

### 项目结构

```text
build.sh
esbuild.config.mjs
manifest.json
styles.css
tiny-dragger/          # 可复制到库的安装目录
src/
  main.ts
  settings.ts
  constants.ts
  i18n/
  engine/              # md-dragger 封装
  services/            # 编辑器宿主、拖拽会话
  ui/                  # gutter、菜单、设置
tests/
docs/superpowers/specs/
```
