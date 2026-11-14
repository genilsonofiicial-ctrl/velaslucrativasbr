# Velaslucrativasbr

Crie um aplicativo web chamado "Stúdio Velas Lucrativas", em português do Brasil (pt-BR), para quem personaliza velas com estampas impressas em papel de seda.



STACK: React + Vite + TypeScript + Tailwind + shadcn/ui + React Router. Backend será Supabase (conectado no próximo passo). Sem outras bibliotecas pesadas.



DESIGN

- Mobile-first, responsivo, funciona bem em celular e computador.

- Paleta: vinho #4e0d1a (principal), vinho médio #7a1a2b, dourado #d4a94c, dourado claro #f0cf7a, creme #fff8ec (fundo), texto #2b1a1a.

- Títulos com a fonte Playfair Display, textos com Inter (Google Fonts).

- Botões principais dourados, arredondados, com bom contraste. Cartões brancos com sombra suave.

- Tom da interface: simples, acolhedor, para iniciantes. Textos curtos e sem jargão.



ROTAS (crie as telas com conteúdo de exemplo por enquanto)

- "/" Início: título, uma frase explicando o app, botão "Começar a criar" (vai para /estudio), 3 cartões (Calcule as medidas · Escolha a estampa · Baixe pronto para imprimir) e um aviso de segurança curto.

- "/estudio" Estúdio de criação (assistente em 4 etapas, será construído depois).

- "/biblioteca" Biblioteca de modelos.

- "/minhas-velas" Projetos salvos do usuário.

- "/guia" Guia da técnica e segurança.

- "/entrar" Login.

- "/admin" Área administrativa (restrita, será construída depois).

- Página 404 amigável.



NAVEGAÇÃO

- Cabeçalho com logo/nome, links (Estúdio, Biblioteca, Minhas velas, Guia) e botão Entrar/Sair.

- No celular, menu inferior fixo com 4 ícones (Estúdio, Biblioteca, Minhas velas, Guia).

- Rodapé com aviso: "Ferramenta de apoio. Os resultados dependem da sua impressora, do papel e da vela. Faça sempre um teste antes de produzir em quantidade."



Não implemente cálculos nem banco de dados ainda.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://velaslucrativasbr.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/c35c97ec-47c5-469c-b5e0-cc8c0d85bc15).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
