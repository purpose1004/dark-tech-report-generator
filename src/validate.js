// 轻量结构校验（零依赖）。返回 {errs, warns}。
// 完整 JSON Schema 见仓库根 report.schema.json（供编辑器/Agent 使用）。
function validate(data) {
  const errs = [], warns = [];
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    errs.push("根节点必须是一个对象 (root must be an object)");
    return { errs, warns };
  }
  if (data.meta != null && (typeof data.meta !== "object" || Array.isArray(data.meta)))
    errs.push('"meta" 必须是对象');
  ["sections", "metrics", "kpi_scorecard", "main_lines", "highlights", "issues", "next_half", "next_plan"].forEach(f => {
    if (data[f] != null && !Array.isArray(data[f])) errs.push(`"${f}" 必须是数组`);
  });
  const KNOWN = ["cover", "statement", "text", "metrics", "table", "cards", "columns", "timeline", "rows", "summary"];
  (Array.isArray(data.sections) ? data.sections : []).forEach((b, i) => {
    if (!b || typeof b !== "object") { errs.push(`sections[${i}] 必须是对象`); return; }
    if (!b.type) errs.push(`sections[${i}] 缺少 "type"`);
    else if (!KNOWN.includes(b.type)) warns.push(`sections[${i}] 未知 type "${b.type}"（将被跳过）。可用: ${KNOWN.join(", ")}`);
  });
  (Array.isArray(data.kpi_scorecard) ? data.kpi_scorecard : []).forEach((g, i) => {
    if (!g || typeof g !== "object") { errs.push(`kpi_scorecard[${i}] 必须是对象`); return; }
    if (g.items != null && !Array.isArray(g.items)) errs.push(`kpi_scorecard[${i}].items 必须是数组`);
    if (!g.category) warns.push(`kpi_scorecard[${i}] 缺少 "category"`);
  });
  (Array.isArray(data.main_lines) ? data.main_lines : []).forEach((m, i) => {
    if (m && m.timeline != null && !Array.isArray(m.timeline)) errs.push(`main_lines[${i}].timeline 必须是数组`);
    if (m && m.points != null && !Array.isArray(m.points)) errs.push(`main_lines[${i}].points 必须是数组`);
  });
  if (!data.meta || !data.meta.title) warns.push('meta.title 缺失 — 封面将使用默认标题');
  return { errs, warns };
}
module.exports = { validate };
