document.getElementById('fileInput').addEventListener('change', handleFiles, false);
// VO Multi-Session Dashboard JS (D3.js)
// Loads multiple exported session logs and renders timeline, histogram, and heatmap

const fileInput = document.getElementById("fileInput");
let sessions = [];
const BASELINE_WINDOW = 10;
const TOLERANCE_PCT = 15;


fileInput.addEventListener("change", handleFiles);

function handleFiles() {
  const files = Array.from(fileInput.files);
  files.forEach(file => {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const data = JSON.parse(e.target.result);
        checkBaselineDrift(data);
        sessions.push(data);
        renderDashboard();
      } catch (err) {
        console.error("Invalid JSON", err);
      }
    };
    reader.readAsText(file);
  });
}

function avgRun(run) {
  return d3.mean(run.events
    .filter(e => /PLAY:/.test(e.message))
    .map(e => parseFloat(e.message.match(/Load\+Play:\s([\d.]+)\sms/)[1]))
  );
}

function voLog(msg) {
  // Log to overlay if present, else console
  let overlay = document.getElementById('vo-log');
  if (overlay) {
    const p = document.createElement('p');
    p.textContent = msg;
    overlay.appendChild(p);
    overlay.scrollTop = overlay.scrollHeight;
  } else {
    console.log(msg);
  }
}

function checkBaselineDrift(newRun) {
  const sorted = sessions
    .slice(0, -1) // exclude the incoming run
    .sort((a, b) => new Date(a.runStarted) - new Date(b.runStarted));
  const recent = sorted.slice(-BASELINE_WINDOW);

  if (recent.length < 3) return; // not enough data to form baseline

  const baseline = d3.mean(recent.map(avgRun));
  const current = avgRun(newRun);
  const deltaPct = ((current - baseline) / baseline) * 100;

  if (Math.abs(deltaPct) > TOLERANCE_PCT) {
    voLog(`🚨 BASELINE DRIFT: ${deltaPct.toFixed(1)}% from ${baseline.toFixed(1)} ms [${newRun.runHash || ''}]`);
    // tag session for red‑dot flash
    newRun._driftFlag = true;
  }
}

function renderDashboard() {
  d3.select("#timeline").html("");
  d3.select("#histogram").html("");
  d3.select("#heatmap").html("");

  renderTimeline();
  renderHistogram();
  renderHeatmap();
}

function renderTimeline() {
  const margin = {top: 20, right: 30, bottom: 30, left: 40};
  const width = 500, height = 250;
  const thresholdMs = 250; // tweak this to your tolerance

  const svg = d3.select("#timeline").append("svg")
    .attr("width", width)
    .attr("height", height);

  const x = d3.scaleTime()
    .domain(d3.extent(sessions, d => new Date(d.runStarted)))
    .range([margin.left, width - margin.right]);

  const y = d3.scaleLinear()
    .domain([0, d3.max(sessions, d => d3.mean(d.events
      .filter(e => /PLAY:/.test(e.message))
      .map(e => parseFloat(e.message.match(/Load\+Play:\s([\d.]+)\sms/)[1]))
    ))])
    .nice()
    .range([height - margin.bottom, margin.top]);

  // axes
  svg.append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x));
  svg.append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y));

  // line path
  svg.append("path")
    .datum(sessions)
    .attr("fill", "none")
    .attr("stroke", "#0f0")
    .attr("stroke-width", 2)
    .attr("d", d3.line()
      .x(d => x(new Date(d.runStarted)))
      .y(d => y(d3.mean(d.events
        .filter(e => /PLAY:/.test(e.message))
        .map(e => parseFloat(e.message.match(/Load\+Play:\s([\d.]+)\sms/)[1]))
      )))
    );

  // outlier markers
  svg.selectAll("circle")
    .data(sessions)
    .join("circle")
    .attr("cx", d => x(new Date(d.runStarted)))
    .attr("cy", d => y(d3.mean(d.events
      .filter(e => /PLAY:/.test(e.message))
      .map(e => parseFloat(e.message.match(/Load\+Play:\s([\d.]+)\sms/)[1]))
    )))
    .attr("r", 5)
    .attr("fill", d => d._driftFlag ? "red" : "#0f0")
    .append("title") // hover tooltip
    .text(d => {
      const avg = d3.mean(d.events
        .filter(e => /PLAY:/.test(e.message))
        .map(e => parseFloat(e.message.match(/Load\+Play:\s([\d.]+)\sms/)[1]))
      ).toFixed(1);
      return `Avg load: ${avg} ms`;
    });
}

function renderHistogram() {
  const allTimes = sessions.flatMap(s =>
    s.events.filter(e => /PLAY:/.test(e.message))
     .map(e => parseFloat(e.message.match(/Load\+Play:\s([\d.]+)\sms/)[1]))
  );

  const binSize = 50;
  const bins = d3.bin().thresholds(d3.range(0, d3.max(allTimes) + binSize, binSize))(allTimes);

  const width = 500, height = 250, margin = {top: 20, right: 30, bottom: 30, left: 40};
  const svg = d3.select("#histogram").append("svg")
    .attr("width", width)
    .attr("height", height);

  const x = d3.scaleLinear()
    .domain([0, d3.max(allTimes)]).nice()
    .range([margin.left, width - margin.right]);

  const y = d3.scaleLinear()
    .domain([0, d3.max(bins, d => d.length)]).nice()
    .range([height - margin.bottom, margin.top]);

  svg.append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x));

  svg.append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y));

  svg.selectAll("rect")
    .data(bins)
    .join("rect")
    .attr("x", d => x(d.x0))
    .attr("y", d => y(d.length))
    .attr("width", d => x(d.x1) - x(d.x0) - 1)
    .attr("height", d => y(0) - y(d.length))
    .attr("fill", "#0f0");
}

function renderHeatmap() {
  const cueStats = {};
  sessions.forEach(s => {
    s.events.filter(e => /PLAY:/.test(e.message)).forEach(e => {
      const label = e.message.split(" | ")[0].replace("PLAY: ", "");
      cueStats[label] = (cueStats[label] || 0) + 1;
    });
  });

  const cues = Object.keys(cueStats);
  const counts = Object.values(cueStats);

  const width = 500, height = cues.length * 20, margin = {top: 20, right: 30, bottom: 30, left: 100};
  const svg = d3.select("#heatmap").append("svg")
    .attr("width", width)
    .attr("height", height + margin.top + margin.bottom);

  const y = d3.scaleBand()
    .domain(cues)
    .range([margin.top, height + margin.top])
    .padding(0.1);

  const x = d3.scaleLinear()
    .domain([0, d3.max(counts)])
    .range([margin.left, width - margin.right]);

  svg.append("g")
    .attr("transform", `translate(0,${margin.top})`)
    .call(d3.axisTop(x));

  svg.append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y));

  svg.selectAll("rect")
    .data(cues)
    .join("rect")
    .attr("x", margin.left)
    .attr("y", cue => y(cue))
    .attr("width", cue => x(cueStats[cue]) - margin.left)
    .attr("height", y.bandwidth())
    .attr("fill", "#0f0");
}
