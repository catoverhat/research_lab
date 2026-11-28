// Chart colors (dataviz skill reference palette, light mode). Validated with the skill's
// validate_palette.js on 2026-11-27: the four categorical slots pass every check; orange, aqua and
// yellow sit under 3:1 on white, so every chart ships direct labels or its table (relief rule).
// The app has no dark mode yet; when it does, add the dark steps and validate them.
export const chartColors = {
  series: ["#257de0", "#f47230", "#00b894", "#f2a600"],
  /** Same hue as series[0], lighter step (250): the reference in a before -> after comparison. */
  reference: "#84b9f3",
  surface: "#ffffff",
  ink: "#191919",
  inkSecondary: "#666666",
  grid: "#e7e7e7",
  axis: "#c2c2c2",
};

/** Categorical series cap per chart: past it, fold or use small multiples (never a generated hue). */
export const maxSeries = chartColors.series.length;
