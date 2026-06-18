// i18n 词包与状态别名。新增语言：往 LABELS 里加一个 locale 即可。
const LABELS = {
  zh: {
    overview: "整体概览",
    kpiTitle: "KPI 完成度对照",
    kpiCols: { cat: "类别", kpi: "KPI", actual: "实际进展", status: "完成度" },
    highlights: "核心成果",
    issues: "问题与建议",
    nextPlan: "后续规划",
    summary: "总结",
    valuePrefix: "价值：",
    eyebrows: { overview: "OVERVIEW", kpi: "KPI SCORECARD", mainline: "MAIN LINE", highlights: "HIGHLIGHTS", issues: "ISSUES", next: "ROADMAP", summary: "SUMMARY" },
    legend: { done: "达成 / 超额", doing: "进行中", pending: "未达 / 未到", bonus: "加分" }
  },
  en: {
    overview: "Overview",
    kpiTitle: "KPI Scorecard",
    kpiCols: { cat: "Category", kpi: "KPI", actual: "Progress", status: "Status" },
    highlights: "Highlights",
    issues: "Issues & Suggestions",
    nextPlan: "Roadmap",
    summary: "Summary",
    valuePrefix: "Value: ",
    eyebrows: { overview: "OVERVIEW", kpi: "KPI SCORECARD", mainline: "MAIN LINE", highlights: "HIGHLIGHTS", issues: "ISSUES", next: "ROADMAP", summary: "SUMMARY" },
    legend: { done: "Done / Exceeded", doing: "In progress", pending: "Pending", bonus: "Bonus" }
  }
};

// 状态文案 -> 语义等级（决定颜色）。大小写不敏感。
// 也可在数据里直接给 item.level（done/doing/pending/bonus）或 item.color 覆盖。
const STATUS_ALIASES = {
  done: ["达成", "超额", "持续达成", "完成", "已完成", "done", "completed", "complete", "exceeded"],
  doing: ["进行中", "部分完成", "铺垫中", "in-progress", "in progress", "ongoing", "partial", "wip"],
  pending: ["节点未到", "未开始", "待启动", "pending", "not started", "not-started", "planned", "upcoming"],
  bonus: ["加分", "bonus", "extra"]
};

module.exports = { LABELS, STATUS_ALIASES };
