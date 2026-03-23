let holidays = {};

const monthSelect = document.getElementById("monthSelect");
const yearSelect = document.getElementById("yearSelect");
const resultDiv = document.getElementById("result");
const officeInput = document.getElementById("officeDays");

// Populate selectors
function initSelectors() {
  const months = [
    "Jan","Feb","Mar","Apr","May","Jun",
    "Jul","Aug","Sep","Oct","Nov","Dec"
  ];

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
  renderHolidays();
  autoFillOfficeDays();
  resultDiv.innerHTML = "Click calculate";
}

function renderHolidays() {
  const list = document.getElementById("holidayList");
  list.innerHTML = "";

  const key = getKey();

  if (!holidays[key]) {
    list.innerHTML = "<p style='color:orange'>No holidays configured</p>";
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

// 🔥 Auto-fill logic (your requirement)
function autoFillOfficeDays() {
  const key = getKey();
  const year = Number(yearSelect.value);
  const month = Number(monthSelect.value);

  let working = getWorkingDays(year, month);

  const declared = holidays[key] || [];
  working -= declared.length;

  officeInput.value = working > 0 ? working : 0;
}

function calculate() {
  const key = getKey();
  const year = Number(yearSelect.value);
  const month = Number(monthSelect.value);

  let working = getWorkingDays(year, month);

  const declared = holidays[key] || [];
  working -= declared.length;

  const leaves = Number(document.getElementById("leaves").value || 0);
  const office = Number(officeInput.value || 0);

  working -= leaves;

  if (working <= 0) {
    resultDiv.innerHTML = "Invalid data";
    return;
  }

  const percent = ((office / working) * 100).toFixed(2);
  const required = Math.ceil(0.6 * working);
  const remaining = Math.max(0, required - office);

  resultDiv.innerHTML = `
    <p><strong>Working Days:</strong> ${working}</p>
    <p><strong>Your %:</strong> ${percent}%</p>
    <p><strong>Required for 60%:</strong> ${required}</p>
    <p><strong>Remaining Needed:</strong> ${remaining}</p>
  `;
}

// Init
initSelectors();
