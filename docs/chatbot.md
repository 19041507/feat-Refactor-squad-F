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

| Situação                                                    | Modelo padrão           | Limite de saída |
| ----------------------------------------------------------- | ----------------------- | --------------- |
| Saudações isoladas e definições simples reconhecidas        | `gemini-2.5-flash-lite` | 160 tokens      |
| Pedidos gerais, código e perguntas que dependem do contexto | `gemini-2.5-flash`      | 360 tokens      |
| Mais detalhes solicitados                                   | `gemini-2.5-flash`      | 800 tokens      |

A escolha usa regras locais, sem consulta extra à IA. É uma heurística
conservadora: pedidos não reconhecidos como simples usam o modelo principal.
As variáveis estão no `.env.example`. Use uma chave Gemini em `GEMINI_API_KEY`.
Os modelos aceitos são os dois da tabela;
a configuração valida esses nomes para garantir compatibilidade com os limites.

## Controle de consumo

- Raciocínio adicional desativado com `thinkingBudget: 0` nos dois modelos.
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

O outro modelo configurado é a alternativa automática. `GEMINI_FALLBACK_MODEL`
permite escolher uma alternativa específica. Modelos repetidos são deduplicados.

Erros de rede, timeout, HTTP 408, 429 temporário, 5xx e indisponibilidade/acesso
ao modelo (404) permitem uma única alternativa. O prazo total de
`AI_TIMEOUT_MS` é compartilhado entre as tentativas.

Chave inválida, falta de permissão (403), requisição inválida e cota diária ou
zero informada em QuotaFailure encerram a chamada sem alternativa. RetryInfo e
Retry-After são respeitados quando cabem no prazo total; caso contrário, o
chat informa o limite sem tentar novamente. Bloqueios de segurança retornam
uma recusa legível, sem tentar contorná-los com outro modelo.

O fallback não garante acesso quando a cota do projeto acabou. Uma tentativa que atingiu timeout pode
ter sido processada pelo provedor; duas tentativas podem aumentar o consumo.
Os detalhes internos dos erros e a chave não são enviados ao navegador.

## Testar

- `npm run check`: testes isolados, sem créditos ou chamadas externas.
- `npm run test:live`: integração real, com até três cenários e relatório local
  de modelos, duração, tokens reportados e respostas; para no primeiro erro.

Documentação consultada: [Gemini generateContent](https://ai.google.dev/api/generate-content) e
[controle de raciocínio](https://ai.google.dev/gemini-api/docs/thinking).
