let holidays = {};
let selectedRestricted = [];
let userModifiedOffice = false;
let manualHolidayCount = 0;

const monthSelect = document.getElementById("monthSelect");
const yearSelect = document.getElementById("yearSelect");
const resultDiv = document.getElementById("result");
const officeInput = document.getElementById("officeDays");
const leavesInput = document.getElementById("leaves");

// Init selectors
function initSelectors() {
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  months.forEach((m,i)=>{
    const opt=document.createElement("option");
    opt.value=String(i+1).padStart(2,"0");
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
  monthSelect.value=String(now.getMonth()+1).padStart(2,"0");
  yearSelect.value=now.getFullYear();
}

// Load holidays
fetch("holidays.json")
.then(r=>r.json())
.then(data=>{
  holidays=data;
  render();
});

monthSelect.addEventListener("change", render);
yearSelect.addEventListener("change", render);

// Leaves input
leavesInput.addEventListener("input", ()=>{
  leavesInput.dataset.manual = leavesInput.value;
  adjustOfficeDays();
  calculate();
});

// Office override
officeInput.addEventListener("input", ()=>{
  userModifiedOffice = true;
  calculate();
});

function getKey(){
  return `${yearSelect.value}-${monthSelect.value}`;
}

// Render
function render(){
  selectedRestricted=[];
  leavesInput.value=0;
  leavesInput.dataset.manual=0;
  userModifiedOffice=false;
  manualHolidayCount=0;

  lucide.createIcons();
  renderHolidays();
  autoFillOffice();
  renderCalendar();
  calculate();
}

// Holidays
function renderHolidays(){
  const list=document.getElementById("holidayList");
  list.innerHTML="";

  const key=getKey();

  // No config
  if(!holidays[key]){
    const msg=document.createElement("p");
    msg.style.color="orange";
    msg.innerText="No configuration available for this month";

    const input=document.createElement("input");
    input.type="number";
    input.placeholder="Enter declared holidays";

    input.addEventListener("input",(e)=>{
      manualHolidayCount=Number(e.target.value||0);
      if(!userModifiedOffice) autoFillOffice();
      calculate();
    });

    list.appendChild(msg);
    list.appendChild(input);
    return;
  }

  const declared=holidays[key].filter(h=>h.type==="declared");
  const restricted=holidays[key].filter(h=>h.type==="restricted");

  // Empty month
  if(declared.length===0 && restricted.length===0){
    list.innerHTML="<p>No declared or restricted holidays this month</p>";
    return;
  }

  // Declared
  if(declared.length){
    list.innerHTML += "<div style='font-weight:600'>Declared</div>";
    declared.forEach(h=>{
      list.innerHTML += `<div class="holiday-item">${h.date} — ${h.name}</div>`;
    });
  }

  // Restricted
  if(restricted.length){
    list.innerHTML += "<div style='font-weight:600;margin-top:10px;color:#94a3b8'>Restricted</div>";

    restricted.forEach(h=>{
      const isSelected=selectedRestricted.includes(h.date);

      const div=document.createElement("div");
      div.className="holiday-item";

      const text=document.createElement("span");
      text.innerText=`${h.date} — ${h.name}`;
      text.style.color="#94a3b8";

      const btn=document.createElement("div");
      btn.className="icon-add";
      btn.innerHTML=isSelected
        ? '<i data-lucide="check"></i>'
        : '<i data-lucide="plus"></i>';

      btn.onclick=()=>{
        if(isSelected){
          selectedRestricted=selectedRestricted.filter(d=>d!==h.date);
        } else {
          selectedRestricted.push(h.date);
        }
        updateLeaves();
        renderHolidays();
        calculate();
      };

      div.appendChild(text);
      div.appendChild(btn);
      list.appendChild(div);
    });
  }

  lucide.createIcons();
}

// Leaves
function updateLeaves(){
  const manual=Number(leavesInput.dataset.manual||0);
  leavesInput.value=manual+selectedRestricted.length;
}

// Calendar
function renderCalendar(){
  const cal=document.getElementById("calendar");
  cal.innerHTML="";

  const year=Number(yearSelect.value);
  const month=Number(monthSelect.value)-1;
  const key=getKey();
  const list=holidays[key]||[];

  // Header SMTWTFS
  const days = ["S","M","T","W","T","F","S"];
  days.forEach(d=>{
    const head=document.createElement("div");
    head.className="day header";
    head.innerText=d;
    cal.appendChild(head);
  });

  let date=new Date(year,month,1);

  // offset
  const startDay=date.getDay();
  for(let i=0;i<startDay;i++){
    cal.appendChild(document.createElement("div"));
  }

  while(date.getMonth()===month){
    const d=date.getDate();
    const day=date.getDay();

    const cell=document.createElement("div");
    cell.className="day";
    cell.innerText=d;

    if(day===0||day===6) cell.classList.add("weekend");

    list.forEach(h=>{
      const hd=new Date(h.date);
      if(hd.getDate()===d){
        if(h.type==="declared") cell.classList.add("declared");
        if(h.type==="restricted") cell.classList.add("restricted");

        cell.title = h.name;
      }
    });

    cal.appendChild(cell);
    date.setDate(d+1);
  }
}

// Working days
function getWorkingDays(y,m){
  let d=new Date(y,m-1,1),c=0;
  while(d.getMonth()===m-1){
    if(d.getDay()!=0 && d.getDay()!=6) c++;
    d.setDate(d.getDate()+1);
  }
  return c;
}

function getDeclared(key){
  if(!holidays[key]) return manualHolidayCount;
  return holidays[key].filter(h=>h.type==="declared").length;
}

function autoFillOffice(){
  let w=getWorkingDays(yearSelect.value,monthSelect.value);
  w-=getDeclared(getKey());
  officeInput.value=w;
}

function adjustOfficeDays(){
  if(userModifiedOffice) return;

  let total=getWorkingDays(yearSelect.value,monthSelect.value);
  total-=getDeclared(getKey());

  const leaves=Number(leavesInput.value||0);
  officeInput.value=Math.max(0,total-leaves);
}

// Final calculation
function calculate(){
  let total=getWorkingDays(yearSelect.value,monthSelect.value);
  total-=getDeclared(getKey());

  const leaves=Number(leavesInput.value||0);
  const office=Number(officeInput.value||0);

  const effective=Math.max(0,total-leaves);

  let warning="";
  if(userModifiedOffice && office>total){
    warning=`<p class="warn">Office days exceed possible working days</p>`;
  }

  if(effective===0){
    resultDiv.innerHTML=`
      ${warning}
      <p>Total Working Days: <span class="highlight">${total}</span></p>
      <p>After Leaves: <span class="highlight">0</span></p>
      <p>Your Presence: <span class="highlight">0%</span></p>
    `;
    return;
  }

  const effectiveOffice=Math.min(office,total);

  let percent=(effectiveOffice/effective)*100;
  percent=Math.min(percent,100).toFixed(2);

  const required=Math.ceil(0.6*effective);
  const remaining=Math.max(0,required-effectiveOffice);

  let cls="good";
  let statusText="On Track";
  
  if (percent < 60) {
    cls = "bad";
    statusText = "Below Requirement";
  }

resultDiv.innerHTML = `
  ${warning}

  <p class="${cls}"><b>${statusText}</b></p>

  <p>
    Minimum Required: 
    <span class="highlight">${required}</span> days
  </p>

  <p>Total Working Days: <span class="highlight">${total}</span></p>
  <p>After Leaves: <span class="highlight">${effective}</span></p>

  <p>Your Presence: <span class="highlight ${cls}">${percent}%</span></p>

  <p>You must attend <span class="highlight">${remaining}</span> more days</p>
`;
}

initSelectors();
