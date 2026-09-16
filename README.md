# Squad F

Portfólio acadêmico de desenvolvimento web, design e gestão de projetos. Apresenta a equipe, seus projetos e serviços, com a **Fê**, assistente virtual que orienta os visitantes pelo portfólio.

## Equipe

| Integrante     | Função              |
| -------------- | ------------------- |
| Daniel Augusto | Front-end Lead      |
| Edson          | Back-end Developer  |
| Felipe         | Designer UI/UX      |
| Elisson        | Gerente de Projetos |

## Tecnologias

HTML, CSS e JavaScript no frontend; Node.js e Express no backend; Google Gemini no chat. Testes com Node Test Runner e Playwright, formatação com Prettier.

## Executar localmente

**Requisito:** Node.js 22.15 ou superior.

Na raiz do repositório:

```sh
npm ci
npm start
```

Acesse **http://127.0.0.1:3000**. Para reinício automático durante o desenvolvimento, use `npm run dev`.

### Configurar a Fê

Copie `.env.example` para `.env` e preencha sua chave do [Google AI Studio](https://aistudio.google.com/apikey):

```dotenv
GEMINI_API_KEY=sua_chave
```

Reinicie o servidor após alterar a configuração. A chave é usada somente no backend; o `.env` é ignorado pelo Git. Sem a chave, o portfólio funciona, mas o chat fica indisponível.

Os modelos e limites estão em [.env.example](.env.example). Consulte [a documentação da Fê](docs/chatbot.md) para entender seu comportamento e o controle de consumo.

## Estrutura

```text
src/frontend/   Páginas, estilos e scripts
src/backend/    Rotas, controllers e serviços
assets/         Imagens da equipe
config/         Configuração de ambiente
data/           Metadados do projeto
tests/          Testes de integração e navegador
docs/           Documentação técnica
```

## Testes

```sh
npx playwright install chromium
npm run check
```

O comando verifica a formatação e executa os testes de integração e navegador, sem chamadas à API real.

- `npm test`: testes de configuração, API e serviços.
- `npm run test:e2e`: testes de navegador em desktop e celular.
- `npm run test:live`: validação real do Gemini, com consumo da cota da chave configurada.
- `npm run format`: formatação dos arquivos.

## Escopo

Projetos, depoimentos e estudo de caso são demonstrações acadêmicas. O formulário de contato prepara uma mensagem para copiar; não envia e-mail.

## Documentação

- [Arquitetura](docs/arquitetura.md)
- [Assistente virtual Fê](docs/chatbot.md)
- [Roteiro de testes](docs/roteiro-de-testes.md)
