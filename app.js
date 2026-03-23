let holidays = {};

const picker = document.getElementById("monthPicker");
const resultDiv = document.getElementById("result");

picker.value = new Date().toISOString().slice(0, 7);

fetch("holidays.json")
  .then(res => res.json())
  .then(data => {
    holidays = data;
    render();
  });

picker.addEventListener("change", render);
document.getElementById("calcBtn").addEventListener("click", calculate);

function render() {
  renderHolidays();
  resultDiv.innerHTML = "";
}

function renderHolidays() {
  const list = document.getElementById("holidayList");
  list.innerHTML = "";

  const month = picker.value;

  if (!holidays[month]) {
    list.innerHTML = "<p style='color:orange'>No holidays configured</p>";
    return;
  }

  holidays[month].forEach(h => {
    const div = document.createElement("div");
    div.className = "holiday-item";
    div.innerText = `${h.date} — ${h.name}`;
    list.appendChild(div);
  });
}

function getWorkingDays(year, month) {
  let count = 0;
  let date = new Date(year, month, 1);

  while (date.getMonth() === month) {
    const day = date.getDay();
    if (day !== 0 && day !== 6) count++;
    date.setDate(date.getDate() + 1);
  }

  return count;
}

function calculate() {
  const [year, month] = picker.value.split("-").map(Number);

  let working = getWorkingDays(year, month - 1);

  const declared = holidays[picker.value] || [];
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
