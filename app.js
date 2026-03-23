let holidays = {};
let manualHolidayCount = 0;

const monthSelect = document.getElementById("monthSelect");
const yearSelect = document.getElementById("yearSelect");
const resultDiv = document.getElementById("result");
const officeInput = document.getElementById("officeDays");
const leavesInput = document.getElementById("leaves");

// 🔒 enforce numeric only
function enforceNumber(input) {
  input.addEventListener("input", () => {
    input.value = input.value.replace(/[^0-9]/g, "");
  });
}
enforceNumber(officeInput);
enforceNumber(leavesInput);

// Init selectors
function initSelectors() {
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  months.forEach((m, i) => {
    const opt = document.createElement("option");
    opt.value = String(i + 1).padStart(2, "0");
    opt.text = m;
    monthSelect.appendChild(opt);
  });

  for (let y = 2025; y <= 2030; y++) {
    const opt = document.createElement("option");
    opt.value = y;
    opt.text = y;
    yearSelect.appendChild(opt);
  }

  const now = new Date();
  monthSelect.value = String(now.getMonth() + 1).padStart(2, "0");
  yearSelect.value = now.getFullYear();
}

// Load holidays
fetch("holidays.json")
  .then(res => res.json())
  .then(data => {
    holidays = data;
    render();
  });

monthSelect.addEventListener("change", render);
yearSelect.addEventListener("change", render);
document.getElementById("calcBtn").addEventListener("click", calculate);

function getKey() {
  return `${yearSelect.value}-${monthSelect.value}`;
}

function render() {
  resetInputs();
  renderHolidays();
  autoFillOfficeDays();
  calculate();
}

function resetInputs() {
  leavesInput.value = 0;
  manualHolidayCount = 0;
}

function renderHolidays() {
  const list = document.getElementById("holidayList");
  list.innerHTML = "";

  const key = getKey();

  if (holidays[key] && holidays[key].length === 0) {
    list.innerHTML = "<p>No declared holidays this month</p>";
    return;
  }

  if (!holidays[key]) {
    const container = document.createElement("div");

    const msg = document.createElement("p");
    msg.style.color = "orange";
    msg.innerText = "Future month — not configured";

    const input = document.createElement("input");
    input.type = "number";
    input.placeholder = "Enter declared holidays";

    enforceNumber(input);

    input.addEventListener("input", (e) => {
      manualHolidayCount = Number(e.target.value || 0);
      calculate();
    });

    container.appendChild(msg);
    container.appendChild(input);
    list.appendChild(container);
    return;
  }

  holidays[key].forEach(h => {
    const div = document.createElement("div");
    div.className = "holiday-item";
    div.innerText = `${h.date} — ${h.name}`;
    list.appendChild(div);
  });
}

function getWorkingDays(year, month) {
  let count = 0;
  let date = new Date(year, month - 1, 1);

  while (date.getMonth() === month - 1) {
    const day = date.getDay();
    if (day !== 0 && day !== 6) count++;
    date.setDate(date.getDate() + 1);
  }

  return count;
}

function getDeclaredHolidayCount(key) {
  if (holidays[key]) return holidays[key].length;
  return manualHolidayCount;
}

function autoFillOfficeDays() {
  const key = getKey();
  const year = Number(yearSelect.value);
  const month = Number(monthSelect.value);

  let working = getWorkingDays(year, month);
  working -= getDeclaredHolidayCount(key);

  officeInput.value = working > 0 ? working : 0;
}

function calculate() {
  const key = getKey();
  const year = Number(yearSelect.value);
  const month = Number(monthSelect.value);

  let totalWorking = getWorkingDays(year, month);
  const declared = getDeclaredHolidayCount(key);

  totalWorking -= declared;

  const leaves = Number(leavesInput.value || 0);
  let office = Number(officeInput.value || 0);

  let effectiveWorking = totalWorking - leaves;

  if (office > effectiveWorking) {
    office = effectiveWorking;
    officeInput.value = office;
  }

  if (effectiveWorking <= 0) {
    resultDiv.innerHTML = "<span style='color:red'>Invalid data</span>";
    return;
  }

  const percent = ((office / effectiveWorking) * 100).toFixed(2);
  const required = Math.ceil(0.6 * effectiveWorking);
  const remaining = Math.max(0, required - office);

  let statusClass = "good";
  if (percent < 60) statusClass = "bad";
  else if (percent < 70) statusClass = "warn";

  resultDiv.innerHTML = `
    <p>Total Working Days: <span class="highlight">${totalWorking}</span></p>
    <p>After Leaves: <span class="highlight">${effectiveWorking}</span></p>
    <p>Your Presence: <span class="highlight ${statusClass}">${percent}%</span></p>
    <p>Minimum Required: <span class="highlight">${required}</span></p>
    <p>Still Needed: <span class="highlight">${remaining}</span></p>
  `;
}

initSelectors();
