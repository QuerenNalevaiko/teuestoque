// ============================================================
// app/servicos/api.js
// Servico central do Teu Estoque.
//
// TODAS as chamadas de API do aplicativo (usuarios e estoque)
// passam por este arquivo. Nenhuma tela usa fetch diretamente.
//
// Regras atendidas aqui:
// - A URL da API local e uma constante no inicio do arquivo.
// - O token JWT e enviado como "Authorization: Bearer <token>"
//   em todas as rotas protegidas.
// - O token NUNCA e gravado em disco/armazenamento (so memoria).
// - Em HTTP 401 numa rota protegida, o erro recebe a marca
//   "sessaoExpirada" para o App limpar o token e voltar ao login.
// - As mensagens reais devolvidas pela API sao repassadas as telas.
// ============================================================

// ------------------------------------------------------------
// URL DA API LOCAL (troque aqui se necessario)
// - Rodando o app no navegador da mesma maquina da API:
//   http://localhost:3000 funciona.
// - Rodando no celular pelo Expo Go, use o IP do computador,
//   por exemplo: http://192.168.0.15:3000
// ------------------------------------------------------------
export const URL_BASE = 'http://localhost:3000';

// ------------------------------------------------------------
// Limite de "estoque baixo": produtos com quantidade MENOR que
// este valor recebem o aviso de estoque baixo.
// ------------------------------------------------------------
export const LIMITE_ESTOQUE_BAIXO = 10;

// ------------------------------------------------------------
// Caminhos da API de USUARIOS (conforme o testes.http)
// ------------------------------------------------------------
const CAMINHOS_USUARIOS = {
  cadastrar: '/api/usuarios/cadastrar',
  login: '/api/usuarios/login',
  base: '/api/usuarios',
  porId: (id) => `/api/usuarios/${id}`,
};

// ------------------------------------------------------------
// Caminhos da API de ESTOQUE.
//
// ATENCAO: o testes.http enviado documenta SOMENTE as rotas de
// usuarios. As rotas de estoque abaixo seguem o padrao mais comum
// dessa API (produtos em /api/produtos e movimentacoes por POST).
// Se a sua API de estoque usa outros caminhos, ajuste APENAS este
// bloco (e, se necessario, o metodo POST/PUT nas funcoes abaixo) —
// nenhuma tela precisa mudar.
// ------------------------------------------------------------
const CAMINHOS_ESTOQUE = {
  produtos: '/api/produtos',
  entrada: (idProduto) => `/api/produtos/${idProduto}/entrada`,
  venda: (idProduto) => `/api/produtos/${idProduto}/venda`,
};

// ------------------------------------------------------------
// Funcoes internas
// ------------------------------------------------------------

// Cria um objeto de erro com mensagem amigavel e dados extras.
function criarErro(mensagem, status, propriedadesExtras = {}) {
  const erro = new Error(mensagem);
  erro.status = status;
  erro.mensagem = mensagem;
  Object.assign(erro, propriedadesExtras);
  return erro;
}

// Nucleo de todas as requisicoes.
// rotaProtegida = true -> envia o token e trata 401 como sessao expirada.
async function pedir(caminho, metodo = 'GET', corpo = undefined, token = null, rotaProtegida = false) {
  const cabecalhos = { 'Content-Type': 'application/json' };
  if (token) {
    cabecalhos.Authorization = `Bearer ${token}`;
  }

  let resposta;
  try {
    resposta = await fetch(URL_BASE + caminho, {
      method: metodo,
      headers: cabecalhos,
      body: corpo === undefined ? undefined : JSON.stringify(corpo),
    });
  } catch (falhaDeConexao) {
    throw criarErro(
      `Nao foi possivel conectar a API em ${URL_BASE}. Verifique se a API esta rodando.`,
      0,
      { semConexao: true }
    );
  }

  // Le o corpo JSON (se existir) uma unica vez.
  let conteudo = null;
  try {
    conteudo = await resposta.json();
  } catch (falhaAoLerJson) {
    conteudo = null;
  }

  const mensagemDaApi =
    (conteudo && (conteudo.mensagem || conteudo.message || conteudo.erro || conteudo.error)) || '';

  // 401 em rota protegida: token ausente, invalido ou expirado.
  if (resposta.status === 401 && rotaProtegida) {
    throw criarErro('Sua sessão expirou, entre de novo', 401, { sessaoExpirada: true });
  }

  // Falha HTTP ou envelope { sucesso: false } com status 200.
  const falhou = !resposta.ok || (conteudo && conteudo.sucesso === false);
  if (falhou) {
    throw criarErro(
      mensagemDaApi || `A API respondeu com o status ${resposta.status}.`,
      resposta.status
    );
  }

  return conteudo;
}

