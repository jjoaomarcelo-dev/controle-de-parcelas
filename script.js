const formulario = document.querySelector("#formulario-compra");
const campoDescricao = document.querySelector("#descricao-compra");
const campoDataCompra = document.querySelector("#data-compra");
const campoFormaPagamento = document.querySelector("#forma-pagamento");
const campoValorTotal = document.querySelector("#valor-total");
const campoQuantidadeParcelas = document.querySelector("#quantidade-parcelas");
const campoParcelasPagas = document.querySelector("#parcelas-pagas");
const campoPrimeiroVencimento = document.querySelector("#primeiro-vencimento");
const rotuloPrimeiroVencimento = document.querySelector(
  "#rotulo-primeiro-vencimento"
);
const rotuloUltimoVencimento = document.querySelector(
  "#rotulo-ultimo-vencimento"
);

const previaValorParcela = document.querySelector("#previa-valor-parcela");
const previaValorTotal = document.querySelector("#previa-valor-total");
const previaParcelasRestantes = document.querySelector(
  "#previa-parcelas-restantes"
);
const previaSaldoAberto = document.querySelector("#previa-saldo-aberto");
const previaProgresso = document.querySelector("#previa-progresso");
const previaUltimoVencimento = document.querySelector(
  "#previa-ultimo-vencimento"
);

const quantidadeCompras = document.querySelector("#quantidade-compras");
const compromissoMensal = document.querySelector("#compromisso-mensal");
const saldoEmAberto = document.querySelector("#saldo-em-aberto");
const listaCompras = document.querySelector("#lista-compras");
const estadoVazio = document.querySelector("#estado-vazio");
const mensagemErro = document.querySelector("#mensagem-erro");

const chaveArmazenamento = "controleDeParcelas.compras";

let compras = carregarCompras();

function carregarCompras() {
  try {
    const comprasSalvas = localStorage.getItem(chaveArmazenamento);

    if (!comprasSalvas) {
      return [];
    }

    const dadosConvertidos = JSON.parse(comprasSalvas);

    if (!Array.isArray(dadosConvertidos)) {
      return [];
    }

    return dadosConvertidos.map(function (compra) {
      const parcelasPagas = Number.isInteger(compra.parcelasPagas)
        ? compra.parcelasPagas
        : 0;
      const parcelasRestantes = compra.quantidadeParcelas - parcelasPagas;

      return {
        ...compra,
        parcelasPagas,
        parcelasRestantes,
        saldoEmAberto:
          compra.valorTotal * (parcelasRestantes / compra.quantidadeParcelas)
      };
    });
  } catch {
    return [];
  }
}

function salvarCompras() {
  localStorage.setItem(chaveArmazenamento, JSON.stringify(compras));
}

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

function obterRotuloVencimento(formaPagamento) {
  if (formaPagamento === "Cartão de crédito") {
    return "Vencimento da primeira fatura";
  }

  if (
    formaPagamento === "Carnê" ||
    formaPagamento === "Financiamento" ||
    formaPagamento === "Empréstimo"
  ) {
    return "Vencimento da primeira parcela";
  }

  return "Primeiro vencimento";
}

function obterRotuloUltimoVencimento(formaPagamento) {
  if (formaPagamento === "Cartão de crédito") {
    return "Vencimento da última fatura";
  }

  if (
    formaPagamento === "Carnê" ||
    formaPagamento === "Financiamento" ||
    formaPagamento === "Empréstimo"
  ) {
    return "Vencimento da última parcela";
  }

  return "Último vencimento";
}

function atualizarRotuloVencimento() {
  rotuloPrimeiroVencimento.textContent = obterRotuloVencimento(
    campoFormaPagamento.value
  );
  rotuloUltimoVencimento.textContent = obterRotuloUltimoVencimento(
    campoFormaPagamento.value
  );
}

