/**
 * script.js — Hệ Thống Xếp Loại Học Lực
 * Đầy đủ chức năng: nhập điểm, tính toán, dark mode, toast
 */

'use strict';

/* ─────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────── */
const SUBJECTS = [
  { value: 'toan', label: 'Toán Học',   icon: '📐' },
  { value: 'van',  label: 'Ngữ Văn',    icon: '📝' },
  { value: 'anh',  label: 'Tiếng Anh',  icon: '🌍' },
  { value: 'hoa',  label: 'Hóa Học',    icon: '🧪' },
  { value: 'ly',   label: 'Vật Lí',     icon: '⚛️'  },
  { value: 'tin',  label: 'Tin Học',    icon: '💻' },
  { value: 'su',   label: 'Lịch Sử',   icon: '📜' },
  { value: 'dia',  label: 'Địa Lí',    icon: '🗺️'  },
];

let rowId = 0;          // unique row counter
let toastTimer = null;

/* ─────────────────────────────────────────────
   DARK MODE
───────────────────────────────────────────── */
const darkToggle = document.getElementById('darkModeToggle');
const dmIcon     = darkToggle.querySelector('.dm-icon');
const dmText     = darkToggle.querySelector('.dm-text');

let isDark = localStorage.getItem('xlhl-dark') === 'true';
applyDark();

darkToggle.addEventListener('click', () => {
  isDark = !isDark;
  localStorage.setItem('xlhl-dark', isDark);
  applyDark();
});

function applyDark() {
  document.body.classList.toggle('dark', isDark);
  dmIcon.textContent = isDark ? '☀️' : '🌙';
  dmText.textContent = isDark ? 'Light Mode' : 'Dark Mode';
}

/* ─────────────────────────────────────────────
   SEMESTER TABS
───────────────────────────────────────────── */
document.querySelectorAll('.semester-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const sem = btn.dataset.semester;

    // Tab buttons
    document.querySelectorAll('.semester-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    // Content panels
    document.querySelectorAll('.semester-content').forEach(p => p.classList.add('hidden'));
    document.getElementById(`semester${sem}`).classList.remove('hidden');

    // Summary panels
    document.querySelectorAll('.summary-section').forEach(s => s.classList.add('hidden'));
    document.getElementById(`summary${sem}`).classList.remove('hidden');
  });
});

// Show summary 1 by default (remove hidden if present)
document.getElementById('summary1').classList.remove('hidden');

/* ─────────────────────────────────────────────
   ADD SUBJECT BUTTONS
───────────────────────────────────────────── */
document.querySelectorAll('.add-subject-btn').forEach(btn => {
  btn.addEventListener('click', () => addRow(btn.dataset.semester));
});

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */

/**
 * Làm tròn đến 0.5 gần nhất
 */
function roundHalf(n) {
  return Math.round(n * 2) / 2;
}

/**
 * Format số hiển thị luôn có 1 chữ số thập phân
 */
function fmt(n) {
  return (n % 1 === 0) ? n.toFixed(1) : String(n);
}

/**
 * Validate chuỗi điểm. Trả { ok, value } hoặc { ok: false, msg }
 */
function validateScore(raw) {
  const str = raw.trim().replace(',', '.');
  if (str === '') return { ok: true, value: null };

  // Chỉ chấp nhận dạng số có tối đa 1 chữ thập phân
  if (!/^\d+(\.\d?)?$/.test(str)) {
    return { ok: false, msg: '⚠️ Hãy nhập số hợp lệ (ví dụ: 7.5)!' };
  }
  const num = parseFloat(str);
  if (num < 0 || num > 10) {
    return { ok: false, msg: '⚠️ Điểm phải nằm trong đoạn [0, 10]!' };
  }
  return { ok: true, value: num };
}

