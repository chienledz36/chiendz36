/* ============================================================
   script.js — Xếp Loại Học Lực
   ============================================================ */

// ─── Constants ───────────────────────────────────────────────
const SUBJECTS = [
  { value: 'toan',    label: 'Toán Học',   icon: '📐' },
  { value: 'van',     label: 'Ngữ Văn',    icon: '📝' },
  { value: 'anh',     label: 'Tiếng Anh',  icon: '🌍' },
  { value: 'hoa',     label: 'Hóa Học',    icon: '🧪' },
  { value: 'ly',      label: 'Vật Lí',     icon: '⚛️' },
  { value: 'tin',     label: 'Tin Học',    icon: '💻' },
  { value: 'su',      label: 'Lịch Sử',   icon: '📜' },
  { value: 'dia',     label: 'Địa Lí',    icon: '🗺️' },
];

const SUBJECT_MAP = {};
SUBJECTS.forEach(s => { SUBJECT_MAP[s.value] = s; });

// Row counter to generate unique IDs
let rowCounter = 0;

// ─── Dark Mode ────────────────────────────────────────────────
const darkBtn = document.getElementById('darkModeBtn');
const darkIcon = darkBtn.querySelector('.dark-icon');
const darkLabel = darkBtn.querySelector('.dark-label');

let isDark = localStorage.getItem('darkMode') === 'true';
applyDark();

darkBtn.addEventListener('click', () => {
  isDark = !isDark;
  localStorage.setItem('darkMode', isDark);
  applyDark();
});

function applyDark() {
  document.body.classList.toggle('dark', isDark);
  darkIcon.textContent = isDark ? '☀️' : '🌙';
  darkLabel.textContent = isDark ? 'Light Mode' : 'Dark Mode';
}

// ─── Semester Tabs ────────────────────────────────────────────
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.semester-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(`sem-${btn.dataset.sem}`).classList.add('active');
  });
});

// ─── Add Subject Buttons ──────────────────────────────────────
document.querySelectorAll('.add-subject-btn').forEach(btn => {
  btn.addEventListener('click', () => addRow(btn.dataset.sem));
});

// ─── Rounding: round to nearest 0.5 ──────────────────────────
function roundHalf(num) {
  return Math.round(num * 2) / 2;
}

// ─── Validate a single score string ──────────────────────────
// Returns { ok: true, value } or { ok: false, msg }
function validateScore(str) {
  str = str.trim();
  if (str === '' || str === null) return { ok: true, value: null }; // empty = not entered
  const num = parseFloat(str);
  if (isNaN(num) || !/^(\d+(\.\d?)?)$/.test(str.replace(',', '.'))) {
    return { ok: false, msg: '⚠️ Chỉ nhập số (0–10)!' };
  }
  if (num < 0 || num > 10) {
    return { ok: false, msg: '⚠️ Điểm phải từ 0 đến 10!' };
  }
  return { ok: true, value: num };
}

// ─── Build subject select ─────────────────────────────────────
function buildSubjectSelect(rowId, sem) {
  const sel = document.createElement('select');
  sel.className = 'subject-select';
  sel.dataset.row = rowId;

  const defaultOpt = document.createElement('option');
  defaultOpt.value = '';
  defaultOpt.textContent = '— Chọn môn —';
  defaultOpt.disabled = true;
  defaultOpt.selected = true;
  sel.appendChild(defaultOpt);

  SUBJECTS.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.value;
    opt.textContent = `${s.icon} ${s.label}`;
    sel.appendChild(opt);
  });

  sel.addEventListener('change', () => updateRow(rowId, sem));
  return sel;
}

// ─── Build score input ────────────────────────────────────────
function buildScoreInput(rowId, sem, type, idx = '') {
  const wrap = document.createElement('div');
  wrap.style.display = 'flex';
  wrap.style.flexDirection = 'column';
  wrap.style.alignItems = 'center';

  const inp = document.createElement('input');
  inp.type = 'text';
  inp.className = 'score-input';
  inp.placeholder = '—';
  inp.inputMode = 'decimal';
  inp.dataset.row = rowId;
  inp.dataset.type = type;
  inp.dataset.idx = idx;

  const errMsg = document.createElement('div');
  errMsg.className = 'input-error-msg';
  errMsg.id = `err-${rowId}-${type}${idx}`;

  // Confirm on Enter
  inp.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      confirmInput(inp, errMsg, rowId, sem);
      inp.blur();
    }
  });

  // Clear error styling on new input
  inp.addEventListener('input', () => {
    inp.classList.remove('error', 'valid');
    errMsg.classList.remove('show');
  });

  wrap.appendChild(inp);
  wrap.appendChild(errMsg);
  return { wrap, inp };
}

