// 主题预设。meta.theme 可填预设名（"dark"|"light"|"midnight"）或对象（{preset, ...覆盖}）。
const THEMES = {
  dark: {
    bg: "0A1224", panel: "121C33", panel2: "0F1830", line: "26324F",
    text: "EAF0FC", muted: "9FB0D0", faint: "6B7A9C",
    accent: "4CE2B0", blue: "5F8CFF", grey: "97A9D3", purple: "C27AFF"
  },
  midnight: {
    bg: "0B1020", panel: "151B30", panel2: "10162A", line: "2A3350",
    text: "EAF0FC", muted: "A3AEC9", faint: "6E7894",
    accent: "7C8CFF", blue: "4FC3F7", grey: "9AA3BC", purple: "C792EA"
  },
  light: {
    bg: "F5F7FB", panel: "FFFFFF", panel2: "EEF2F9", line: "D6DEEC",
    text: "0E1726", muted: "55617A", faint: "9AA6BE",
    accent: "0FB286", blue: "2E5BFF", grey: "8893A8", purple: "8A4DDB"
  }
};

function resolveTheme(t) {
  if (typeof t === "string") return Object.assign({}, THEMES[t] || THEMES.dark);
  if (t && typeof t === "object") return Object.assign({}, THEMES[t.preset] || THEMES.dark, t);
  return Object.assign({}, THEMES.dark);
}

module.exports = { THEMES, resolveTheme };
