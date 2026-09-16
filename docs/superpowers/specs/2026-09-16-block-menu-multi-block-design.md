# Block menu multi-block support

Date: 2026-09-16  
Status: Approved for planning

## Problem

The block menu opened from the grip handle currently operates on a single `Block` only. Drag already supports multi-block payloads via the editor selection and `resolveDragPayload`. README documents menu convert/copy/cut/delete as single-block-only. Users expect the same selection rules for menu actions as for drag.

## Goals

- When the editor has a multi-block selection and the clicked grip is inside that selection, menu convert / copy / cut / delete apply to the whole payload.
- When the selection is collapsed, or the grip is outside the selection, behavior stays single-block (including list-row handle semantics).
- Multi-block operations commit as one editor transaction (one undo).
- Convert each selected block independently; blocks already matching the target are skipped (`noop`).
- Reuse `resolveDragPayload`; do not invent a second selection resolver.

## Non-goals

- Changing menu item layout or labels beyond copy that covers one or many blocks.
- Merging multiple blocks into one code fence / callout / heading.
- New multi-select gestures beyond the native editor selection.
- Changing drag payload rules themselves.

## Approach

Reuse the drag payload path and extend engine helpers so menu actions plan against a `BlockSelection`, then dispatch once.

## Architecture and data flow

On grip click (`onGripClick`):

1. Read the current editor selection with the same helper drag uses (`readSelectionLines` / equivalent).
2. Resolve `BlockSelection` with `resolveDragPayload({ doc, tabSize, origin: clickedBlock, selection })`.
3. Open the menu with that selection (not only the origin block).
4. Every menu action runs against that frozen payload for the lifetime of the open menu.
5. Planned edits merge into one `dispatchChanges` call.

Handle pin behavior stays as today: pin to the clicked block’s start line until the menu closes.

## Component responsibilities

### Plugin / drag session

- Resolve payload before opening the menu.
- Pass `view`, `selection` (`BlockSelection`), `event`, and `onClose` into `openBlockMenu`.

### `block-menu`

- Accept `BlockSelection` instead of a lone `Block` as the action target.
- Route convert / copy / cut / delete through multi-block-aware engine helpers.
- Keep `populateBlockMenu` UI structure unchanged.

### Engine

| Capability | Multi-block behavior |
|------------|----------------------|
| Convert | Plan each block; skip `noop`; merge non-noop `TextChange`s; if all noop, do not dispatch. Apply changes in an order that preserves offsets (typically higher document positions first). |
| Copy | Document-order contiguous slice from the first selected block’s start line through the last block’s end line (`lineRangeText` span); ensure a trailing newline like `blockText`. Preserves blank lines between blocks; not per-block text concatenation. |
| Delete | Pass the full `BlockSelection` to existing `planBlockDelete`. |
| Cut | Copy first; only delete if copy succeeds. |

Single-block callers can remain thin wrappers over the selection-based APIs, or existing single-block functions can be implemented in terms of a one-block selection.

## Error handling

- Copy failure → Notice; do not delete (same as today).
- Convert / delete / cut: plan fully before dispatch; on dispatch failure, show the existing style of Notice with detail.
- Prefer all-or-nothing application via a single planned edit set, not interleaved per-block dispatches.
- i18n / Notice / README wording should cover one or many blocks where it currently says “this block” only when that would be misleading.

## Testing

- Grip inside multi-block selection → convert / copy / cut / delete affect the whole group; one dispatch.
- Grip outside selection → only the origin block changes.
- Mixed types: blocks already at target type skipped; others convert.
- List-row selection payload matches `resolveDragPayload` (same fixtures as drag where practical).
- Existing single-block menu tests keep passing.

## Success criteria

- Multi-block menu actions match drag’s selection inclusion rules.
- One undo undoes a multi-block menu convert / cut / delete.
- Single-block menu behavior is unchanged when there is no applicable multi-block payload.
- README / README_zh no longer list “menu only acts on one block” as a known limitation; they describe the shared selection rule.

## Implementation notes

- Do not change `resolveDragPayload` unless a shared bug is found; menu should call it as-is.
- README updates belong in the same implementation plan as the code.
