const pool = require("../config/database");

// Colunas retornadas nas consultas (nunca inclui a senha)
const COLUNAS_SEM_SENHA =
  "id, nome, sobrenome, email, usuario, ativo, data_criacao, data_alteracao";

class UsuarioModel {
  static async listarTodos() {
    try {
      const query = `SELECT ${COLUNAS_SEM_SENHA} FROM usuarios ORDER BY data_criacao DESC`;
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      throw new Error(`Erro ao listar usuários: ${error.message}`);
    }
  }

  static async buscarPorId(id) {
    try {
      const query = `SELECT ${COLUNAS_SEM_SENHA} FROM usuarios WHERE id = $1`;
      const result = await pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Erro ao buscar usuário por ID: ${error.message}`);
    }
  }

  static async buscarPorEmail(email) {
    try {
      const query = `SELECT ${COLUNAS_SEM_SENHA} FROM usuarios WHERE email = $1`;
      const result = await pool.query(query, [email]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Erro ao buscar usuário por email: ${error.message}`);
    }
  }

  static async buscarPorEmailComSenha(email) {
    try {
      const query =
        "SELECT id, nome, sobrenome, email, usuario, senha, ativo, data_criacao, data_alteracao FROM usuarios WHERE email = $1";
      const result = await pool.query(query, [email]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Erro ao buscar usuário por email: ${error.message}`);
    }
  }

  static async buscarPorUsuario(usuario) {
    try {
      const query = `SELECT ${COLUNAS_SEM_SENHA} FROM usuarios WHERE usuario = $1`;
      const result = await pool.query(query, [usuario]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Erro ao buscar usuário por login: ${error.message}`);
    }
  }

  static async criar({ nome, sobrenome, email, usuario, senha }) {
    try {
      const query = `
                INSERT INTO usuarios (nome, sobrenome, email, usuario, senha)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING ${COLUNAS_SEM_SENHA}
            `;
      const values = [nome, sobrenome, email, usuario, senha];
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      if (error.code === "23505") {
        error.mensagemAmigavel = "Email ou usuário já cadastrado";
      } else {
        error.mensagemAmigavel = `Erro ao criar usuário: ${error.message}`;
      }
      throw error;
    }
  }

  static async atualizar(id, dados) {
    try {
      const { nome, sobrenome, email, usuario, senha, ativo } = dados;
      const query = `
                UPDATE usuarios
                SET nome = COALESCE($1, nome),
                    sobrenome = COALESCE($2, sobrenome),
                    email = COALESCE($3, email),
                    usuario = COALESCE($4, usuario),
                    senha = COALESCE($5, senha),
                    ativo = COALESCE($6, ativo),
                    data_alteracao = CURRENT_TIMESTAMP
                WHERE id = $7
                RETURNING ${COLUNAS_SEM_SENHA}
            `;
      const values = [nome, sobrenome, email, usuario, senha, ativo, id];
      const result = await pool.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      if (error.code === "23505") {
        error.mensagemAmigavel =
          "Email ou usuário já cadastrado por outra conta";
      } else {
        error.mensagemAmigavel = `Erro ao atualizar usuário: ${error.message}`;
      }
      throw error;
    }
  }

  static async deletar(id) {
    try {
      const query = "DELETE FROM usuarios WHERE id = $1 RETURNING id";
      const result = await pool.query(query, [id]);
      return result.rowCount > 0;
    } catch (error) {
      throw new Error(`Erro ao deletar usuário: ${error.message}`);
    }
  }
}

module.exports = UsuarioModel;