function confirmInput(inp, errMsg, rowId, sem) {
  const val = inp.value.replace(',', '.').trim();
  if (val === '') {
    inp.classList.remove('error', 'valid');
    errMsg.classList.remove('show');
    inp.dataset.confirmed = '';
    updateRow(rowId, sem);
    return;
  }
  const result = validateScore(val);
  if (!result.ok) {
    inp.classList.add('error');
    inp.classList.remove('valid');
    errMsg.textContent = result.msg;
    errMsg.classList.add('show');
    showToast(result.msg);
    inp.dataset.confirmed = '';
  } else {
    const rounded = roundHalf(result.value);
    inp.value = rounded % 1 === 0 ? rounded.toFixed(1) : rounded.toString();
    inp.classList.add('valid');
    inp.classList.remove('error');
    errMsg.classList.remove('show');
    inp.dataset.confirmed = inp.value;
    updateRow(rowId, sem);
  }
}

// ─── Add Row ──────────────────────────────────────────────────
function addRow(sem) {
  rowCounter++;
  const rowId = `${sem}-${rowCounter}`;
  const tbody = document.getElementById(`tbody-${sem}`);

  // Remove empty state if present
  const emptyRow = tbody.querySelector('.empty-row');
  if (emptyRow) emptyRow.remove();

  const tr = document.createElement('tr');
  tr.id = `row-${rowId}`;

  // ── Subject cell ──
  const tdSubject = document.createElement('td');
  const select = buildSubjectSelect(rowId, sem);
  tdSubject.appendChild(select);
  tr.appendChild(tdSubject);

  // ── TX cells (4 inputs) ──
  const tdTX = document.createElement('td');
  tdTX.colSpan = 4;
  const txWrap = document.createElement('div');
  txWrap.className = 'tx-inputs';

  for (let i = 1; i <= 4; i++) {
    const { wrap, inp } = buildScoreInput(rowId, sem, 'tx', i);
    txWrap.appendChild(wrap);
  }
  tdTX.appendChild(txWrap);
  tr.appendChild(tdTX);

  // ── GK cell ──
  const tdGK = document.createElement('td');
  const { wrap: wrapGK } = buildScoreInput(rowId, sem, 'gk');
  tdGK.appendChild(wrapGK);
  tr.appendChild(tdGK);

  // ── CK cell ──
  const tdCK = document.createElement('td');
  const { wrap: wrapCK } = buildScoreInput(rowId, sem, 'ck');
  tdCK.appendChild(wrapCK);
  tr.appendChild(tdCK);

  // ── Average cell ──
  const tdAvg = document.createElement('td');
  const avgSpan = document.createElement('span');
  avgSpan.className = 'avg-cell not-enough';
  avgSpan.textContent = 'Chưa đủ thông tin';
  avgSpan.id = `avg-${rowId}`;
  tdAvg.appendChild(avgSpan);
  tr.appendChild(tdAvg);

  // ── Delete cell ──
  const tdDel = document.createElement('td');
  const delBtn = document.createElement('button');
  delBtn.className = 'del-btn';
  delBtn.textContent = '✕';
  delBtn.title = 'Xóa môn này';
  delBtn.addEventListener('click', () => {
    tr.style.opacity = '0';
    tr.style.transform = 'translateX(20px)';
    tr.style.transition = 'all 0.3s ease';
    setTimeout(() => {
      tr.remove();
      checkEmptyState(sem);
      updateSummary(sem);
    }, 300);
  });
  tdDel.appendChild(delBtn);
  tr.appendChild(tdDel);

  tbody.appendChild(tr);
  checkEmptyState(sem);

  // Focus first TX input
  const firstTX = tr.querySelector('.score-input');
  if (firstTX) firstTX.focus();
}

// ─── Empty state ──────────────────────────────────────────────
function checkEmptyState(sem) {
  const tbody = document.getElementById(`tbody-${sem}`);
  const rows = tbody.querySelectorAll('tr:not(.empty-row)');
  let emptyRow = tbody.querySelector('.empty-row');

  if (rows.length === 0) {
    if (!emptyRow) {
      const tr = document.createElement('tr');
      tr.className = 'empty-row';
      const td = document.createElement('td');
      td.colSpan = 9;
      td.textContent = '📋 Chưa có môn học nào. Nhấn "＋ Thêm Môn Học" để bắt đầu!';
      tr.appendChild(td);
      tbody.appendChild(tr);
    }
  } else {
    if (emptyRow) emptyRow.remove();
  }
}

