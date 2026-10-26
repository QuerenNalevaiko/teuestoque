const pool = require("../config/database");

const COLUNAS = "id, nome, quantidade, data_criacao, data_alteracao";

class ProdutoModel {
  static async listarTodos() {
    const result = await pool.query(
      `SELECT ${COLUNAS} FROM produtos ORDER BY nome ASC`,
    );
    return result.rows;
  }

  static async criar({ nome, quantidade }) {
    const result = await pool.query(
      `INSERT INTO produtos (nome, quantidade)
       VALUES ($1, $2)
       RETURNING ${COLUNAS}`,
      [nome, quantidade],
    );
    return result.rows[0];
  }

  static async movimentar(id, quantidade, tipo) {
    const operador = tipo === "entrada" ? "+" : "-";
    const condicao =
      tipo === "entrada" ? "" : "AND quantidade >= $2";
    const result = await pool.query(
      `UPDATE produtos
       SET quantidade = quantidade ${operador} $2,
           data_alteracao = CURRENT_TIMESTAMP
       WHERE id = $1 ${condicao}
       RETURNING ${COLUNAS}`,
      [id, quantidade],
    );
    return result.rows[0] || null;
  }
}

module.exports = ProdutoModel;
