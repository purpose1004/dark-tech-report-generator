#!/usr/bin/env node
/*
 * Dark-Tech Report Generator
 * 把 report.json 生成为暗黑科技风、可在 PowerPoint 编辑的 .pptx。
 * CLI:  dark-tech-report <input.json> [output.pptx]
 *
 * 两种数据模式（可混用，向后兼容）：
 *   A) 通用区块: data.sections = [{ type, ... }]  —— 任意内容/格式
 *   B) 汇报快捷键: data.metrics / kpi_scorecard / main_lines / highlights / issues / next_half / summary
 *      —— 会自动转换成等价区块。
 * Schema: ../report.schema.json ；示例: ../examples/
 */
const pptxgen = require("pptxgenjs");
const fs = require("fs");
const { LABELS, STATUS_ALIASES } = require("./labels");
const { resolveTheme } = require("./themes");
const { validate } = require("./validate");

const inPath = process.argv[2];
if (!inPath || inPath === "-h" || inPath === "--help") {
  console.log("Usage: dark-tech-report <input.json> [output.pptx]");
  process.exit(inPath ? 0 : 1);
}
let data;
try { data = JSON.parse(fs.readFileSync(inPath, "utf8")); }
catch (e) { console.error("无法读取/解析 JSON:", e.message); process.exit(1); }

const { errs, warns } = validate(data);
warns.forEach(w => console.warn("WARN:", w));
if (errs.length) { errs.forEach(e => console.error("ERROR:", e)); process.exit(1); }

const outPath = process.argv[3] || inPath.replace(/\.json$/i, "") + ".pptx";
const meta = data.meta || {};

// ---- theme ----
const TH = resolveTheme(meta.theme);
const BG = TH.bg, PANEL = TH.panel, PANEL2 = TH.panel2, LINE = TH.line;
const TEXT = TH.text, MUTED = TH.muted, FAINT = TH.faint;
const GREEN = TH.accent, BLUE = TH.blue, GREY = TH.grey, PURPLE = TH.purple;
const LEVEL_COLORS = { done: GREEN, doing: BLUE, pending: GREY, bonus: PURPLE };

// ---- i18n ----
const locale = meta.locale === "en" ? "en" : "zh";
function deepMerge(base, over) {
  const out = Array.isArray(base) ? base.slice() : Object.assign({}, base);
  for (const k of Object.keys(over || {})) {
    out[k] = over[k] && typeof over[k] === "object" && !Array.isArray(over[k])
      ? deepMerge(base[k] || {}, over[k]) : over[k];
  }
  return out;
}
const L = deepMerge(LABELS[locale], meta.labels || {});

// ---- fonts ----
const fonts = Object.assign({ zh: "Microsoft YaHei", latin: "Arial", mono: "Consolas" }, meta.fonts || {});
const FZ = locale === "en" ? fonts.latin : fonts.zh;
const FNUM = fonts.latin;
const FMONO = fonts.mono;

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

function statusColor(item) {
  if (!item) return MUTED;
  if (item.color) return String(item.color).replace(/^#/, "");
  let lvl = item.level;
  if (!lvl && item.status != null) {
    const s = String(item.status).trim().toLowerCase();
    for (const [k, arr] of Object.entries(STATUS_ALIASES)) { if (arr.some(a => a.toLowerCase() === s)) { lvl = k; break; } }
  }
  return LEVEL_COLORS[lvl] || MUTED;
}

const pres = new pptxgen();
pres.defineLayout({ name: "W", width: 13.333, height: 7.5 });
pres.layout = "W";
pres.author = meta.author || "";
pres.title = meta.title || "Report";
const W = 13.333, H = 7.5, MX = 0.6;

// ================= shared chrome =================
let pageNo = 0, TOTAL = 0;
function base(eyebrow) {
  const s = pres.addSlide();
  s.background = { color: BG };
  pageNo++;
  if (eyebrow !== null) {
    s.addText(eyebrow || "", { x: MX, y: 0.4, w: 8, h: 0.32, fontFace: FMONO, fontSize: 11, color: GREEN, charSpacing: 3, bold: true });
    s.addText(`${String(pageNo).padStart(2, "0")} / ${TOTAL}`, { x: W - MX - 1.6, y: 0.4, w: 1.6, h: 0.32, align: "right", fontFace: FMONO, fontSize: 11, color: FAINT, charSpacing: 2 });
  }
  return s;
}
function head(s, t, sub) {
  if (t) s.addText(t, { x: MX, y: 0.82, w: W - 2 * MX, h: 0.8, fontFace: FZ, fontSize: 30, bold: true, color: TEXT });
  if (sub) s.addText(sub, { x: MX + 0.02, y: 1.62, w: W - 2 * MX, h: 0.4, fontFace: FZ, fontSize: 13, color: MUTED });
}
function panel(s, x, y, w, h, fill) {
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.06, fill: { color: fill || PANEL }, line: { color: LINE, width: 1 } });
}
function legend(s, x, y) {
  const items = [[L.legend.done, GREEN], [L.legend.doing, BLUE], [L.legend.pending, GREY], [L.legend.bonus, PURPLE]];
  let cx = x;
  items.forEach(([t, c]) => {
    s.addText("●", { x: cx, y, w: 0.25, h: 0.3, fontSize: 11, color: c });
    s.addText(t, { x: cx + 0.22, y, w: 1.8, h: 0.3, fontFace: FZ, fontSize: 10, color: MUTED });
    cx += 2.05;
  });
}
const bullets = (arr, fs, sa) => (arr || []).map(t => ({ text: String(t), options: { bullet: { code: "2022", indent: 12 }, breakLine: true, paraSpaceAfter: sa } }));

