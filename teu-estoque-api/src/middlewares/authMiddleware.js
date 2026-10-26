const jwt = require("jsonwebtoken");
const { erro } = require("../utils/respostas");

function autenticar(req, res, next) {
  const cabecalho = req.headers.authorization;

  if (!cabecalho || !cabecalho.startsWith("Bearer ")) {
    return erro(res, 401, "Token de autenticação não informado");
  }

  const token = cabecalho.slice("Bearer ".length).trim();

  if (!token) {
    return erro(res, 401, "Token de autenticação não informado");
  }

  try {
    req.usuario = jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch (error) {
    return erro(res, 401, "Token de autenticação inválido ou expirado");
  }
}

module.exports = autenticar;