/* ─────────────────────────────────────────────
   BUILD ROW
───────────────────────────────────────────── */
function addRow(sem) {
  rowId++;
  const id  = `${sem}r${rowId}`;
  const tbody = document.getElementById(`gradeTableBody${sem}`);

  // Remove empty-state row if present
  const empty = tbody.querySelector('.empty-row');
  if (empty) empty.remove();

  const tr = document.createElement('tr');
  tr.id = `row-${id}`;

  /* ── Cell: Subject select ── */
  const tdSubject = document.createElement('td');
  const sel = createSubjectSelect(id, sem);
  tdSubject.appendChild(sel);
  tr.appendChild(tdSubject);

  /* ── Cell: TX × 4 ── */
  const tdTX = document.createElement('td');
  tdTX.colSpan = 4;
  const txGroup = document.createElement('div');
  txGroup.className = 'tx-group';
  for (let i = 1; i <= 4; i++) {
    txGroup.appendChild(createInputWrap(id, sem, 'tx', i));
  }
  tdTX.appendChild(txGroup);
  tr.appendChild(tdTX);

  /* ── Cell: GK ── */
  const tdGK = document.createElement('td');
  tdGK.appendChild(createInputWrap(id, sem, 'gk'));
  tr.appendChild(tdGK);

  /* ── Cell: CK ── */
  const tdCK = document.createElement('td');
  tdCK.appendChild(createInputWrap(id, sem, 'ck'));
  tr.appendChild(tdCK);

  /* ── Cell: Average ── */
  const tdAvg = document.createElement('td');
  const avgChip = document.createElement('span');
  avgChip.className = 'avg-chip pending';
  avgChip.id = `avg-${id}`;
  avgChip.textContent = 'Chưa đủ thông tin';
  tdAvg.appendChild(avgChip);
  tr.appendChild(tdAvg);

  /* ── Cell: Delete ── */
  const tdDel = document.createElement('td');
  const delBtn = document.createElement('button');
  delBtn.className = 'del-btn';
  delBtn.title = 'Xóa môn này';
  delBtn.textContent = '✕';
  delBtn.addEventListener('click', () => {
    tr.style.transition = 'opacity .25s, transform .25s';
    tr.style.opacity = '0';
    tr.style.transform = 'translateX(20px)';
    setTimeout(() => {
      tr.remove();
      refreshEmptyState(sem);
      recalcSummary(sem);
    }, 260);
  });
  tdDel.appendChild(delBtn);
  tr.appendChild(tdDel);

  tbody.appendChild(tr);
  refreshEmptyState(sem);

  // Focus first TX input
  const first = tr.querySelector('.score-input');
  if (first) first.focus();
}

/* ─────────────────────────────────────────────
   CREATE SUBJECT SELECT
───────────────────────────────────────────── */
function createSubjectSelect(id, sem) {
  const sel = document.createElement('select');
  sel.className = 'subject-select';

  const def = document.createElement('option');
  def.value = '';
  def.textContent = '— Chọn môn —';
  def.disabled = true;
  def.selected = true;
  sel.appendChild(def);

  SUBJECTS.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.value;
    opt.textContent = `${s.icon} ${s.label}`;
    sel.appendChild(opt);
  });

  sel.addEventListener('change', () => recalcRow(id, sem));
  return sel;
}

/* ─────────────────────────────────────────────
   CREATE INPUT WRAP (input + error label)
───────────────────────────────────────────── */
function createInputWrap(id, sem, type, idx = '') {
  const wrap = document.createElement('div');
  wrap.className = 'input-wrap';

  const inp = document.createElement('input');
  inp.type = 'text';
  inp.className = 'score-input';
  inp.placeholder = '—';
  inp.inputMode = 'decimal';
  inp.dataset.type = type;
  inp.dataset.idx  = idx;
  // confirmed = rounded value string, or '' if blank
  inp.dataset.confirmed = '';

  const errEl = document.createElement('span');
  errEl.className = 'input-error';

  /* Xóa lỗi khi đang gõ */
  inp.addEventListener('input', () => {
    inp.classList.remove('error', 'valid');
    errEl.classList.remove('show');
    errEl.textContent = '';
  });

  /* Xác nhận khi Enter */
  inp.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitInput(inp, errEl, id, sem);
    }
  });

  /* Cũng tính lại khi blur (tiện lợi trên mobile) */
  inp.addEventListener('blur', () => {
    if (inp.value.trim() !== '' && inp.dataset.confirmed === '') {
      commitInput(inp, errEl, id, sem);
    }
  });

  wrap.appendChild(inp);
  wrap.appendChild(errEl);
  return wrap;
}

/* ─────────────────────────────────────────────
   COMMIT INPUT (validate → round → confirm)
───────────────────────────────────────────── */
function commitInput(inp, errEl, id, sem) {
  const raw = inp.value.trim().replace(',', '.');

  if (raw === '') {
    inp.classList.remove('error', 'valid');
    errEl.classList.remove('show');
    inp.dataset.confirmed = '';
    recalcRow(id, sem);
    return;
  }

  const result = validateScore(raw);

  if (!result.ok) {
    inp.classList.add('error');
    inp.classList.remove('valid');
    errEl.textContent = result.msg;
    errEl.classList.add('show');
    showToast(result.msg);
    inp.dataset.confirmed = '';
    return;
  }

  // Round to nearest 0.5
  const rounded = roundHalf(result.value);
  inp.value = fmt(rounded);
  inp.classList.add('valid');
  inp.classList.remove('error');
  errEl.classList.remove('show');
  inp.dataset.confirmed = String(rounded);

  recalcRow(id, sem);
}

