# Prompts usados no desenvolvimento

Este arquivo registra solicitações reais usadas durante o desenvolvimento do
projeto. Nenhuma senha, chave de API ou outro segredo é incluído.

## 1. Correção dos imports do Expo

Foi solicitado investigar o erro do Metro:

```text
Unable to resolve "./app/telas/TelaLogin" from "App.js"
```

Resultado: os imports de `App.js` foram corrigidos de `./app/telas/...` para
`./telas/...`, porque `App.js` já está dentro da pasta `app`.

## 2. Diagnóstico do cadastro de usuário

Foi solicitado identificar por que o cadastro da Maria Silva mostrava apenas
“erro ao cadastrar usuário”.

Resultado: a API retornou erro de autenticação SCRAM do PostgreSQL porque a
senha do banco não estava configurada como string válida no ambiente. O
README passou a documentar a configuração do `.env` sem publicar credenciais.

## 3. Documentação

Foi solicitado escrever o README completo do projeto usando somente
informações confirmadas nos arquivos e nos testes realizados.

Resultado: foi criado o `README.md` com instalação, banco, APIs, app, testes,
integração Gemini e marcadores explícitos para informações ainda não
confirmadas, como endereço de produção.

## 4. Validação e usabilidade

Foi solicitado executar o roteiro de finalização, garantir a usabilidade das
APIs e preservar segredos.

Resultado: as APIs foram verificadas por sintaxe e pelas rotas locais de
saúde; a API de usuários foi consultada com login inválido e respondeu `401`,
e a API de IA rejeitou pergunta vazia com `400`. O arquivo `.env.exemplo` da
API de usuários foi sanitizado.

## 5. Funcionalidades de estoque e assistente

Foi solicitado completar as superfícies usadas pelo app, sem criar testes ou
publicações fictícias.

Resultado: foram adicionadas as rotas persistentes de produtos, entradas e
vendas na API de usuários, com validação para impedir estoque negativo, e
uma interface de consulta à API de IA no app. A URL da API de IA permanece
configurável por `EXPO_PUBLIC_API_IA_URL`, usando `localhost:3001` por padrão.
