const formulario = document.querySelector("#formulario-compra");
const campoDescricao = document.querySelector("#descricao-compra");
const campoValorTotal = document.querySelector("#valor-total");
const campoQuantidadeParcelas = document.querySelector("#quantidade-parcelas");
const campoPrimeiroVencimento = document.querySelector("#primeiro-vencimento");

const previaValorParcela = document.querySelector("#previa-valor-parcela");
const previaValorTotal = document.querySelector("#previa-valor-total");
const previaQuantidade = document.querySelector("#previa-quantidade");
const previaUltimoVencimento = document.querySelector(
  "#previa-ultimo-vencimento"
);

const quantidadeCompras = document.querySelector("#quantidade-compras");
const compromissoMensal = document.querySelector("#compromisso-mensal");
const totalParcelado = document.querySelector("#total-parcelado");
const listaCompras = document.querySelector("#lista-compras");
const estadoVazio = document.querySelector("#estado-vazio");
const mensagemErro = document.querySelector("#mensagem-erro");

let compras = [];

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
    previaUltimoVencimento.textContent = "\u2014";
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
    previaUltimoVencimento.textContent = "\u2014";
  }
}

function atualizarResumo() {
  const totalDasCompras = compras.reduce(function (total, compra) {
    return total + compra.valorTotal;
  }, 0);

  const totalDasParcelas = compras.reduce(function (total, compra) {
    return total + compra.valorParcela;
  }, 0);

  quantidadeCompras.textContent = compras.length;
  compromissoMensal.textContent = formatarMoeda(totalDasParcelas);
  totalParcelado.textContent = formatarMoeda(totalDasCompras);
}

function criarInformacaoCompra(rotulo, valor) {
  const informacao = document.createElement("div");
  informacao.classList.add("compra-informacao");

  const legenda = document.createElement("span");
  legenda.textContent = rotulo;

  const conteudo = document.createElement("strong");
  conteudo.textContent = valor;

  informacao.append(legenda, conteudo);

  return informacao;
}

function mostrarCompras() {
  if (compras.length === 0) {
    listaCompras.replaceChildren(estadoVazio);
    return;
  }

  const itens = compras.map(function (compra) {
    const item = document.createElement("article");
    item.classList.add("compra-item");

    const identificacao = document.createElement("div");
    const titulo = document.createElement("h3");
    const descricaoParcelas = document.createElement("p");

    titulo.textContent = compra.descricao;
    descricaoParcelas.textContent =
      `${compra.quantidadeParcelas}x de ${formatarMoeda(compra.valorParcela)}`;

    identificacao.append(titulo, descricaoParcelas);

    const valorTotal = criarInformacaoCompra(
      "Valor total",
      formatarMoeda(compra.valorTotal)
    );
    const primeiroVencimento = criarInformacaoCompra(
      "Primeiro vencimento",
      compra.primeiroVencimento
    );
    const ultimoVencimento = criarInformacaoCompra(
      "Último vencimento",
      compra.ultimoVencimento
    );

    const botaoExcluir = document.createElement("button");
    botaoExcluir.classList.add("botao-excluir");
    botaoExcluir.type = "button";
    botaoExcluir.dataset.id = compra.id;
    botaoExcluir.textContent = "×";
    botaoExcluir.title = `Excluir ${compra.descricao}`;
    botaoExcluir.setAttribute(
      "aria-label",
      `Excluir compra ${compra.descricao}`
    );

    item.append(
      identificacao,
      valorTotal,
      primeiroVencimento,
      ultimoVencimento,
      botaoExcluir
    );

    return item;
  });

  listaCompras.replaceChildren(...itens);
}

campoValorTotal.addEventListener("input", atualizarPrevia);
campoQuantidadeParcelas.addEventListener("input", atualizarPrevia);

campoPrimeiroVencimento.addEventListener("input", function (evento) {
  formatarCampoData(evento);
  atualizarPrevia();
});

listaCompras.addEventListener("click", function (evento) {
  const botaoExcluir = evento.target.closest(".botao-excluir");

  if (!botaoExcluir) {
    return;
  }

  const idDaCompra = Number(botaoExcluir.dataset.id);

  compras = compras.filter(function (compra) {
    return compra.id !== idDaCompra;
  });

  mostrarCompras();
  atualizarResumo();
});

formulario.addEventListener("submit", function (evento) {
  evento.preventDefault();

  const descricao = campoDescricao.value.trim();
  const valorTotal = Number(campoValorTotal.value);
  const quantidadeParcelas = Number(campoQuantidadeParcelas.value);
  const primeiroVencimento = converterTextoEmData(
    campoPrimeiroVencimento.value
  );

  const dadosValidos =
    descricao !== "" &&
    valorTotal > 0 &&
    Number.isInteger(quantidadeParcelas) &&
    quantidadeParcelas > 0 &&
    primeiroVencimento !== null;

  if (!dadosValidos) {
    mensagemErro.textContent = "Preencha todos os campos corretamente.";
    mensagemErro.hidden = false;
    return;
  }

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  if (primeiroVencimento < hoje) {
    mensagemErro.textContent =
      "O primeiro vencimento não pode estar no passado.";
    mensagemErro.hidden = false;
    return;
  }

  const ultimoVencimento = adicionarMeses(
    primeiroVencimento,
    quantidadeParcelas - 1
  );

  const compra = {
    id: Date.now(),
    descricao,
    valorTotal,
    quantidadeParcelas,
    valorParcela: valorTotal / quantidadeParcelas,
    primeiroVencimento: campoPrimeiroVencimento.value,
    ultimoVencimento: ultimoVencimento.toLocaleDateString("pt-BR")
  };

  compras.push(compra);
  mensagemErro.hidden = true;

  mostrarCompras();
  atualizarResumo();

  formulario.reset();
  atualizarPrevia();
  campoDescricao.focus();
});
