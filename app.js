// ONLY showing changed function (rest remains same)

function renderHolidays() {
  const list = document.getElementById("holidayList");
  list.innerHTML = "";

  const key = getKey();

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

  const declared = holidays[key].filter(h => h.type === "declared");
  const restricted = holidays[key].filter(h => h.type === "restricted");

  if (declared.length === 0 && restricted.length === 0) {
    list.innerHTML = "<p>No holidays this month</p>";
    return;
  }

  if (declared.length > 0) {
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

  if (restricted.length > 0) {
    const title = document.createElement("p");
    title.innerText = "Restricted";
    title.style.fontWeight = "600";
    title.style.marginTop = "12px";
    title.style.color = "#94a3b8";
    list.appendChild(title);

    restricted.forEach(h => {
      const div = document.createElement("div");
      div.className = "holiday-item";
      div.style.color = "#94a3b8";
      div.innerText = `${h.date} — ${h.name}`;
      list.appendChild(div);
    });
  }
}
