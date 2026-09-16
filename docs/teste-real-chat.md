# Teste real do chatbot Gemini

A integração usa exclusivamente Google Gemini. Os testes automatizados usam
respostas controladas, sem chamadas externas.

Para verificar a geração real:

1. Preencha `GEMINI_API_KEY` no `.env`.
2. Execute `npm run test:live` dentro de `squad-f`.
3. Consulte o resultado em `test-results/chat-live.json`.

O comando executa até três cenários e para no primeiro erro. O relatório
registra modelo, status HTTP, duração e consumo informado pelo provedor,
sem registrar a chave. Uma execução com erro não comprova geração bem-sucedida.
