const form = document.querySelector("#calc-form");
const tableBody = document.querySelector("#table-body");
const formMessage = document.querySelector("#form-message");
const resetButton = document.querySelector("#reset") || document.querySelector("#clear-btn");
const tableSubtitle = document.querySelector("#table-subtitle");
const systemPill = document.querySelector("#system-pill");

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const percentFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 4,
});

const EPSILON = 1e-10;

const toNumber = (value) => {
  if (typeof value === "number") {
    return value;
  }
  if (typeof value !== "string") {
    return Number(value);
  }

  let normalized = value.trim();
  if (!normalized) {
    return NaN;
  }

  normalized = normalized.replace(/\s/g, "");
  if (normalized.includes(",")) {
    normalized = normalized.replace(/\./g, "").replace(",", ".");
  }
  return Number(normalized);
};

const toCurrency = (value) => {
  const safeValue = Math.abs(value) < EPSILON ? 0 : value;
  return currencyFormatter.format(safeValue);
};

const buildRow = ({ period, openingBalance, amortization, interest, payment, closingBalance }) => {
  const row = document.createElement("tr");
  const cells = [
    period,
    toCurrency(openingBalance),
    toCurrency(amortization),
    toCurrency(interest),
    toCurrency(payment),
    toCurrency(closingBalance),
  ];

  cells.forEach((cell) => {
    const td = document.createElement("td");
    td.textContent = cell;
    row.appendChild(td);
  });

  return row;
};

const calculateSAC = (pv, rate, periods) => {
  const amortization = pv / periods;
  const rows = [];
  let openingBalance = pv;

  for (let period = 1; period <= periods; period += 1) {
    const interest = openingBalance * rate;
    const payment = amortization + interest;
    let closingBalance = openingBalance - amortization;

    if (period === periods || Math.abs(closingBalance) < EPSILON) {
      closingBalance = 0;
    }

    rows.push({
      period,
      openingBalance,
      amortization,
      interest,
      payment,
      closingBalance,
    });

    openingBalance = closingBalance;
  }

  return rows;
};

const calculatePrice = (pv, rate, periods) => {
  const rows = [];
  let openingBalance = pv;
  let payment;

  if (rate === 0) {
    payment = pv / periods;
  } else {
    const factor = Math.pow(1 + rate, periods);
    payment = pv * ((rate * factor) / (factor - 1));
  }

  for (let period = 1; period <= periods; period += 1) {
    const interest = openingBalance * rate;
    const amortization = payment - interest;
    let closingBalance = openingBalance - amortization;

    if (period === periods || Math.abs(closingBalance) < EPSILON) {
      closingBalance = 0;
    }

    rows.push({
      period,
      openingBalance,
      amortization,
      interest,
      payment,
      closingBalance,
    });

    openingBalance = closingBalance;
  }

  return rows;
};

const renderRows = (rows) => {
  tableBody.innerHTML = "";

  if (!rows.length) {
    const empty = document.createElement("tr");
    empty.innerHTML = '<td colspan="6" class="empty">Nenhum cálculo realizado.</td>';
    tableBody.appendChild(empty);
    return;
  }

  rows.forEach((row) => {
    tableBody.appendChild(buildRow(row));
  });
};

const updateSubtitle = (system, pv, ratePercent, periods) => {
  const systemLabel = system === "sac" ? "SAC" : "Price";
  systemPill.textContent = systemLabel;
  tableSubtitle.textContent = `Sistema ${systemLabel} • PV ${toCurrency(pv)} • i ${percentFormatter.format(
    ratePercent
  )}% • n ${periods}`;
};

const validateInputs = (pv, ratePercent, periods) => {
  if (!Number.isFinite(pv) || pv <= 0) {
    return "Informe um valor financiado válido.";
  }
  if (!Number.isFinite(ratePercent) || ratePercent < 0) {
    return "Informe uma taxa de juros válida.";
  }
  if (!Number.isInteger(periods) || periods <= 0) {
    return "Informe um número inteiro de períodos.";
  }
  return "";
};

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = new FormData(form);
  const pv = toNumber(formData.get("pv"));
  const ratePercent = toNumber(formData.get("rate"));
  const periods = toNumber(formData.get("periods"));
  const system = formData.get("system");

  const error = validateInputs(pv, ratePercent, periods);
  if (error) {
    formMessage.textContent = error;
    renderRows([]);
    tableSubtitle.textContent = "Preencha os campos para gerar as parcelas.";
    return;
  }

  formMessage.textContent = "";

  const rate = ratePercent / 100;
  const rows = system === "sac" ? calculateSAC(pv, rate, periods) : calculatePrice(pv, rate, periods);
  renderRows(rows);
  updateSubtitle(system, pv, ratePercent, periods);
});

if (resetButton) {
  resetButton.addEventListener("click", () => {
    form.reset();
    formMessage.textContent = "";
    renderRows([]);
    tableSubtitle.textContent = "Preencha os campos para gerar as parcelas.";
    systemPill.textContent = "SAC";
  });
}

renderRows([]);
