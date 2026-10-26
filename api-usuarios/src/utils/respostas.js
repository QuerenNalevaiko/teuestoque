// Utilitário central de respostas no formato { sucesso, mensagem, dados }

function sucesso(res, status, mensagem, dados = null) {
  return res.status(status).json({
    sucesso: true,
    mensagem,
    dados,
  });
}

function erro(res, status, mensagem, dados = null) {
  return res.status(status).json({
    sucesso: false,
    mensagem,
    dados,
  });
}

module.exports = { sucesso, erro };
