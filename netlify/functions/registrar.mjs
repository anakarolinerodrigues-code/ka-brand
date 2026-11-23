/* =====================================================================
   KA BRAND — PONTE SITE → NOTION (função do Netlify)
   Recebe a lista VIP e os pedidos do site e grava nas tabelas do Notion.
   A chave do Notion fica SÓ no Netlify (variável NOTION_TOKEN), nunca no site.
   ===================================================================== */

const NOTION_VERSION = "2022-06-28";
// IDs das tabelas no Notion (não são segredo). Podem ser trocados por variáveis no Netlify.
const DB_PEDIDOS = process.env.NOTION_DB_PEDIDOS || "4213c4de7fc681f4b4fcdcafd30a0057";
const DB_VIP = process.env.NOTION_DB_VIP || "4213c4de7fc68145bdbfe9329b976b32";

const INTERESSES = ["Vestidos", "Conjuntos", "Shorts", "Blusas", "Acessórios"];
const TAMANHOS = ["PP", "P", "M", "G", "GG"];

const txt = (v, max = 1900) => String(v == null ? "" : v).trim().slice(0, max);
const digits = (v) => String(v || "").replace(/\D/g, "").slice(0, 13);
const rich = (v) => { const t = txt(v); return t ? [{ type: "text", text: { content: t } }] : []; };
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
const phone = (v) => { const d = digits(v); return d ? "+" + (d.startsWith("55") ? d : "55" + d) : null; };
const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

export function montarPagina(d) {
  const agora = new Date().toISOString();
  if (d.tipo === "pedido") {
    const total = Number(d.total);
    const props = {
      Pedido: { title: rich(txt(d.pedido, 12) || "sem número") },
      Status: { select: { name: "Aguardando confirmação" } },
      Data: { date: { start: agora } },
      Nome: { rich_text: rich(txt(d.nome, 120)) },
      WhatsApp: { phone_number: phone(d.whatsapp) },
      "Peças": { rich_text: rich(d.itens) },
      Total: { number: Number.isFinite(total) && total > 0 ? Math.round(total * 100) / 100 : null },
      Entrega: { rich_text: rich(txt(d.entrega, 120)) },
      "Endereço": { rich_text: rich(txt(d.endereco, 400)) },
      "Observações": { rich_text: rich(txt(d.obs, 600)) }
    };
    const email = txt(d.email, 160);
    if (isEmail(email)) props["E-mail"] = { email };
    return { parent: { database_id: DB_PEDIDOS }, properties: props };
  }
  const interesses = txt(d.interesses, 200).split(",").map((s) => s.trim()).filter((s) => INTERESSES.includes(s));
  const props = {
    Nome: { title: rich(txt(d.nome, 120)) },
    Data: { date: { start: agora } },
    WhatsApp: { phone_number: phone(d.whatsapp) },
    Interesses: { multi_select: interesses.map((name) => ({ name })) },
    "Aceitou novidades": { checkbox: d.consentimento === "sim" }
  };
  const email = txt(d.email, 160);
  if (isEmail(email)) props["E-mail"] = { email };
  if (TAMANHOS.includes(d.tamanho)) props.Tamanho = { select: { name: d.tamanho } };
  return { parent: { database_id: DB_VIP }, properties: props };
}

export default async (req) => {
  if (req.method !== "POST") return json(405, { ok: false });
  if (!process.env.NOTION_TOKEN) return json(500, { ok: false, erro: "NOTION_TOKEN não configurado" });

  let d;
  try {
    const raw = await req.text();
    if (raw.length > 20000) return json(413, { ok: false });
    d = JSON.parse(raw);
  } catch (e) {
    return json(400, { ok: false });
  }
  if (!d || typeof d !== "object") return json(400, { ok: false });
  if (d.site) return json(200, { ok: true }); // campo-isca: robôs preenchem, pessoas não veem
  if (txt(d.nome).length < 2 || digits(d.whatsapp).length < 10) return json(400, { ok: false });
  if (d.tipo === "pedido" && !/^KA[A-Z0-9]{6}$/.test(txt(d.pedido))) return json(400, { ok: false });

  const r = await fetch("https://api.notion.com/v1/pages", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + process.env.NOTION_TOKEN,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(montarPagina(d))
  });
  if (!r.ok) {
    // Registra só o código do erro, nunca os dados da cliente.
    console.error("Notion respondeu", r.status);
    return json(502, { ok: false });
  }
  return json(200, { ok: true });
};
