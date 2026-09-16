# Migração para Gemini

A integração atual usa Google Gemini. Os testes automatizados usam respostas
controladas, sem chamadas externas. A geração real com Gemini ainda depende
de preencher `GEMINI_API_KEY` no `.env` e executar `npm run test:live`.

O registro abaixo é histórico da integração OpenAI anterior; não descreve a
cota nem o funcionamento da conta Gemini.

# Teste real do chatbot — 15/09/2026

Foi utilizada a credencial fornecida no `.env`, sem exibir seu conteúdo.

## Resultado observado

| Chamada                                 | Modelo         | Resultado                                             |
| --------------------------------------- | -------------- | ----------------------------------------------------- |
| Saudação curta                          | `gpt-4o-mini`  | HTTP 429, sem resposta gerada                         |
| Alternativa automática                  | `gpt-4.1-mini` | HTTP 429, sem resposta gerada                         |
| Diagnóstico mínimo, limite de 16 tokens | `gpt-4o-mini`  | `credit_balance_exhausted`, tipo `insufficient_quota` |

O teste completo foi interrompido no primeiro cenário. As chamadas não
retornaram dados de uso; não foi possível medir tokens de respostas reais,
avaliar a personalidade gerada ou comprovar qualidade entre modelos.

## Ajuste decorrente do teste

O provedor retornou um código específico de saldo esgotado junto com o tipo
genérico de falta de cota. O tratamento foi corrigido para reconhecer ambos
os campos e encerrar imediatamente nesses casos, sem tentar outro modelo.
O formato observado está coberto por teste de regressão local.

## Para repetir

Regularize os créditos/cota da conta associada à chave e execute
`npm run test:live`. O comando usa a API real e pode consumir créditos.
Nenhum novo teste real foi executado após confirmar o saldo esgotado.

Os testes automatizados de roteamento, orçamentos, fallback e interface são
independentes desse bloqueio e usam respostas externas controladas.
