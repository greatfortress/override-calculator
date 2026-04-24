const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const compactCurrency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
  notation: "compact",
});

const form = document.getElementById("projection-form");
const exampleButton = document.getElementById("example-button");
const resultsBody = document.getElementById("results-body");
const lineChart = document.getElementById("line-chart");
const barChart = document.getElementById("bar-chart");

const metricCurrentTax = document.getElementById("metric-current-tax");
const metricCurrentTaxDetail = document.getElementById("metric-current-tax-detail");
const metricTier1Total = document.getElementById("metric-tier1-total");
const metricTier1Detail = document.getElementById("metric-tier1-detail");
const metricTier2Total = document.getElementById("metric-tier2-total");
const metricTier2Detail = document.getElementById("metric-tier2-detail");
const metricFinalYear = document.getElementById("metric-final-year");
const metricFinalYearDetail = document.getElementById("metric-final-year-detail");
const metricTier1Invested = document.getElementById("metric-tier1-invested");
const metricTier1InvestedDetail = document.getElementById("metric-tier1-invested-detail");
const metricTier2Invested = document.getElementById("metric-tier2-invested");
const metricTier2InvestedDetail = document.getElementById("metric-tier2-invested-detail");
const heroHorizon = document.getElementById("hero-horizon");
const metricTier1Label = document.getElementById("metric-tier1-label");
const metricTier2Label = document.getElementById("metric-tier2-label");
const lineChartCaption = document.getElementById("line-chart-caption");
const tableCaption = document.getElementById("table-caption");
const inputHint = document.getElementById("input-hint");

const colors = {
  baseline: "#42647a",
  tier1: "#15695a",
  tier2: "#ab4f1f",
};

