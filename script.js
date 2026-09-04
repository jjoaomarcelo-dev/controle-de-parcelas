const campoValorTotal = document.querySelector("#valor-total");
const campoQuantidadeParcelas = document.querySelector("#quantidade-parcelas");
const campoPrimeiroVencimento = document.querySelector("#primeiro-vencimento");

const previaValorParcela = document.querySelector("#previa-valor-parcela");
const previaValorTotal = document.querySelector("#previa-valor-total");
const previaQuantidade = document.querySelector("#previa-quantidade");
const previaUltimoVencimento = document.querySelector(
  "#previa-ultimo-vencimento"
);

function formatarMoeda(valor) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function formatarCampoData(evento) {
  let valor = evento.target.value
    .replace(/\D/g, "")
    .slice(0, 8);

  if (valor.length > 4) {
    valor = `${valor.slice(0, 2)}/${valor.slice(2, 4)}/${valor.slice(4)}`;
  } else if (valor.length > 2) {
    valor = `${valor.slice(0, 2)}/${valor.slice(2)}`;
  }

  evento.target.value = valor;
}

function converterTextoEmData(texto) {
  const partes = texto.split("/");

  if (partes.length !== 3) {
    return null;
  }

  const dia = Number(partes[0]);
  const mes = Number(partes[1]);
  const ano = Number(partes[2]);
  const data = new Date(ano, mes - 1, dia);

  const dataValida =
    data.getDate() === dia &&
    data.getMonth() === mes - 1 &&
    data.getFullYear() === ano;

  return dataValida ? data : null;
}

function adicionarMeses(dataInicial, quantidadeMeses) {
  const diaOriginal = dataInicial.getDate();
  const novaData = new Date(
    dataInicial.getFullYear(),
    dataInicial.getMonth() + quantidadeMeses,
    1
  );

  const ultimoDiaDoMes = new Date(
    novaData.getFullYear(),
    novaData.getMonth() + 1,
    0
  ).getDate();

  novaData.setDate(Math.min(diaOriginal, ultimoDiaDoMes));

  return novaData;
}

function atualizarPrevia() {
  const valorTotal = Number(campoValorTotal.value);
  const quantidadeParcelas = Number(campoQuantidadeParcelas.value);
  const primeiroVencimento = converterTextoEmData(
    campoPrimeiroVencimento.value
  );

  const dadosValidos =
    valorTotal > 0 &&
    Number.isInteger(quantidadeParcelas) &&
    quantidadeParcelas > 0;

  if (!dadosValidos) {
    previaValorParcela.textContent = formatarMoeda(0);
    previaValorTotal.textContent = formatarMoeda(0);
    previaQuantidade.textContent = "0 parcelas";
    previaUltimoVencimento.textContent = "—";
    return;
  }

  const valorParcela = valorTotal / quantidadeParcelas;

  previaValorParcela.textContent = formatarMoeda(valorParcela);
  previaValorTotal.textContent = formatarMoeda(valorTotal);
  previaQuantidade.textContent =
    quantidadeParcelas === 1
      ? "1 parcela"
      : `${quantidadeParcelas} parcelas`;

  if (primeiroVencimento) {
    const ultimoVencimento = adicionarMeses(
      primeiroVencimento,
      quantidadeParcelas - 1
    );

    previaUltimoVencimento.textContent =
      ultimoVencimento.toLocaleDateString("pt-BR");
  } else {
    previaUltimoVencimento.textContent = "—";
  }
}

campoValorTotal.addEventListener("input", atualizarPrevia);
campoQuantidadeParcelas.addEventListener("input", atualizarPrevia);

campoPrimeiroVencimento.addEventListener("input", function (evento) {
  formatarCampoData(evento);
  atualizarPrevia();
});
