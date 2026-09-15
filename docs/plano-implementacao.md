# Plano de implementação — Squad F

**Objetivo:** entregar portfólio organizado e refatorado, com chat configurável
por `.env`, testes e histórico incremental, conforme arquitetura aprovada.

**Arquitetura:** frontend estático e backend Express no mesmo servidor.
Integração OpenAI isolada em serviço; testes substituem somente a rede externa.
**Tecnologias:** Node.js >=22.15, HTML, CSS, JavaScript, Express, Playwright.
**Especificação:** [arquitetura.md](arquitetura.md).

## 1. Base e organização

- [x] Registrar arquivos originais em commit antes da reorganização.
- [ ] Criar teste que exige entrada, folhas de estilo e links locais existentes.
- [ ] Executar `npm test` e observar falha antes de mover páginas.
- [ ] Mover páginas para `src/frontend`, fotos para `assets` e JSON para `data`.
- [ ] Corrigir referências, executar testes de navegação e fazer commit.

## 2. Backend e IA

- [ ] Testar HTTP real com porta temporária: sucesso, entrada inválida, chave
  ausente, erro do provedor, limite de corpo e arquivos privados.
- [ ] Testar serviço com respostas HTTP controladas: extrair texto de itens
  da Responses API, preservar contexto e tratar timeout, 401 e 429.
- [ ] Executar testes antes da implementação e confirmar falhas.
- [ ] Implementar `createApp({ config, fetchImpl })`, `createAiService(...)`
  e `readConfig(env)`; restringir o conteúdo público ao frontend e assets.
- [ ] Configurar `.env` vazio local e `.env.example`, testar e fazer commit.

## 3. Refatoração e design

- [ ] Testar navegação, recursos, menu móvel e interface do chat com Playwright.
- [ ] Extrair base/layout/componentes CSS e cabeçalho/rodapé compartilhados.
- [ ] Manter textos originais, corrigir semântica e identificar conteúdo de exemplo.
- [ ] Adicionar chat: histórico, carregamento, falha recuperável, limpar conversa,
  texto seguro e foco acessível; testar 390px e desktop; fazer commits por etapa.

## 4. Entrega

- [ ] Documentar execução, variáveis, testes, limitações e mudanças.
- [ ] Executar `npm run test:all` e inspecionar telas de home/chat.
- [ ] Revisar diff e ignorados; registrar resultado em docs e commit final.
- [ ] Manter histórico local; sincronizar remoto somente com acesso confirmado,
  sem sobrescrever histórico existente.
