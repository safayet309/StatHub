/* ============================================
StatHub — Statistics Learning Platform
File: app.js
============================================ */

"use strict";

/* ---------- App Configuration ---------- */

const APP_CONFIG = {
name: "StatHub",
version: "1.0.0",
defaultModule: "home",
decimalPlaces: 4
};

const MODULES = {
home: {
title: "Dashboard",
subtitle: "Your statistics workspace"
},
descriptive: {
title: "Descriptive Statistics",
subtitle: "Summarize and explore your dataset"
},
probability: {
title: "Probability",
subtitle: "Explore probability distributions and events"
},
sampling: {
title: "Sampling Distributions",
subtitle: "Understand sampling variability and the CLT"
},
inference: {
title: "Inferential Statistics",
subtitle: "Estimate parameters and test hypotheses"
},
regression: {
title: "Regression Analysis",
subtitle: "Explore relationships between variables"
},
demography: {
title: "Demography",
subtitle: "Analyze population and demographic change"
}
};

const state = {
currentModule: APP_CONFIG.defaultModule,
currentUser: null,
authMode: "login"
};

/* ---------- DOM Helpers ---------- */

const $ = (selector, root = document) => root.querySelector(selector);

const $$ = (selector, root = document) =>
Array.from(root.querySelectorAll(selector));

