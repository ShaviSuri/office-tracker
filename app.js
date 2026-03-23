let holidays = {};
let data = JSON.parse(localStorage.getItem("office-data")) || {};

fetch('holidays.json')
.then(res => res.json())
.then(d => holidays = d);

const picker = document.getElementById("monthPicker");
picker.value = new Date().toISOString().slice(0,7);

picker.addEventListener("change", renderCalendar);

function save() {
localStorage.setItem("office-data", JSON.stringify(data));
}

function renderCalendar() {
const cal = document.getElementById("calendar");
cal.innerHTML = "";

const [year, month] = picker.value.split("-").map(Number);
const days = new Date(year, month, 0).getDate();

for (let i = 1; i <= days; i++) {
const date = `${picker.value}-${String(i).padStart(2,'0')}`;
const div = document.createElement("div");

const holiday = holidays[picker.value]?.find(h => h.date === date);
let status = data[date] || "default";

if (holiday) {
status = "holiday";
div.title = holiday.name;
}

div.className = `day ${status}`;
div.innerText = i;

div.onclick = () => {
if (holiday) return;

const current = data[date] || "default";
const next = current === "default" ? "office" : current === "office" ? "leave" : "default";

data[date] = next;
save();
renderCalendar();
};

cal.appendChild(div);
}
}

function calculate() {
const [year, month] = picker.value.split("-").map(Number);
const days = new Date(year, month, 0).getDate();

let working = 0, office = 0, leave = 0;

for (let i = 1; i <= days; i++) {
const d = new Date(year, month-1, i);
const day = d.getDay();
const date = `${picker.value}-${String(i).padStart(2,'0')}`;
const holiday = holidays[picker.value]?.find(h => h.date === date);

if (day !== 0 && day !== 6 && !holiday) {
working++;
if (data[date] === "office") office++;
if (data[date] === "leave") leave++;
}
}

working -= leave;

const percent = ((office/working)*100 || 0).toFixed(2);
const required = Math.ceil(0.6 * working);
const remaining = Math.max(0, required-office);

const result = document.getElementById("result");
result.innerHTML = `
<h3>Results</h3>
<p>Working Days: ${working}</p>
<p>Office Days: ${office}</p>
<p>Your %: ${percent}%</p>
<p>Required: ${required}</p>
<p>Remaining: ${remaining}</p>
`;

const statusBar = document.getElementById("statusBar");
if (percent >= 60) {
statusBar.className = "safe";
statusBar.innerText = "✅ You are SAFE";
} else {
statusBar.className = "risk";
statusBar.innerText = "⚠️ You are BELOW 60%";
}
}

renderCalendar();
