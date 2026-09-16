# Tiny Dragger

[English](README.md) | [中文](README_zh.md)

Tiny Dragger is an [Obsidian](https://obsidian.md/) **desktop** plugin that rearranges Markdown **blocks inside the current file**. Hover a block to show a gutter handle, drag to move or nest it, and click the handle for convert / copy / cut / delete. It does not drag between files.

Block detection, moves, indent, and basic type conversion use the MIT [`md-dragger`](https://www.npmjs.com/package/md-dragger) engine (the same domain as [Dragger](https://github.com/ariestar/obsidian-dragger)). Handles, menus, native multi-block selection, settings, and translations are implemented in this plugin.

- **Display name:** Tiny Dragger
- **Plugin ID:** `tiny-dragger`
- **Minimum Obsidian version:** 1.7.2
- **License:** [GPL-3.0](LICENSE) (the `md-dragger` dependency is MIT)
- **UI language:** Follows the Obsidian app language. Codes starting with `zh` show Simplified Chinese. All other languages show English.

## Install

In Obsidian, open **Settings → Community plugins**, search for **Tiny Dragger**, then install and enable it. Desktop only.

To skip the community directory or install a development build, see “Build from source” at the end.

## Usage

Works in **Source mode** and **Live Preview**. Reading view has no handles.

### Handle

Hover a block. A handle appears in the left gutter:

- **Four dots** in a square: click to open the block menu; press and drag to move the block.
- **Short lines** above and below: hover to turn them into pluses; click to insert a blank line above or below.

### Drag

- **Single block:** do not select text. Hover the four dots, hold the left button, and drag.
- **Multiple blocks:** select the text of several blocks with the editor’s native selection, then drag from the four-dot handle of a block **inside** that selection. Dragging from a handle outside the selection moves only that one block.
- **Nesting:** while dragging lists, quotes, or callouts, move horizontally to change indent. A mostly vertical drag keeps the original indent.
- Press **Escape** to cancel.

### Block menu

Click the four dots (without dragging) to convert the **current** block to paragraph, H1–H6, bulleted / numbered / task list, quote, `[!info]` / `[!warning]` / `[!danger]` / `[!example]`, code block, or math block, or to copy, cut, or delete it. Same-type conversions do nothing. The menu does not convert a multi-block selection as a group.

## Settings

Under Obsidian **Settings → Tiny Dragger**:

| Setting | Description | Default |
| ------- | ----------- | ------- |
| Handle size | 12–28 px, step 2 | 20 |
| Handle color | Theme accent, or a custom color picker | Theme |
| Handle horizontal offset | −80 to 80 px | 0 |

## Known limits

- Desktop only. No handles in reading view or on mobile.
- Block boundaries follow `md-dragger` and may not match Live Preview widgets exactly.
- Menu conversion applies to one block, not a multi-block selection.
- Inline `$…$` math is not a block. YAML frontmatter is not draggable.
- No cross-file or cross-pane dragging.

## Development

For people who change the code, install locally, or publish a release. Plugin users can skip this chapter.

### Build from source

Requires Node.js. On Windows, run this in Git Bash or WSL (PowerShell cannot run `./build.sh` directly).

```bash
git clone https://github.com/exbob/obsidian-tiny-dragger.git
cd obsidian-tiny-dragger
npm install
./build.sh
```

Then copy `tiny-dragger/` into the vault at `.obsidian/plugins/tiny-dragger/`. That directory contains `main.js`, `manifest.json`, and `styles.css`. Enable **Tiny Dragger** under **Settings → Community plugins**.

`./build.sh clean` only deletes `main.js`, `main.js.map` (if present), and `./tiny-dragger/`. It does not build. `./build.sh` and `bash build.sh` are the same.

### Develop and check

```bash
npm run dev       # watch source and rebuild
npm test          # unit tests
npx tsc --noEmit  # typecheck
npm run build     # production build (writes main.js at the repo root only)
./build.sh        # production build and write tiny-dragger/
```

### Publish a new version

Bump `version` in `manifest.json` and `package.json`, add the mapping in `versions.json`, push, and create a GitHub Release from `tiny-dragger/`’s `main.js`, `manifest.json`, and `styles.css`. The release tag must match the version exactly (for example `1.0.0`, with no `v` prefix). See the [Obsidian plugin publishing docs](https://docs.obsidian.md/plugins/releasing/submit-plugin).

### Project layout

```text
build.sh
esbuild.config.mjs
manifest.json
styles.css
tiny-dragger/          # install directory to copy into a vault
src/
  main.ts
  settings.ts
  constants.ts
  i18n/
  engine/              # md-dragger wrappers
  services/            # editor host, drag session
  ui/                  # gutter, menu, settings
tests/
docs/superpowers/specs/
```
