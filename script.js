const form = document.getElementById('calc-form');
const tbody = document.querySelector('#results-table tbody');
const summary = document.getElementById('result-summary');
const errorEl = document.getElementById('error');
const systemPill = document.getElementById('system-pill');
const clearBtn = document.getElementById('clear-btn');

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const percentFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const EPSILON = 1e-10;

function parseNumber(value) {
  if (!value) return NaN;
  let cleaned = String(value).trim();
  if (!cleaned) return NaN;
  cleaned = cleaned.replace(/\s/g, '');
  if (cleaned.includes(',')) {
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  }
  return Number(cleaned);
}

function formatBRL(value) {
  const safeValue = Math.abs(value) < EPSILON ? 0 : value;
  return currencyFormatter.format(safeValue);
}

function clearTable() {
  tbody.innerHTML = '<tr class="empty-row"><td colspan="6">Nenhum cálculo realizado.</td></tr>';
}

function setError(message) {
  errorEl.textContent = message;
}

function updateSummary({ system, pv, rate, periods }) {
  const systemLabel = system === 'sac' ? 'SAC' : 'Price';
  summary.textContent = `${systemLabel} • PV ${formatBRL(pv)} • i ${percentFormatter.format(rate)}% • n ${periods}`;
  systemPill.textContent = systemLabel;
}

function buildRow({ period, openingBalance, amortization, interest, payment, closingBalance }) {
  return `
    <tr>
      <td>${period}</td>
      <td>${formatBRL(openingBalance)}</td>
      <td>${formatBRL(amortization)}</td>
      <td>${formatBRL(interest)}</td>
      <td>${formatBRL(payment)}</td>
      <td>${formatBRL(closingBalance)}</td>
    </tr>
  `;
}

function calculateSAC({ pv, rate, periods }) {
  const amortization = pv / periods;
  let balance = pv;
  const rows = [];

  for (let period = 1; period <= periods; period += 1) {
    const interest = balance * rate;
    const payment = amortization + interest;
    const closingBalance = balance - amortization;

    rows.push({
      period,
      openingBalance: balance,
      amortization,
      interest,
      payment,
      closingBalance,
    });

    balance = closingBalance;
  }

  return rows;
}

function calculatePrice({ pv, rate, periods }) {
  let payment;
  if (rate === 0) {
    payment = pv / periods;
  } else {
    const factor = Math.pow(1 + rate, periods);
    payment = pv * ((rate * factor) / (factor - 1));
  }

  let balance = pv;
  const rows = [];

  for (let period = 1; period <= periods; period += 1) {
    const interest = balance * rate;
    const amortization = payment - interest;
    const closingBalance = balance - amortization;

    rows.push({
      period,
      openingBalance: balance,
      amortization,
      interest,
      payment,
      closingBalance,
    });

    balance = closingBalance;
  }

  return rows;
}

function renderTable(rows) {
  tbody.innerHTML = rows.map(buildRow).join('');
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  setError('');

  const pv = parseNumber(form.pv.value);
  const ratePercent = parseNumber(form.rate.value);
  const periods = Number(form.periods.value);

  if (!Number.isFinite(pv) || pv <= 0) {
    setError('Informe um valor financiado válido.');
    clearTable();
    return;
  }

  if (!Number.isFinite(ratePercent) || ratePercent < 0) {
    setError('Informe uma taxa de juros válida.');
    clearTable();
    return;
  }

  if (!Number.isInteger(periods) || periods <= 0) {
    setError('Informe um número inteiro de períodos.');
    clearTable();
    return;
  }

  const rate = ratePercent / 100;
  const system = form.system.value;

  const rows = system === 'sac'
    ? calculateSAC({ pv, rate, periods })
    : calculatePrice({ pv, rate, periods });

  renderTable(rows);
  updateSummary({ system, pv, rate: ratePercent, periods });
});

clearBtn.addEventListener('click', () => {
  form.reset();
  setError('');
  summary.textContent = 'Preencha os campos para gerar a tabela.';
  systemPill.textContent = 'SAC';
  clearTable();
});

clearTable();
