const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const UsuarioModel = require("../models/UsuarioModel");
const { sucesso, erro } = require("../utils/respostas");

// Quantidade de rounds do bcrypt para criptografar a senha
const BCRYPT_ROUNDS = 10;
// Validade do token JWT
const JWT_EXPIRA_EM = "1h";

class UsuarioController {
  // POST /api/usuarios/cadastrar (pública)
  static async cadastrar(req, res) {
    try {
      const { nome, sobrenome, email, usuario, senha } = req.body;

      // Validações
      if (!nome || typeof nome !== "string" || nome.trim() === "") {
        return erro(res, 400, "O nome é obrigatório");
      }
      if (
        !sobrenome ||
        typeof sobrenome !== "string" ||
        sobrenome.trim() === ""
      ) {
        return erro(res, 400, "O sobrenome é obrigatório");
      }
      if (!email || typeof email !== "string" || email.trim() === "") {
        return erro(res, 400, "O email é obrigatório");
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        return erro(res, 400, "Email inválido");
      }
      if (!usuario || typeof usuario !== "string" || usuario.trim() === "") {
        return erro(res, 400, "O usuário (login) é obrigatório");
      }
      if (usuario.trim().length < 3) {
        return erro(
          res,
          400,
          "O usuário (login) deve ter no mínimo 3 caracteres",
        );
      }
      if (!senha || typeof senha !== "string" || senha.length < 6) {
        return erro(
          res,
          400,
          "A senha é obrigatória e deve ter no mínimo 6 caracteres",
        );
      }

      const emailNormalizado = email.trim().toLowerCase();
      const loginNormalizado = usuario.trim();

      // Verifica duplicidade de email e usuário (colunas únicas)
      const emailExiste = await UsuarioModel.buscarPorEmail(emailNormalizado);
      if (emailExiste) {
        return erro(res, 409, "Email já cadastrado");
      }
      const usuarioExiste =
        await UsuarioModel.buscarPorUsuario(loginNormalizado);
      if (usuarioExiste) {
        return erro(res, 409, "Usuário (login) já cadastrado");
      }

      // Criptografa a senha (nunca salva em texto puro)
      const senhaHash = await bcrypt.hash(senha, BCRYPT_ROUNDS);

      const novoUsuario = await UsuarioModel.criar({
        nome: nome.trim(),
        sobrenome: sobrenome.trim(),
        email: emailNormalizado,
        usuario: loginNormalizado,
        senha: senhaHash,
      });

      return sucesso(res, 201, "Usuário cadastrado com sucesso", novoUsuario);
    } catch (error) {
      console.error("Erro ao cadastrar usuário:", error);
      if (error.mensagemAmigavel) {
        return erro(res, 409, error.mensagemAmigavel);
      }
      return erro(res, 500, "Erro ao cadastrar usuário");
    }
  }

  // POST /api/usuarios/login (pública)
  static async login(req, res) {
    try {
      const { email, senha } = req.body;

      // Validações
      if (!email || typeof email !== "string" || email.trim() === "") {
        return erro(res, 400, "O email é obrigatório");
      }
      if (!senha || typeof senha !== "string" || senha === "") {
        return erro(res, 400, "A senha é obrigatória");
      }

      const emailNormalizado = email.trim().toLowerCase();

      const usuario =
        await UsuarioModel.buscarPorEmailComSenha(emailNormalizado);

      // Mensagem genérica para não revelar se o email existe
      if (!usuario) {
        return erro(res, 401, "Email ou senha inválidos");
      }

      const senhaCorreta = await bcrypt.compare(senha, usuario.senha);
      if (!senhaCorreta) {
        return erro(res, 401, "Email ou senha inválidos");
      }

      if (!usuario.ativo) {
        return erro(res, 403, "Usuário inativo. Procure o administrador.");
      }

      // Gera o token JWT com validade de uma hora
      const token = jwt.sign(
        {
          id: usuario.id,
          email: usuario.email,
          usuario: usuario.usuario,
        },
        process.env.JWT_SECRET,
        { expiresIn: JWT_EXPIRA_EM },
      );

      const { senha: _, ...usuarioSemSenha } = usuario;

      return sucesso(res, 200, "Login realizado com sucesso", {
        token,
        usuario: usuarioSemSenha,
      });
    } catch (error) {
      console.error("Erro ao realizar login:", error);
      return erro(res, 500, "Erro ao realizar login");
    }
  }

  // GET /api/usuarios (protegida)
  static async listar(req, res) {
    try {
      const usuarios = await UsuarioModel.listarTodos();
      return sucesso(res, 200, "Usuários listados com sucesso", usuarios);
    } catch (error) {
      console.error("Erro ao listar usuários:", error);
      return erro(res, 500, "Erro ao listar usuários");
    }
  }

