// .workspace/worktrees/ggomesbra-zetari-b35b05b0/sessions/wf-8065f751-coder-t4/script.js

const form = document.querySelector("#calc-form");
const tableBody = document.querySelector("#table-body");
const formMessage = document.querySelector("#form-message");
const resetButton = document.querySelector("#reset");
const tableSubtitle = document.querySelector("#table-subtitle");
const systemPill = document.querySelector("#system-pill");

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const toCurrency = (value) => currencyFormatter.format(value);

const toNumber = (value) => {
  if (typeof value !== "string") {
    return Number(value);
  }
  const normalized = value.replace(/\s/g, "").replace(",", ".");
  return Number(normalized);
};

const buildRow = ({ period, saldoInicial, amortizacao, juros, prestacao, saldoFinal }) => {
  const row = document.createElement("tr");
  const cells = [
    period,
    toCurrency(saldoInicial),
    toCurrency(amortizacao),
    toCurrency(juros),
    toCurrency(prestacao),
    toCurrency(saldoFinal),
  ];

  cells.forEach((cell) => {
    const td = document.createElement("td");
    td.textContent = cell;
    row.appendChild(td);
  });

  return row;
};

const calculateSAC = (pv, rate, periods) => {
  const amortizacao = pv / periods;
  const rows = [];
  let saldoAnterior = pv;

  for (let period = 1; period <= periods; period += 1) {
    const juros = saldoAnterior * rate;
    const prestacao = amortizacao + juros;
    let saldoFinal = saldoAnterior - amortizacao;

    if (period === periods) {
      saldoFinal = 0;
    }

    rows.push({
      period,
      saldoInicial: saldoAnterior,
      amortizacao,
      juros,
      prestacao,
      saldoFinal,
    });

    saldoAnterior = saldoFinal;
  }

  return rows;
};

const calculatePrice = (pv, rate, periods) => {
  const rows = [];
  let saldoAnterior = pv;
  let prestacao;

  if (rate === 0) {
    prestacao = pv / periods;
  } else {
    const factor = Math.pow(1 + rate, periods);
    prestacao = pv * ((rate * factor) / (factor - 1));
  }

  for (let period = 1; period <= periods; period += 1) {
    const juros = saldoAnterior * rate;
    const amortizacao = prestacao - juros;
    let saldoFinal = saldoAnterior - amortizacao;

    if (period === periods) {
      saldoFinal = 0;
    }

    rows.push({
      period,
      saldoInicial: saldoAnterior,
      amortizacao,
      juros,
      prestacao,
      saldoFinal,
    });

    saldoAnterior = saldoFinal;
  }

  return rows;
};

const renderRows = (rows) => {
  tableBody.innerHTML = "";

  if (!rows.length) {
    const empty = document.createElement("tr");
    empty.innerHTML = '<td colspan="6" class="empty">Nenhum c�lculo realizado.</td>';
    tableBody.appendChild(empty);
    return;
  }

  rows.forEach((row) => {
    tableBody.appendChild(buildRow(row));
  });
};

const updateSubtitle = (system, pv, rate, periods) => {
  const systemLabel = system === "sac" ? "SAC" : "Price";
  systemPill.textContent = systemLabel;
  tableSubtitle.textContent = `Sistema ${systemLabel} � PV ${toCurrency(pv)} � i ${(
    rate * 100
  ).toFixed(4)}% � n ${periods}`;
};

const validateInputs = (pv, rate, periods) => {
  if (!Number.isFinite(pv) || pv <= 0) {
    return "Informe um valor financiado v�lido.";
  }
  if (!Number.isFinite(rate) || rate < 0) {
    return "Informe uma taxa de juros v�lida.";
  }
  if (!Number.isFinite(periods) || periods <= 0) {
    return "Informe o n�mero de per�odos.";
  }
  return "";
};

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = new FormData(form);
  const pv = toNumber(formData.get("pv"));
  const rate = toNumber(formData.get("rate")) / 100;
  const periods = Math.floor(toNumber(formData.get("periods")));
  const system = formData.get("system");

  const error = validateInputs(pv, rate, periods);
  if (error) {
    formMessage.textContent = error;
    renderRows([]);
    tableSubtitle.textContent = "Preencha os campos para gerar as parcelas.";
    return;
  }

  formMessage.textContent = "";

  const rows = system === "sac" ? calculateSAC(pv, rate, periods) : calculatePrice(pv, rate, periods);
  renderRows(rows);
  updateSubtitle(system, pv, rate, periods);
});

resetButton.addEventListener("click", () => {
  form.reset();
  formMessage.textContent = "";
  renderRows([]);
  tableSubtitle.textContent = "Preencha os campos para gerar as parcelas.";
  systemPill.textContent = "SAC";
});