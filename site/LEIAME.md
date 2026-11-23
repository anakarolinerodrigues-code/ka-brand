# KA Brand: guia do site ✦

Este é o site de pré-venda da KA Brand. Ele é feito só de arquivos simples (HTML, CSS e JavaScript): não precisa instalar nada e não tem mensalidade de sistema.

## O que tem em cada arquivo

| Arquivo | Para que serve |
|---|---|
| `config.js` | **O único que você precisa mexer**: WhatsApp, e-mail, data da pré-venda, peças, preços, frete e códigos de rastreamento |
| `index.html` | A página principal |
| `legal.html` | Trocas, privacidade (LGPD) e termos da pré-venda (**modelos**: peça revisão de um advogado ou contador) |
| `styles.css` | Cores, fontes e visual |
| `script.js` | Entrada animada, contagem regressiva, lista VIP, pop-up |
| `shop.js` | Catálogo, sacola, entrega e pedido pelo WhatsApp |
| `serve.ps1` | Abre o site no seu computador (Windows) |

## 1. Trocar os dados de exemplo (faça primeiro)

Abra `config.js` em um editor de texto (Bloco de Notas serve; o VS Code é melhor) e troque:

1. `whatsapp`: 55 + DDD + número, só números. Ex.: `"5595991234567"`.
2. `email`: o e-mail oficial da loja.
3. `dataPreVenda`: data de abertura, ex.: `"2026-12-15T10:00:00"`. Deixe `""` para esconder a contagem.
4. `catalogo`: as peças. Para cada uma:
   - `nome` e `desc` (descrição curta);
   - `preco`: número com ponto, ex.: `149.90`, ou `null` para "Preço a definir";
   - `foto`: ex.: `"fotos/vestido-marsala.webp"` (crie a pasta `fotos/` ao lado do `index.html`);
   - `tamanhos`: ex.: `["P", "M", "G"]`;
   - `cat`: `"vestidos"`, `"conjuntos"`, `"shorts"`, `"blusas"` ou `"acessorios"`.
5. Quando as peças forem reais, troque `catalogoDeExemplo: true` para `false`.
6. `entregas`: o `frete` de cada região (número, `0` para grátis ou `null` para "informado pela loja").

**Fotos:** use fotos suas, em pé (formato 3:4), com cerca de 800 px de largura, salvas em WebP (pode converter grátis em squoosh.app). Nunca use fotos de outras lojas ou de banco de imagem.

Os textos com a etiqueta **editável** no site são exemplos: troque ou confirme antes de divulgar.

## 2. Ver o site no seu computador

- **Windows:** clique com o botão direito em `serve.ps1` > **Executar com PowerShell**. O navegador abre em http://localhost:8080.
- Ou dê dois cliques em `index.html` (precisa de internet para as fontes).
- Para ver como fica no celular: no Chrome, aperte `F12` e clique no ícone de celular.

## 3. Notion: onde chegam a lista VIP e os pedidos

No seu Notion já existe a página **KA Brand · Site**, com duas tabelas: **Pedidos** e **Lista VIP**. O site grava nelas sozinho, desde que três coisas estejam ligadas (só uma vez):

**a) Criar a chave do Notion**
1. Entre em notion.so/profile/integrations e clique em **Nova integração**.
2. Nome: `Site KA Brand`. Workspace: o seu. Tipo: **Interna**. Salve.
3. Copie a **Chave secreta interna** (começa com `ntn_`). Não mande essa chave para ninguém, nem cole no site ou no chat.

**b) Dar acesso à página**
1. Abra a página **KA Brand · Site** no Notion.
2. Clique nos **três pontinhos (•••)**, no canto de cima → **Conexões** → procure `Site KA Brand` → **Confirmar**.

**c) Publicar no Netlify ligado ao GitHub** (veja a seção 6) e colocar a chave lá:
1. No Netlify, abra o site → **Site configuration → Environment variables → Add a variable**.
2. Key: `NOTION_TOKEN`. Value: cole a chave do passo (a). Salve.
3. Vá em **Deploys → Trigger deploy → Deploy site**.

Teste: entre na lista VIP e faça um pedido no site publicado. Em poucos segundos aparecem as linhas no Notion. Os pedidos chegam com status **Aguardando confirmação**: troque o status ali mesmo conforme avança (Confirmado, Pago, Enviado, Entregue).

**Não renomeie nem apague as colunas das tabelas**: o site usa esses nomes. Pode criar colunas novas à vontade.

## 4. Como funciona um pedido

1. A cliente escolhe as peças, o tamanho e a entrega, e preenche os dados.
2. O site gera um número (ex.: `KA7F3QXM`), guarda uma cópia e manda para o Notion.
3. Aparece o botão **Enviar pedido pelo WhatsApp** com a mensagem pronta.
4. **Você** confirma estoque, frete e total e manda o Pix. Nada é cobrado pelo site.

## 5. Pixel da Meta e Google Analytics (opcional)

Cole só os códigos em `config.js`: `metaPixelId: "1234567890"` e `googleAnalyticsId: "G-XXXXXXX"`. O site já avisa quando alguém entra na lista (`Lead`), coloca na sacola (`AddToCart`) e faz pedido (`Purchase`).

## 6. Colocar no ar (grátis, ligado ao GitHub)

Para gravar no Notion, o site precisa ser publicado pelo GitHub (o "arrastar a pasta" do Netlify Drop não leva a ponte com o Notion).

1. Crie uma conta grátis em netlify.com, entrando com o GitHub.
2. Clique em **Add new site → Import an existing project → GitHub** e escolha o repositório **ka-brand**.
3. Em **Branch to deploy**, escolha o ramo com o site (hoje: `claude/ka-brand-site-continuation-eccb6r`). O resto o Netlify lê sozinho do arquivo `netlify.toml`. Clique em **Deploy**.
4. Faça o passo **3c** (a chave do Notion).
5. Pronto: o endereço `algumacoisa.netlify.app` abre para qualquer pessoa. Em **Domain management** dá para trocar o nome ou ligar um domínio próprio (`kabrand.com.br`, comprado no registro.br). O cadeado (HTTPS) é automático.

Cada mudança salva no GitHub é publicada sozinha em cerca de 1 minuto.

## Limites que você precisa saber

- O pedido **não confirma pagamento nem estoque**: ele organiza a mensagem do WhatsApp e guarda uma cópia.
- Sem a ligação com o Notion (seção 3), contatos e pedidos ficam só no aparelho da cliente.
- Preço `null` aparece como "Preço a definir" e o total como "confirmado pela loja".
- Confirme CNPJ e textos legais antes de divulgar.
