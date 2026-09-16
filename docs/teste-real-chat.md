# Teste real do chatbot Gemini

A integração usa exclusivamente Google Gemini. Os testes automatizados usam
respostas controladas, sem chamadas externas.

Para verificar a geração real:

1. Preencha `GEMINI_API_KEY` no `.env`.
2. Execute `npm run test:live` dentro de `squad-f`.
3. Consulte o resultado em `test-results/chat-live.json`.

O comando executa até quatro cenários e para no primeiro erro. O relatório
registra modelo, status HTTP, duração e consumo informado pelo provedor,
sem registrar a chave. Uma execução com erro não comprova geração bem-sucedida.

## Validação após atualização dos modelos

Os três cenários reais retornaram HTTP 200 e término STOP: saudação, orientação
curta e explicação com contexto. O Flash-Lite respondeu aos três. Nas duas
últimas perguntas, a tentativa com Flash excedeu o prazo e a alternativa
Flash-Lite entregou respostas completas. Isso valida o fallback, mas não garante
que o Flash conclua todas as perguntas dentro do prazo atual.

A primeira execução revelou corte de texto porque o raciocínio do Flash
compartilha o limite de geração. Foi adicionada uma reserva limitada de 2.048
tokens para esse modelo, mantendo a orientação de respostas curtas.

Validação automatizada: 49 testes Node e 32 testes de navegador aprovados.
