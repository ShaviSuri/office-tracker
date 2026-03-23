let holidays = {};
let selectedRestricted = [];
let userModifiedOffice = false;
let manualHolidayCount = 0;

const monthSelect = document.getElementById("monthSelect");
const yearSelect = document.getElementById("yearSelect");
const resultDiv = document.getElementById("result");
const officeInput = document.getElementById("officeDays");
const leavesInput = document.getElementById("leaves");
const progressFill = document.getElementById("progressFill");
const safeLeavesDiv = document.getElementById("safeLeaves");

function initSelectors() {
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  months.forEach((m,i)=>{
    const opt=document.createElement("option");
    opt.value=i;
    opt.text=m;
    monthSelect.appendChild(opt);
  });

  for(let y=2025;y<=2030;y++){
    const opt=document.createElement("option");
    opt.value=y;
    opt.text=y;
    yearSelect.appendChild(opt);
  }

  const now=new Date();
  monthSelect.value=now.getMonth();
  yearSelect.value=now.getFullYear();
}

fetch("holidays.json")
.then(r=>r.json())
.then(data=>{
  holidays=data;
  render();
});

monthSelect.addEventListener("change", render);
yearSelect.addEventListener("change", render);

leavesInput.addEventListener("input", ()=>{
  calculate();
});

officeInput.addEventListener("input", ()=>{
  userModifiedOffice=true;
  calculate();
});

function getKey(){
  const m = String(Number(monthSelect.value)+1).padStart(2,"0");
  return `${yearSelect.value}-${m}`;
}

function render(){
  renderCalendar();
  calculate();
}

// Calendar
function renderCalendar(){
  const cal=document.getElementById("calendar");
  cal.innerHTML="";

  const year=yearSelect.value;
  const month=Number(monthSelect.value);

  const key=getKey();
  const list=holidays[key]||[];

  const date=new Date(year,month,1);

  while(date.getMonth()===month){
    const d=date.getDate();
    const day=date.getDay();

    const cell=document.createElement("div");
    cell.className="day";
    cell.innerText=d;

    if(day===0||day===6) cell.classList.add("weekend");

    list.forEach(h=>{
      if(new Date(h.date).getDate()===d){
        if(h.type==="declared") cell.classList.add("declared");
        if(h.type==="restricted") cell.classList.add("restricted");
      }
    });

    cal.appendChild(cell);
    date.setDate(d+1);
  }
}

// Calculation
function getWorkingDays(y,m){
  let d=new Date(y,m,1),c=0;
  while(d.getMonth()===m){
    if(d.getDay()!=0 && d.getDay()!=6) c++;
    d.setDate(d.getDate()+1);
  }
  return c;
}

function calculate(){
  const year=Number(yearSelect.value);
  const month=Number(monthSelect.value);

  let total=getWorkingDays(year,month);

  const key=getKey();
  const declared=(holidays[key]||[]).filter(h=>h.type==="declared").length;

  total-=declared;

  const leaves=Number(leavesInput.value||0);
  const office=Number(officeInput.value||0);

  const effective=Math.max(0,total-leaves);

  let percent=(office/effective)*100 || 0;
  percent=Math.min(percent,100);

  const required=Math.ceil(0.6*effective);

  const safeLeaves=Math.max(0,total-required);

  // progress
  progressFill.style.width=Math.min(percent,100)+"%";

  safeLeavesDiv.innerHTML=`Safe Leaves Remaining: <b>${safeLeaves}</b>`;

  let cls="good";
  if(percent<60) cls="bad";
  else if(percent<70) cls="warn";

  resultDiv.innerHTML=`
    <p>Total Working Days: <span class="highlight">${total}</span></p>
    <p>After Leaves: <span class="highlight">${effective}</span></p>
    <p>Your Presence: <span class="highlight ${cls}">${percent.toFixed(2)}%</span></p>
    <p>Minimum Required: <span class="highlight">${required}</span></p>
  `;
}

initSelectors();
