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
const mesSelecionado = document.querySelector("#mes-selecionado");
const quantidadeParcelasMes = document.querySelector(
  "#quantidade-parcelas-mes"
);
const botaoMesAnterior = document.querySelector("#mes-anterior");
const botaoProximoMes = document.querySelector("#proximo-mes");
const saldoEmAberto = document.querySelector("#saldo-em-aberto");
const listaCompras = document.querySelector("#lista-compras");
const estadoVazio = document.querySelector("#estado-vazio");
const mensagemErro = document.querySelector("#mensagem-erro");
const botaoTema = document.querySelector("#botao-tema");
const rotuloTema = document.querySelector("#rotulo-tema");
const iconeTema = botaoTema.querySelector("span");

const chaveArmazenamento = "controleDeParcelas.compras";
const chaveTema = "capiva.tema";

let compras = carregarCompras();
let mesEmExibicao = new Date();
mesEmExibicao.setDate(1);
mesEmExibicao.setHours(0, 0, 0, 0);

function carregarTema() {
  try {
    return localStorage.getItem(chaveTema) || "escuro";
  } catch {
    return "escuro";
  }
}

function salvarTema(tema) {
  try {
    localStorage.setItem(chaveTema, tema);
  } catch {
    // O tema continua funcionando durante o uso da página.
  }
}

function aplicarTema(tema) {
  const temaClaroAtivo = tema === "claro";

  document.body.classList.toggle("tema-claro", temaClaroAtivo);
  iconeTema.textContent = temaClaroAtivo ? "☾" : "☀";
  rotuloTema.textContent = temaClaroAtivo ? "Modo escuro" : "Modo claro";

  const proximoTema = temaClaroAtivo ? "escuro" : "claro";
  botaoTema.setAttribute("aria-label", `Ativar modo ${proximoTema}`);
  botaoTema.setAttribute("title", `Ativar modo ${proximoTema}`);
}

aplicarTema(carregarTema());

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

      const compraAtualizada = {
        ...compra,
        parcelasPagas,
        parcelasRestantes,
        saldoEmAberto:
          compra.valorTotal * (parcelasRestantes / compra.quantidadeParcelas)
      };

      compraAtualizada.parcelas = gerarParcelas(compraAtualizada);
      atualizarDadosCompra(compraAtualizada);

      return compraAtualizada;
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

function gerarParcelas(compra) {
  const primeiroVencimento = converterTextoEmData(compra.primeiroVencimento);
  const temParcelasSalvas =
    Array.isArray(compra.parcelas) && compra.parcelas.length > 0;

  if (!primeiroVencimento) {
    return [];
  }

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const valorTotalEmCentavos = Math.round(compra.valorTotal * 100);
  const valorBaseEmCentavos = Math.floor(
    valorTotalEmCentavos / compra.quantidadeParcelas
  );
  const centavosRestantes =
    valorTotalEmCentavos % compra.quantidadeParcelas;

  return Array.from(
    { length: compra.quantidadeParcelas },
    function (_, indice) {
      const parcelaAnterior = Array.isArray(compra.parcelas)
        ? compra.parcelas.find(function (parcela) {
          return parcela.numero === indice + 1;
        })
        : null;
      const vencimento = adicionarMeses(primeiroVencimento, indice);
      const valorEmCentavos =
        valorBaseEmCentavos + (indice < centavosRestantes ? 1 : 0);

      let status = "pendente";

      if (
        parcelaAnterior?.status === "paga" ||
        (!temParcelasSalvas && indice < compra.parcelasPagas)
      ) {
        status = "paga";
      } else if (vencimento < hoje) {
        status = "atrasada";
      }

      return {
        numero: indice + 1,
        valor: valorEmCentavos / 100,
        vencimento: vencimento.toLocaleDateString("pt-BR"),
        status,
        dataPagamento: parcelaAnterior?.dataPagamento || null
      };
    }
  );
}

function atualizarDadosCompra(compra) {
  compra.parcelasPagas = compra.parcelas.filter(function (parcela) {
    return parcela.status === "paga";
  }).length;
  compra.parcelasRestantes =
    compra.quantidadeParcelas - compra.parcelasPagas;
  compra.saldoEmAberto = compra.parcelas.reduce(function (total, parcela) {
    return parcela.status === "paga" ? total : total + parcela.valor;
  }, 0);
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

  const parcelasDoMes = comprasAtivas.flatMap(function (compra) {
    return compra.parcelas.filter(function (parcela) {
      const vencimento = converterTextoEmData(parcela.vencimento);

      return (
        parcela.status !== "paga" &&
        vencimento !== null &&
        vencimento.getMonth() === mesEmExibicao.getMonth() &&
        vencimento.getFullYear() === mesEmExibicao.getFullYear()
      );
    });
  });

  const totalDoMes = parcelasDoMes.reduce(function (total, parcela) {
    return total + parcela.valor;
  }, 0);

  const totalEmAberto = comprasAtivas.reduce(function (total, compra) {
    return total + compra.saldoEmAberto;
  }, 0);

  quantidadeCompras.textContent = comprasAtivas.length;
  compromissoMensal.textContent = formatarMoeda(totalDoMes);
  quantidadeParcelasMes.textContent =
    parcelasDoMes.length === 1
      ? "1 parcela pendente"
      : `${parcelasDoMes.length} parcelas pendentes`;

  const nomeDoMes = mesEmExibicao.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric"
  });
  mesSelecionado.textContent =
    nomeDoMes.charAt(0).toUpperCase() + nomeDoMes.slice(1);
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

