const form = document.querySelector("#calc-form");
const clearBtn = document.querySelector("#clear-btn");
const errorEl = document.querySelector("#form-error");
const tableBody = document.querySelector("#result-body");

const summarySystem = document.querySelector("#summary-system");
const summaryBase = document.querySelector("#summary-base");
const summaryTotal = document.querySelector("#summary-total");
const summaryInterest = document.querySelector("#summary-interest");
const summaryFinal = document.querySelector("#summary-final");

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function parseNumber(value) {
  if (!value) return NaN;
  let normalized = value.toString().trim().replace(/\s+/g, "");
  const hasComma = normalized.includes(",");
  const hasDot = normalized.includes(".");
  if (hasComma && hasDot) {
    normalized = normalized.replace(/\./g, "").replace(/,/g, ".");
  } else if (hasComma) {
    normalized = normalized.replace(/,/g, ".");
  }
  normalized = normalized.replace(/[^0-9.-]/g, "");
  return Number(normalized);
}

function formatCurrency(value) {
  const safe = Math.abs(value) < 1e-8 ? 0 : value;
  return currencyFormatter.format(safe);
}

function renderPlaceholder() {
  tableBody.innerHTML = `
    <tr class="placeholder">
      <td colspan="6">Preencha os dados acima e clique em “Calcular tabela”.</td>
    </tr>
  `;
}

function setSummaryDefaults() {
  summarySystem.textContent = "—";
  summaryBase.textContent = "—";
  summaryTotal.textContent = "—";
  summaryInterest.textContent = "—";
  summaryFinal.textContent = "—";
}

function validateInputs(pv, ratePercent, periods) {
  if (Number.isNaN(pv) || pv <= 0) {
    return "Informe um valor financiado válido.";
  }
  if (Number.isNaN(ratePercent) || ratePercent < 0) {
    return "Informe uma taxa de juros válida.";
  }
  if (!Number.isFinite(periods) || periods <= 0) {
    return "Informe o número de períodos.";
  }
  return "";
}

function calculateSchedule({ pv, ratePercent, periods, system }) {
  const rate = ratePercent / 100;
  const rows = [];
  let balance = pv;
  let totalInterest = 0;
  let totalPayment = 0;

  if (system === "sac") {
    const amortization = pv / periods;
    for (let period = 1; period <= periods; period += 1) {
      const interest = balance * rate;
      const payment = amortization + interest;
      const nextBalance = balance - amortization;

      rows.push({
        period,
        balanceStart: balance,
        amortization,
        interest,
        payment,
        balanceEnd: nextBalance,
      });

      totalInterest += interest;
      totalPayment += payment;
      balance = nextBalance;
    }

    return {
      rows,
      baseValue: amortization,
      totalInterest,
      totalPayment,
      finalBalance: balance,
    };
  }

  let payment = 0;
  if (rate === 0) {
    payment = pv / periods;
  } else {
    const factor = Math.pow(1 + rate, periods);
    payment = pv * ((rate * factor) / (factor - 1));
  }

  for (let period = 1; period <= periods; period += 1) {
    const interest = balance * rate;
    const amortization = payment - interest;
    const nextBalance = balance - amortization;

    rows.push({
      period,
      balanceStart: balance,
      amortization,
      interest,
      payment,
      balanceEnd: nextBalance,
    });

    totalInterest += interest;
    totalPayment += payment;
    balance = nextBalance;
  }

  return {
    rows,
    baseValue: payment,
    totalInterest,
    totalPayment,
    finalBalance: balance,
  };
}

function renderTable(rows) {
  tableBody.innerHTML = "";
  rows.forEach((row) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${row.period}</td>
      <td>${formatCurrency(row.balanceStart)}</td>
      <td>${formatCurrency(row.amortization)}</td>
      <td>${formatCurrency(row.interest)}</td>
      <td>${formatCurrency(row.payment)}</td>
      <td>${formatCurrency(row.balanceEnd)}</td>
    `;
    tableBody.appendChild(tr);
  });
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  errorEl.textContent = "";

  const pv = parseNumber(form.pv.value);
  const ratePercent = parseNumber(form.rate.value);
  const periods = Number(form.periods.value);
  const system = form.system.value;

  const error = validateInputs(pv, ratePercent, periods);
  if (error) {
    errorEl.textContent = error;
    renderPlaceholder();
    setSummaryDefaults();
    return;
  }

  const result = calculateSchedule({ pv, ratePercent, periods, system });

  renderTable(result.rows);

  summarySystem.textContent = system === "sac" ? "SAC" : "Price";
  summaryBase.textContent =
    system === "sac"
      ? `${formatCurrency(result.baseValue)} (amortização)`
      : `${formatCurrency(result.baseValue)} (prestação)`;
  summaryTotal.textContent = formatCurrency(result.totalPayment);
  summaryInterest.textContent = formatCurrency(result.totalInterest);
  summaryFinal.textContent = formatCurrency(result.finalBalance);
});

clearBtn.addEventListener("click", () => {
  form.reset();
  errorEl.textContent = "";
  renderPlaceholder();
  setSummaryDefaults();
});

renderPlaceholder();
setSummaryDefaults();
