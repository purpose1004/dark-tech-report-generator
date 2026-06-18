---
name: dark-tech-report-generator
description: Turn a report.json into an editable, dark-tech-style PowerPoint (.pptx) work report. Use for monthly / quarterly / half-year / annual reports when the user wants an editable PPTX deck. Supports zh/en labels, configurable fonts and status colors. 把 report.json 生成暗黑科技风、可编辑的 PPTX 工作汇报（月报/季报/半年报/年报），支持中英文与可配置字体、状态色。
---

# Dark-Tech Report Generator

Render a structured `report.json` into a dark-tech, **editable** `.pptx` deck. Data and styling are separated: content lives in JSON, layout lives in `src/build.js`. Re-run after editing data.

Runs on any harness (Claude Code / Cursor / Codex / plain CLI). Pure JS, offline, deterministic.

## Prerequisites
- Node.js (>= 18)
- `npm install pptxgenjs` (run once in this folder)

## Usage
```bash
# CLI (after `npm install`):
npx dark-tech-report <input.json> [output.pptx]
# or run the script directly:
node src/build.js <input.json> [output.pptx]
```
Default output: same dir & name as input, `.pptx`. Invalid input prints `ERROR:` lines and exits 1; non-fatal issues print `WARN:`.

## Themes
`meta.theme`: `"dark"` (default) / `"midnight"` / `"light"`, or an object `{ "preset": "dark", "accent": "FF6B35", ... }` to override individual colors. Presets live in `src/themes.js`.

## Schema & validation
Full JSON Schema: `report.schema.json` (draft-07) — use it for editor autocomplete or to let an agent self-check its `report.json`. `src/build.js` also runs a built-in lightweight structural check before rendering.

## Localization
- `meta.locale`: `"zh"` (default) or `"en"` — switches built-in UI strings (section titles, legend, column headers).
- Override any label via `meta.labels` (deep-merged over the locale pack). Example: `"labels": { "kpiCols": { "kpi": "本月目标", "actual": "实际进展" } }`.
- Add a new language by adding a locale block in `src/labels.js`.

## Status colors (decoupled from language)
Each scorecard item resolves a color by, in order:
1. `item.color` (hex) — explicit override
2. `item.level` — one of `done | doing | pending | bonus`
3. `item.status` text — matched against aliases in `src/labels.js` (zh + en)

Colors: done=green, doing=blue, pending=grey, bonus=purple.

## Fonts (cross-platform)
`meta.fonts = { zh, latin, mono }`. Defaults: zh `Microsoft YaHei`, latin `Arial`, mono `Consolas`.
For CJK on macOS/Linux, set `meta.fonts.zh` to a CJK font present on the target machine (e.g. `"Noto Sans SC"`, `"PingFang SC"`).

## Data schema (report.json)
All fields optional; missing sections are skipped. Full examples in `examples/`.

- `meta`: `title` `eyebrow` `period` `author` `dept` `date` `summary` `locale` `labels` `fonts` `logo`(path) `highlights_title` `next_title` `next_eyebrow` `summary_slogan`
- `cover.info_cards`: 1–3 × `{label, value, note}`
- `metrics`: any count (3/row) × `{label, value, unit?, note?}`
- `kpi_scorecard`: array; each item → one slide
  - simple: `{category, items:[{kpi, actual, status|level|color}]}`
  - merged (one table with a Category column): `{category, merged:true, items:[{cat, kpi, actual, status|level}]}`
- `main_lines`: array
  - timeline slide: `{name, subtitle?, timeline:[{month|label, title, desc}], value?}`
  - two-column points (auto-paired): `{name, subtitle?, points:[...]}`
- `highlights`: 4 per slide × `{title, headline?, points:[...]}`
- `issues`: N columns × `{title, content}`
- `next_half` (or `next_plan`): rows × `{goal, milestone, node?}`
- `summary`: string

## Styling (built-in)
16:9, dark `#0A1224` + glow accents (green `#4CE2B0` / blue `#5F8CFF`), rounded panels, hairline borders, auto page numbers.

## QA (optional, cross-platform)
LibreOffice: `soffice --headless --convert-to pdf out.pptx` then `pdftoppm -png out.pdf slide`. Or open the `.pptx` in PowerPoint and edit directly.
