"use strict";

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { responderPergunta } = require("./assistente-estoque");

const app = express();

const origensPadraoExpo = [
  "http://localhost:8081",
  "http://127.0.0.1:8081",
  "http://localhost:19006",
  "http://127.0.0.1:19006",
];

const origensConfiguradas = (process.env.CORS_ORIGENS || "")
  .split(",")
  .map((origem) => origem.trim())
  .filter(Boolean);

const origensPermitidas = new Set([
  ...origensPadraoExpo,
  ...origensConfiguradas,
]);

app.use(
  cors({
    origin(origem, callback) {
      // Permite clientes sem Origin, como curl e outros servidores.
      if (
        !origem ||
        origensPermitidas.has("*") ||
        origensPermitidas.has(origem)
      ) {
        return callback(null, true);
      }

      // Para uma origem não permitida, não envia autorização CORS.
      return callback(null, false);
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
    optionsSuccessStatus: 204,
  }),
);

app.use(express.json({ limit: "64kb" }));

function respostaErro(res, status, mensagem) {
  return res.status(status).json({
    sucesso: false,
    mensagem,
    dados: null,
  });
}

// GET /saude
app.get("/saude", (_req, res) => {
  return res.status(200).json({ status: "OK" });
});

// POST /perguntar
app.post("/perguntar", async (req, res) => {
  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
    return respostaErro(
      res,
      400,
      'Envie um corpo JSON com a propriedade "pergunta".',
    );
  }

  const perguntaRecebida = req.body.pergunta;

  if (
    typeof perguntaRecebida !== "string" ||
    perguntaRecebida.trim().length === 0
  ) {
    return respostaErro(res, 400, "A pergunta não pode estar vazia.");
  }

  if (perguntaRecebida.length > 500) {
    return respostaErro(
      res,
      400,
      "A pergunta deve ter no máximo 500 caracteres.",
    );
  }

  // O campo recomendado é "estoque".
  // "dadosEstoque" também é aceito como alternativa.
  const estoque = req.body.estoque ?? req.body.dadosEstoque ?? {};

  if (typeof estoque !== "object" || estoque === null) {
    return respostaErro(
      res,
      400,
      'A propriedade "estoque" deve ser um objeto ou uma lista de produtos.',
    );
  }

  try {
    const resultado = await responderPergunta({
      pergunta: perguntaRecebida.trim(),
      estoque,
    });

    return res.status(200).json({
      sucesso: true,
      mensagem: "Resposta gerada com sucesso.",
      dados: {
        resposta: resultado.resposta,
        tokens: resultado.tokens,
      },
    });
  } catch (erro) {
    const codigo = Number(erro.statusCode || erro.status || erro.code);

    const detalhes = `${erro.name || ""} ${erro.message || ""}`;

    // Não envia detalhes internos do provedor nem a chave ao aplicativo.
    console.error("[Teu Estoque IA] Falha ao consultar o serviço Gemini.", {
      nome: erro.name || "Erro",
      codigo: Number.isFinite(codigo) ? codigo : undefined,
    });

    if (codigo === 503 && erro.message === "GEMINI_API_KEY não configurada.") {
      return respostaErro(
        res,
        503,
        "O serviço de IA ainda não está configurado. Defina GEMINI_API_KEY no ambiente da API.",
      );
    }

    if (
      codigo === 429 ||
      /RESOURCE_EXHAUSTED|RATE_LIMIT|QUOTA_EXCEEDED|too many requests|rate limit/i.test(
        detalhes,
      )
    ) {
      return respostaErro(
        res,
        429,
        "O limite de uso da IA foi atingido. Aguarde e tente novamente ou confira as cotas da Gemini API.",
      );
    }

    if (
      /API key not valid|API_KEY_INVALID|UNAUTHENTICATED|PERMISSION_DENIED/i.test(
        detalhes,
      )
    ) {
      return respostaErro(
        res,
        502,
        "A autenticação com a Gemini API falhou. Confira GEMINI_API_KEY e as permissões da chave.",
      );
    }

    return respostaErro(
      res,
      502,
      "Não foi possível obter uma resposta do serviço Gemini. Tente novamente mais tarde.",
    );
  }
});

// Resposta JSON para rotas inexistentes.
app.use((_req, res) => {
  return respostaErro(res, 404, "Rota não encontrada.");
});

// Tratamento de erros do Express e do parser JSON.
app.use((erro, _req, res, _next) => {
  if (
    erro instanceof SyntaxError &&
    erro.status === 400 &&
    Object.prototype.hasOwnProperty.call(erro, "body")
  ) {
    return respostaErro(
      res,
      400,
      "O corpo da requisição não contém um JSON válido.",
    );
  }

  if (erro && erro.type === "entity.too.large") {
    return respostaErro(
      res,
      413,
      "O corpo da requisição é grande demais. Reduza os dados enviados.",
    );
  }

  console.error("[Teu Estoque IA] Erro interno na API.", {
    nome: erro && erro.name ? erro.name : "Erro",
  });

  return respostaErro(res, 500, "Ocorreu um erro interno na API.");
});

// Na Vercel, a aplicação é exportada e executada pela plataforma.
// Localmente, inicia o servidor na porta 3001 ou em process.env.PORT.
if (require.main === module) {
  const porta = Number(process.env.PORT) || 3001;

  app.listen(porta, () => {
    console.log(`API Teu Estoque disponível em http://localhost:${porta}`);
  });
}

module.exports = app;
