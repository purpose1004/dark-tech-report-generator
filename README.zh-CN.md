# 暗黑科技风汇报生成器（Dark-Tech Report Generator）

[English](README.md) | **简体中文**

用一份结构化的 `report.json` 生成暗黑科技风、**可编辑**的 PowerPoint（`.pptx`）工作汇报——月报、季报、半年报、年报均可。数据与样式分离：改 JSON 重跑，版式保持一致。产物是真正的 `.pptx`，可在 PowerPoint / Keynote / WPS 里继续编辑。

可在任意 Agent 环境（Claude Code / Cursor / Codex）或纯 CLI 下运行。纯 JS、离线、可重复。

## 效果截图
<p align="center">
  <img src="examples/preview/01-cover.png" width="49%" alt="封面" />
  <img src="examples/preview/02-overview.png" width="49%" alt="概览指标" />
  <img src="examples/preview/03-kpi-merged.png" width="49%" alt="KPI 记分牌（合并表）" />
  <img src="examples/preview/04-timeline.png" width="49%" alt="时间轴" />
</p>

> 从任意 `.pptx` 重新生成截图：`node scripts/preview.js out.pptx`（需要 LibreOffice + poppler）。

## 快速开始

作为 CLI（安装后）：
```bash
npm install            # 安装 pptxgenjs
npx dark-tech-report examples/monthly.zh.json out.pptx
# 或全局安装：  npm i -g .  &&  dark-tech-report report.json out.pptx
```

或直接运行脚本：
```bash
npm install
node src/build.js examples/monthly.zh.json out.zh.pptx
```

## 特性
- **国际化（i18n）** —— 内置 `zh` / `en` 词包（`meta.locale`），可用 `meta.labels` 覆盖任意文案。
- **状态色与语言解耦** —— 用 `level`（`done|doing|pending|bonus`）或 `color`，不再依赖写死的中文词。
- **主题预设** —— `meta.theme`：`"dark"`（默认）/ `"midnight"` / `"light"`，或用对象覆盖单个颜色。
- **可配置字体** —— `meta.fonts = { zh, latin, mono }`，方便跨平台中文显示。
- **输入校验** —— 结构检查 + 清晰报错（致命错误退出码 1）；完整 JSON Schema 见 [`report.schema.json`](./report.schema.json)，供编辑器/Agent 使用。
- **抗溢出** —— KPI 表、指标卡、要点列、路线图行按条目数量自动缩放字号/高度。
- **通用区块 + 汇报快捷键** —— 既可用 `sections` 通用区块（封面/陈述/正文/指标/表格/卡片/分栏/时间轴/账单行/总结）承载任意内容，也兼容旧的 `metrics / kpi_scorecard / main_lines / highlights / issues / next_half / summary` 字段。

## 数据结构与选项
完整字段说明见 [`SKILL.md`](./SKILL.md)；可运行的 `report.json` 示例（中 / 英 / 通用区块）见 [`examples/`](./examples/)。

## 预览 / QA
```bash
soffice --headless --convert-to pdf out.pptx
pdftoppm -png out.pdf slide      # 每页一张 PNG
```
或直接打开 `.pptx`。

## 许可证
[MIT](./LICENSE)
