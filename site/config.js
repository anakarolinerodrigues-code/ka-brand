/* =====================================================================
   KA BRAND — CONFIGURAÇÃO DO SITE
   ---------------------------------------------------------------------
   Este é o ÚNICO arquivo que você precisa mexer para trocar contatos,
   data da pré-venda, peças do catálogo, frete e códigos de rastreamento.

   Regras simples:
   - Textos ficam entre aspas: "assim".
   - Números (preço, frete) ficam sem aspas: 129.90 (use ponto, não vírgula).
   - Preço ainda não definido: null  → o site mostra "Preço a definir".
   - Não apague as vírgulas no fim das linhas.
   ===================================================================== */

window.KA = {
  /* ---------- CONTATOS (TROQUE PELOS OFICIAIS) ---------- */
  // WhatsApp com 55 + DDD + número, só números. Ex.: 5595991234567
  whatsapp: "5595991723414",
  email: "anakarolinerodrigues1810@gmail.com",
  instagram: "kabrandrr", // sem o @
  cidade: "Boa Vista/RR",
  cnpj: "69.857.792/0001-11",
  dona: "Ana Karoline",

  /* ---------- PRÉ-VENDA ---------- */
  // Data e hora de abertura (formato AAAA-MM-DDTHH:MM:SS).
  // Deixe "" (vazio) para esconder a contagem regressiva.
  dataPreVenda: "2026-12-15T10:00:00",

  // Mensagem que abre no WhatsApp pelo botão flutuante.
  mensagemWhatsapp: "Oi, KA Brand! ✦ Vim pelo site e quero saber mais sobre a pré-venda.",

  /* ---------- ONDE OS DADOS SÃO GUARDADOS ---------- */
  // Cole aqui a URL do Google Apps Script (veja LEIAME.md, passo "Planilha").
  // Vazio = modo demonstração (os dados ficam só no navegador de quem preencheu).
  formEndpoint: "",

  /* ---------- CATÁLOGO ---------- */
  // true = mostra o aviso "peças de exemplo". Troque para false quando
  // colocar as peças reais.
  catalogoDeExemplo: true,

  // cat: "vestidos" | "conjuntos" | "shorts" | "blusas" | "acessorios"
  // foto: caminho da imagem, ex.: "fotos/vestido-marsala.webp" (vazio = desenho provisório)
  // preco: número (ex.: 159.90) ou null
  catalogo: [
    {
      id: "vestido-midi-marsala",
      cat: "vestidos",
      nome: "Vestido Midi Marsala",
      desc: "Caimento fluido, decote delicado e fenda lateral. Para chegar e ser lembrada.",
      preco: null,
      foto: "",
      tamanhos: ["P", "M", "G", "GG"]
    },
    {
      id: "vestido-curto-brilho",
      cat: "vestidos",
      nome: "Vestido Curto Brilho",
      desc: "Modelagem ajustada com toque acetinado. Feito para as noites que pedem brilho.",
      preco: null,
      foto: "",
      tamanhos: ["PP", "P", "M", "G"]
    },
    {
      id: "conjunto-alfaiataria-rosa",
      cat: "conjuntos",
      nome: "Conjunto Alfaiataria Rosa",
      desc: "Blazer cropped e calça de cintura alta. Elegância do trabalho ao happy hour.",
      preco: null,
      foto: "",
      tamanhos: ["P", "M", "G"]
    },
    {
      id: "conjunto-cropped-saia",
      cat: "conjuntos",
      nome: "Conjunto Cropped e Saia",
      desc: "Cropped de alça e saia midi no mesmo tom. Leve, feminino e fácil de usar.",
      preco: null,
      foto: "",
      tamanhos: ["PP", "P", "M", "G"]
    },
    {
      id: "short-alfaiataria",
      cat: "shorts",
      nome: "Short Alfaiataria",
      desc: "Cintura alta, pregas frontais e bolsos. Básico com cara de especial.",
      preco: null,
      foto: "",
      tamanhos: ["36", "38", "40", "42", "44"]
    },
    {
      id: "short-cintura-alta",
      cat: "shorts",
      nome: "Short Cintura Alta",
      desc: "Modela bem e combina com tudo. Seu curinga para os dias quentes de Roraima.",
      preco: null,
      foto: "",
      tamanhos: ["36", "38", "40", "42"]
    },
    {
      id: "blusa-ombro-a-ombro",
      cat: "blusas",
      nome: "Blusa Ombro a Ombro",
      desc: "Mangas bufantes e elástico confortável. Romântica na medida certa.",
      preco: null,
      foto: "",
      tamanhos: ["P", "M", "G"]
    },
    {
      id: "blusa-cetim",
      cat: "blusas",
      nome: "Blusa de Cetim",
      desc: "Toque macio e brilho suave. Vai do jeans ao look de festa.",
      preco: null,
      foto: "",
      tamanhos: ["P", "M", "G", "GG"]
    }
  ],

  /* ---------- ENTREGA ---------- */
  // frete: número (ex.: 15) | 0 (grátis) | null (a loja informa pelo WhatsApp)
  // endereco: true = pede o endereço da cliente
  entregas: [
    { id: "boa-vista", nome: "Entrega em Boa Vista", info: "Motoboy, com dia combinado pelo WhatsApp.", frete: null, endereco: true },
    { id: "interior-rr", nome: "Interior de Roraima", info: "Envio por transportadora ou ônibus. Valor informado pela loja.", frete: null, endereco: true },
    { id: "brasil", nome: "Outros estados", info: "Envio pelos Correios. Valor e prazo informados pela loja.", frete: null, endereco: true },
    { id: "retirada", nome: "Retirada combinada", info: "Combinamos local e horário em Boa Vista.", frete: 0, endereco: false }
  ],

  /* ---------- RASTREAMENTO (OPCIONAL) ---------- */
  // Cole só o número do Pixel da Meta (ex.: "1234567890") e o ID do Google Analytics (ex.: "G-XXXXXXX").
  metaPixelId: "",
  googleAnalyticsId: ""
};
