let holidays = {};
let manualHolidayCount = 0;
let userModifiedOffice = false;
let selectedRestricted = [];

const monthSelect = document.getElementById("monthSelect");
const yearSelect = document.getElementById("yearSelect");
const resultDiv = document.getElementById("result");
const officeInput = document.getElementById("officeDays");
const leavesInput = document.getElementById("leaves");

// numeric only
function enforceNumber(input) {
  input.addEventListener("input", () => {
    input.value = input.value.replace(/[^0-9]/g, "");
  });
}
enforceNumber(officeInput);
enforceNumber(leavesInput);

officeInput.addEventListener("input", () => {
  userModifiedOffice = true;
  calculate();
});

leavesInput.addEventListener("input", () => {
  adjustOfficeDays();
  calculate();
});

// init
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

// load holidays
fetch("holidays.json")
  .then(res => res.json())
  .then(data => {
    holidays = data;
    render();
  });

monthSelect.addEventListener("change", render);
yearSelect.addEventListener("change", render);

function getKey() {
  return `${yearSelect.value}-${monthSelect.value}`;
}

function resetInputs() {
  leavesInput.value = 0;
  manualHolidayCount = 0;
  userModifiedOffice = false;
  selectedRestricted = [];
}

function render() {
  resetInputs();
  renderHolidays();
  autoFillOfficeDays();
  calculate();
}

// 🔥 CLEAN render holidays
function renderHolidays() {
  const list = document.getElementById("holidayList");
  list.innerHTML = "";

  const key = getKey();

  if (!holidays[key]) {
    list.innerHTML = "<p style='color:orange'>Month not configured</p>";
    return;
  }

  const declared = holidays[key].filter(h => h.type === "declared");
  const restricted = holidays[key].filter(h => h.type === "restricted");

  // Declared
  if (declared.length) {
    const title = document.createElement("p");
    title.innerText = "Declared";
    title.style.fontWeight = "600";
    list.appendChild(title);

    declared.forEach(h => {
      const div = document.createElement("div");
      div.className = "holiday-item";
      div.innerText = `${h.date} — ${h.name}`;
      list.appendChild(div);
    });
  }

  // Restricted
  if (restricted.length) {
    const title = document.createElement("p");
    title.innerText = "Restricted";
    title.style.fontWeight = "600";
    title.style.marginTop = "10px";
    title.style.color = "#94a3b8";
    list.appendChild(title);

    restricted.forEach(h => {
      const isSelected = selectedRestricted.includes(h.date);

      const div = document.createElement("div");
      div.className = "holiday-item";

      const text = document.createElement("span");
      text.innerText = `${h.date} — ${h.name}`;
      text.style.color = "#94a3b8";

      const btn = document.createElement("button");
      btn.className = "mini-btn";

      if (isSelected) {
        btn.innerText = "Added";
        btn.classList.add("active");
        btn.onclick = () => {
          selectedRestricted = selectedRestricted.filter(d => d !== h.date);
          updateLeaves();
          renderHolidays();
          calculate();
        };
      } else {
        btn.innerText = "Add";
        btn.onclick = () => {
          selectedRestricted.push(h.date);
          updateLeaves();
          renderHolidays();
          calculate();
        };
      }

      div.appendChild(text);
      div.appendChild(btn);
      list.appendChild(div);
    });
  }
}

// leaves = manual + selected restricted
function updateLeaves() {
  const manual = Number(leavesInput.dataset.manual || 0);
  leavesInput.value = manual + selectedRestricted.length;
}

leavesInput.addEventListener("input", () => {
  leavesInput.dataset.manual = leavesInput.value;
});

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
  if (!holidays[key]) return manualHolidayCount;
  return holidays[key].filter(h => h.type === "declared").length;
}

function autoFillOfficeDays() {
  const key = getKey();
  const year = Number(yearSelect.value);
  const month = Number(monthSelect.value);

  let working = getWorkingDays(year, month);
  working -= getDeclaredHolidayCount(key);

  officeInput.value = working > 0 ? working : 0;
}

function adjustOfficeDays() {
  if (userModifiedOffice) return;

  const key = getKey();
  const year = Number(yearSelect.value);
  const month = Number(monthSelect.value);

  let totalWorking = getWorkingDays(year, month);
  totalWorking -= getDeclaredHolidayCount(key);

  const leaves = Number(leavesInput.value || 0);
  officeInput.value = Math.max(0, totalWorking - leaves);
}

function calculate() {
  const key = getKey();
  const year = Number(yearSelect.value);
  const month = Number(monthSelect.value);

  let totalWorking = getWorkingDays(year, month);
  totalWorking -= getDeclaredHolidayCount(key);

  const leaves = Number(leavesInput.value || 0);
  const office = Number(officeInput.value || 0);

  const effectiveWorking = totalWorking - leaves;

  if (effectiveWorking === 0) {
    resultDiv.innerHTML = `
      <p>Total Working Days: <b>${totalWorking}</b></p>
      <p>After Leaves: <b>0</b></p>
      <p>Your Presence: <b>0%</b></p>
    `;
    return;
  }

  const effectiveOffice = Math.min(office, totalWorking);

  let percent = (effectiveOffice / effectiveWorking) * 100;
  percent = Math.min(percent, 100).toFixed(2);

  const required = Math.ceil(0.6 * effectiveWorking);
  const remaining = Math.max(0, required - effectiveOffice);

  resultDiv.innerHTML = `
    <p>Total Working Days: <b>${totalWorking}</b></p>
    <p>After Leaves: <b>${effectiveWorking}</b></p>
    <p>Your Presence: <b>${percent}%</b></p>
    <p>Minimum Required: <b>${required}</b></p>
    <p>Still Needed: <b>${remaining}</b></p>
  `;
}

initSelectors();
