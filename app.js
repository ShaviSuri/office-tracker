let holidays = {};

fetch('holidays.json')
.then(r=>r.json())
.then(d=>{
holidays = d;
load();
});

const picker = document.getElementById("monthPicker");
picker.value = new Date().toISOString().slice(0,7);

picker.addEventListener("change", load);

function load(){
renderHolidays();
}

function renderHolidays(){
const list = document.getElementById("holidayList");
list.innerHTML = "";

const month = picker.value;

if(!holidays[month]){
list.innerHTML = "<li>No data</li>";
return;
}

holidays[month].forEach(h=>{
const li = document.createElement("li");
li.innerText = `${h.date.split('-')[2]} - ${h.name}`;
list.appendChild(li);
});
}

function getWorkingDays(year, month){
let count = 0;
let date = new Date(year, month, 1);

while(date.getMonth() === month){
let d = date.getDay();
if(d !== 0 && d !== 6){
count++;
}
date.setDate(date.getDate()+1);
}
return count;
}

function calculate(){
const [year, month] = picker.value.split("-").map(Number);

let working = getWorkingDays(year, month-1);

let declared = holidays[picker.value] || [];
working -= declared.length;

let leaves = parseInt(document.getElementById("leaves").value) || 0;
let office = parseInt(document.getElementById("officeDays").value) || 0;

working -= leaves;

let percent = ((office/working)*100 || 0).toFixed(2);
let required = Math.ceil(0.6 * working);
let remaining = Math.max(0, required-office);

document.getElementById("result").innerHTML = `
<p>Working Days: ${working}</p>
<p>Your %: ${percent}%</p>
<p>Required: ${required}</p>
<p>Remaining: ${remaining}</p>
`;
}
