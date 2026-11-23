/**
 * KA BRAND — Google Apps Script para guardar a LISTA VIP e os PEDIDOS
 * em uma planilha do Google (abas separadas).
 *
 * Passo a passo no LEIAME.md, seção "Planilha".
 * Não coloque senhas nem chaves secretas aqui nem no site.
 */

var ABAS = {
  vip: {
    nome: "Lista VIP",
    colunas: ["data", "nome", "whatsapp", "email", "interesses", "tamanho", "consentimento", "origem"]
  },
  pedido: {
    nome: "Pedidos",
    colunas: ["data", "pedido", "nome", "whatsapp", "email", "entrega", "endereco", "itens", "total", "obs", "status"]
  }
};

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var dados = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    var tipo = dados.tipo === "pedido" ? "pedido" : "vip";
    var cfg = ABAS[tipo];
    var aba = pegarAba(cfg);
    if (tipo === "pedido" && !dados.status) dados.status = "aguardando confirmação";
    if (!dados.data) dados.data = new Date().toISOString();
    var linha = cfg.colunas.map(function (c) { return limpar(dados[c]); });
    aba.appendRow(linha);
    return resposta({ ok: true });
  } catch (err) {
    return resposta({ ok: false });
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  return resposta({ ok: true, msg: "KA Brand: planilha conectada ✦" });
}

function pegarAba(cfg) {
  var planilha = SpreadsheetApp.getActiveSpreadsheet();
  var aba = planilha.getSheetByName(cfg.nome);
  if (!aba) {
    aba = planilha.insertSheet(cfg.nome);
    aba.appendRow(cfg.colunas);
    aba.setFrozenRows(1);
  }
  return aba;
}

// Evita que um texto começando com = + - @ vire fórmula na planilha.
function limpar(v) {
  var s = v == null ? "" : String(v).slice(0, 2000);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function resposta(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