function escapeHTML(value) {
  const entities = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  };
  return String(value).replace(/[&<>"']/g, character => entities[character]);
}

function formatNumber(value, digits = APP_CONFIG.decimalPlaces) {
if (!Number.isFinite(value)) {
return "Undefined";
}

return Number(value.toFixed(digits)).toLocaleString("en-US", {
maximumFractionDigits: digits
});
}

function showMessage(message, type = "info") {
const view = $("#view");

if (!view) return;

let alert = $("#appAlert");

if (!alert) {
alert = document.createElement("div");
alert.id = "appAlert";
alert.setAttribute("role", "status");
view.prepend(alert);
}

const allowedTypes = ["info", "success", "warning", "error"];
const safeType = allowedTypes.includes(type) ? type : "info";

alert.className = `alert alert-${safeType}`;
alert.textContent = message;

alert.scrollIntoView({
behavior: "smooth",
block: "nearest"
});
}

function clearMessage() {
const alert = $("#appAlert");

if (alert) {
alert.remove();
}
}

function setPageTitle(title, subtitle = "") {
const titleElement = $("#topbarTitle");
const subtitleElement = $("#topbarSubtitle");

if (titleElement) {
titleElement.textContent = title;
}

if (subtitleElement) {
subtitleElement.textContent = subtitle;
}

document.title = `${title} | ${APP_CONFIG.name}`;
}

function setActiveNavigation(moduleName) {

$$(".nav-item").forEach(button => {
  const active = button.dataset.module === moduleName;

  button.classList.toggle("active", active);

  if (active) {
    button.setAttribute("aria-current", "page");
  } else {
    button.removeAttribute("aria-current");
  }
});
}

function renderView(html) {
const view = $("#view");

if (view) {
  view.innerHTML = html;
}
}

/* ---------- Statistical Data Helpers ---------- */

function parseNumberList(input) {
const text = String(input ?? "").trim();

if (!text) {
  throw new Error("Please enter at least one number.");
}

const parts = text
  .split(/[\s,;\n\t]+/)
  .filter(Boolean);

const numbers = parts.map(Number);

if (numbers.some(number => !Number.isFinite(number))) {
  throw new Error(
    "Invalid dataset. Use only numbers separated by commas or spaces."
  );
}

return numbers;
}

function requirePositive(value, label) {
const number = Number(value);

if (!Number.isFinite(number) || number <= 0) {
  throw new Error(`${label} must be a positive number.`);
}

return number;
}

function requireInteger(value, label, minimum = 0) {
const number = Number(value);

if (!Number.isInteger(number) || number < minimum) {
  throw new Error(
    `${label} must be an integer greater than or equal to ${minimum}.`
  );
}

return number;
}

function sum(values) {
return values.reduce((total, value) => total + value, 0);
}

function mean(values) {
if (!values.length) {
  throw new Error("Dataset cannot be empty.");
}

return sum(values) / values.length;
}

function median(values) {
if (!values.length) {
  throw new Error("Dataset cannot be empty.");
}

const sorted = [...values].sort((a, b) => a - b);
const middle = Math.floor(sorted.length / 2);

return sorted.length % 2 === 0
  ? (sorted[middle - 1] + sorted[middle]) / 2
  : sorted[middle];
}

function mode(values) {
const frequencies = new Map();

values.forEach(value => {
  frequencies.set(value, (frequencies.get(value) || 0) + 1);
});

const maxFrequency = Math.max(...frequencies.values());

if (maxFrequency === 1) {
  return [];
}

return [...frequencies.entries()]
  .filter(([, frequency]) => frequency === maxFrequency)
  .map(([value]) => value)
  .sort((a, b) => a - b);
}

function variance(values, sample = false) {
if (sample && values.length < 2) {
  throw new Error(
    "Sample variance requires at least two observations."
  );
}

if (!values.length) {
  throw new Error("Dataset cannot be empty.");
}

const average = mean(values);
const squaredDifferences = values.map(
  value => (value - average) ** 2
);

const divisor = sample ? values.length - 1 : values.length;

return sum(squaredDifferences) / divisor;
}

function standardDeviation(values, sample = false) {
return Math.sqrt(variance(values, sample));
}

function quantile(values, probability) {
if (!values.length) {
  throw new Error("Dataset cannot be empty.");
}

if (probability < 0 || probability > 1) {
  throw new Error("Quantile probability must be between 0 and 1.");
}

const sorted = [...values].sort((a, b) => a - b);
const position = (sorted.length - 1) * probability;

const lower = Math.floor(position);
const upper = Math.ceil(position);

if (lower === upper) {
  return sorted[lower];
}

const fraction = position - lower;

return sorted[lower] * (1 - fraction) +
  sorted[upper] * fraction;
}

function describe(values) {
const average = mean(values);
const sorted = [...values].sort((a, b) => a - b);

return {
  count: values.length,
  sum: sum(values),
  mean: average,
  median: median(values),
  mode: mode(values),
  min: sorted[0],
  max: sorted[sorted.length - 1],
  range: sorted[sorted.length - 1] - sorted[0],
  q1: quantile(values, 0.25),
  q3: quantile(values, 0.75),
  populationVariance: variance(values),
  populationSD: standardDeviation(values),
  sampleVariance: values.length > 1
    ? variance(values, true)
    : null,
  sampleSD: values.length > 1
    ? standardDeviation(values, true)
    : null
};
}

/* ---------- Statistical Result Components ---------- */

function metricCard(label, value, note = "") {
return `
  <article class="metric-card">
    <div class="metric-accent"></div>
    <span class="metric-label">${escapeHTML(label)}</span>
    <strong class="metric-value">${escapeHTML(value)}</strong>
    ${note
      ? `<span class="metric-note">${escapeHTML(note)}</span>`
      : ""}
  </article>
`;
}

function resultItem(label, value, description = "") {
return `
  <div class="result-item">
    <span class="result-label">${escapeHTML(label)}</span>
    <strong class="result-value">${escapeHTML(value)}</strong>
    ${description
      ? `<div class="result-description">${escapeHTML(description)}</div>`
      : ""}
  </div>
`;
}

function sectionHeader(title, description = "") {
return `
  <div class="page-header">
    <div>
      <div class="eyebrow">
        <span class="eyebrow-dot"></span>
        STATISTICAL WORKSPACE
      </div>
      <h1 class="page-title">${escapeHTML(title)}</h1>
      <p class="page-description">${escapeHTML(description)}</p>
    </div>
  </div>
`;
}

function cardHeader(title, description = "") {
return `
  <div class="card-header">
    <div>
      <h2 class="card-title">${escapeHTML(title)}</h2>
      ${description
        ? `<p class="card-description">${escapeHTML(description)}</p>`
        : ""}
    </div>
  </div>
`;
}

function renderResults(items, title = "Analysis Results") {
return `
  <section class="results-panel">
    <h3 class="results-title">${escapeHTML(title)}</h3>
    <div class="result-grid">
      ${items.map(item =>
        resultItem(item.label, item.value, item.description || "")
      ).join("")}
    </div>
  </section>
`;
}

function renderError(error) {
showMessage(
  error instanceof Error ? error.message : String(error),
  "error"
);
}

function runSafely(callback) {
try {
  clearMessage();
  callback();
} catch (error) {
  renderError(error);
}
}

/* ---------- Plotly Chart Helper ---------- */

function drawChart(elementId, traces, layout = {}) {
const element = document.getElementById(elementId);

if (!element) return;

if (!window.Plotly) {
  element.innerHTML = `
    <div class="alert alert-warning">
      Chart library is unavailable. Check your internet connection.
    </div>
  `;
  return;
}

const baseLayout = {
  autosize: true,
  paper_bgcolor: "#ffffff",
  plot_bgcolor: "#ffffff",
  font: {
    family: "Inter, Segoe UI, Arial, sans-serif",
    color: "#718096",
    size: 11
  },
  margin: {
    l: 48,
    r: 20,
    t: 25,
    b: 48
  },
  xaxis: {
    gridcolor: "#edf2f7",
    zerolinecolor: "#dbe5f0"
  },
  yaxis: {
    gridcolor: "#edf2f7",
    zerolinecolor: "#dbe5f0"
  },
  legend: {
    orientation: "h",
    y: -0.2
  },
  ...layout
};

window.Plotly.react(
  element,
  traces,
  baseLayout,
  {
    responsive: true,
    displaylogo: false
  }
);
}

function chartCard(id, title, description = "") {
return `
  <section class="chart-card">
    ${cardHeader(title, description)}
    <div id="${escapeHTML(id)}" class="chart-container"></div>
  </section>
`;
}

/* ---------- Home Dashboard ---------- */

function renderHome() {
setPageTitle("Dashboard", "Welcome to your statistics workspace");

const moduleCards = [
  {
    id: "descriptive",
    icon: "📊",
    title: "Descriptive Statistics",
    description: "Calculate central tendency, dispersion, quartiles and explore data distributions."
  },
  {
    id: "probability",
    icon: "🎲",
    title: "Probability",
    description: "Calculate event probabilities and explore the binomial distribution."
  },
  {
    id: "sampling",
    icon: "📈",
    title: "Sampling Distributions",
    description: "Simulate sample means and explore the Central Limit Theorem."
  },
  {
    id: "inference",
    icon: "🔬",
    title: "Inferential Statistics",
    description: "Calculate confidence intervals and perform one-sample hypothesis tests."
  },
  {
    id: "regression",
    icon: "📉",
    title: "Regression Analysis",
    description: "Fit a simple linear regression model and examine correlation."
  },
  {
    id: "demography",
    icon: "🌍",
    title: "Demography",
    description: "Analyze population growth, annual change and doubling time."
  }
];

renderView(`
  <section class="hero-card">
    <div class="hero-content">
      <div class="eyebrow" style="color:#b9dcff">
        <span class="eyebrow-dot" style="background:#b9dcff"></span>
        STATISTICS MADE ACCESSIBLE
      </div>
      <h1 class="hero-title">Understand data.<br>Discover insights.</h1>
      <p class="hero-description">
        An interactive statistics workspace for university students.
        Calculate, visualize and learn statistical concepts step by step.
      </p>
      <button class="btn btn-secondary" data-go="descriptive">
        Start Analyzing <span aria-hidden="true">→</span>
      </button>
    </div>
    <div class="hero-decoration" aria-hidden="true">∑</div>
  </section>

  <div class="page-header">
    <div>
      <h2 class="page-title" style="font-size:22px">
        Explore Statistics Modules
      </h2>
      <p class="page-description">
        Choose a module to begin your analysis.
      </p>
    </div>
  </div>

  <div class="module-grid">
    ${moduleCards.map(module => `
      <article class="module-card">
        <div class="card-icon" aria-hidden="true">${module.icon}</div>
        <h3>${escapeHTML(module.title)}</h3>
        <p>${escapeHTML(module.description)}</p>
        <button class="module-link" data-go="${module.id}">
          Open module <span aria-hidden="true">→</span>
        </button>
      </article>
    `).join("")}
  </div>

  <div class="alert alert-info mt-3">
    <span aria-hidden="true">ℹ️</span>
    <div>
      <strong>Learning note:</strong>
      Results depend on the data and assumptions you enter.
      Check the explanation and sample/population settings before
      interpreting statistical results.
    </div>
  </div>
`);
}

/* ---------- Descriptive Statistics ---------- */

function renderDescriptive() {
setPageTitle(
  MODULES.descriptive.title,
  MODULES.descriptive.subtitle
);

renderView(`
  ${sectionHeader(
    "Descriptive Statistics",
    "Summarize numerical data using measures of center, spread and position."
  )}

  <div class="grid grid-2">
    <section class="card">
      ${cardHeader(
        "Enter Your Dataset",
        "Separate numbers with commas, spaces or new lines."
      )}

      <form id="descriptiveForm">
        <div class="form-group">
          <label for="descriptiveData">Numerical observations</label>
          <textarea
            id="descriptiveData"
            class="data-input"
            required
            placeholder="12, 15, 18, 18, 21, 24, 27, 30"
          >12, 15, 18, 18, 21, 24, 27, 30</textarea>
          <span class="form-hint">
            Example: 12, 15, 18, 21, 24
          </span>
        </div>

        <div class="form-group">
          <label for="varianceType">Variance and SD convention</label>
          <select id="varianceType">
            <option value="population">Population (divide by n)</option>
            <option value="sample">Sample (divide by n − 1)</option>
          </select>
        </div>

        <button class="btn btn-primary btn-block" type="submit">
          Calculate Statistics
        </button>
      </form>
    </section>

    <section class="card">
      ${cardHeader(
        "What You Will Learn",
        "Key measures in descriptive statistics."
      )}

      <div class="alert alert-info">
        <strong>Mean:</strong> The arithmetic average of observations.
      </div>

      <div class="alert alert-info">
        <strong>Median:</strong> The middle value of ordered observations.
      </div>

      <div class="alert alert-info">
        <strong>Standard deviation:</strong> A measure of spread around
        the mean.
      </div>

      <div class="alert alert-info">
        <strong>Quartiles:</strong> Values that divide ordered data
        into four parts.
      </div>
    </section>
  </div>

  <div id="descriptiveResults"></div>

  <div class="grid grid-2 mt-3">
    ${chartCard(
      "descriptiveHistogram",
      "Data Distribution",
      "Histogram of the entered observations."
    )}
    ${chartCard(
      "descriptiveBox",
      "Box Plot",
      "Explore the median, quartiles and spread."
    )}
  </div>
`);

$("#descriptiveForm").addEventListener("submit", event => {
  event.preventDefault();

  runSafely(() => {
    const values = parseNumberList($("#descriptiveData").value);
    const stats = describe(values);
    const useSample = $("#varianceType").value === "sample";

    const varianceValue = useSample
      ? stats.sampleVariance
      : stats.populationVariance;

    const sdValue = useSample
      ? stats.sampleSD
      : stats.populationSD;

    const modeText = stats.mode.length
      ? stats.mode.map(value => formatNumber(value)).join(", ")
      : "No mode";

    $("#descriptiveResults").innerHTML = renderResults([
      { label: "Observations (n)", value: String(stats.count) },
      { label: "Mean", value: formatNumber(stats.mean) },
      { label: "Median", value: formatNumber(stats.median) },
      { label: "Mode", value: modeText },
      { label: "Minimum", value: formatNumber(stats.min) },
      { label: "Maximum", value: formatNumber(stats.max) },
      { label: "Range", value: formatNumber(stats.range) },
      { label: "First Quartile (Q1)", value: formatNumber(stats.q1) },
      { label: "Third Quartile (Q3)", value: formatNumber(stats.q3) },
      { label: "IQR", value: formatNumber(stats.q3 - stats.q1) },
      {
        label: useSample ? "Sample Variance" : "Population Variance",
        value: formatNumber(varianceValue)
      },
      {
        label: useSample ? "Sample SD" : "Population SD",
        value: formatNumber(sdValue)
      }
    ]);

    drawChart("descriptiveHistogram", [{
      x: values,
      type: "histogram",
      marker: {
        color: "#3182f6",
        line: { color: "#ffffff", width: 1 }
      },
      hovertemplate: "Value: %{x}<extra></extra>"
    }], {
      xaxis: { title: "Value" },
      yaxis: { title: "Frequency" },
      bargap: 0.08
    });

    drawChart("descriptiveBox", [{
      y: values,
      type: "box",
      name: "Dataset",
      boxpoints: "outliers",
      marker: { color: "#3182f6" },
      line: { color: "#3182f6" },
      fillcolor: "rgba(49,130,246,0.15)"
    }], {
      yaxis: { title: "Value" },
      showlegend: false
    });
  });
});

$("#descriptiveForm").requestSubmit();
}

/* ---------- Probability ---------- */

function factorial(n) {
if (n < 0 || !Number.isInteger(n)) {
  throw new Error("Factorial requires a non-negative integer.");
}

let result = 1;

for (let i = 2; i <= n; i++) {
  result *= i;
}

return result;
}

function logCombination(n, r) {
if (r < 0 || r > n) {
  return -Infinity;
}

let k = Math.min(r, n - r);
let result = 0;

for (let i = 1; i <= k; i++) {
  result += Math.log(n - k + i) - Math.log(i);
}

return result;
}

function combination(n, r) {
if (r < 0 || r > n) return 0;

const logarithm = logCombination(n, r);

if (logarithm > 700) {
  throw new Error("Combination is too large for direct calculation.");
}

return Math.round(Math.exp(logarithm));
}

function binomialPMF(n, p, k) {
if (
  !Number.isInteger(n) ||
  n < 0 ||
  !Number.isInteger(k) ||
  k < 0 ||
  k > n ||
  p < 0 ||
  p > 1
) {
  return 0;
}

if (p === 0) return k === 0 ? 1 : 0;
if (p === 1) return k === n ? 1 : 0;

return Math.exp(
  logCombination(n, k) +
  k * Math.log(p) +
  (n - k) * Math.log1p(-p)
);
}

function renderProbability() {
setPageTitle(MODULES.probability.title, MODULES.probability.subtitle);

renderView(`
  ${sectionHeader(
    "Probability Calculator",
    "Calculate binomial probabilities and visualize the probability mass function."
  )}

  <div class="grid grid-2">
    <section class="card">
      ${cardHeader(
        "Binomial Distribution",
        "Model the number of successes in independent trials."
      )}

      <form id="probabilityForm">
        <div class="form-group">
          <label for="binomialN">Number of trials (n)</label>
          <input id="binomialN" type="number" min="1" max="1000"
            step="1" value="10" required>
        </div>

        <div class="form-group">
          <label for="binomialP">Success probability (p)</label>
          <input id="binomialP" type="number" min="0" max="1"
            step="0.01" value="0.5" required>
          <span class="form-hint">Enter a probability from 0 to 1.</span>
        </div>

        <div class="form-group">
          <label for="binomialK">Exact number of successes (k)</label>
          <input id="binomialK" type="number" min="0" max="10"
            step="1" value="5" required>
        </div>

        <button class="btn btn-primary btn-block" type="submit">
          Calculate Probability
        </button>
      </form>
    </section>

    <section class="card">
      ${cardHeader("Binomial Formula", "Probability of exactly k successes.")}

      <div class="results-panel">
        <h3 class="results-title">Probability Mass Function</h3>
        <p>
          P(X = k) = C(n, k) × p<sup>k</sup> × (1 − p)<sup>n − k</sup>
        </p>
        <p class="card-description">
          Assumptions: a fixed number of independent trials, two possible
          outcomes per trial, and a constant success probability.
        </p>
      </div>

      <div id="probabilitySummary" class="mt-2"></div>
    </section>
  </div>

  <div id="probabilityResults"></div>

  <div class="mt-3">
    ${chartCard(
      "binomialChart",
      "Binomial Probability Distribution",
      "Each bar represents the probability of a possible number of successes."
    )}
  </div>
`);

const nInput = $("#binomialN");
const kInput = $("#binomialK");

nInput.addEventListener("input", () => {
  kInput.max = nInput.value;

  if (Number(kInput.value) > Number(nInput.value)) {
    kInput.value = nInput.value;
  }
});

$("#probabilityForm").addEventListener("submit", event => {
  event.preventDefault();

  runSafely(() => {
    const n = requireInteger(nInput.value, "Number of trials", 1);
    const p = Number($("#binomialP").value);
    const k = requireInteger(kInput.value, "Success count", 0);

    if (n > 1000) {
      throw new Error("For this interactive chart, n cannot exceed 1000.");
    }

    if (!Number.isFinite(p) || p < 0 || p > 1) {
      throw new Error("Probability must be between 0 and 1.");
    }

    if (k > n) {
      throw new Error("The success count cannot exceed the trial count.");
    }

    const probabilities = Array.from(
      { length: n + 1 },
      (_, x) => binomialPMF(n, p, x)
    );

    const exact = probabilities[k];
    const cumulative = probabilities
      .slice(0, k + 1)
      .reduce((total, value) => total + value, 0);

    const expectedValue = n * p;
    const varianceValue = n * p * (1 - p);

    $("#probabilityResults").innerHTML = renderResults([
      { label: "P(X = k)", value: formatNumber(exact, 6) },
      { label: "P(X ≤ k)", value: formatNumber(cumulative, 6) },
      { label: "P(X > k)", value: formatNumber(1 - cumulative, 6) },
      { label: "Expected Value", value: formatNumber(expectedValue) },
      { label: "Variance", value: formatNumber(varianceValue) },
      { label: "Standard Deviation", value: formatNumber(Math.sqrt(varianceValue)) }
    ]);

    $("#probabilitySummary").innerHTML = `
      <div class="alert alert-info">
        <strong>Interpretation:</strong>
        With n = ${n} and p = ${formatNumber(p, 3)}, the probability of
        exactly ${k} successes is ${formatNumber(exact * 100, 3)}%.
      </div>
    `;

    drawChart("binomialChart", [{
      x: Array.from({ length: n + 1 }, (_, i) => i),
      y: probabilities,
      type: "bar",
      marker: {
        color: Array.from(
          { length: n + 1 },
          (_, i) => i === k ? "#175cd3" : "#76b5ff"
        )
      },
      hovertemplate: "Successes: %{x}<br>Probability: %{y:.6f}<extra></extra>"
    }], {
      xaxis: { title: "Number of successes (k)", dtick: Math.max(1, Math.ceil(n / 20)) },
      yaxis: { title: "Probability", rangemode: "tozero" },
      showlegend: false
    });
  });
});

$("#probabilityForm").requestSubmit();
}

/* ---------- Sampling Distribution / CLT ---------- */

function randomNormal(meanValue, sd) {
const u1 = Math.max(Number.EPSILON, Math.random());
const u2 = Math.random();

return meanValue +
  sd * Math.sqrt(-2 * Math.log(u1)) *
  Math.cos(2 * Math.PI * u2);
}

function renderSampling() {
setPageTitle(MODULES.sampling.title, MODULES.sampling.subtitle);

renderView(`
  ${sectionHeader(
    "Sampling Distributions",
    "Simulate sample means and examine how their distribution changes with sample size."
  )}

  <div class="grid grid-2">
    <section class="card">
      ${cardHeader(
        "Simulation Settings",
        "This simulation uses a normal population."
      )}

      <form id="samplingForm">
        <div class="form-group">
          <label for="populationMean">Population mean (μ)</label>
          <input id="populationMean" type="number" step="any" value="100" required>
        </div>

        <div class="form-group">
          <label for="populationSD">Population SD (σ)</label>
          <input id="populationSD" type="number" min="0.000001"
            step="any" value="15" required>
        </div>

        <div class="form-group">
          <label for="sampleSize">Sample size (n)</label>
          <input id="sampleSize" type="number" min="2" max="500"
            step="1" value="30" required>
        </div>

        <div class="form-group">
          <label for="simulationCount">Number of simulations</label>
          <select id="simulationCount">
            <option value="500">500</option>
            <option value="1000" selected>1,000</option>
            <option value="3000">3,000</option>
            <option value="5000">5,000</option>
          </select>
        </div>

        <button class="btn btn-primary btn-block" type="submit">
          Run Simulation
        </button>
      </form>
    </section>

    <section class="card">
      ${cardHeader("Central Limit Theorem", "The distribution of sample means.")}

      <div class="alert alert-info">
        For independent observations with finite variance, the sampling
        distribution of the sample mean approaches a normal distribution
        as the sample size grows under the usual CLT conditions.
      </div>

      <p class="card-description">
        The theoretical standard error of the sample mean is:
      </p>

      <div class="results-panel">
        <h3 class="results-title">Standard Error</h3>
        <p>SE = σ / √n</p>
        <div id="samplingFormulaResult"></div>
      </div>
    </section>
  </div>

  <div id="samplingResults"></div>

  <div class="mt-3">
    ${chartCard(
      "samplingChart",
      "Distribution of Simulated Sample Means",
      "Compare the simulated sample means with the population mean."
    )}
  </div>
`);

$("#samplingForm").addEventListener("submit", event => {
  event.preventDefault();

  runSafely(() => {
    const populationMean = Number($("#populationMean").value);
    const populationSD = requirePositive(
      $("#populationSD").value,
      "Population SD"
    );
    const n = requireInteger($("#sampleSize").value, "Sample size", 2);
    const simulations = requireInteger(
      $("#simulationCount").value,
      "Simulation count",
      1
    );

    if (!Number.isFinite(populationMean)) {
      throw new Error("Population mean must be a valid number.");
    }

    if (n > 500) {
      throw new Error("Sample size cannot exceed 500.");
    }

    const sampleMeans = [];

    for (let simulation = 0; simulation < simulations; simulation++) {
      let total = 0;

      for (let j = 0; j < n; j++) {
        total += randomNormal(populationMean, populationSD);
      }

      sampleMeans.push(total / n);
    }

    const simulatedMean = mean(sampleMeans);
    const simulatedSD = standardDeviation(sampleMeans);
    const theoreticalSE = populationSD / Math.sqrt(n);

    $("#samplingFormulaResult").innerHTML = `
      <strong class="result-value">${formatNumber(theoreticalSE)}</strong>
    `;

    $("#samplingResults").innerHTML = renderResults([
      { label: "Simulations", value: String(simulations) },
      { label: "Sample Size", value: String(n) },
      { label: "Population Mean", value: formatNumber(populationMean) },
      { label: "Simulated Mean", value: formatNumber(simulatedMean) },
      { label: "Theoretical SE", value: formatNumber(theoreticalSE) },
      { label: "Simulated SD of Means", value: formatNumber(simulatedSD) }
    ]);

    drawChart("samplingChart", [
      {
        x: sampleMeans,
        type: "histogram",
        name: "Simulated sample means",
        marker: { color: "#3182f6" },
        opacity: 0.8,
        histnorm: "probability density"
      },
      {
        x: [populationMean, populationMean],
        y: [0, 1 / (theoreticalSE * Math.sqrt(2 * Math.PI))],
        type: "scatter",
        mode: "lines",
        name: "Population mean",
        line: { color: "#e5484d", width: 2, dash: "dash" }
      }
    ], {
      xaxis: { title: "Sample mean" },
      yaxis: { title: "Probability density" },
      barmode: "overlay"
    });
  });
});

$("#samplingForm").requestSubmit();
}

/* ---------- Normal Distribution Utilities ---------- */

function normalCDF(z) {
// Abramowitz-Stegun approximation to the standard normal CDF.
const sign = z < 0 ? -1 : 1;
const x = Math.abs(z) / Math.sqrt(2);
const t = 1 / (1 + 0.3275911 * x);

const erf = 1 - (
  (((((1.061405429 * t - 1.453152027) * t) +
    1.421413741) * t - 0.284496736) * t +
    0.254829592) * t * Math.exp(-x * x)
);

return Math.min(1, Math.max(0, 0.5 * (1 + sign * erf)));
}

function inverseNormalCDF(p) {
if (!(p > 0 && p < 1)) {
  throw new Error("Probability must be strictly between 0 and 1.");
}

const a = [
  -39.6968302866538,
  220.946098424521,
  -275.928510446969,
  138.357751867269,
  -30.6647980661472,
  2.50662827745924
];

const b = [
  -54.4760987982241,
  161.585836858041,
  -155.698979859887,
  66.8013118877197,
  -13.2806815528857
];

const c = [
  -0.00778489400243029,
  -0.322396458041136,
  -2.40075827716184,
  -2.54973253934373,
  4.37466414146497,
  2.93816398269878
];

const d = [
  0.00778469570904146,
  0.32246712907004,
  2.445134137143,
  3.75440866190742
];

const low = 0.02425;
const high = 1 - low;

if (p < low) {
  const q = Math.sqrt(-2 * Math.log(p));

  return (((((c[0] * q + c[1]) * q + c[2]) * q +
    c[3]) * q + c[4]) * q + c[5]) /
    ((((d[0] * q + d[1]) * q + d[2]) * q +
    d[3]) * q + 1);
}

if (p > high) {
  const q = Math.sqrt(-2 * Math.log(1 - p));

  return -(((((c[0] * q + c[1]) * q + c[2]) * q +
    c[3]) * q + c[4]) * q + c[5]) /
    ((((d[0] * q + d[1]) * q + d[2]) * q +
    d[3]) * q + 1);
}

const q = p - 0.5;
const r = q * q;

return (((((a[0] * r + a[1]) * r + a[2]) * r +
  a[3]) * r + a[4]) * r + a[5]) * q /
  (((((b[0] * r + b[1]) * r + b[2]) * r +
  b[3]) * r + b[4]) * r + 1);
}

/* ---------- Inferential Statistics ---------- */

function renderInference() {
setPageTitle(MODULES.inference.title, MODULES.inference.subtitle);

renderView(`
  ${sectionHeader(
    "Inferential Statistics",
    "Construct a confidence interval or perform a one-sample z-test when population SD is known."
  )}

  <div class="grid grid-2">
    <section class="card">
      ${cardHeader(
        "One-Sample Z Analysis",
        "Use this calculator when the population standard deviation is known and the normal-model assumptions are appropriate."
      )}

      <form id="inferenceForm">
        <div class="form-group">
          <label for="inferMean">Sample mean (x̄)</label>
          <input id="inferMean" type="number" step="any" value="52" required>
        </div>

        <div class="form-group">
          <label for="inferSD">Known population SD (σ)</label>
          <input id="inferSD" type="number" min="0.000001"
            step="any" value="10" required>
        </div>

        <div class="form-group">
          <label for="inferN">Sample size (n)</label>
          <input id="inferN" type="number" min="2" step="1" value="100" required>
        </div>

        <div class="form-group">
          <label for="inferMu">Null / reference mean (μ₀)</label>
          <input id="inferMu" type="number" step="any" value="50" required>
        </div>

        <div class="form-group">
          <label for="inferConfidence">Confidence level</label>
          <select id="inferConfidence">
            <option value="0.90">90%</option>
            <option value="0.95" selected>95%</option>
            <option value="0.99">99%</option>
          </select>
        </div>

        <div class="form-group">
          <label for="inferAlternative">Alternative hypothesis</label>
          <select id="inferAlternative">
            <option value="two">Two-sided: μ ≠ μ₀</option>
            <option value="greater">Right-sided: μ &gt; μ₀</option>
            <option value="less">Left-sided: μ &lt; μ₀</option>
          </select>
        </div>

        <button class="btn btn-primary btn-block" type="submit">
          Run Inference
        </button>
      </form>
    </section>

    <section class="card">
      ${cardHeader("Interpretation Guide", "Read results with care.")}

      <div class="alert alert-info">
        <strong>Confidence interval:</strong>
        A method that, over repeated sampling, captures the fixed population
        parameter at the stated long-run rate when its assumptions hold.
      </div>

      <div class="alert alert-info">
        <strong>p-value:</strong>
        The probability, assuming the null hypothesis is true, of a test
        statistic at least as extreme as the observed one in the specified
        direction(s).
      </div>

      <div class="alert alert-warning">
        A z-test is not appropriate for every dataset. When population SD
        is unknown, a one-sample t procedure is commonly used instead,
        subject to its assumptions.
      </div>
    </section>
  </div>

  <div id="inferenceResults"></div>
`);

$("#inferenceForm").addEventListener("submit", event => {
  event.preventDefault();

  runSafely(() => {
    const sampleMean = Number($("#inferMean").value);
    const populationSD = requirePositive(
      $("#inferSD").value,
      "Population SD"
    );
    const n = requireInteger($("#inferN").value, "Sample size", 2);
    const mu0 = Number($("#inferMu").value);
    const confidence = Number($("#inferConfidence").value);
    const alternative = $("#inferAlternative").value;

    if (!Number.isFinite(sampleMean) || !Number.isFinite(mu0)) {
      throw new Error("Means must be valid numbers.");
    }

    const alpha = 1 - confidence;
    const standardError = populationSD / Math.sqrt(n);
    const critical = inverseNormalCDF(1 - alpha / 2);
    const lower = sampleMean - critical * standardError;
    const upper = sampleMean + critical * standardError;
    const z = (sampleMean - mu0) / standardError;

    let pValue;

    if (alternative === "greater") {
      pValue = 1 - normalCDF(z);
    } else if (alternative === "less") {
      pValue = normalCDF(z);
    } else {
      pValue = 2 * (1 - normalCDF(Math.abs(z)));
    }

    pValue = Math.max(0, Math.min(1, pValue));

    const reject = pValue < alpha;

    $("#inferenceResults").innerHTML = `
      ${renderResults([
        { label: "Standard Error", value: formatNumber(standardError) },
        { label: "Z Statistic", value: formatNumber(z) },
        { label: "p-value", value: formatNumber(pValue, 6) },
        { label: `${formatNumber(confidence * 100, 0)}% CI Lower`, value: formatNumber(lower) },
        { label: `${formatNumber(confidence * 100, 0)}% CI Upper`, value: formatNumber(upper) },
        { label: "Significance Level (α)", value: formatNumber(alpha, 3) }
      ])}

      <div class="alert ${reject ? "alert-warning" : "alert-success"} mt-2">
        <div>
          <strong>
            ${reject
              ? "Reject the null hypothesis."
              : "Do not reject the null hypothesis."}
          </strong>
          At α = ${formatNumber(alpha, 3)}, the p-value is
          ${formatNumber(pValue, 6)}.
          This is a statistical decision, not proof that either hypothesis
          is true.
        </div>
      </div>
    `;
  });
});

$("#inferenceForm").requestSubmit();
}

/* ---------- Regression Analysis ---------- */

function calculateRegression(xValues, yValues) {
if (xValues.length !== yValues.length) {
  throw new Error("X and Y must contain the same number of observations.");
}

if (xValues.length < 3) {
  throw new Error("Enter at least three paired observations for regression.");
}

const xMean = mean(xValues);
const yMean = mean(yValues);

const sxx = sum(xValues.map(x => (x - xMean) ** 2));
const syy = sum(yValues.map(y => (y - yMean) ** 2));
const sxy = sum(
  xValues.map((x, index) => (x - xMean) * (yValues[index] - yMean))
);

if (sxx === 0) {
  throw new Error("All X values are identical; slope cannot be calculated.");
}

if (syy === 0) {
  throw new Error("All Y values are identical; correlation is undefined.");
}

const slope = sxy / sxx;
const intercept = yMean - slope * xMean;
const r = sxy / Math.sqrt(sxx * syy);
const rSquared = r * r;

const predictions = xValues.map(x => intercept + slope * x);
const residuals = yValues.map((y, index) => y - predictions[index]);
const sse = sum(residuals.map(residual => residual ** 2));
const residualSD = Math.sqrt(sse / (xValues.length - 2));

return {
  count: xValues.length,
  xMean,
  yMean,
  slope,
  intercept,
  r,
  rSquared,
  predictions,
  residuals,
  sse,
  residualSD
};
}

function renderRegression() {
setPageTitle(MODULES.regression.title, MODULES.regression.subtitle);

renderView(`
  ${sectionHeader(
    "Regression Analysis",
    "Fit a simple least-squares line and visualize the relationship between two variables."
  )}

  <div class="grid grid-2">
    <section class="card">
      ${cardHeader(
        "Enter Paired Data",
        "The X and Y lists must have the same number of observations."
      )}

      <form id="regressionForm">
        <div class="form-group">
          <label for="regressionX">Independent variable (X)</label>
          <textarea id="regressionX" class="data-input" required>1, 2, 3, 4, 5, 6</textarea>
        </div>

        <div class="form-group">
          <label for="regressionY">Dependent variable (Y)</label>
          <textarea id="regressionY" class="data-input" required>2, 4, 5, 4, 5, 7</textarea>
        </div>

        <div class="form-group">
          <label for="predictX">Predict Y for X =</label>
          <input id="predictX" type="number" step="any" value="7" required>
        </div>

        <button class="btn btn-primary btn-block" type="submit">
          Fit Regression Model
        </button>
      </form>
    </section>

    <section class="card">
      ${cardHeader("Linear Regression", "Model form and interpretation.")}

      <div class="results-panel">
        <h3 class="results-title">Fitted Equation</h3>
        <p>Ŷ = a + bX</p>
        <p class="card-description">
          The intercept a is the fitted value at X = 0.
          The slope b is the fitted change in Y for a one-unit increase
          in X.
        </p>
      </div>

      <div class="alert alert-info mt-2">
        <strong>R²:</strong> The proportion of observed variation in Y
        explained by the fitted linear model in this dataset.
      </div>
    </section>
  </div>

  <div id="regressionResults"></div>

  <div class="mt-3">
    ${chartCard(
      "regressionChart",
      "Scatter Plot and Fitted Line",
      "The fitted line summarizes the linear association in the entered data."
    )}
  </div>
`);

$("#regressionForm").addEventListener("submit", event => {
  event.preventDefault();

  runSafely(() => {
    const xValues = parseNumberList($("#regressionX").value);
    const yValues = parseNumberList($("#regressionY").value);
    const predictX = Number($("#predictX").value);

    if (!Number.isFinite(predictX)) {
      throw new Error("Prediction X must be a valid number.");
    }

    const model = calculateRegression(xValues, yValues);
    const predictedY = model.intercept + model.slope * predictX;

    $("#regressionResults").innerHTML = renderResults([
      { label: "Observations", value: String(model.count) },
      { label: "Slope", value: formatNumber(model.slope) },
      { label: "Intercept", value: formatNumber(model.intercept) },
      { label: "Correlation (r)", value: formatNumber(model.r) },
      { label: "R-squared", value: formatNumber(model.rSquared) },
      { label: `Predicted Y at X=${formatNumber(predictX)}`, value: formatNumber(predictedY) }
    ]);

    const minX = Math.min(...xValues);
    const maxX = Math.max(...xValues);

    drawChart("regressionChart", [
      {
        x: xValues,
        y: yValues,
        type: "scatter",
        mode: "markers",
        name: "Observed data",
        marker: {
          color: "#3182f6",
          size: 10,
          line: { color: "#ffffff", width: 1 }
        },
        hovertemplate: "X: %{x}<br>Y: %{y}<extra></extra>"
      },
      {
        x: [minX, maxX],
        y: [
          model.intercept + model.slope * minX,
          model.intercept + model.slope * maxX
        ],
        type: "scatter",
        mode: "lines",
        name: "Fitted line",
        line: { color: "#e5484d", width: 2 }
      }
    ], {
      xaxis: { title: "X" },
      yaxis: { title: "Y" }
    });
  });
});

$("#regressionForm").requestSubmit();
}

/* ---------- Demography ---------- */

function renderDemography() {
setPageTitle(MODULES.demography.title, MODULES.demography.subtitle);

renderView(`
  ${sectionHeader(
    "Demography",
    "Calculate population growth, annual change and theoretical doubling time."
  )}

  <div class="grid grid-2">
    <section class="card">
      ${cardHeader(
        "Population Growth Calculator",
        "Use an exponential growth model with a constant annual rate."
      )}

      <form id="demographyForm">
        <div class="form-group">
          <label for="initialPopulation">Initial population (P₀)</label>
          <input id="initialPopulation" type="number" min="0.000001"
            step="any" value="100000" required>
        </div>

        <div class="form-group">
          <label for="growthRate">Annual growth rate (%)</label>
          <input id="growthRate" type="number" step="any"
            value="1.5" required>
          <span class="form-hint">
            Use a negative rate for population decline.
          </span>
        </div>

        <div class="form-group">
          <label for="growthYears">Projection period (years)</label>
          <input id="growthYears" type="number" min="0" max="500"
            step="1" value="20" required>
        </div>

        <button class="btn btn-primary btn-block" type="submit">
          Project Population
        </button>
      </form>
    </section>

    <section class="card">
      ${cardHeader("Growth Model", "Discrete annual compounding.")}

      <div class="results-panel">
        <h3 class="results-title">Projection Formula</h3>
        <p>P(t) = P₀ × (1 + r)<sup>t</sup></p>
        <p class="card-description">
          P₀ is the initial population, r is the annual growth rate
          expressed as a decimal, and t is time in years.
        </p>
      </div>

      <div class="alert alert-warning mt-2">
        This is a simplified projection, not a population forecast.
        It assumes the same annual rate throughout the projection period
        and does not account for age structure, migration or policy changes.
      </div>
    </section>
  </div>

  <div id="demographyResults"></div>

  <div class="mt-3">
    ${chartCard(
      "demographyChart",
      "Population Projection",
      "Projected population under the selected constant annual growth rate."
    )}
  </div>
`);

$("#demographyForm").addEventListener("submit", event => {
  event.preventDefault();

  runSafely(() => {
    const initialPopulation = requirePositive(
      $("#initialPopulation").value,
      "Initial population"
    );

    const ratePercent = Number($("#growthRate").value);
    const years = requireInteger($("#growthYears").value, "Years", 0);

    if (!Number.isFinite(ratePercent) || ratePercent <= -100) {
      throw new Error("Annual growth rate must be greater than -100%.");
    }

    if (years > 500) {
      throw new Error("Projection period cannot exceed 500 years.");
    }

    const rate = ratePercent / 100;
    const projectedPopulation =
      initialPopulation * Math.pow(1 + rate, years);

    const annualChange = initialPopulation * rate;
    const totalChange = projectedPopulation - initialPopulation;

    let doublingTime = "Not applicable";

    if (rate > 0) {
      doublingTime = formatNumber(
        Math.log(2) / Math.log(1 + rate),
        2
      ) + " years";
    }

    const labels = [];
    const populations = [];

    for (let year = 0; year <= years; year++) {
      labels.push(year);
      populations.push(
        initialPopulation * Math.pow(1 + rate, year)
      );
    }

    $("#demographyResults").innerHTML = renderResults([
      { label: "Initial Population", value: formatNumber(initialPopulation, 0) },
      { label: "Annual Growth Rate", value: `${formatNumber(ratePercent, 3)}%` },
      { label: "Projected Population", value: formatNumber(projectedPopulation, 0) },
      { label: "Total Population Change", value: formatNumber(totalChange, 0) },
      { label: "First-Year Change", value: formatNumber(annualChange, 0) },
      { label: "Approx. Doubling Time", value: doublingTime }
    ]);

    drawChart("demographyChart", [{
      x: labels,
      y: populations,
      type: "scatter",
      mode: "lines+markers",
      name: "Population",
      line: { color: "#3182f6", width: 3 },
      marker: { size: 5 },
      fill: "tozeroy",
      fillcolor: "rgba(49,130,246,0.09)",
      hovertemplate: "Year: %{x}<br>Population: %{y:,.0f}<extra></extra>"
    }], {
      xaxis: { title: "Years from baseline", dtick: Math.max(1, Math.ceil(years / 10)) },
      yaxis: { title: "Population", rangemode: "tozero" },
      showlegend: false
    });
  });
});

$("#demographyForm").requestSubmit();
}

/* ---------- Navigation ---------- */

function navigateTo(moduleName) {
if (!Object.prototype.hasOwnProperty.call(MODULES, moduleName)) {
  moduleName = "home";
}

state.currentModule = moduleName;

setActiveNavigation(moduleName);
clearMessage();

const renderers = {
  home: renderHome,
  descriptive: renderDescriptive,
  probability: renderProbability,
  sampling: renderSampling,
  inference: renderInference,
  regression: renderRegression,
  demography: renderDemography
};

renderers[moduleName]();
}

document.addEventListener("click", event => {
const navButton = event.target.closest("[data-module]");

if (navButton) {
  navigateTo(navButton.dataset.module);
  return;
}

const goButton = event.target.closest("[data-go]");

if (goButton) {
  navigateTo(goButton.dataset.go);
}
});

/* ---------- Authentication UI ---------- */

function openAuthDialog(mode = "login") {
const dialog = $("#authDialog");

if (!dialog) {
  showMessage("Authentication dialog was not found in index.html.", "error");
  return;
}

state.authMode = mode;

const title = $("#authTitle");
const description = $("#authDescription");
const submit = $("#authSubmit");
const toggle = $("#toggleAuth");
const message = $("#authMessage");

if (title) {
  title.textContent = mode === "signup" ? "Create your account" : "Welcome back";
}

if (description) {
  description.textContent = mode === "signup"
    ? "Sign up to access your StatHub account."
    : "Log in to continue to your statistics workspace.";
}

if (submit) {
  submit.textContent = mode === "signup" ? "Create Account" : "Log In";
}

if (toggle) {
  toggle.textContent = mode === "signup"
    ? "Already have an account? Log in"
    : "New to StatHub? Create an account";
}

if (message) {
  message.textContent = "";
}

if (typeof dialog.showModal === "function") {
  if (!dialog.open) dialog.showModal();
} else {
  dialog.setAttribute("open", "");
}
}

function closeAuthDialog() {
const dialog = $("#authDialog");

if (!dialog) return;

if (typeof dialog.close === "function") {
  dialog.close();
} else {
  dialog.removeAttribute("open");
}
}

function updateUserUI(user) {
state.currentUser = user || null;

const button = $("#authButton");
const label = $("#userLabel");

if (user) {
  if (button) button.textContent = "Log Out";

  if (label) {
    label.textContent =
      user.email ||
      user.user_metadata?.full_name ||
      "Signed in";
  }
} else {
  if (button) button.textContent = "Log In";

  if (label) {
    label.textContent = "Guest mode";
  }
}
}

function setAuthMessage(message, type = "info") {
const element = $("#authMessage");

if (!element) return;

element.className = `auth-message text-${type === "error" ? "danger" : type === "success" ? "success" : "muted"}`;
element.textContent = message;
}

/* ---------- Supabase Integration ---------- */
/*
Supabase Configuration
Never put a Supabase service_role or secret key in browser code.
*/

const SUPABASE_CONFIG = {
  url: "https://vslkfqdcevyiehdvkkme.supabase.co",
  key: "sb_publishable_3-MNRr_KjxFvC0uRdoJpCg_vp9wTAvB"
};

// GitHub Pages website URL
const SUPABASE_REDIRECT_URL =
  "https://safayet309.github.io/StatHub/";

let supabaseClient = null;

function isSupabaseConfigured() {
  return (
    SUPABASE_CONFIG.url.startsWith("https://") &&
    !SUPABASE_CONFIG.url.includes("YOUR_SUPABASE") &&
    SUPABASE_CONFIG.key.length > 20 &&
    !SUPABASE_CONFIG.key.includes("YOUR_SUPABASE")
  );
}

function setConnectionStatus(message, status = "offline") {
  const connectionText = $("#connectionText");

  if (connectionText) {
    connectionText.textContent = message;
  }

  const dot = $(".status-dot");

  if (dot) {
    dot.classList.remove("connected", "error");

    if (status === "connected") {
      dot.classList.add("connected");
    } else if (status === "error") {
      dot.classList.add("error");
    }
  }
}

async function initializeSupabase() {
  if (!isSupabaseConfigured()) {
    setConnectionStatus("Supabase not configured", "offline");
    updateUserUI(null);
    return;
  }

  if (!window.supabase?.createClient) {
    setConnectionStatus("Supabase library unavailable", "error");
    console.error(
      "Supabase JS library is missing. Check index.html."
    );
    return;
  }

  try {
    supabaseClient = window.supabase.createClient(
      SUPABASE_CONFIG.url,
      SUPABASE_CONFIG.key
    );

    const { data, error } =
      await supabaseClient.auth.getSession();

    if (error) throw error;

    updateUserUI(data.session?.user || null);

    setConnectionStatus("Supabase connected", "connected");

    supabaseClient.auth.onAuthStateChange(
      (_event, session) => {
        updateUserUI(session?.user || null);
      }
    );
  } catch (error) {
    console.error("Supabase initialization failed:", error);
    setConnectionStatus("Connection failed", "error");
  }
}

async function handleAuthSubmit(event) {
  event.preventDefault();

  if (!supabaseClient) {
    setAuthMessage(
      "Supabase is not connected. Please check your configuration.",
      "error"
    );
    return;
  }

  const email = $("#authEmail")?.value.trim();
  const password = $("#authPassword")?.value;

  if (!email || !password) {
    setAuthMessage(
      "Enter your email and password.",
      "error"
    );
    return;
  }

  if (password.length < 6) {
    setAuthMessage(
      "Password must be at least 6 characters.",
      "error"
    );
    return;
  }

  const submitButton = $("#authSubmit");

  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = "Please wait...";
  }

  try {
    let result;

    if (state.authMode === "signup") {
      result = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: SUPABASE_REDIRECT_URL
        }
      });
    } else {
      result = await supabaseClient.auth.signInWithPassword({
        email,
        password
      });
    }

    if (result.error) {
      throw result.error;
    }

    if (
      state.authMode === "signup" &&
      !result.data.session
    ) {
      setAuthMessage(
        "Account created. Please check your email and confirm your account before logging in.",
        "success"
      );
      return;
    }

    setAuthMessage(
      "Authentication successful.",
      "success"
    );

    closeAuthDialog();

    showMessage(
      "You are signed in.",
      "success"
    );

  } catch (error) {
    console.error("Authentication error:", error);

    let message =
      error.message || "Authentication failed.";

    if (
      error.message?.toLowerCase().includes("already registered")
    ) {
      message =
        "This email is already registered. Please log in instead.";
    }

    setAuthMessage(message, "error");

  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent =
        state.authMode === "signup"
          ? "Create Account"
          : "Log In";
    }
  }
}

