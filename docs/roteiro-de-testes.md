# Roteiro de testes e apresentação

## Verificação automatizada

Na pasta `squad-f`, execute `npm run check`. Em um novo ambiente, execute antes
`npm ci` e `npx playwright install chromium`.

As suítes cobrem:

- 40 testes Node: configuração, caminhos das nove páginas, API HTTP,
  proteção de arquivos privados, limites de uso, validação de histórico,
  extração da resposta da IA, recusa, timeout e erros do provedor.
- 32 cenários Chromium: navegação e recursos em 1440px e 390px, menu por
  teclado, chat, texto HTML inofensivo, contexto, nova conversa, falha
  recuperável, prevenção de envio duplo e preparação de contato.

Os testes usam portas locais e não chamam a OpenAI. Os testes de navegador
de sucesso substituem a resposta HTTP do chat; os testes Node verificam o
fluxo HTTP/controller/serviço, substituindo apenas a rede do provedor.

## Verificação manual com chave real

1. Preencher `OPENAI_API_KEY` no `.env` e reiniciar `npm start`.
2. Abrir http://127.0.0.1:3000/pages/chat.html.
3. Perguntar “O que é refatoração?” e conferir a resposta real.
4. Perguntar “Dê um exemplo disso em HTML” para verificar o contexto.
5. Usar Nova conversa e confirmar que o histórico desapareceu.
6. Se houver indisponibilidade, conferir chave, acesso ao modelo, saldo/cota
   e conexão. Não exibir o `.env` na apresentação nem publicá-lo no Git.

## Apresentação individual

1. Mostrar a árvore de pastas e explicar `src`, `assets`, `config`, `tests`
   e `docs`, relacionando com as páginas 3–11 do PDF.
2. Mostrar `git log --oneline --reverse` e a evolução em pequenos commits.
3. Comparar um arquivo original com sua versão final usando o diff do Git.
4. Explicar a diferença entre correção, refatoração, redesign e novo chat.
5. Demonstrar menu em tela pequena, páginas e formulário de contato.
6. Executar testes e demonstrar o chat com uma chave válida.
7. Explicar que o backend guarda a chave e o frontend recebe apenas a resposta.

## Limites da verificação

Chromium foi exercitado automaticamente; Firefox e Safari não foram testados.
A suite não certifica toda a acessibilidade nem a veracidade dos conteúdos
acadêmicos. A chamada com credencial real foi bloqueada por falta de créditos;
o resultado está em [teste-real-chat.md](teste-real-chat.md).
O workflow GitHub Actions foi preparado, mas ainda não executou no remoto.
