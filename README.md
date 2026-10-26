# Teu Estoque

## O que o app faz

O Teu Estoque é um aplicativo Expo/React Native para apoiar o controle de
usuários e de estoque.

As funcionalidades implementadas incluem:

- cadastro de usuário com nome, sobrenome, e-mail, usuário e senha;
- login com e-mail e senha;
- autenticação por token JWT;
- listagem, edição e exclusão de usuários;
- cadastro de produtos;
- consulta dos produtos cadastrados;
- registro de entradas e vendas de produtos;
- aviso de estoque baixo quando a quantidade do produto fica abaixo de 10;
- consulta opcional a um assistente de IA para organização e análise do
  estoque.

O token fica somente na memória do estado do React. Ao sair, ao expirar a
sessão ou ao recarregar/fechar o aplicativo, o token é apagado e é necessário
fazer login novamente.

Se o usuário excluir a própria conta enquanto está autenticado, o aplicativo
também apaga o token e retorna automaticamente à tela de login. A exclusão de
outro usuário mantém a sessão atual e retorna à lista de usuários.

O assistente de IA não substitui as operações do aplicativo: ele apenas
analisa os dados enviados na pergunta.

## Como instalar e rodar

### api-usuarios

Requisitos confirmados pelo projeto:

- Windows;
- Node.js e npm;
- PostgreSQL;
- acesso ao comando `psql` para executar o script do banco.

O endereço remoto do repositório não foi fornecido. Substitua o marcador abaixo
pela URL real antes de clonar:

```powershell
git clone [SUBSTITUIR_PELO_ENDERECO_DO_REPOSITORIO]
cd teuestoque
```

No PowerShell, entre na pasta da API:

```powershell
cd "C:\caminho\para\teuestoque\api-usuarios"
```

Crie o banco `app_usuarios` e a tabela `usuarios` executando o script:

```powershell
psql -U postgres -f banco.sql
```

O arquivo [banco.sql](./api-usuarios/banco.sql) cria o banco
`app_usuarios`, conecta-se a ele e cria a tabela `usuarios` com e-mail e
usuário únicos.

Copie o arquivo `.env.exemplo` para `.env` e substitua os valores pelos dados
da sua instalação:

```powershell
Copy-Item .env.exemplo .env
```

O arquivo `.env.exemplo` contém estes nomes de variáveis:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=app_usuarios
DB_USER=postgres
DB_PASSWORD=COLOQUE_A_SENHA_DO_POSTGRES
JWT_SECRET=COLOQUE_UMA_CHAVE_LONGA_E_ALEATORIA
NODE_ENV=development
```

Instale as dependências e inicie a API:

```powershell
npm install
npm start
```

A API local fica em `http://localhost:3000`. A rota de saúde é
`GET http://localhost:3000/saude`.

As rotas protegidas de estoque ficam em `/api/produtos`: `GET` e `POST` na
rota base, além de `POST /api/produtos/:id/entrada` e
`POST /api/produtos/:id/venda`. Todas exigem `Authorization: Bearer <token>`.
O banco impede saldo negativo e a venda acima do estoque disponível retorna
erro HTTP `409`.

Nunca publique o arquivo `.env`, a senha do PostgreSQL, o `JWT_SECRET`, senhas
de usuários ou qualquer outra chave. O `.gitignore` da API já ignora `.env`.

### app

Em outro terminal do PowerShell, entre na pasta do aplicativo:

```powershell
cd "C:\caminho\para\teuestoque\app"
npm install
npx expo start --web
```

Depois abra o endereço web mostrado pelo Expo, normalmente
`http://localhost:8081`.

O aplicativo usa `http://localhost:3000` como URL local da API no arquivo
[app/servicos/api.js](./app/servicos/api.js). Para executar o app em um celular
com Expo Go, substitua essa URL pelo IP do computador na rede local.

A URL da API de IA pode ser alterada com a variável Expo
`EXPO_PUBLIC_API_IA_URL`. Sem essa variável, o app usa
`http://localhost:3001` durante o desenvolvimento.

### api-ia

Em um terceiro terminal do PowerShell, entre na pasta da API de IA:

```powershell
cd "C:\caminho\para\teuestoque\api-ia"
Copy-Item .env.exemplo .env
```

Abra o `.env` e preencha `GEMINI_API_KEY` com a chave local da API Gemini.
Também é possível ajustar `GEMINI_MODELO`; o valor configurado no exemplo é:

```env
GEMINI_MODELO=gemini-3.5-flash-lite
```

Instale as dependências e inicie a API:

```powershell
npm install
npm start
```

Por padrão, a API de IA local usa a porta `3001` e disponibiliza:

