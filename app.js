let holidays = {};
let selectedRestricted = [];
let userModifiedOffice = false;

const monthSelect = document.getElementById("monthSelect");
const yearSelect = document.getElementById("yearSelect");
const resultDiv = document.getElementById("result");
const officeInput = document.getElementById("officeDays");
const leavesInput = document.getElementById("leaves");

// Init
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

fetch("holidays.json")
.then(r=>r.json())
.then(data=>{
  holidays=data;
  render();
});

monthSelect.addEventListener("change", render);
yearSelect.addEventListener("change", render);

officeInput.addEventListener("input", ()=>{
  userModifiedOffice=true;
  calculate();
});

leavesInput.addEventListener("input", calculate);

function getKey(){
  return `${yearSelect.value}-${monthSelect.value}`;
}

function render(){
  selectedRestricted=[];
  leavesInput.value=0;
  userModifiedOffice=false;
  renderHolidays();
  autoFillOffice();
  calculate();
}

function renderHolidays() {
  const list = document.getElementById("holidayList");
  list.innerHTML = "";

  const key = getKey();
  if (!holidays[key]) return;

  const declared = holidays[key].filter(h => h.type === "declared");
  const restricted = holidays[key].filter(h => h.type === "restricted");

  if (declared.length) {
    const title = document.createElement("div");
    title.className = "section-title";
    title.innerText = "Declared";
    list.appendChild(title);

    declared.forEach(h => {
      const div = document.createElement("div");
      div.className = "holiday-item";
      div.innerText = `${h.date} — ${h.name}`;
      list.appendChild(div);
    });
  }

  if (restricted.length) {
    const title = document.createElement("div");
    title.className = "section-title muted";
    title.innerText = "Restricted";
    list.appendChild(title);

    restricted.forEach(h => {
      const isSelected = selectedRestricted.includes(h.date);

      const div = document.createElement("div");
      div.className = "holiday-item";

      const text = document.createElement("span");
      text.innerText = `${h.date} — ${h.name}`;
      text.className = "muted";

      const btn = document.createElement("div");
      btn.className = "icon-add";
      btn.innerText = isSelected ? "✓" : "+";

      btn.onclick = () => {
        if (isSelected) {
          selectedRestricted = selectedRestricted.filter(d => d !== h.date);
        } else {
          selectedRestricted.push(h.date);
        }
        leavesInput.value = selectedRestricted.length;
        renderHolidays();
        calculate();
      };

      div.appendChild(text);
      div.appendChild(btn);
      list.appendChild(div);
    });
  }
}

function getWorkingDays(y,m){
  let d=new Date(y,m-1,1),c=0;
  while(d.getMonth()===m-1){
    if(d.getDay()!=0 && d.getDay()!=6) c++;
    d.setDate(d.getDate()+1);
  }
  return c;
}

function getDeclared(key){
  return (holidays[key]||[]).filter(h=>h.type==="declared").length;
}

function autoFillOffice(){
  const key=getKey();
  let w=getWorkingDays(yearSelect.value,monthSelect.value);
  w-=getDeclared(key);
  officeInput.value=w;
}

function calculate(){
  const key=getKey();
  let total=getWorkingDays(yearSelect.value,monthSelect.value);
  total-=getDeclared(key);

  const leaves=Number(leavesInput.value||0);
  const office=Number(officeInput.value||0);

  const effective=total-leaves;

  if(effective<=0){
    resultDiv.innerHTML=`<p>No working days</p>`;
    return;
  }

  const effOffice=Math.min(office,total);
  let percent=(effOffice/effective)*100;
  percent=Math.min(percent,100).toFixed(2);

  const required=Math.ceil(0.6*effective);
  const remaining=Math.max(0,required-effOffice);

  resultDiv.innerHTML=`
    <p>Total Working Days: <b>${total}</b></p>
    <p>After Leaves: <b>${effective}</b></p>
    <p>Your Presence: <b>${percent}%</b></p>
    <p>Minimum Required: <b>${required}</b></p>
    <p>Still Needed: <b>${remaining}</b></p>
  `;
}

initSelectors();