/* ─────────────────────────────────────────────
   RECALC ROW AVERAGE
───────────────────────────────────────────── */
function recalcRow(id, sem) {
  const tr = document.getElementById(`row-${id}`);
  if (!tr) return;

  // Gather confirmed TX values
  const txConfirmed = [];
  tr.querySelectorAll('.score-input[data-type="tx"]').forEach(inp => {
    if (inp.dataset.confirmed !== '') {
      txConfirmed.push(parseFloat(inp.dataset.confirmed));
    }
  });

  const gkInp = tr.querySelector('.score-input[data-type="gk"]');
  const ckInp = tr.querySelector('.score-input[data-type="ck"]');

  const gkVal = (gkInp && gkInp.dataset.confirmed !== '') ? parseFloat(gkInp.dataset.confirmed) : null;
  const ckVal = (ckInp && ckInp.dataset.confirmed !== '') ? parseFloat(ckInp.dataset.confirmed) : null;

  const chip = document.getElementById(`avg-${id}`);

  // Cần GK & CK mới tính
  if (gkVal === null || ckVal === null) {
    chip.textContent = 'Chưa đủ thông tin';
    chip.className = 'avg-chip pending';
    delete chip.dataset.val;
    recalcSummary(sem);
    return;
  }

  // Công thức: (∑TX + GK×2 + CK×3) / (n_TX + 2 + 3)
  const txSum   = txConfirmed.reduce((a, b) => a + b, 0);
  const denom   = txConfirmed.length + 2 + 3;
  const avg     = roundHalf((txSum + gkVal * 2 + ckVal * 3) / denom);

  chip.textContent = fmt(avg);
  chip.className   = 'avg-chip';
  chip.dataset.val = avg;

  recalcSummary(sem);
}

/* ─────────────────────────────────────────────
   RECALC SUMMARY (TK + Xếp loại)
───────────────────────────────────────────── */
function recalcSummary(sem) {
  const tbody = document.getElementById(`gradeTableBody${sem}`);
  const dataRows = tbody.querySelectorAll('tr:not(.empty-row)');

  const tkScoreEl = document.getElementById(`totalScore${sem}`);
  const ratingEl  = document.getElementById(`rating${sem}`);
  const tkCard    = document.getElementById(`totalCard${sem}`);
  const rtCard    = document.getElementById(`ratingCard${sem}`);

  if (dataRows.length === 0) {
    resetSummary(tkScoreEl, ratingEl, tkCard, rtCard);
    return;
  }

  const avgs = [];
  let allReady = true;

  dataRows.forEach(tr => {
    const chip = tr.querySelector('.avg-chip');
    if (!chip || chip.dataset.val === undefined) {
      allReady = false;
    } else {
      avgs.push(parseFloat(chip.dataset.val));
    }
  });

  if (!allReady || avgs.length === 0) {
    resetSummary(tkScoreEl, ratingEl, tkCard, rtCard);
    return;
  }

  const tk = roundHalf(avgs.reduce((a, b) => a + b, 0) / avgs.length);
  tkScoreEl.textContent = fmt(tk);

  let cls, label;
  if (tk < 7) {
    cls = 'red';    label = '📊 Trung Bình';
  } else if (tk < 8.5) {
    cls = 'yellow'; label = '⭐ Khá';
  } else {
    cls = 'green';  label = '🏆 Giỏi';
  }

  ratingEl.textContent = label;

  // Apply colour theme
  ['red','yellow','green'].forEach(c => {
    tkCard.classList.remove(c);
    rtCard.classList.remove(c);
  });
  tkCard.classList.add(cls);
  rtCard.classList.add(cls);

  // Pop animation
  tkScoreEl.style.transform = 'scale(1.2)';
  requestAnimationFrame(() => {
    setTimeout(() => { tkScoreEl.style.transition = 'transform .25s'; tkScoreEl.style.transform = 'scale(1)'; }, 20);
  });
}

function resetSummary(tkEl, rtEl, tkCard, rtCard) {
  tkEl.textContent = '--';
  rtEl.textContent = '--';
  ['red','yellow','green'].forEach(c => { tkCard.classList.remove(c); rtCard.classList.remove(c); });
}

/* ─────────────────────────────────────────────
   EMPTY STATE
───────────────────────────────────────────── */
function refreshEmptyState(sem) {
  const tbody   = document.getElementById(`gradeTableBody${sem}`);
  const hasRows = tbody.querySelectorAll('tr:not(.empty-row)').length > 0;
  const existing = tbody.querySelector('.empty-row');

  if (!hasRows && !existing) {
    const tr = document.createElement('tr');
    tr.className = 'empty-row';
    const td = document.createElement('td');
    td.colSpan = 9;
    td.textContent = '📋 Chưa có môn học nào. Nhấn "➕ Thêm Môn Học" để bắt đầu!';
    tr.appendChild(td);
    tbody.appendChild(tr);
  } else if (hasRows && existing) {
    existing.remove();
  }
}

/* ─────────────────────────────────────────────
   TOAST NOTIFICATION
───────────────────────────────────────────── */
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 3000);
}

/* ─────────────────────────────────────────────
   INIT
───────────────────────────────────────────── */
refreshEmptyState('1');
refreshEmptyState('2');
