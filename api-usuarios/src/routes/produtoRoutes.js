const express = require("express");
const ProdutoController = require("../controllers/ProdutoController");
const autenticar = require("../middlewares/authMiddleware");

const router = express.Router();

router.use(autenticar);
router.get("/", ProdutoController.listar);
router.post("/", ProdutoController.criar);
router.post("/:id/entrada", (req, res) =>
  ProdutoController.movimentar(req, res, "entrada"),
);
router.post("/:id/venda", (req, res) =>
  ProdutoController.movimentar(req, res, "venda"),
);

module.exports = router;
