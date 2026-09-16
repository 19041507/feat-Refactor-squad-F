# Arquitetura do Squad F

## Escopo aprovado

Organizar o projeto do Squad F conforme o material de Wagner Johnatan,
refatorar HTML/CSS, ajustar o design e acrescentar chat com IA e testes.
Manter as oito páginas e os conteúdos acadêmicos de origem; não inventar
integrantes, contatos ou resultados. A avaliação é individual.

## Estrutura e responsabilidades

- `src/frontend/index.html`: entrada do portfólio.
- `src/frontend/pages/`: oito páginas internas, incluindo o novo chat.
- `src/frontend/styles/`: base, layout, componentes e estilos específicos.
- `src/frontend/scripts/`: navegação compartilhada e interface do chat.
- `src/backend/app.js`: aplicação HTTP, arquivos públicos e tratamento de erros.
- `src/backend/server.js`: inicialização e encerramento do servidor.
- `src/backend/routes/`: endpoints HTTP.
- `src/backend/controllers/`: validação e coordenação das requisições.
- `src/backend/services/`: integração externa com IA.
- `assets/images/equipe/`: fotos originais.
- `config/env.js`: leitura e validação das variáveis de ambiente.
- `data/metadata.json`: metadados originais, a conferir pelo aluno.
- `tests/`: testes de integração e testes reais em Chromium.
- `docs/`: arquitetura, plano, mudanças e roteiro de testes.

## Decisões

HTML, CSS e JavaScript nativos no navegador; Node.js com Express no servidor.
Não é necessário framework de interface nem banco de dados neste escopo.
Cabeçalho e rodapé compartilhados por módulo JavaScript; conteúdo principal
continua em HTML, com navegação alternativa quando JavaScript estiver desativado.

O chat envia mensagens para `POST /api/chat`. O servidor valida conteúdo e
histórico antes de acessar a API generateContent do Google Gemini. A chave nunca vai para
o navegador. Modelo padrão: `gemini-3.6-flash`, configurável no `.env`.
Roteamento, personalidade e orçamento ficam em `services/chat-policy.js`;
veja [chatbot.md](chatbot.md) para limites e alternativas de modelo.
O histórico existe apenas na memória da página, limitado aos últimos turnos;
não há persistência local de conversas. O tratamento pelo provedor segue os
termos do Google Gemini e a modalidade da conta.

Apenas frontend e assets são públicos. Configuração, documentação, testes,
metadados e `.env` não são servidos. O servidor escuta em localhost por padrão.

## Critérios de aceitação

Todas as páginas e recursos locais acessíveis; navegação responsiva e por
teclado; chat com estados de envio, sucesso e falha; chave configurável sem
editar código; testes sem consumir a API real; commits por etapa e README.
Sem chave, o site continua funcionando e o chat informa indisponibilidade.

## Referências consultadas

- PDF fornecido: páginas 3–11 (organização), 12–16 (refatoração) e 18 (atividade).
- https://ai.google.dev/api/generate-content
- https://ai.google.dev/gemini-api/docs/models/gemini-3.6-flash
