# Fê — chatbot do Squad F

## Personalidade e respostas

Fê conversa em português brasileiro, com tom de colega: descontraído, direto
e prestativo, sem forçar gírias, elogios ou emojis. Não se apresenta em cada
turno nem encerra toda resposta oferecendo ajuda. Faz uma pergunta curta
quando falta contexto essencial e não inventa dados do portfólio.

O padrão é **Direto ao ponto**. O usuário pode selecionar **Com mais detalhes**
ou pedir aprofundamento no texto. Pedidos como “sem detalhes”, “resuma” e
“em uma frase” têm prioridade para manter o orçamento curto.

As instruções de estilo são orientações ao modelo, não garantias matemáticas
de tom ou número de palavras. O limite de saída em tokens é imposto na API.

## Escolha de modelo

| Situação                                                    | Modelo padrão  | Limite de saída |
| ----------------------------------------------------------- | -------------- | --------------- |
| Saudações isoladas e definições simples reconhecidas        | `gpt-4o-mini`  | 160 tokens      |
| Pedidos gerais, código e perguntas que dependem do contexto | `gpt-4.1-mini` | 360 tokens      |
| Mais detalhes solicitados                                   | `gpt-4.1-mini` | 800 tokens      |

A escolha usa regras locais, sem consulta extra à IA. É uma heurística
conservadora: pedidos não reconhecidos como simples usam o modelo principal.
As variáveis e valores configuráveis estão no `.env.example`. A chave existente
foi preservada. `OPENAI_MODEL` continua compatível com a configuração anterior.

## Controle de consumo

- Uma chamada em caso de sucesso; no máximo duas em caso de falha recuperável.
- Sem resposta intermediária de IA para classificar ou resumir o histórico.
- Até cinco pares recentes e 6.000 caracteres de mensagens no total, incluindo
  a pergunta atual. O histórico mais antigo sai primeiro. Respostas anteriores
  longas podem ser abreviadas com indicação explícita, preservando a pergunta atual.
- Saudações isoladas não enviam histórico desnecessário.
- Os 6.000 caracteres são um limite de entrada textual, **não uma contagem exata
  de tokens**; as instruções do sistema também usam tokens.
- Uma resposta útil interrompida pelo limite é apresentada com aviso, sem
  refazer a geração automaticamente e gastar outra chamada.
- O frontend bloqueia envio duplo; o servidor mantém limite de 20 chamadas/minuto/IP.

## Alternativa em caso de falha

O outro modelo configurado é a alternativa automática. `OPENAI_FALLBACK_MODEL`
permite escolher uma alternativa específica. Modelos repetidos são deduplicados.

Erros de rede, timeout, HTTP 408, 429 temporário, 5xx e indisponibilidade/acesso
ao modelo (403/404) permitem uma única alternativa. O prazo total de
`AI_TIMEOUT_MS` é compartilhado entre as tentativas.

Chave inválida, requisição inválida e falta de créditos/cota encerram a chamada
sem alternativa. A detecção considera tanto `error.code` quanto `error.type`,
incluindo `credit_balance_exhausted` e `insufficient_quota`.

O fallback não resolve falta de saldo. Uma tentativa que atingiu timeout pode
ter sido processada pelo provedor; duas tentativas podem aumentar o consumo.
Os detalhes internos dos erros e a chave não são enviados ao navegador.

## Testar

- `npm run check`: testes isolados, sem créditos ou chamadas externas.
- `npm run test:live`: integração real, com até três cenários e relatório local
  de modelos, duração, tokens reportados e respostas; para no primeiro erro.

Documentação consultada: [GPT-4o mini](https://developers.openai.com/api/docs/models/gpt-4o-mini),
[GPT-4.1 mini](https://developers.openai.com/api/docs/models/gpt-4.1-mini) e
[erros da API](https://developers.openai.com/api/docs/guides/error-codes).