function criarAgendaParcelas(compra) {
  const detalhes = document.createElement("details");
  detalhes.classList.add("agenda-parcelas");

  const titulo = document.createElement("summary");
  titulo.textContent = "Ver parcelas";

  const lista = document.createElement("div");
  lista.classList.add("parcelas-lista");

  compra.parcelas.forEach(function (parcela) {
    const item = document.createElement("div");
    item.classList.add("parcela-item");

    const numero = document.createElement("strong");
    numero.textContent = `Parcela ${parcela.numero}/${compra.quantidadeParcelas}`;

    const vencimento = document.createElement("span");
    vencimento.textContent = parcela.vencimento;

    const valor = document.createElement("span");
    valor.textContent = formatarMoeda(parcela.valor);

    const status = document.createElement("span");
    status.classList.add("parcela-status", `status-${parcela.status}`);
    status.textContent =
      parcela.status.charAt(0).toUpperCase() + parcela.status.slice(1);

    let acao;

    if (parcela.status === "paga") {
      acao = document.createElement("div");
      acao.classList.add("parcela-acao");

      const pagamento = document.createElement("span");
      pagamento.classList.add("parcela-pagamento");
      pagamento.textContent = parcela.dataPagamento
        ? `Paga em ${parcela.dataPagamento}`
        : "Pagamento informado";

      const botaoDesfazer = document.createElement("button");
      botaoDesfazer.classList.add("botao-desfazer");
      botaoDesfazer.type = "button";
      botaoDesfazer.dataset.compraId = compra.id;
      botaoDesfazer.dataset.parcelaNumero = parcela.numero;
      botaoDesfazer.textContent = "Desfazer";
      botaoDesfazer.setAttribute(
        "aria-label",
        `Desfazer pagamento da parcela ${parcela.numero} de ${compra.descricao}`
      );

      acao.append(pagamento, botaoDesfazer);
    } else {
      acao = document.createElement("button");
      acao.classList.add("botao-pagar");
      acao.type = "button";
      acao.dataset.compraId = compra.id;
      acao.dataset.parcelaNumero = parcela.numero;
      acao.textContent = "Marcar como paga";
      acao.setAttribute(
        "aria-label",
        `Marcar parcela ${parcela.numero} de ${compra.descricao} como paga`
      );
    }

    item.append(numero, vencimento, valor, status, acao);
    lista.append(item);
  });

  detalhes.append(titulo, lista);

  return detalhes;
}

function mostrarCompras(compraAbertaId = null) {
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

    const agendaParcelas = criarAgendaParcelas(compra);

    if (compra.id === compraAbertaId) {
      agendaParcelas.open = true;
    }

    item.append(
      identificacao,
      saldoAberto,
      dataCompra,
      primeiroVencimento,
      ultimoVencimento,
      botaoExcluir,
      agendaParcelas
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

botaoTema.addEventListener("click", function () {
  const novoTema = document.body.classList.contains("tema-claro")
    ? "escuro"
    : "claro";

  aplicarTema(novoTema);
  salvarTema(novoTema);
});

campoPrimeiroVencimento.addEventListener("input", function (evento) {
  formatarCampoData(evento);
  atualizarPrevia();
});

botaoMesAnterior.addEventListener("click", function () {
  mesEmExibicao.setMonth(mesEmExibicao.getMonth() - 1);
  atualizarResumo();
});

botaoProximoMes.addEventListener("click", function () {
  mesEmExibicao.setMonth(mesEmExibicao.getMonth() + 1);
  atualizarResumo();
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

listaCompras.addEventListener("click", function (evento) {
  const botaoDesfazer = evento.target.closest(".botao-desfazer");

  if (!botaoDesfazer) {
    return;
  }

  const compra = compras.find(function (item) {
    return item.id === Number(botaoDesfazer.dataset.compraId);
  });

  if (!compra) {
    return;
  }

  const parcela = compra.parcelas.find(function (item) {
    return item.numero === Number(botaoDesfazer.dataset.parcelaNumero);
  });

  if (!parcela || parcela.status !== "paga") {
    return;
  }

  const vencimento = converterTextoEmData(parcela.vencimento);
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  parcela.status = vencimento && vencimento < hoje ? "atrasada" : "pendente";
  parcela.dataPagamento = null;
  atualizarDadosCompra(compra);

  salvarCompras();
  mostrarCompras(compra.id);
  atualizarResumo();
});

listaCompras.addEventListener("click", function (evento) {
  const botaoPagar = evento.target.closest(".botao-pagar");

  if (!botaoPagar) {
    return;
  }

  const compra = compras.find(function (item) {
    return item.id === Number(botaoPagar.dataset.compraId);
  });

  if (!compra) {
    return;
  }

  const parcela = compra.parcelas.find(function (item) {
    return item.numero === Number(botaoPagar.dataset.parcelaNumero);
  });

  if (!parcela || parcela.status === "paga") {
    return;
  }

  parcela.status = "paga";
  parcela.dataPagamento = new Date().toLocaleDateString("pt-BR");
  atualizarDadosCompra(compra);

  salvarCompras();
  mostrarCompras(compra.id);
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

  compra.parcelas = gerarParcelas(compra);
  atualizarDadosCompra(compra);

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