```text
http://localhost:3001/saude
POST http://localhost:3001/perguntar
```

Nunca publique `GEMINI_API_KEY` nem qualquer outro segredo. A chave deve ficar
somente no `.env` da API de IA; ela não deve ser colocada no aplicativo Expo,
no código-fonte ou no repositório.

## A api-ia on-line

O endereço de produção real da API de IA não está presente nos arquivos
fornecidos e não foi confirmado neste documento.

**Substitua este marcador pelo endereço HTTPS real publicado:**

```text
[SUBSTITUIR_PELO_ENDERECO_REAL_DA_API_IA]
```

O endpoint de produção deverá ser:

```text
POST [SUBSTITUIR_PELO_ENDERECO_REAL_DA_API_IA]/perguntar
Content-Type: application/json
```

Exemplo de pedido com JSON válido, usando somente dados fictícios:

```http
POST [SUBSTITUIR_PELO_ENDERECO_REAL_DA_API_IA]/perguntar
Content-Type: application/json

{
  "pergunta": "Quais produtos estão abaixo do estoque mínimo?",
  "estoque": [
    {
      "nome": "Caderno universitário",
      "quantidade": 3,
      "estoqueMinimo": 5
    },
    {
      "nome": "Caneta azul",
      "quantidade": 20,
      "estoqueMinimo": 10
    }
  ]
}
```

O serviço de IA configurado é a **Gemini API**, usando o SDK
`@google/genai`. O modelo configurado em [api-ia/.env.exemplo](./api-ia/.env.exemplo)
é `gemini-3.5-flash-lite`. O próprio arquivo de exemplo o identifica como um
modelo estável documentado na data da configuração; por isso ele foi escolhido
para o assistente. A disponibilidade do modelo também depende da chave e da
conta usadas.

O assistente:

- orienta sobre organização e análise do estoque;
- usa somente os dados de estoque recebidos na requisição;
- compara quantidade atual com estoque mínimo quando esses dados são enviados;
- informa quando os dados são insuficientes;
- não inventa quantidades, produtos, preços, vendas ou entradas;
- não realiza vendas;
- não registra entradas ou saídas;
- não altera quantidades no estoque.

Os arquivos relacionados à segurança e à integração são:

- [app/App.js](./app/App.js): guarda o token JWT somente no estado em memória e
  o apaga ao sair, ao expirar a sessão ou ao excluir a própria conta;
- [app/servicos/api.js](./app/servicos/api.js): envia o token nas requisições
  protegidas e não o grava em armazenamento persistente;
- [api-usuarios/src/controllers/UsuarioController.js](./api-usuarios/src/controllers/UsuarioController.js):
  usa `bcryptjs` para gerar o hash das senhas antes de salvá-las;
- [api-ia/assistente-estoque.js](./api-ia/assistente-estoque.js): lê
  `GEMINI_API_KEY` e `GEMINI_MODELO` do ambiente;
- [api-ia/assistente-estoque.js](./api-ia/assistente-estoque.js): contém a
  constante `INSTRUCAO_SISTEMA`, que define a finalidade e os limites do
  assistente.

Para executar os testes documentados da API de usuários, mantenha a API
rodando e abra [api-usuarios/teste.http](./api-usuarios/teste.http) no
VS Code com uma extensão de cliente REST, como REST Client. Execute as
requisições na ordem indicada no arquivo: saúde, cadastro, login, consultas
protegidas, alteração e exclusão.

Para executar os testes documentados da API de IA, mantenha a API de IA
rodando e abra [api-ia/teste.http](./api-ia/teste.http) no VS Code. O arquivo
contém pedidos para saúde, pergunta respondível, dados insuficientes, pergunta
vazia e pergunta acima do limite de caracteres.

Para abrir o aplicativo no navegador, execute:

```powershell
cd "C:\caminho\para\teuestoque\app"
npx expo start --web
```

## Onde está

O projeto está organizado nestas pastas:

- [app/](./app/): aplicativo Expo/React Native e interface web;
- [api-usuarios/](./api-usuarios/): API de usuários, autenticação JWT
  e acesso ao PostgreSQL;
- [api-ia/](./api-ia/): API do assistente de análise de estoque integrada à
  Gemini API.

Os principais arquivos de execução são:

- [app/App.js](./app/App.js): fluxo das telas e estado da sessão;
- [app/servicos/api.js](./app/servicos/api.js): chamadas HTTP do aplicativo;
- [api-usuarios/server.js](./api-usuarios/server.js): servidor da API de
  usuários;
- [api-ia/servidor.js](./api-ia/servidor.js): servidor da API de IA;
- [api-ia/assistente-estoque.js](./api-ia/assistente-estoque.js): integração
  com o modelo e instrução de sistema.
