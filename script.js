const MANAGERS = [
  "Tomi Husni",
  "Hidjrah Halim",
  "Mohammad Ibnu Haitam",
  "Maheru Hendrawan",
  "Aliefido Anastyan Ramadhan"
];

const HISTORY_KEY = "preshift:history";
const HISTORY_MAX = 15;

const $ = (id) => document.getElementById(id);

let currentDate = todayString();
let state = {};
let typedHistory = {};

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

function utcNow() {
  const now = new Date();
  const hh = String(now.getUTCHours()).padStart(2, "0");
  const mm = String(now.getUTCMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function initials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0].toUpperCase())
    .slice(0, 2)
    .join("");
}

function storageKey(date) {
  return "preshift:" + date;
}

function load() {
  try {
    const raw = localStorage.getItem(storageKey(currentDate));
    state = raw ? JSON.parse(raw) : {};
  } catch (error) {
    state = {};
  }
}

function save() {
  try {
    localStorage.setItem(storageKey(currentDate), JSON.stringify(state));
    $("status").innerHTML =
      '<span class="saved">Tersimpan</span> otomatis di perangkat ini.';
  } catch (error) {
    $("status").textContent =
      "Penyimpanan tidak tersedia; gunakan Cetak untuk arsip.";
  }
}

function loadHistory() {
  try {
    typedHistory = JSON.parse(localStorage.getItem(HISTORY_KEY)) || {};
  } catch (error) {
    typedHistory = {};
  }
}

function saveHistory() {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(typedHistory));
  } catch (error) {
    return;
  }
}

function fillDatalist(i) {
  const datalist = $("history-" + i);
  datalist.innerHTML = "";

  (typedHistory[i] || []).forEach((text) => {
    const option = document.createElement("option");
    option.value = text;
    datalist.appendChild(option);
  });
}

function addHistory(i, value) {
  const text = value.trim();
  if (!text) return;

  const list = (typedHistory[i] || []).filter((item) => item !== text);
  list.unshift(text);
  typedHistory[i] = list.slice(0, HISTORY_MAX);

  saveHistory();
  fillDatalist(i);
}

function clearHistory() {
  if (!confirm("Hapus semua riwayat ketikan?")) return;

  typedHistory = {};
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch (error) {
    typedHistory = {};
  }

  document.querySelectorAll(".item").forEach((row) => fillDatalist(row.dataset.i));
}

function fillManagerSelects() {
  document.querySelectorAll("select.manager").forEach((select) => {
    select.innerHTML = "";

    const blank = document.createElement("option");
    blank.value = "";
    blank.textContent = "Pilih manager";
    select.appendChild(blank);

    MANAGERS.forEach((name) => {
      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      select.appendChild(option);
    });
  });
}

function drawSignature(canvas) {
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const data = state.s && state.s[canvas.dataset.sign];
  if (!data) return;

  const image = new Image();
  image.onload = () => ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  image.src = data;
}

function render() {
  $("date").value = currentDate;
  $("time").value = state.time || "";
  $("mod").value = state.mod || "";
  $("shift").value = state.shift || "";

  document.querySelectorAll(".item").forEach((row) => {
    const i = row.dataset.i;
    const checkbox = row.querySelector(".check input");
    const detail = row.querySelector(".details input");

    detail.value = (state.d && state.d[i]) || "";
    checkbox.checked = Boolean(state.c && state.c[i]);
    row.classList.toggle("done", checkbox.checked);
  });

  document.querySelectorAll("[data-k]").forEach((field) => {
    field.value = (state.s && state.s[field.dataset.k]) || "";
  });

  document.querySelectorAll(".pad").forEach(drawSignature);
}

function goToDate(date) {
  currentDate = date;
  load();
  render();
}

