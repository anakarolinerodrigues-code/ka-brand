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
| `apps-script.gs` | Código para colar no Google Planilhas e guardar contatos e pedidos |
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

## 3. Planilha (para não perder nenhum contato ou pedido)

Sem isso, os cadastros e pedidos ficam **só no celular de quem preencheu**. Configure antes de divulgar:

1. Entre em sheets.google.com e crie uma planilha em branco chamada "KA Brand – Site".
2. No menu, clique em **Extensões > Apps Script**.
3. Apague o que estiver lá, abra o arquivo `apps-script.gs`, copie tudo e cole. Clique no disquete (Salvar).
4. Clique em **Implantar > Nova implantação**. Na engrenagem, escolha **App da Web**.
   - Executar como: **Eu**
   - Quem pode acessar: **Qualquer pessoa**
5. Clique em **Implantar**, autorize com sua conta Google (pode aparecer "app não verificado": clique em *Avançado > Acessar*; o app é seu).
6. Copie a **URL do app da Web** (termina com `/exec`).
7. Cole em `config.js`, em `formEndpoint: "COLE_AQUI"`.
8. Teste: entre na lista VIP e faça um pedido no site. Vão aparecer as abas **Lista VIP** e **Pedidos** na planilha.

Se mudar o código do Apps Script depois, faça **Implantar > Gerenciar implantações > Editar > Nova versão** (a URL continua a mesma).

## 4. Como funciona um pedido

1. A cliente escolhe as peças, o tamanho e a entrega, e preenche os dados.
2. O site gera um número (ex.: `KA7F3QXM`), guarda uma cópia e manda para a planilha.
3. Aparece o botão **Enviar pedido pelo WhatsApp** com a mensagem pronta.
4. **Você** confirma estoque, frete e total e manda o Pix. Nada é cobrado pelo site.

## 5. Pixel da Meta e Google Analytics (opcional)

Cole só os códigos em `config.js`: `metaPixelId: "1234567890"` e `googleAnalyticsId: "G-XXXXXXX"`. O site já avisa quando alguém entra na lista (`Lead`), coloca na sacola (`AddToCart`) e faz pedido (`Purchase`).

## 6. Colocar no ar (grátis)

1. Entre em app.netlify.com/drop.
2. Arraste a pasta `site` inteira para a página.
3. Pronto: o Netlify dá um endereço `algumacoisa.netlify.app`. Crie uma conta para guardar o site e trocar o nome.
4. Domínio próprio (`kabrand.com.br`): compre em registro.br e, no Netlify, vá em **Domain settings > Add domain** e siga as instruções de DNS. O cadeado (HTTPS) é automático.

Ao atualizar algum arquivo, arraste a pasta de novo (em **Deploys**). Se o navegador mostrar a versão antiga, troque o `?v=1` por `?v=2` no `index.html`.

## Limites que você precisa saber

- O pedido **não confirma pagamento nem estoque**: ele organiza a mensagem do WhatsApp e guarda uma cópia.
- Sem a planilha, contatos e pedidos ficam só no aparelho da cliente.
- Preço `null` aparece como "Preço a definir" e o total como "confirmado pela loja".
- Confirme CNPJ e textos legais antes de divulgar.