// ------------------------------------------------------------
// Auxiliar usado pelas telas: as respostas da API costumam vir no
// formato { sucesso, mensagem, dados }. extrairDados devolve o
// conteudo de "dados" quando ele existe, ou o proprio corpo
// (tolera formatos ligeiramente diferentes sem quebrar).
// ------------------------------------------------------------
export function extrairDados(corpo) {
  if (corpo && typeof corpo === 'object' && Object.prototype.hasOwnProperty.call(corpo, 'dados')) {
    return corpo.dados;
  }
  return corpo;
}

// ------------------------------------------------------------
// API de USUARIOS
// ------------------------------------------------------------

// 0) GET /saude
export async function verificarSaude() {
  return pedir('/saude', 'GET');
}

// 1) POST /api/usuarios/cadastrar (publica)
export async function cadastrarUsuario({ nome, sobrenome, email, usuario, senha }) {
  return pedir(CAMINHOS_USUARIOS.cadastrar, 'POST', { nome, sobrenome, email, usuario, senha });
}

// 2) POST /api/usuarios/login (publica) -> { token, usuario }
export async function entrar({ email, senha }) {
  return pedir(CAMINHOS_USUARIOS.login, 'POST', { email, senha });
}

// 4) GET /api/usuarios (protegida)
export async function listarUsuarios(token) {
  return pedir(CAMINHOS_USUARIOS.base, 'GET', undefined, token, true);
}

// 5) GET /api/usuarios/:id (protegida)
export async function buscarUsuario(id, token) {
  return pedir(CAMINHOS_USUARIOS.porId(id), 'GET', undefined, token, true);
}

// 6) PUT /api/usuarios/:id (protegida) - envie apenas os campos alterados
export async function alterarUsuario(id, campos, token) {
  return pedir(CAMINHOS_USUARIOS.porId(id), 'PUT', campos, token, true);
}

// 7) DELETE /api/usuarios/:id (protegida)
export async function excluirUsuario(id, token) {
  return pedir(CAMINHOS_USUARIOS.porId(id), 'DELETE', undefined, token, true);
}

// ------------------------------------------------------------
// API de ESTOQUE (rotas protegidas: exigem login)
// ------------------------------------------------------------

// GET /api/produtos
export async function listarProdutos(token) {
  return pedir(CAMINHOS_ESTOQUE.produtos, 'GET', undefined, token, true);
}

// POST /api/produtos - corpo { nome, quantidade }
export async function cadastrarProduto(produto, token) {
  return pedir(CAMINHOS_ESTOQUE.produtos, 'POST', produto, token, true);
}

// POST /api/produtos/:id/entrada - corpo { quantidade }
export async function registrarEntrada(idProduto, quantidade, token) {
  return pedir(CAMINHOS_ESTOQUE.entrada(idProduto), 'POST', { quantidade }, token, true);
}

// POST /api/produtos/:id/venda - corpo { quantidade }
export async function registrarVenda(idProduto, quantidade, token) {
  return pedir(CAMINHOS_ESTOQUE.venda(idProduto), 'POST', { quantidade }, token, true);
}

// Regra central do aviso de estoque baixo (usada pelo ModuloEstoque).
export function estaComEstoqueBaixo(quantidade) {
  return Number(quantidade) < LIMITE_ESTOQUE_BAIXO;
}