function shiftDay(days) {
  const d = new Date(currentDate + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  goToDate(d.toISOString().slice(0, 10));
}

function bindItems() {
  document.querySelectorAll(".item").forEach((row) => {
    const i = row.dataset.i;
    const detail = row.querySelector(".details input");
    const checkbox = row.querySelector(".check input");

    const datalist = document.createElement("datalist");
    datalist.id = "history-" + i;
    document.body.appendChild(datalist);
    detail.setAttribute("list", datalist.id);
    fillDatalist(i);

    detail.addEventListener("input", () => {
      state.d = state.d || {};
      state.d[i] = detail.value;
      save();
    });

    detail.addEventListener("change", () => addHistory(i, detail.value));

    checkbox.addEventListener("change", () => {
      state.c = state.c || {};
      state.c[i] = checkbox.checked;
      row.classList.toggle("done", checkbox.checked);
      save();
    });
  });
}

function bindHeaderFields() {
  ["time", "mod", "shift"].forEach((field) => {
    $(field).addEventListener("change", (event) => {
      state[field] = event.target.value;
      save();
    });
  });
}

function bindSignFields() {
  document.querySelectorAll("[data-k]").forEach((field) => {
    field.addEventListener("change", () => {
      const key = field.dataset.k;
      state.s = state.s || {};
      state.s[key] = field.value;

      if (key.endsWith("Name")) {
        const initKey = key.replace("Name", "Init");
        state.s[initKey] = initials(field.value);
        document.querySelector(`[data-k="${initKey}"]`).value = state.s[initKey];
      }

      save();
    });
  });
}

function bindPads() {
  document.querySelectorAll(".pad").forEach((canvas) => {
    const ctx = canvas.getContext("2d");
    const key = canvas.dataset.sign;
    let drawing = false;

    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#2B2D42";

    const point = (event) => {
      const rect = canvas.getBoundingClientRect();
      return [
        ((event.clientX - rect.left) * canvas.width) / rect.width,
        ((event.clientY - rect.top) * canvas.height) / rect.height
      ];
    };

    canvas.addEventListener("pointerdown", (event) => {
      drawing = true;
      canvas.setPointerCapture(event.pointerId);
      const [x, y] = point(event);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 0.1, y);
      ctx.stroke();
    });

    canvas.addEventListener("pointermove", (event) => {
      if (!drawing) return;
      const [x, y] = point(event);
      ctx.lineTo(x, y);
      ctx.stroke();
    });

    const finish = () => {
      if (!drawing) return;
      drawing = false;
      state.s = state.s || {};
      state.s[key] = canvas.toDataURL("image/png");
      save();
    };

    canvas.addEventListener("pointerup", finish);
    canvas.addEventListener("pointercancel", finish);
  });

  document.querySelectorAll("[data-clear]").forEach((button) => {
    button.addEventListener("click", () => {
      const key = button.dataset.clear;
      if (state.s) delete state.s[key];
      drawSignature(document.querySelector(`[data-sign="${key}"]`));
      save();
    });
  });
}

function bindButtons() {
  $("date").addEventListener("change", (event) => {
    if (event.target.value) goToDate(event.target.value);
  });

  $("prev").onclick = () => shiftDay(-1);
  $("next").onclick = () => shiftDay(1);
  $("today").onclick = () => goToDate(todayString());
  $("print").onclick = () => window.print();
  $("clearHistory").onclick = clearHistory;

  $("reset").onclick = () => {
    if (!confirm("Kosongkan checklist untuk tanggal " + currentDate + "?")) return;
    state = {};
    try {
      localStorage.removeItem(storageKey(currentDate));
    } catch (error) {
      state = {};
    }
    render();
  };
}

function bindMenu() {
  const icon = $("menuIcon");
  const list = $("menuList");

  icon.onclick = () => {
    const open = list.classList.toggle("open");
    icon.setAttribute("aria-expanded", open);
  };

  list.addEventListener("click", () => list.classList.remove("open"));
}

fillManagerSelects();
loadHistory();
bindItems();
bindHeaderFields();
bindSignFields();
bindPads();
bindMenu();
bindButtons();

load();

if (!state.time && currentDate === todayString()) {
  state.time = utcNow();
}

render();