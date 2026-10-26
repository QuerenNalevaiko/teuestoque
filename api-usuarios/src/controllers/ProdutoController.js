const ProdutoModel = require("../models/ProdutoModel");
const { sucesso, erro } = require("../utils/respostas");

function idValido(id) {
  return /^\d+$/.test(id) && Number(id) > 0;
}

function quantidadeValida(quantidade) {
  return Number.isInteger(quantidade) && quantidade >= 0;
}

class ProdutoController {
  static async listar(req, res) {
    try {
      return sucesso(
        res,
        200,
        "Produtos listados com sucesso",
        await ProdutoModel.listarTodos(),
      );
    } catch (error) {
      console.error("Erro ao listar produtos:", error);
      return erro(res, 500, "Erro ao listar produtos");
    }
  }

  static async criar(req, res) {
    const { nome, quantidade = 0 } = req.body || {};
    if (typeof nome !== "string" || nome.trim() === "") {
      return erro(res, 400, "O nome do produto é obrigatório");
    }
    if (!quantidadeValida(quantidade)) {
      return erro(res, 400, "A quantidade deve ser um número inteiro maior ou igual a zero");
    }

    try {
      const produto = await ProdutoModel.criar({
        nome: nome.trim(),
        quantidade,
      });
      return sucesso(res, 201, "Produto cadastrado com sucesso", produto);
    } catch (error) {
      console.error("Erro ao cadastrar produto:", error);
      return erro(res, 500, "Erro ao cadastrar produto");
    }
  }

  static async movimentar(req, res, tipo) {
    const { id } = req.params;
    const { quantidade } = req.body || {};

    if (!idValido(id)) {
      return erro(res, 400, "ID do produto inválido");
    }
    if (!Number.isInteger(quantidade) || quantidade <= 0) {
      return erro(res, 400, "A quantidade deve ser um número inteiro positivo");
    }

    try {
      const produto = await ProdutoModel.movimentar(Number(id), quantidade, tipo);
      if (!produto) {
        return erro(
          res,
          tipo === "venda" ? 409 : 404,
          tipo === "venda"
            ? "A quantidade da venda é maior que o estoque disponível"
            : "Produto não encontrado",
        );
      }
      return sucesso(
        res,
        200,
        tipo === "entrada"
          ? "Entrada registrada com sucesso"
          : "Venda registrada com sucesso",
        produto,
      );
    } catch (error) {
      console.error(`Erro ao registrar ${tipo}:`, error);
      return erro(res, 500, `Erro ao registrar ${tipo}`);
    }
  }
}

module.exports = ProdutoController;
