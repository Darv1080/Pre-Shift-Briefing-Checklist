const REQUIRED_COUNT = 7;

const $ = (id) => document.getElementById(id);

let currentDate = todayString();
let state = {};

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

function utcNow() {
  const now = new Date();
  const hh = String(now.getUTCHours()).padStart(2, "0");
  const mm = String(now.getUTCMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
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

function render() {
  $("date").value  = currentDate;
  $("time").value  = state.time  || "";
  $("mod").value   = state.mod   || "";
  $("shift").value = state.shift || "";

  document.querySelectorAll(".item").forEach((row) => {
    const i = row.dataset.i;
    const checkbox = row.querySelector("input");
    const detail = row.querySelector("textarea");

    detail.value = (state.d && state.d[i]) || "";
    checkbox.checked = Boolean(state.c && state.c[i]);
    row.classList.toggle("done", checkbox.checked);
  });

  document.querySelectorAll("[data-k]").forEach((input) => {
    input.value = (state.s && state.s[input.dataset.k]) || "";
  });

  updateProgress();
}

function updateProgress() {
  let done = 0;
  for (let i = 0; i < REQUIRED_COUNT; i++) {
    if (state.c && state.c[i]) done++;
  }

  $("fill").style.width = (done / REQUIRED_COUNT) * 100 + "%";
  $("pct").textContent =
    done === REQUIRED_COUNT ? "Lengkap ✓" : `${done} / ${REQUIRED_COUNT} wajib`;
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
    const detail = row.querySelector("textarea");
    const checkbox = row.querySelector("input");

    detail.addEventListener("input", () => {
      state.d = state.d || {};
      state.d[i] = detail.value;
      save();
    });

    checkbox.addEventListener("change", () => {
      state.c = state.c || {};
      state.c[i] = checkbox.checked;
      row.classList.toggle("done", checkbox.checked);
      updateProgress();
      save();
    });
  });
}

function bindHeaderFields() {
  ["time", "mod", "shift"].forEach((field) => {
    $(field).addEventListener("input", (event) => {
      state[field] = event.target.value;
      save();
    });
  });
}

function bindSignFields() {
  document.querySelectorAll("[data-k]").forEach((input) => {
    input.addEventListener("input", () => {
      state.s = state.s || {};
      state.s[input.dataset.k] = input.value;
      save();
    });
  });
}

function bindButtons() {
  $("date").addEventListener("change", (event) => {
    if (event.target.value) goToDate(event.target.value);
  });

  $("prev").onclick  = () => shiftDay(-1);
  $("next").onclick  = () => shiftDay(1);
  $("today").onclick = () => goToDate(todayString());
  $("print").onclick = () => window.print();

  $("reset").onclick = () => {
    if (!confirm("Kosongkan checklist untuk tanggal " + currentDate + "?")) return;
    state = {};
    try {
      localStorage.removeItem(storageKey(currentDate));
    } catch (error) {

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

bindItems();
bindHeaderFields();
bindMenu();
bindSignFields();
bindButtons();

load();

if (!state.time && currentDate === todayString()) {
  state.time = utcNow();
}

render();