function atualizarPrevia() {
  const valorTotal = Number(campoValorTotal.value);
  const quantidadeParcelas = Number(campoQuantidadeParcelas.value);
  const parcelasPagas = Number(campoParcelasPagas.value);
  const primeiroVencimento = converterTextoEmData(
    campoPrimeiroVencimento.value
  );

  const dadosValidos =
    valorTotal > 0 &&
    Number.isInteger(quantidadeParcelas) &&
    quantidadeParcelas > 0 &&
    Number.isInteger(parcelasPagas) &&
    parcelasPagas >= 0 &&
    parcelasPagas <= quantidadeParcelas;

  if (!dadosValidos) {
    previaValorParcela.textContent = formatarMoeda(0);
    previaValorTotal.textContent = formatarMoeda(0);
    previaParcelasRestantes.textContent = "0 parcelas";
    previaSaldoAberto.textContent = formatarMoeda(0);
    previaProgresso.textContent = "0% pago";
    previaUltimoVencimento.textContent = "\u2014";
    return;
  }

  const valorParcela = valorTotal / quantidadeParcelas;
  const parcelasRestantes = quantidadeParcelas - parcelasPagas;
  const saldoAberto = valorTotal * (parcelasRestantes / quantidadeParcelas);
  const progresso = (parcelasPagas / quantidadeParcelas) * 100;

  previaValorParcela.textContent = formatarMoeda(valorParcela);
  previaValorTotal.textContent = formatarMoeda(valorTotal);
  previaParcelasRestantes.textContent =
    parcelasRestantes === 1
      ? "1 parcela"
      : `${parcelasRestantes} parcelas`;
  previaSaldoAberto.textContent = formatarMoeda(saldoAberto);
  previaProgresso.textContent = `${progresso.toFixed(0)}% pago`;

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
  const comprasAtivas = compras.filter(function (compra) {
    return compra.parcelasRestantes > 0;
  });

  const totalDasParcelas = comprasAtivas.reduce(function (total, compra) {
    return total + compra.valorParcela;
  }, 0);

  const totalEmAberto = comprasAtivas.reduce(function (total, compra) {
    return total + compra.saldoEmAberto;
  }, 0);

  quantidadeCompras.textContent = comprasAtivas.length;
  compromissoMensal.textContent = formatarMoeda(totalDasParcelas);
  saldoEmAberto.textContent = formatarMoeda(totalEmAberto);
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
      `${compra.formaPagamento || "Forma não informada"} · ` +
      `${compra.parcelasPagas} de ${compra.quantidadeParcelas} parcelas pagas`;

    identificacao.append(titulo, descricaoParcelas);

    const saldoAberto = criarInformacaoCompra(
      "Saldo em aberto",
      formatarMoeda(compra.saldoEmAberto)
    );
    const dataCompra = criarInformacaoCompra(
      "Data da compra",
      compra.dataCompra || "Não informada"
    );
    const primeiroVencimento = criarInformacaoCompra(
      obterRotuloVencimento(compra.formaPagamento),
      compra.primeiroVencimento
    );
    const ultimoVencimento = criarInformacaoCompra(
      obterRotuloUltimoVencimento(compra.formaPagamento),
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
      saldoAberto,
      dataCompra,
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
campoParcelasPagas.addEventListener("input", atualizarPrevia);

campoDataCompra.addEventListener("input", formatarCampoData);
campoFormaPagamento.addEventListener("change", atualizarRotuloVencimento);

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

  salvarCompras();
  mostrarCompras();
  atualizarResumo();
});

formulario.addEventListener("submit", function (evento) {
  evento.preventDefault();

  const descricao = campoDescricao.value.trim();
  const dataCompra = converterTextoEmData(campoDataCompra.value);
  const formaPagamento = campoFormaPagamento.value;
  const valorTotal = Number(campoValorTotal.value);
  const quantidadeParcelas = Number(campoQuantidadeParcelas.value);
  const parcelasPagas = Number(campoParcelasPagas.value);
  const primeiroVencimento = converterTextoEmData(
    campoPrimeiroVencimento.value
  );

  const dadosValidos =
    descricao !== "" &&
    dataCompra !== null &&
    formaPagamento !== "" &&
    valorTotal > 0 &&
    Number.isInteger(quantidadeParcelas) &&
    quantidadeParcelas > 0 &&
    Number.isInteger(parcelasPagas) &&
    parcelasPagas >= 0 &&
    parcelasPagas <= quantidadeParcelas &&
    primeiroVencimento !== null;

  if (!dadosValidos) {
    mensagemErro.textContent = "Preencha todos os campos corretamente.";
    mensagemErro.hidden = false;
    return;
  }

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  if (dataCompra > hoje) {
    mensagemErro.textContent = "A data da compra não pode estar no futuro.";
    mensagemErro.hidden = false;
    return;
  }

  if (primeiroVencimento < dataCompra) {
    mensagemErro.textContent =
      "O primeiro vencimento não pode ser anterior à data da compra.";
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
    dataCompra: campoDataCompra.value,
    formaPagamento,
    valorTotal,
    quantidadeParcelas,
    parcelasPagas,
    parcelasRestantes: quantidadeParcelas - parcelasPagas,
    valorParcela: valorTotal / quantidadeParcelas,
    saldoEmAberto:
      valorTotal * ((quantidadeParcelas - parcelasPagas) / quantidadeParcelas),
    primeiroVencimento: campoPrimeiroVencimento.value,
    ultimoVencimento: ultimoVencimento.toLocaleDateString("pt-BR")
  };

  compras.push(compra);
  salvarCompras();
  mensagemErro.hidden = true;

  mostrarCompras();
  atualizarResumo();

  formulario.reset();
  atualizarRotuloVencimento();
  atualizarPrevia();
  campoDescricao.focus();
});

mostrarCompras();
atualizarResumo();