function parseNumber(value) {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatCurrency(value) {
  if (value === null || value === undefined) {
    return "Not provided";
  }

  return currency.format(value);
}

function formatYearCount(years) {
  return `${years} year${years === 1 ? "" : "s"}`;
}

function deriveAssessedValue({ assessedValue, currentTax, currentRate }) {
  if (assessedValue !== null) {
    return assessedValue;
  }

  if (currentTax !== null && currentRate !== null && currentRate > 0) {
    return (currentTax / currentRate) * 1000;
  }

  return null;
}

function calculateTaxFromRate(assessedValue, rate) {
  if (assessedValue === null || rate === null) {
    return null;
  }

  return assessedValue * (rate / 1000);
}

function getInputs() {
  const data = new FormData(form);

  return {
    propertyLabel: (data.get("propertyLabel") || "My property").toString().trim() || "My property",
    currentTax: parseNumber(data.get("currentTax")),
    assessedValue: parseNumber(data.get("assessedValue")),
    currentRate: parseNumber(data.get("currentRate")) ?? 14.39,
    tier1Rate: parseNumber(data.get("tier1Rate")) ?? 15.37,
    tier2Rate: parseNumber(data.get("tier2Rate")) ?? 15.74,
    growthRate: (parseNumber(data.get("growthRate")) ?? 2.5) / 100,
    assessedGrowthRate: (parseNumber(data.get("assessedGrowthRate")) ?? 0) / 100,
    investmentReturn: (parseNumber(data.get("investmentReturn")) ?? 4.0) / 100,
    years: Math.max(1, Math.min(25, Math.round(parseNumber(data.get("years")) ?? 5))),
    startYear: Math.max(2027, Math.round(parseNumber(data.get("startYear")) ?? 2027)),
  };
}

function buildProjection(inputs) {
  const assessedValue = deriveAssessedValue(inputs);
  const baselineStartingTax = calculateTaxFromRate(assessedValue, inputs.currentRate) ?? inputs.currentTax;
  const tier1StartingTax = calculateTaxFromRate(assessedValue, inputs.tier1Rate);
  const tier2StartingTax = calculateTaxFromRate(assessedValue, inputs.tier2Rate);
  const rows = [];
  let tier1Cumulative = 0;
  let tier2Cumulative = 0;
  let tier1InvestedValue = 0;
  let tier2InvestedValue = 0;

  for (let index = 0; index < inputs.years; index += 1) {
    const fiscalYear = inputs.startYear + index;
    const levyGrowthFactor = Math.pow(1 + inputs.growthRate, index);
    const assessedGrowthFactor = Math.pow(1 + inputs.assessedGrowthRate, index);
    const combinedGrowthFactor = levyGrowthFactor * assessedGrowthFactor;
    const assessedValueForYear = assessedValue === null ? null : assessedValue * assessedGrowthFactor;
    const baseline = baselineStartingTax === null ? null : baselineStartingTax * combinedGrowthFactor;
    const tier1Total = tier1StartingTax === null ? null : tier1StartingTax * combinedGrowthFactor;
    const tier2Total = tier2StartingTax === null ? null : tier2StartingTax * combinedGrowthFactor;
    const tier1Extra = baseline === null || tier1Total === null ? null : tier1Total - baseline;
    const tier2Extra = baseline === null || tier2Total === null ? null : tier2Total - baseline;

    tier1Cumulative += tier1Extra ?? 0;
    tier2Cumulative += tier2Extra ?? 0;
    tier1InvestedValue += (tier1Extra ?? 0) * Math.pow(1 + inputs.investmentReturn, inputs.years - index - 1);
    tier2InvestedValue += (tier2Extra ?? 0) * Math.pow(1 + inputs.investmentReturn, inputs.years - index - 1);

    rows.push({
      fiscalYear,
      assessedValue: assessedValueForYear,
      baseline,
      tier1Extra,
      tier1Total,
      tier2Extra,
      tier2Total,
    });
  }

  return {
    assessedValue,
    currentAnnualTax: baselineStartingTax,
    tier1StartingTax,
    tier2StartingTax,
    tier1Cumulative,
    tier2Cumulative,
    tier1InvestedValue,
    tier2InvestedValue,
    rows,
  };
}

function updateMetrics(inputs, projection) {
  const currentBill = projection.currentAnnualTax;
  const finalRow = projection.rows.at(-1);
  const yearCountLabel = formatYearCount(inputs.years);
  const firstYearExtraTier1 = projection.rows[0]?.tier1Extra ?? null;
  const firstYearExtraTier2 = projection.rows[0]?.tier2Extra ?? null;

  heroHorizon.textContent = yearCountLabel;
  metricTier1Label.textContent = `Tier 1 extra over ${yearCountLabel}`;
  metricTier2Label.textContent = `Tier 2 extra over ${yearCountLabel}`;

  metricCurrentTax.textContent = currentBill === null ? "Optional" : formatCurrency(currentBill);
  metricCurrentTaxDetail.textContent =
    currentBill === null
      ? "Add an assessed value, or both a current bill and current rate, to convert tax rates into dollars."
      : `Using ${inputs.propertyLabel} at ${inputs.currentRate.toFixed(2)} per $1,000 as the FY${inputs.startYear} no-override starting point.`;

  metricTier1Total.textContent = formatCurrency(projection.tier1Cumulative);
  metricTier1Detail.textContent =
    firstYearExtraTier1 === null
      ? "Enter an assessed value to calculate the Tier 1 burden."
      : `${yearCountLabel} cumulative increase from a FY${inputs.startYear} Tier 1 rate of ${inputs.tier1Rate.toFixed(
          2
        )} per $1,000, starting with about ${formatCurrency(firstYearExtraTier1)} extra in year one.`;

  metricTier2Total.textContent = formatCurrency(projection.tier2Cumulative);
  metricTier2Detail.textContent =
    firstYearExtraTier2 === null
      ? "Enter an assessed value to calculate the Tier 2 burden."
      : `${yearCountLabel} cumulative increase from a FY${inputs.startYear} Tier 2 rate of ${inputs.tier2Rate.toFixed(
          2
        )} per $1,000, starting with about ${formatCurrency(firstYearExtraTier2)} extra in year one.`;

  metricFinalYear.textContent = `${formatCurrency(finalRow.tier1Extra)} / ${formatCurrency(finalRow.tier2Extra)}`;
  metricFinalYearDetail.textContent = `Tier 1 and Tier 2 extra taxes in FY${finalRow.fiscalYear}.`;

  metricTier1Invested.textContent = formatCurrency(projection.tier1InvestedValue);
  metricTier1InvestedDetail.textContent = `If each year's Tier 1 burden were invested over ${yearCountLabel} at ${(
    inputs.investmentReturn * 100
  ).toFixed(1)}%, the ending value by FY${finalRow.fiscalYear} would be about this much.`;

  metricTier2Invested.textContent = formatCurrency(projection.tier2InvestedValue);
  metricTier2InvestedDetail.textContent = `If each year's Tier 2 burden were invested over ${yearCountLabel} at ${(
    inputs.investmentReturn * 100
  ).toFixed(1)}%, the ending value by FY${finalRow.fiscalYear} would be about this much.`;

  lineChartCaption.textContent =
    currentBill === null
      ? "Add an assessed value to compare the no-override and override tax paths in dollars."
      : inputs.assessedGrowthRate > 0
        ? "Each line starts from its own FY starting tax rate, then grows with both the levy-rate assumption and assessed-value growth."
        : "Each line starts from its own FY starting tax rate, then grows at the same annual levy rate.";

  tableCaption.textContent =
    currentBill === null
      ? "Add an assessed value to convert the tax rates into dollar projections."
      : `Projected from FY${inputs.startYear - 1} into FY${inputs.startYear} through FY${
          inputs.startYear + inputs.years - 1
        } using tax-rate-based starting scenarios${
          inputs.assessedGrowthRate > 0
            ? ` and ${ (inputs.assessedGrowthRate * 100).toFixed(1) }% annual assessed-value growth`
            : ""
        }.`;

  inputHint.textContent =
    currentBill === null
      ? "Enter an assessed value, or both a current bill and current rate, so the tool can translate the proposed rates into taxes."
      : inputs.assessedGrowthRate > 0
        ? "The first year uses the tax rates you entered; later years apply both the annual levy growth rate and your assessed-value growth assumption."
        : "The first year uses the tax rates you entered, and later years apply the annual levy growth rate to each scenario.";
}

function renderTable(projection) {
  resultsBody.innerHTML = projection.rows
    .map((row) => {
      return `
        <tr>
          <td>FY${row.fiscalYear}</td>
          <td>${row.baseline === null ? "—" : formatCurrency(row.baseline)}</td>
          <td>${row.tier1Extra === null ? "—" : formatCurrency(row.tier1Extra)}</td>
          <td>${row.tier1Total === null ? "—" : formatCurrency(row.tier1Total)}</td>
          <td>${row.tier2Extra === null ? "—" : formatCurrency(row.tier2Extra)}</td>
          <td>${row.tier2Total === null ? "—" : formatCurrency(row.tier2Total)}</td>
        </tr>
      `;
    })
    .join("");
}

function createLegend(items) {
  const legend = document.createElement("div");
  legend.className = "chart-legend";
  legend.innerHTML = items
    .map((item) => {
      return `<span><span class="legend-swatch" style="background:${item.color}"></span>${item.label}</span>`;
    })
    .join("");
  return legend;
}

function getSeriesExtent(seriesList) {
  const values = seriesList
    .flatMap((series) => series.values)
    .filter((value) => value !== null && value !== undefined);

  if (!values.length) {
    return { min: 0, max: 1 };
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const spread = max - min || Math.max(max * 0.04, 1);
  const padding = spread * 0.12;

  return {
    min: Math.max(0, min - padding),
    max: max + padding,
  };
}

function drawLineChart(target, projection) {
  target.innerHTML = "";

  const width = 760;
  const height = 340;
  const margin = { top: 16, right: 16, bottom: 42, left: 74 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  const baselineValues = projection.rows.map((row) => row.baseline);
  const tier1Values = projection.rows.map((row) => (row.baseline === null ? row.tier1Extra : row.tier1Total));
  const tier2Values = projection.rows.map((row) => (row.baseline === null ? row.tier2Extra : row.tier2Total));

  const hasBaseline = projection.rows[0].baseline !== null;
  const seriesList = hasBaseline
    ? [
        { label: "No override", color: colors.baseline, values: baselineValues },
        { label: "Tier 1", color: colors.tier1, values: tier1Values },
        { label: "Tier 2", color: colors.tier2, values: tier2Values },
      ]
    : [
        { label: "Tier 1 extra", color: colors.tier1, values: tier1Values },
        { label: "Tier 2 extra", color: colors.tier2, values: tier2Values },
      ];

  const { min: minValue, max: maxValue } = getSeriesExtent(seriesList);
  const valueRange = maxValue - minValue || 1;
  const yTicks = 4;

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.setAttribute("class", "chart-svg");
  svg.setAttribute("role", "img");

  for (let tick = 0; tick <= yTicks; tick += 1) {
    const ratio = tick / yTicks;
    const y = margin.top + chartHeight - ratio * chartHeight;
    const grid = document.createElementNS(svg.namespaceURI, "line");
    grid.setAttribute("x1", margin.left);
    grid.setAttribute("x2", width - margin.right);
    grid.setAttribute("y1", y);
    grid.setAttribute("y2", y);
    grid.setAttribute("class", "chart-grid-line");
    svg.appendChild(grid);

    const label = document.createElementNS(svg.namespaceURI, "text");
    label.setAttribute("x", margin.left - 12);
    label.setAttribute("y", y + 4);
    label.setAttribute("text-anchor", "end");
    label.setAttribute("font-size", "11");
    label.setAttribute("class", "chart-label");
    label.textContent = compactCurrency.format(minValue + valueRange * ratio);
    svg.appendChild(label);
  }

  const xStep = projection.rows.length === 1 ? 0 : chartWidth / (projection.rows.length - 1);

  projection.rows.forEach((row, index) => {
    const x = margin.left + xStep * index;
    const label = document.createElementNS(svg.namespaceURI, "text");
    label.setAttribute("x", x);
    label.setAttribute("y", height - 14);
    label.setAttribute("text-anchor", "middle");
    label.setAttribute("font-size", "11");
    label.setAttribute("class", "chart-axis");
    label.textContent = `FY${row.fiscalYear.toString().slice(-2)}`;
    svg.appendChild(label);
  });

  seriesList.forEach((series) => {
    const points = series.values
      .map((value, index) => {
        if (value === null) {
          return null;
        }

        const x = margin.left + xStep * index;
        const y = margin.top + chartHeight - ((value - minValue) / valueRange) * chartHeight;
        return { x, y, value };
      })
      .filter(Boolean);

    if (!points.length) {
      return;
    }

    const path = document.createElementNS(svg.namespaceURI, "path");
    path.setAttribute(
      "d",
      points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(" ")
    );
    path.setAttribute("stroke", series.color);
    path.setAttribute("class", "chart-line");
    svg.appendChild(path);

    points.forEach((point) => {
      const circle = document.createElementNS(svg.namespaceURI, "circle");
      circle.setAttribute("cx", point.x);
      circle.setAttribute("cy", point.y);
      circle.setAttribute("r", "4");
      circle.setAttribute("fill", series.color);
      circle.setAttribute("class", "chart-point");
      svg.appendChild(circle);
    });
  });

  target.appendChild(svg);
  target.appendChild(createLegend(seriesList));
}

function drawBarChart(target, projection) {
  target.innerHTML = "";

  const width = 760;
  const height = 340;
  const margin = { top: 16, right: 16, bottom: 42, left: 74 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;
  const maxValue = Math.max(...projection.rows.flatMap((row) => [row.tier1Extra, row.tier2Extra]), 1);
  const groups = projection.rows.length;
  const groupWidth = chartWidth / groups;
  const barWidth = Math.min(26, groupWidth * 0.34);
  const yTicks = 4;

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.setAttribute("class", "chart-svg");
  svg.setAttribute("role", "img");

  for (let tick = 0; tick <= yTicks; tick += 1) {
    const ratio = tick / yTicks;
    const y = margin.top + chartHeight - ratio * chartHeight;
    const grid = document.createElementNS(svg.namespaceURI, "line");
    grid.setAttribute("x1", margin.left);
    grid.setAttribute("x2", width - margin.right);
    grid.setAttribute("y1", y);
    grid.setAttribute("y2", y);
    grid.setAttribute("class", "chart-grid-line");
    svg.appendChild(grid);

    const label = document.createElementNS(svg.namespaceURI, "text");
    label.setAttribute("x", margin.left - 12);
    label.setAttribute("y", y + 4);
    label.setAttribute("text-anchor", "end");
    label.setAttribute("font-size", "11");
    label.setAttribute("class", "chart-label");
    label.textContent = compactCurrency.format((maxValue * ratio) || 0);
    svg.appendChild(label);
  }

  projection.rows.forEach((row, index) => {
    const center = margin.left + groupWidth * index + groupWidth / 2;
    const tier1Height = (row.tier1Extra / maxValue) * chartHeight;
    const tier2Height = (row.tier2Extra / maxValue) * chartHeight;

    const tier1Bar = document.createElementNS(svg.namespaceURI, "rect");
    tier1Bar.setAttribute("x", center - barWidth - 3);
    tier1Bar.setAttribute("y", margin.top + chartHeight - tier1Height);
    tier1Bar.setAttribute("width", barWidth);
    tier1Bar.setAttribute("height", tier1Height);
    tier1Bar.setAttribute("rx", "8");
    tier1Bar.setAttribute("fill", colors.tier1);
    svg.appendChild(tier1Bar);

    const tier2Bar = document.createElementNS(svg.namespaceURI, "rect");
    tier2Bar.setAttribute("x", center + 3);
    tier2Bar.setAttribute("y", margin.top + chartHeight - tier2Height);
    tier2Bar.setAttribute("width", barWidth);
    tier2Bar.setAttribute("height", tier2Height);
    tier2Bar.setAttribute("rx", "8");
    tier2Bar.setAttribute("fill", colors.tier2);
    svg.appendChild(tier2Bar);

    const label = document.createElementNS(svg.namespaceURI, "text");
    label.setAttribute("x", center);
    label.setAttribute("y", height - 14);
    label.setAttribute("text-anchor", "middle");
    label.setAttribute("font-size", "11");
    label.setAttribute("class", "chart-axis");
    label.textContent = `FY${row.fiscalYear.toString().slice(-2)}`;
    svg.appendChild(label);
  });

  target.appendChild(svg);
  target.appendChild(
    createLegend([
      { label: "Tier 1 extra burden", color: colors.tier1 },
      { label: "Tier 2 extra burden", color: colors.tier2 },
    ])
  );
}

function render() {
  const inputs = getInputs();
  const projection = buildProjection(inputs);

  updateMetrics(inputs, projection);
  renderTable(projection);
  drawLineChart(lineChart, projection);
  drawBarChart(barChart, projection);
}

form.addEventListener("input", render);

exampleButton.addEventListener("click", () => {
  document.getElementById("property-label").value = "119 Rolling Acres Rd";
  document.getElementById("current-tax").value = "6898.57";
  document.getElementById("assessed-value").value = "479400";
  document.getElementById("current-rate").value = "14.39";
  document.getElementById("tier1-rate").value = "15.37";
  document.getElementById("tier2-rate").value = "15.74";
  document.getElementById("growth-rate").value = "2.5";
  document.getElementById("assessed-growth-rate").value = "0.0";
  document.getElementById("investment-return").value = "4.0";
  document.getElementById("years").value = "5";
  document.getElementById("start-year").value = "2027";
  render();
});

render();