async function handleAuthButton() {
  if (state.currentUser && supabaseClient) {
    const confirmed = window.confirm(
      "Are you sure you want to log out?"
    );

    if (!confirmed) return;

    const { error } =
      await supabaseClient.auth.signOut();

    if (error) {
      showMessage(error.message, "error");
      return;
    }

    updateUserUI(null);

    showMessage(
      "You have logged out.",
      "success"
    );

    return;
  }

  openAuthDialog("login");
}

function initializeAuthUI() {
  $("#authButton")?.addEventListener(
    "click",
    handleAuthButton
  );

  $("#closeAuth")?.addEventListener(
    "click",
    closeAuthDialog
  );

  $("#authForm")?.addEventListener(
    "submit",
    handleAuthSubmit
  );

  $("#toggleAuth")?.addEventListener("click", () => {
    openAuthDialog(
      state.authMode === "login"
        ? "signup"
        : "login"
    );
  });

  $("#authDialog")?.addEventListener("click", event => {
    if (event.target === $("#authDialog")) {
      closeAuthDialog();
    }
  });
}

/* ---------- App Startup ---------- */

function initializeApp() {
initializeAuthUI();
navigateTo(APP_CONFIG.defaultModule);
initializeSupabase();

console.info(
  `${APP_CONFIG.name} v${APP_CONFIG.version} initialized.`
);
}

if (document.readyState === "loading") {
document.addEventListener("DOMContentLoaded", initializeApp);
} else {
initializeApp();
}
