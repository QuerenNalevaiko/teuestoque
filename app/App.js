// ============================================================
// App.js
// Controle de telas por estado — SEM biblioteca de navegacao.
//
// Fluxo: login -> cadastro (e volta) | login -> principal
//        principal -> usuarios -> editarUsuario -> usuarios
//
// O token JWT fica guardado SOMENTE na memoria (estado do React).
// Ao fechar ou recarregar o app, o usuario precisa entrar de novo.
// O token e a senha NUNCA sao exibidos em nenhuma tela.
// ============================================================
import React, { useState } from "react";
import { View, StyleSheet } from "react-native";

import TelaLogin from "./telas/TelaLogin";
import TelaCadastro from "./telas/TelaCadastro";
import TelaPrincipal from "./telas/TelaPrincipal";
import TelaUsuarios from "./telas/TelaUsuarios";
import TelaEditarUsuario from "./telas/TelaEditarUsuario";

export default function App() {
  const [tela, setTela] = useState("login");
  const [token, setToken] = useState(null); // so na memoria
  const [usuarioLogado, setUsuarioLogado] = useState(null);
  const [usuarioEmEdicao, setUsuarioEmEdicao] = useState(null);
  const [avisoLogin, setAvisoLogin] = useState(null); // { texto, tipo: 'sucesso' | 'aviso' }

  // Login OK: guarda token/usuario na memoria e abre a tela principal.
  function aoEntrar(novoToken, novoUsuario) {
    setToken(novoToken);
    setUsuarioLogado(novoUsuario);
    setAvisoLogin(null);
    setTela("principal");
  }

  function irParaCadastro() {
    setAvisoLogin(null);
    setTela("cadastro");
  }

  function irParaLogin() {
    setTela("login");
  }

  // Cadastro concluido: volta ao login mostrando a mensagem de sucesso.
  function concluirCadastro(mensagemSucesso) {
    setAvisoLogin({ texto: mensagemSucesso, tipo: "sucesso" });
    setTela("login");
  }

  function limparAvisoLogin() {
    setAvisoLogin(null);
  }

  // Sair: limpa o token (memoria) e volta ao login.
  function aoSair() {
    setToken(null);
    setUsuarioLogado(null);
    setUsuarioEmEdicao(null);
    setAvisoLogin(null);
    setTela("login");
  }

  // HTTP 401 em rota protegida: limpa o token e volta ao login com aviso.
  function aoExpirarSessao() {
    setToken(null);
    setUsuarioLogado(null);
    setUsuarioEmEdicao(null);
    setAvisoLogin({
      texto: "Sua sessão expirou, entre de novo",
      tipo: "aviso",
    });
    setTela("login");
  }

  function abrirEdicao(usuario) {
    setUsuarioEmEdicao(usuario);
    setTela("editarUsuario");
  }

  function voltarParaUsuarios() {
    setUsuarioEmEdicao(null);
    setTela("usuarios");
  }

  let conteudo;
  if (tela === "cadastro") {
    conteudo = (
      <TelaCadastro aoConcluir={concluirCadastro} aoVoltar={irParaLogin} />
    );
  } else if (tela === "principal") {
    conteudo = (
      <TelaPrincipal
        token={token}
        usuarioLogado={usuarioLogado}
        aoAbrirUsuarios={() => setTela("usuarios")}
        aoSair={aoSair}
        aoExpirarSessao={aoExpirarSessao}
      />
    );
  } else if (tela === "usuarios") {
    conteudo = (
      <TelaUsuarios
        token={token}
        aoVoltar={() => setTela("principal")}
        aoEditar={abrirEdicao}
        aoExpirarSessao={aoExpirarSessao}
      />
    );
  } else if (tela === "editarUsuario") {
    conteudo = (
      <TelaEditarUsuario
        token={token}
        usuario={usuarioEmEdicao}
        aoVoltar={voltarParaUsuarios}
        aoExpirarSessao={aoExpirarSessao}
      />
    );
  } else {
    conteudo = (
      <TelaLogin
        aoEntrar={aoEntrar}
        irParaCadastro={irParaCadastro}
        aviso={avisoLogin}
        aoLimparAviso={limparAvisoLogin}
      />
    );
  }

  return <View style={estilos.raiz}>{conteudo}</View>;
}

const estilos = StyleSheet.create({
  raiz: {
    flex: 1,
    backgroundColor: "#F4F6F4",
    alignItems: "center",
  },
});
