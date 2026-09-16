# Mudanças e refatoração

## Referência da atividade

O material de Wagner Johnatan propõe separar código, testes, documentação,
recursos e configuração; definir entradas; usar Git; refatorar com IA e
validar que o programa continua funcionando. A avaliação da página 18 é
individual, vale 1,0 ponto e indica entrega em 17/09, sem ano no slide.

## Antes e depois

| Problema original                                  | Alteração                                                            |
| -------------------------------------------------- | -------------------------------------------------------------------- |
| Pastas repetidas e código sob `squads/squad-F`     | Raiz única `squad-f`                                                 |
| Fotos dentro de `styles`                           | `assets/images/equipe`                                               |
| Home e outras páginas com referências inexistentes | Entrada `index.html` e caminhos públicos corrigidos                  |
| Cabeçalhos e rodapés divergentes                   | Módulo compartilhado `main.js`                                       |
| Repetição de cores, menus e cartões em oito CSS    | `base.css`, `layout.css`, `components.css` e estilos específicos     |
| Habilidades sem fechamento de `main`               | HTML corrigido e formatado                                           |
| Páginas sem viewport e menu sem adaptação móvel    | Viewport em todas as páginas e menu móvel acessível                  |
| Marca alternando entre Portfólio e Squad F         | Identidade visual Squad F                                            |
| Nomes genéricos na página Sobre                    | Nomes e funções alinhados com a home original                        |
| Conteúdo de clientes sem comprovação               | Identificação de demonstração acadêmica                              |
| Contato com endereço de exemplo                    | Preparação e cópia de mensagem, com aviso explícito de que não envia |
| Sem chat                                           | Interface e backend com integração Google Gemini                     |
| Sem testes ou documentação                         | Suítes Node/Playwright, README e documentação                        |

## O que é refatoração nesta entrega

Separação de arquivos, extração de estilos comuns, navegação compartilhada,
padronização de nomes e formatação. São mudanças de organização para reduzir
duplicação e facilitar manutenção.

Correções de caminhos e marcação HTML são correções de bugs. O novo design,
o comportamento do contato e o chat são mudanças de interface/funcionalidade;
não são apresentados como refatoração que preserva o comportamento.

## IA e revisão

A assistência de IA foi usada para analisar, implementar e testar. A revisão
incluiu contratos da API, limites de histórico, tratamento de falhas, leitura
de segredos apenas no servidor e renderização segura de mensagens como texto.
Um teste reproduziu a rejeição incorreta de histórico grande antes do ajuste
do limite de corpo para 256 KB. Foram inspecionadas telas de home e chat.

Após configurar a chave, foram feitas chamadas reais para verificar a integração.
O provedor retornou HTTP 429 por falta de créditos e não gerou respostas.
O detalhe está em [teste-real-chat.md](teste-real-chat.md). As suítes automatizadas
continuam sem chamadas pagas e verificam o comportamento com respostas controladas.

## Histórico

O commit original permite comparar o resultado com o código recebido. As
mudanças seguintes foram registradas por etapa, com mais de dez commits reais.
O plano temporário de implementação foi removido a pedido do usuário; esta
documentação registra o resultado final, não tarefas pendentes de execução.