// ─── Update Row Average ───────────────────────────────────────
function updateRow(rowId, sem) {
  const tr = document.getElementById(`row-${rowId}`);
  if (!tr) return;

  // Gather confirmed TX values
  const txInputs = tr.querySelectorAll('.score-input[data-type="tx"]');
  const txVals = [];
  txInputs.forEach(inp => {
    const c = inp.dataset.confirmed;
    if (c !== undefined && c !== '') txVals.push(parseFloat(c));
  });

  const gkInp = tr.querySelector('.score-input[data-type="gk"]');
  const ckInp = tr.querySelector('.score-input[data-type="ck"]');

  const gkVal = (gkInp && gkInp.dataset.confirmed !== undefined && gkInp.dataset.confirmed !== '') ? parseFloat(gkInp.dataset.confirmed) : null;
  const ckVal = (ckInp && ckInp.dataset.confirmed !== undefined && ckInp.dataset.confirmed !== '') ? parseFloat(ckInp.dataset.confirmed) : null;

  const avgSpan = document.getElementById(`avg-${rowId}`);

  // Trung bình môn chỉ tính khi có GK và CK
  if (gkVal === null || ckVal === null) {
    avgSpan.textContent = 'Chưa đủ thông tin';
    avgSpan.className = 'avg-cell not-enough';
    updateSummary(sem);
    return;
  }

  // Formula: (TX_sum + GK*2 + CK*3) / (count_TX + 2 + 3)
  const txSum = txVals.reduce((a, b) => a + b, 0);
  const txCount = txVals.length;
  const total = txSum + gkVal * 2 + ckVal * 3;
  const denom = txCount + 2 + 3;
  const avg = roundHalf(total / denom);

  avgSpan.textContent = avg % 1 === 0 ? avg.toFixed(1) : avg.toString();
  avgSpan.className = 'avg-cell';
  avgSpan.dataset.avgVal = avg;

  updateSummary(sem);
}

// ─── Update Summary (TK + Evaluation) ────────────────────────
function updateSummary(sem) {
  const tbody = document.getElementById(`tbody-${sem}`);
  const rows = tbody.querySelectorAll('tr:not(.empty-row)');

  const tkCard = document.getElementById(`tk-card-${sem}`);
  const tkValue = document.getElementById(`tk-value-${sem}`);
  const evalCard = document.getElementById(`eval-card-${sem}`);
  const evalValue = document.getElementById(`eval-value-${sem}`);

  const avgs = [];
  let allHaveAvg = rows.length > 0;

  rows.forEach(tr => {
    const avgSpan = tr.querySelector('.avg-cell');
    if (!avgSpan || avgSpan.classList.contains('not-enough') || avgSpan.dataset.avgVal === undefined) {
      allHaveAvg = false;
    } else {
      avgs.push(parseFloat(avgSpan.dataset.avgVal));
    }
  });

  if (!allHaveAvg || rows.length === 0) {
    tkCard.className = 'summary-card';
    tkValue.textContent = '—';
    evalCard.className = 'summary-card eval-card';
    evalValue.textContent = '—';
    return;
  }

  const tk = roundHalf(avgs.reduce((a, b) => a + b, 0) / avgs.length);
  tkValue.textContent = tk % 1 === 0 ? tk.toFixed(1) : tk.toString();

  let theme, evalText;
  if (tk < 7) {
    theme = 'red-theme';
    evalText = '📊 Trung Bình';
  } else if (tk < 8.5) {
    theme = 'yellow-theme';
    evalText = '⭐ Khá';
  } else {
    theme = 'green-theme';
    evalText = '🏆 Giỏi';
  }

  tkCard.className = `summary-card ${theme}`;
  evalCard.className = `summary-card eval-card ${theme}`;
  evalValue.textContent = evalText;

  // Pulse animation
  tkValue.style.transform = 'scale(1.15)';
  setTimeout(() => { tkValue.style.transform = 'scale(1)'; tkValue.style.transition = 'transform 0.3s'; }, 200);
}

// ─── Toast ────────────────────────────────────────────────────
let toastTimer;
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
}

// ─── Init: add empty state for both semesters ─────────────────
checkEmptyState('1');
checkEmptyState('2');
