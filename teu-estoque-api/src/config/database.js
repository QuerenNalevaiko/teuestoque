const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on("connect", () => {
  console.log(`Conexão estabelecida com o banco ${process.env.DB_NAME}`);
});

pool.on("error", (err) => {
  console.error(`Erro de conexão com o banco ${process.env.DB_NAME}`, err);
  process.exit(-1);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};
