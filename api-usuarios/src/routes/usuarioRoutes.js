const express = require("express");
const UsuarioController = require("../controllers/UsuarioController");
const autenticar = require("../middlewares/authMiddleware");

const router = express.Router();

// Rotas públicas (não exigem token)
router.post("/cadastrar", UsuarioController.cadastrar);
router.post("/login", UsuarioController.login);

// Rotas protegidas (exigem token JWT)
router.get("/", autenticar, UsuarioController.listar);
router.get("/:id", autenticar, UsuarioController.buscarPorId);
router.put("/:id", autenticar, UsuarioController.alterar);
router.delete("/:id", autenticar, UsuarioController.excluir);

module.exports = router;
