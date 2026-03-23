let holidays = {};

const monthSelect = document.getElementById("monthSelect");
const yearSelect = document.getElementById("yearSelect");
const resultDiv = document.getElementById("result");

// Months
const months = [
  "01","02","03","04","05","06",
  "07","08","09","10","11","12"
];

// Populate selectors
function initSelectors() {
  months.forEach((m, i) => {
    const option = document.createElement("option");
    option.value = m;
    option.text = new Date(2026, i).toLocaleString("default", { month: "short" });
    monthSelect.appendChild(option);
  });

  for (let y = 2025; y <= 2030; y++) {
    const option = document.createElement("option");
    option.value = y;
    option.text = y;
    yearSelect.appendChild(option);
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

function calculate() {
  const key = getKey();
  const year = Number(yearSelect.value);
  const month = Number(monthSelect.value);

  let working = getWorkingDays(year, month);

  const declared = holidays[key] || [];
  working -= declared.length;

  const leaves = Number(document.getElementById("leaves").value || 0);
  const office = Number(document.getElementById("officeDays").value || 0);

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
    <p><strong>Required:</strong> ${required}</p>
    <p><strong>Remaining:</strong> ${remaining}</p>
  `;
}

// Init
initSelectors();
