let holidays = {};
let manualHolidayCount = 0;
let userModifiedOffice = false; 

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

// 🔥 Office input (manual override)
officeInput.addEventListener("input", () => {
  userModifiedOffice = true;
  calculate();
});

// 🔥 Leaves input → auto adjust only if NOT overridden
leavesInput.addEventListener("input", () => {
  adjustOfficeDays();
  calculate();
});

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

// Month change
monthSelect.addEventListener("change", render);
yearSelect.addEventListener("change", render);

// Optional button
document.getElementById("calcBtn").addEventListener("click", calculate);

function getKey() {
  return `${yearSelect.value}-${monthSelect.value}`;
}

// Main render
function render() {
  resetInputs();
  renderHolidays();
  autoFillOfficeDays();
  calculate();
}

// Reset values
function resetInputs() {
  leavesInput.value = 0;
  manualHolidayCount = 0;
  userModifiedOffice = false; // 🔥 reset override on month change
}

// Holiday UI
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
    msg.innerText = "Month/Year is not configured";

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

// Working days calc
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

// Auto-fill office days
function autoFillOfficeDays() {
  const key = getKey();
  const year = Number(yearSelect.value);
  const month = Number(monthSelect.value);

  let working = getWorkingDays(year, month);
  working -= getDeclaredHolidayCount(key);

  officeInput.value = working > 0 ? working : 0;
}

// 🔥 Adjust office days only if user hasn’t overridden
function adjustOfficeDays() {
  if (userModifiedOffice) return;

  const key = getKey();
  const year = Number(yearSelect.value);
  const month = Number(monthSelect.value);

  let totalWorking = getWorkingDays(year, month);
  const declared = getDeclaredHolidayCount(key);

  totalWorking -= declared;

  const leaves = Number(leavesInput.value || 0);

  let newOffice = totalWorking - leaves;

  if (newOffice < 0) newOffice = 0;

  officeInput.value = newOffice;
}

// Main calculation
function calculate() {
  const key = getKey();
  const year = Number(yearSelect.value);
  const month = Number(monthSelect.value);

  let totalWorking = getWorkingDays(year, month);
  const declared = getDeclaredHolidayCount(key);

  totalWorking -= declared;

  const leaves = Number(leavesInput.value || 0);
  const officeInputValue = Number(officeInput.value || 0);

  const effectiveWorking = totalWorking - leaves;

  // ✅ Handle full leave case (valid scenario)
  if (effectiveWorking === 0) {
    resultDiv.innerHTML = `
      <p>Total Working Days: <span class="highlight">${totalWorking}</span></p>
      <p>After Leaves: <span class="highlight">0</span></p>
      <p>Your Presence: <span class="highlight">0%</span></p>
      <p>Minimum Required: <span class="highlight">0</span></p>
      <p>Still Needed: <span class="highlight">0</span></p>
      <p style="color:#94a3b8">No working days left after leaves</p>
    `;
    return;
  }

  const effectiveOffice = Math.min(officeInputValue, totalWorking);

  let rawPercent = (effectiveOffice / effectiveWorking) * 100;
  const percent = Math.min(rawPercent, 100).toFixed(2);

  const required = Math.ceil(0.6 * effectiveWorking);
  const remaining = Math.max(0, required - effectiveOffice);

  let statusClass = "good";
  if (percent < 60) statusClass = "bad";
  else if (percent < 70) statusClass = "warn";

  const warning =
    officeInputValue > totalWorking
      ? `<p style="color:#facc15">Office days exceed possible working days.</p>`
      : "";

  resultDiv.innerHTML = `
    ${warning}
    <p>Total Working Days: <span class="highlight">${totalWorking}</span></p>
    <p>After Leaves: <span class="highlight">${effectiveWorking}</span></p>
    <p>Your Presence: <span class="highlight ${statusClass}">${percent}%</span></p>
    <p>Minimum Required: <span class="highlight">${required}</span></p>
    <p>Still Needed: <span class="highlight">${remaining}</span></p>
  `;
}

// Init
initSelectors();