  // GET /api/usuarios/:id (protegida)
  static async buscarPorId(req, res) {
    try {
      const { id } = req.params;

      // Validação básica
      if (!id || isNaN(id)) {
        return erro(res, 400, "ID inválido");
      }

      const usuario = await UsuarioModel.buscarPorId(id);

      if (!usuario) {
        return erro(res, 404, "Usuário não encontrado");
      }

      return sucesso(res, 200, "Usuário encontrado com sucesso", usuario);
    } catch (error) {
      console.error("Erro ao buscar usuário:", error);
      return erro(res, 500, "Erro ao buscar usuário");
    }
  }

  // PUT /api/usuarios/:id (protegida)
  static async alterar(req, res) {
    try {
      const { id } = req.params;
      const { nome, sobrenome, email, usuario, senha, ativo } = req.body;

      // Validações
      if (!id || isNaN(id)) {
        return erro(res, 400, "ID inválido");
      }

      if (nome !== undefined && (!nome || nome.trim() === "")) {
        return erro(res, 400, "O nome não pode ser vazio");
      }
      if (sobrenome !== undefined && (!sobrenome || sobrenome.trim() === "")) {
        return erro(res, 400, "O sobrenome não pode ser vazio");
      }
      if (email !== undefined) {
        if (!email || email.trim() === "") {
          return erro(res, 400, "O email não pode ser vazio");
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
          return erro(res, 400, "Email inválido");
        }
      }
      if (usuario !== undefined) {
        if (!usuario || usuario.trim() === "") {
          return erro(res, 400, "O usuário (login) não pode ser vazio");
        }
        if (usuario.trim().length < 3) {
          return erro(
            res,
            400,
            "O usuário (login) deve ter no mínimo 3 caracteres",
          );
        }
      }
      if (senha !== undefined && senha !== null && senha !== "") {
        if (typeof senha !== "string" || senha.length < 6) {
          return erro(res, 400, "A senha deve ter no mínimo 6 caracteres");
        }
      }
      if (ativo !== undefined && typeof ativo !== "boolean") {
        return erro(
          res,
          400,
          "O campo ativo deve ser um booleano (true ou false)",
        );
      }

      // Verifica se o usuário existe
      const usuarioExiste = await UsuarioModel.buscarPorId(id);
      if (!usuarioExiste) {
        return erro(res, 404, "Usuário não encontrado");
      }

      // Verifica duplicidade de email e usuário (colunas únicas)
      const emailNormalizado =
        email !== undefined ? email.trim().toLowerCase() : undefined;
      const loginNormalizado =
        usuario !== undefined ? usuario.trim() : undefined;

      if (emailNormalizado !== undefined) {
        const emailEmUso = await UsuarioModel.buscarPorEmail(emailNormalizado);
        if (emailEmUso && emailEmUso.id !== Number(id)) {
          return erro(res, 409, "Email já cadastrado por outra conta");
        }
      }
      if (loginNormalizado !== undefined) {
        const loginEmUso =
          await UsuarioModel.buscarPorUsuario(loginNormalizado);
        if (loginEmUso && loginEmUso.id !== Number(id)) {
          return erro(
            res,
            409,
            "Usuário (login) já cadastrado por outra conta",
          );
        }
      }

      // Criptografa a nova senha, somente se ela foi enviada
      let senhaHash = null;
      if (senha !== undefined && senha !== null && senha !== "") {
        senhaHash = await bcrypt.hash(senha, BCRYPT_ROUNDS);
      }

      const usuarioAtualizado = await UsuarioModel.atualizar(id, {
        nome: nome !== undefined ? nome.trim() : undefined,
        sobrenome: sobrenome !== undefined ? sobrenome.trim() : undefined,
        email: emailNormalizado,
        usuario: loginNormalizado,
        senha: senhaHash,
        ativo: ativo !== undefined ? ativo : undefined,
      });

      return sucesso(
        res,
        200,
        "Usuário atualizado com sucesso",
        usuarioAtualizado,
      );
    } catch (error) {
      console.error("Erro ao atualizar usuário:", error);
      if (error.mensagemAmigavel) {
        return erro(res, 409, error.mensagemAmigavel);
      }
      return erro(res, 500, "Erro ao atualizar usuário");
    }
  }

  // DELETE /api/usuarios/:id (protegida)
  static async excluir(req, res) {
    try {
      const { id } = req.params;

      // Validação básica
      if (!id || isNaN(id)) {
        return erro(res, 400, "ID inválido");
      }

      const deletado = await UsuarioModel.deletar(id);

      if (!deletado) {
        return erro(res, 404, "Usuário não encontrado");
      }

      return sucesso(res, 200, "Usuário deletado com sucesso", null);
    } catch (error) {
      console.error("Erro ao deletar usuário:", error);
      return erro(res, 500, "Erro ao deletar usuário");
    }
  }
}

module.exports = UsuarioController;
