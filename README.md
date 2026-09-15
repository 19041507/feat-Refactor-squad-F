# Squad F

Portfólio acadêmico com oito páginas de apresentação e um chat com IA.
Projeto organizado a partir do Squad F da atividade de Organização de Código.

## Executar

Pré-requisito: **Node.js 22.15 ou superior**, com npm.
Abra esta pasta `squad-f` no VS Code e execute:

```powershell
npm install
npm start
```

Abra **http://127.0.0.1:3000**. Para reinício automático ao editar JavaScript,
use `npm run dev`. Encerre com `Ctrl+C`.

O site é servido pelo Node. Abrir o HTML por duplo clique ou por um servidor
que sirva a raiz inteira do repositório não executa o backend do chat.

## Ativar o chat: preencher a chave

Nesta cópia local, o `.env` já está criado. Preencha apenas:

```dotenv
OPENAI_API_KEY=sua_chave_da_openai
```

Salve e reinicie `npm start`. Em um novo clone, crie primeiro o arquivo:

```powershell
Copy-Item .env.example .env
```

No Linux/macOS: `cp .env.example .env`.

O provedor configurado é **OpenAI**, usando a Responses API. A chave precisa
estar válida e a conta precisa ter acesso e saldo/cota para usar o modelo.
Uma chave de outro provedor não funciona nesta integração.

| Variável         | Padrão         | Função                             |
| ---------------- | -------------- | ---------------------------------- |
| `OPENAI_API_KEY` | vazia          | Credencial usada apenas no backend |
| `OPENAI_MODEL`   | `gpt-4.1-mini` | Modelo da OpenAI                   |
| `PORT`           | `3000`         | Porta HTTP                         |
| `HOST`           | `127.0.0.1`    | Endereço local do servidor         |
| `AI_TIMEOUT_MS`  | `30000`        | Tempo máximo da chamada de IA      |

O `.env` está ignorado pelo Git e não é servido ao navegador. Variáveis
definidas no terminal prevalecem sobre o `.env`. O site funciona sem chave;
nesse caso o chat informa indisponibilidade, sem gerar respostas fictícias.

## Testes e formatação

```powershell
npm ci
npx playwright install chromium
npm run check
```

| Comando                | Verificação                                        |
| ---------------------- | -------------------------------------------------- |
| `npm test`             | Configuração, API, serviço de IA e caminhos locais |
| `npm run test:e2e`     | Navegador Chromium em desktop e celular            |
| `npm run test:all`     | As duas suítes de testes                           |
| `npm run format`       | Formata os arquivos com Prettier                   |
| `npm run format:check` | Confere a formatação sem alterar arquivos          |
| `npm run check`        | Formatação e todos os testes                       |

Os testes não usam sua chave nem consomem a API real. Apenas o serviço externo
é substituído por respostas controladas. Há também um teste real do backend
sem chave. O Playwright usa a porta 3107 e encerra o servidor ao terminar.

O workflow `.github/workflows/tests.yml` executará as verificações em pushes
e pull requests quando você publicar o repositório no GitHub com Actions ativo.

## Organização

```text
squad-f/
├── src/
│   ├── frontend/
│   │   ├── index.html
│   │   ├── pages/
│   │   ├── styles/           # base, layout, componentes e páginas
│   │   └── scripts/          # navegação, contato e chat
│   └── backend/
│       ├── app.js
│       ├── server.js
│       ├── routes/
│       ├── controllers/
│       └── services/
├── assets/images/equipe/
├── config/env.js
├── data/metadata.json
├── tests/                    # integração e e2e
├── docs/
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

Tecnologias: HTML5, CSS3, JavaScript, Node.js, Express, OpenAI Responses API,
Node Test Runner, Playwright e Prettier. Não há etapa de build ou banco de dados.

## Comportamentos e limites

- O chat aceita 2.000 caracteres por mensagem e envia os últimos cinco pares
  de pergunta/resposta como contexto. Nova conversa e recarregamento limpam
  o histórico; não há armazenamento em banco ou no navegador.
- São permitidas 20 requisições ao chat por minuto por IP, por processo.
- Mensagens são enviadas à OpenAI com `store: false`. Isso não equivale a uma
  garantia de retenção zero pelo provedor.
- A aplicação foi preparada para execução local e apresentação acadêmica.
  Publicação aberta exige planejar autenticação e limites globais de uso.
- O formulário de contato **prepara e copia texto**. Não envia e-mail e não
  armazena dados. Um canal real de contato não foi informado.
- Conteúdos acadêmicos de projetos, depoimentos e estudo de caso foram
  preservados e identificados como demonstração. Confirme-os antes de divulgar
  como trabalhos reais. Os metadados de origem ficam em `data/metadata.json`.

## Histórico e repositório

Remote: https://github.com/19041507/feat-Refactor-squad-F.git

Branch do trabalho: `feat/estrutura-chat-testes`. Os commits são locais;
nenhum push foi realizado. Não é necessário tornar o repositório público.

```powershell
git log --oneline --reverse
git status
git remote -v
```

Como o repositório é privado e não foi possível buscar seu histórico, esta
cópia foi iniciada a partir dos arquivos locais. Antes do primeiro push,
autentique-se e consulte o remoto com `git fetch origin`. Não use push forçado.
Se já existir histórico remoto, preserve ambos ao integrar as branches; esta
branch pode ser publicada separadamente para revisão.

O primeiro snapshot registra o trabalho automatizado como Codex. Os commits
seguintes usam o nome e e-mail informados por Daniel.

## Documentação

- [Arquitetura](docs/arquitetura.md)
- [Mudanças e refatoração](docs/refatoracao.md)
- [Roteiro de testes e apresentação](docs/roteiro-de-testes.md)

Integração baseada na [documentação de geração de texto da OpenAI](https://developers.openai.com/api/docs/guides/text)
e na [documentação do GPT-4.1 mini](https://developers.openai.com/api/docs/models/gpt-4.1-mini).
