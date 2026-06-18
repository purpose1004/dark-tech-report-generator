# Changelog

All notable changes to this project are documented here. Format loosely follows
[Keep a Changelog](https://keepachangelog.com/); versions follow SemVer.

## [0.3.0] - 2026
### Added
- `LICENSE` (MIT), `CHANGELOG.md`.
- Cross-platform preview/QA script `scripts/preview.js` (LibreOffice + pdftoppm → PNG per slide).
- Preview screenshots under `examples/preview/` and a screenshots section in the README.

## [0.2.0] - 2026
### Added
- **Generic block model** (`sections`): `cover / statement / text / metrics / table / cards / columns / timeline / rows / summary` — render arbitrary content, not just reports.
- **Backward compatibility**: legacy keys (`metrics / kpi_scorecard / main_lines / highlights / issues / next_half / summary`) are auto-converted to equivalent blocks; output unchanged.
- npm **CLI** via `bin` (`npx dark-tech-report <input.json> [output.pptx]`).
- **JSON Schema** (`report.schema.json`) + lightweight built-in validation (`src/validate.js`).
- **Theme presets** (`meta.theme`: dark / midnight / light, or object override) in `src/themes.js`.
- Overflow resistance: tables, metric cards, columns and rows auto-scale font/height by item count; cards/columns/metrics/rows paginate.

## [0.1.0] - 2026
### Added
- Initial public extraction from a private report generator.
- i18n label packs (`zh` / `en`) with `meta.labels` overrides (`src/labels.js`).
- Language-decoupled status colors (`level` / `color` / status-text aliases).
- Configurable fonts (`meta.fonts = { zh, latin, mono }`).
- Neutral example data (no personal/private content).