// ================= block renderers =================
const BLOCKS = {
  cover(b) {
    const s = base(null);
    s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: W, h: 0.12, fill: { color: GREEN } });
    if (b.logo) { try { if (fs.existsSync(b.logo)) s.addImage({ path: b.logo, x: MX, y: 0.55, w: 1.0, h: 1.0, sizing: { type: "contain", w: 1.0, h: 1.0 } }); } catch (e) {} }
    if (b.eyebrow) s.addText(b.eyebrow, { x: MX, y: 1.9, w: 11, h: 0.4, fontFace: FMONO, fontSize: 13, color: GREEN, charSpacing: 3 });
    s.addText(b.title || "Report", { x: MX, y: 2.4, w: 12, h: 1.4, fontFace: FZ, fontSize: 54, bold: true, color: TEXT });
    if (b.period) s.addText(b.period, { x: MX + 0.05, y: 3.85, w: 9, h: 0.5, fontFace: FMONO, fontSize: 16, color: MUTED, charSpacing: 2 });
    const cards = b.cards || [];
    const cw = 4.6, gap = 0.4, ch = 1.5, gy = 4.75;
    cards.slice(0, 3).forEach((c, i) => {
      const x = MX + i * (cw + gap);
      panel(s, x, gy, cw, ch);
      s.addText(c.label || "", { x: x + 0.25, y: gy + 0.18, w: cw - 0.5, h: 0.3, fontFace: FMONO, fontSize: 10, color: GREEN, charSpacing: 2 });
      s.addText(String(c.value || ""), { x: x + 0.25, y: gy + 0.5, w: cw - 0.5, h: 0.5, fontFace: FZ, fontSize: 20, bold: true, color: TEXT });
      s.addText(c.note || "", { x: x + 0.25, y: gy + 1.05, w: cw - 0.5, h: 0.35, fontFace: FZ, fontSize: 10.5, color: MUTED });
    });
    const sig = [b.author, b.dept].filter(Boolean).join(" · ") + (b.date ? "   " + b.date : "");
    if (sig.trim()) s.addText(sig, { x: W - 6.6, y: 6.7, w: 6, h: 0.4, align: "right", fontFace: FZ, fontSize: 12, color: MUTED });
  },

  statement(b) {
    const s = base(b.eyebrow);
    if (b.eyebrowOnly) { /* keep top chrome only */ }
    s.addText(b.title || b.text || "", { x: MX, y: 2.2, w: W - 2 * MX, h: 2.0, fontFace: FZ, fontSize: 44, bold: true, color: TEXT, valign: "top" });
    if (b.sub) s.addText(b.sub, { x: MX, y: 4.4, w: W - 2 * MX - 1, h: 1.2, fontFace: FZ, fontSize: 16, color: MUTED, lineSpacingMultiple: 1.3 });
  },

  text(b) {
    const s = base(b.eyebrow);
    head(s, b.title, b.subtitle);
    const body = Array.isArray(b.body) ? b.body : [b.body].filter(Boolean);
    s.addText(body.map((p, i) => ({ text: String(p), options: { breakLine: true, paraSpaceAfter: 10 } })),
      { x: MX, y: 2.1, w: W - 2 * MX - 0.5, h: 4.6, fontFace: FZ, fontSize: 15, color: MUTED, lineSpacingMultiple: 1.35, valign: "top" });
  },

  metrics(b) {
    const s = base(b.eyebrow);
    head(s, b.title);
    if (b.lead) s.addText(b.lead, { x: MX, y: 1.55, w: W - 2 * MX, h: 0.8, fontFace: FZ, fontSize: 12.5, color: MUTED, lineSpacingMultiple: 1.2 });
    const m = b.items || []; if (!m.length) return;
    const cols = 3, gx = 0.3, gy = 0.3, aw = W - 2 * MX, cw = (aw - (cols - 1) * gx) / cols;
    const rows = Math.ceil(m.length / cols), y0 = b.lead ? 2.7 : 2.3, avail = 6.95 - y0;
    const ch = clamp((avail - (rows - 1) * gy) / rows, 1.15, 1.62);
    const numFs = ch >= 1.5 ? 38 : ch >= 1.32 ? 32 : 26;
    m.forEach((it, i) => {
      const r = Math.floor(i / cols), c = i % cols;
      const x = MX + c * (cw + gx), y = y0 + r * (ch + gy);
      panel(s, x, y, cw, ch);
      s.addShape(pres.shapes.RECTANGLE, { x, y, w: 0.07, h: ch, fill: { color: GREEN } });
      s.addText(it.label || "", { x: x + 0.3, y: y + 0.16, w: cw - 0.6, h: 0.3, fontFace: FMONO, fontSize: 10, color: GREEN, charSpacing: 2 });
      s.addText([{ text: String(it.value), options: { fontFace: FNUM, fontSize: numFs, bold: true, color: TEXT } }, { text: it.unit ? " " + it.unit : "", options: { fontFace: FZ, fontSize: 14, color: MUTED } }],
        { x: x + 0.3, y: y + 0.44, w: cw - 0.6, h: ch - 0.85, align: "left", valign: "middle" });
      if (it.note) s.addText(it.note, { x: x + 0.3, y: y + ch - 0.42, w: cw - 0.6, h: 0.34, fontFace: FZ, fontSize: 10, color: MUTED });
    });
  },

  table(b) {
    const s = base(b.eyebrow);
    head(s, b.title, b.subtitle);
    if (b.legend) legend(s, MX + 5.0, 0.95);
    const cols = b.columns || [], rowsData = b.rows || [];
    const statusCol = b.statusCol == null ? -1 : (b.statusCol < 0 ? cols.length + b.statusCol : b.statusCol);
    const accentCols = b.accentCols || [];
    const nRows = rowsData.length + 1, rowH = clamp(4.95 / nRows, 0.32, 0.5);
    const fs = rowH >= 0.46 ? 10.5 : rowH >= 0.4 ? 9.8 : rowH >= 0.34 ? 9 : 8.3, hf = fs + 1;
    const mkH = t => ({ text: String(t), options: { fill: { color: PANEL2 }, color: GREEN, bold: true, fontFace: FZ, fontSize: hf, align: "left", valign: "middle", border: [{ type: "solid", color: LINE, pt: 1 }] } });
    const out = [cols.map(mkH)];
    rowsData.forEach(r => {
      out.push(r.map((c, ci) => {
        const obj = c && typeof c === "object" ? c : null;
        const text = obj ? (obj.text != null ? obj.text : "") : (c != null ? c : "");
        let color = TEXT, bold = false, align = "left";
        if (ci === statusCol) { color = statusColor(obj || { status: c }); bold = true; align = "center"; }
        else if (accentCols.includes(ci)) { color = BLUE; bold = true; }
        if (obj) { if (obj.muted) color = MUTED; if (obj.color) color = String(obj.color).replace(/^#/, ""); if (obj.level) color = LEVEL_COLORS[obj.level] || color; if (obj.bold != null) bold = obj.bold; if (obj.align) align = obj.align; }
        return { text: String(text), options: { color, bold, align, valign: "middle", fontFace: FZ, fontSize: fs, fill: { color: PANEL }, border: [{ type: "solid", color: LINE, pt: 1 }] } };
      }));
    });
    let colW = b.colW;
    if (!colW) {
      const n = cols.length;
      if (n === 3) colW = [4.4, 6.0, 1.73];
      else if (n === 4) colW = [1.5, 3.3, 5.6, 1.73];
      else colW = Array(n).fill((W - 2 * MX) / n);
    }
    s.addTable(out, { x: MX, y: 2.05, w: W - 2 * MX, colW, rowH, valign: "middle", autoPage: false });
  },

  cards(b) {
    const s = base(b.eyebrow);
    head(s, b.title);
    const items = (b.items || []).slice(0, 4);
    const aw = W - 2 * MX, gx = 0.3, gy = 0.3, cw = (aw - gx) / 2, ch = 2.35, y0 = 2.05;
    items.forEach((h, i) => {
      const r = Math.floor(i / 2), c = i % 2;
      const x = MX + c * (cw + gx), y = y0 + r * (ch + gy);
      panel(s, x, y, cw, ch);
      s.addShape(pres.shapes.RECTANGLE, { x, y, w: 0.07, h: ch, fill: { color: GREEN } });
      if (h.title) s.addText(h.title, { x: x + 0.3, y: y + 0.16, w: cw - 0.6, h: 0.35, fontFace: FZ, fontSize: 14, bold: true, color: GREEN });
      if (h.headline) s.addText(h.headline, { x: x + 0.3, y: y + 0.52, w: cw - 0.6, h: 0.4, fontFace: FZ, fontSize: 11.5, bold: true, color: TEXT });
      const ty = h.headline ? 0.98 : 0.6;
      if (h.points) s.addText(bullets(h.points, 9.5, 3), { x: x + 0.3, y: y + ty, w: cw - 0.6, h: ch - ty - 0.15, fontFace: FZ, fontSize: 9.5, color: MUTED, lineSpacingMultiple: 1.05, valign: "top" });
      else if (h.desc) s.addText(h.desc, { x: x + 0.3, y: y + ty, w: cw - 0.6, h: ch - ty - 0.15, fontFace: FZ, fontSize: 10.5, color: MUTED, lineSpacingMultiple: 1.25, valign: "top" });
    });
  },

  columns(b) {
    const s = base(b.eyebrow);
    head(s, b.title, b.subtitle);
    const items = (b.items || []).slice(0, 4), n = items.length || 1;
    const aw = W - 2 * MX, gx = 0.3, cw = (aw - (n - 1) * gx) / n, y = 2.1, hgt = 4.7;
    const maxLen = Math.max(...items.map(p => (p.points || []).length), 1);
    const pf = maxLen <= 5 ? 11 : maxLen <= 7 ? 10 : maxLen <= 9 ? 9.2 : 8.4;
    const psa = maxLen <= 5 ? 7 : maxLen <= 8 ? 5 : 3;
    items.forEach((it, i) => {
      const x = MX + i * (cw + gx);
      panel(s, x, y, cw, hgt);
      if (b.bar) s.addShape(pres.shapes.RECTANGLE, { x, y, w: cw, h: 0.07, fill: { color: BLUE } });
      let ty = y + 0.28;
      if (b.numbered) { s.addText(String(i + 1).padStart(2, "0"), { x: x + 0.3, y: y + 0.25, w: cw - 0.6, h: 0.6, fontFace: FNUM, fontSize: n <= 3 ? 26 : 22, bold: true, color: BLUE }); ty = y + 0.95; }
      if (it.title) { s.addText(it.title, { x: x + 0.3, y: ty, w: cw - 0.6, h: 0.6, fontFace: FZ, fontSize: b.numbered ? 14 : 17, bold: true, color: TEXT }); ty += b.numbered ? 0.6 : 0.55; }
      if (it.points) s.addText(bullets(it.points, pf, psa), { x: x + 0.3, y: ty, w: cw - 0.6, h: y + hgt - ty - 0.25, fontFace: FZ, fontSize: pf, color: MUTED, lineSpacingMultiple: 1.12, valign: "top" });
      else if (it.body) s.addText(it.body, { x: x + 0.3, y: ty, w: cw - 0.6, h: y + hgt - ty - 0.25, fontFace: FZ, fontSize: n <= 3 ? 11 : 10, color: MUTED, lineSpacingMultiple: 1.25, valign: "top" });
    });
  },

  timeline(b) {
    const s = base(b.eyebrow);
    head(s, b.title, b.subtitle);
    const tl = b.nodes || [], n = tl.length || 1;
    const aw = W - 2 * MX, gx = 0.28, cw = (aw - (n - 1) * gx) / n, y = 2.5, ch = 2.7;
    s.addShape(pres.shapes.LINE, { x: MX, y: y - 0.18, w: aw, h: 0, line: { color: LINE, width: 1.5, dashType: "dash" } });
    tl.forEach((node, i) => {
      const x = MX + i * (cw + gx), accent = b.accentLast !== false && i === n - 1;
      s.addShape(pres.shapes.OVAL, { x: x + cw / 2 - 0.07, y: y - 0.25, w: 0.14, h: 0.14, fill: { color: accent ? GREEN : BLUE } });
      panel(s, x, y, cw, ch);
      if (accent) s.addShape(pres.shapes.RECTANGLE, { x, y, w: cw, h: 0.07, fill: { color: GREEN } });
      s.addText(node.month || node.label || "", { x: x + 0.2, y: y + 0.22, w: cw - 0.4, h: 0.35, fontFace: FMONO, fontSize: 12, color: accent ? GREEN : BLUE, bold: true });
      s.addText(node.title || "", { x: x + 0.2, y: y + 0.62, w: cw - 0.4, h: 0.5, fontFace: FZ, fontSize: 14, bold: true, color: TEXT });
      s.addText(node.desc || "", { x: x + 0.2, y: y + 1.18, w: cw - 0.4, h: ch - 1.3, fontFace: FZ, fontSize: 10, color: MUTED, lineSpacingMultiple: 1.15 });
    });
    if (b.value) s.addText((b.valuePrefix || L.valuePrefix) + b.value, { x: MX, y: 5.5, w: aw, h: 0.6, fontFace: FZ, fontSize: 12, color: GREEN });
  },

  rows(b) {
    const s = base(b.eyebrow);
    head(s, b.title);
    const list = (b.items || []).slice(0, 8), y0 = 2.0, aw = W - 2 * MX, gap = 0.08, avail = 6.95 - y0;
    const rh = clamp((avail - (list.length - 1) * gap) / list.length, 0.44, 0.66);
    const gfs = rh >= 0.58 ? 13 : 12, mfs = rh >= 0.58 ? 10.5 : 9.8;
    list.forEach((g, i) => {
      const y = y0 + i * (rh + gap);
      panel(s, MX, y, aw, rh);
      if (b.numbered !== false) s.addText(String(i + 1), { x: MX + 0.2, y, w: 0.5, h: rh, align: "center", valign: "middle", fontFace: FNUM, fontSize: 18, bold: true, color: GREEN });
      const lx = b.numbered !== false ? MX + 0.85 : MX + 0.3;
      s.addText(g.label || g.goal || "", { x: lx, y, w: 3.2, h: rh, valign: "middle", fontFace: FZ, fontSize: gfs, bold: true, color: TEXT });
      s.addText(g.desc || g.milestone || "", { x: lx + 3.3, y, w: aw - (lx - MX) - 4.6, h: rh, valign: "middle", fontFace: FZ, fontSize: mfs, color: MUTED });
      const tag = g.tag || g.node;
      if (tag) s.addText(tag, { x: MX + aw - 1.25, y: y + 0.1, w: 1.05, h: rh - 0.2, align: "center", valign: "middle", fontFace: FMONO, fontSize: 11, bold: true, color: BLUE, fill: { color: PANEL2 }, line: { color: BLUE, width: 1 } });
    });
  },

  summary(b) {
    const s = base(b.eyebrow);
    s.addShape(pres.shapes.RECTANGLE, { x: 0, y: H - 0.12, w: W, h: 0.12, fill: { color: GREEN } });
    s.addText(b.title || L.summary, { x: MX, y: 1.6, w: 10, h: 0.7, fontFace: FZ, fontSize: 30, bold: true, color: TEXT });
    if (b.slogan) s.addText(b.slogan, { x: MX, y: 2.4, w: 12, h: 0.9, fontFace: FZ, fontSize: 34, bold: true, color: GREEN });
    if (b.body) s.addText(b.body, { x: MX, y: b.slogan ? 3.7 : 2.6, w: W - 2 * MX - 1.5, h: 2.4, fontFace: FZ, fontSize: 14, color: MUTED, lineSpacingMultiple: 1.35 });
    const sig = [b.author, b.dept, b.date].filter(Boolean).join(" · ");
    if (sig) s.addText(sig, { x: MX, y: 6.4, w: 10, h: 0.4, fontFace: FMONO, fontSize: 12, color: FAINT });
  }
};

// ================= legacy → sections (向后兼容) =================
function legacyToSections(d) {
  const out = [];
  if (d.cover || meta.title) {
    out.push({ type: "cover", title: meta.title, eyebrow: meta.eyebrow, period: meta.period, author: meta.author, dept: meta.dept, date: meta.date, logo: meta.logo, cards: (d.cover && d.cover.info_cards) || [] });
  }
  if (d.metrics || meta.summary) {
    out.push({ type: "metrics", eyebrow: L.eyebrows.overview, title: L.overview, lead: meta.summary, items: d.metrics || [] });
  }
  (d.kpi_scorecard || []).forEach(g => {
    const merged = !!g.merged;
    const columns = merged ? [L.kpiCols.cat, L.kpiCols.kpi, L.kpiCols.actual, L.kpiCols.status] : [L.kpiCols.kpi, L.kpiCols.actual, L.kpiCols.status];
    const rows = (g.items || []).map(it => {
      const status = { text: it.status || "", level: it.level, color: it.color, status: it.status };
      return merged
        ? [it.cat || it.category || "", it.kpi || "", { text: it.actual || "", muted: true }, status]
        : [it.kpi || "", { text: it.actual || "", muted: true }, status];
    });
    out.push({ type: "table", eyebrow: L.eyebrows.kpi, title: meta.kpiTitle || L.kpiTitle, subtitle: g.category, legend: true, columns, rows, statusCol: -1, accentCols: merged ? [0] : [] });
  });
  // main lines
  let buf = [];
  const flush = () => { if (buf.length) { out.push({ type: "columns", eyebrow: L.eyebrows.mainline, title: buf.map(p => p.name).join(" · "), bar: true, items: buf.map(p => ({ title: p.name + (p.subtitle ? "（" + p.subtitle + "）" : ""), points: p.points })) }); buf = []; } };
  (d.main_lines || []).forEach(ml => {
    if (ml.timeline) { flush(); out.push({ type: "timeline", eyebrow: L.eyebrows.mainline + (ml.name ? " · " + ml.name : ""), title: ml.name + (ml.subtitle ? "：" + ml.subtitle : ""), nodes: ml.timeline, value: ml.value }); }
    else { buf.push(ml); if (buf.length === 2) flush(); }
  });
  flush();
  if ((d.highlights || []).length) out.push({ type: "cards", eyebrow: L.eyebrows.highlights, title: meta.highlights_title || L.highlights, items: d.highlights });
  if ((d.issues || []).length) out.push({ type: "columns", eyebrow: L.eyebrows.issues, title: L.issues, numbered: true, items: d.issues.map(q => ({ title: q.title, body: q.content })) });
  const nextList = d.next_half || d.next_plan || [];
  if (nextList.length) out.push({ type: "rows", eyebrow: meta.next_eyebrow || L.eyebrows.next, title: meta.next_title || L.nextPlan, numbered: true, items: nextList });
  if (d.summary) out.push({ type: "summary", eyebrow: L.eyebrows.summary, title: L.summary, slogan: meta.summary_slogan, body: d.summary, author: meta.author, dept: meta.dept, date: meta.date });
  return out;
}

// ================= pagination + render =================
function chunk(a, n) { const o = []; for (let i = 0; i < a.length; i += n) o.push(a.slice(i, i + n)); return o; }
function expand(sec) {
  const it = sec.items || [];
  if (sec.type === "cards") { const c = chunk(it, 4); return c.length ? c.map(items => Object.assign({}, sec, { items })) : [sec]; }
  if (sec.type === "columns") { const c = chunk(it, 4); return c.length ? c.map(items => Object.assign({}, sec, { items })) : [sec]; }
  if (sec.type === "metrics") { const c = chunk(it, 9); return c.length ? c.map((items, i) => Object.assign({}, sec, { items, lead: i === 0 ? sec.lead : undefined })) : [sec]; }
  if (sec.type === "rows") { const c = chunk(it, 8); return c.length ? c.map(items => Object.assign({}, sec, { items })) : [sec]; }
  return [sec];
}

const sections = Array.isArray(data.sections) && data.sections.length ? data.sections : legacyToSections(data);
const expanded = sections.flatMap(expand);
TOTAL = expanded.length;
expanded.forEach(sec => {
  const fn = BLOCKS[sec.type];
  if (fn) fn(sec);
  else console.warn("WARN: 未知区块类型 (unknown block type):", sec.type);
});

pres.writeFile({ fileName: outPath }).then(() => console.log("WROTE", outPath, "·", TOTAL, "slides ·", locale, "·", (typeof meta.theme === "string" ? meta.theme : meta.theme ? "custom" : "dark")));
