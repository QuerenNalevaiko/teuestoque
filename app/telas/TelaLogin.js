// ============================================================
// app/telas/TelaLogin.js
// Tela de login: e-mail e senha (conforme o testes.http).
// Se o login falhar, mostra a mensagem REAL devolvida pela API.
// A senha nunca e exibida (campo com secureTextEntry).
// ============================================================
import React, { useState } from 'react';
import { ScrollView, View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { entrar, extrairDados } from '../servicos/api';

export default function TelaLogin({ aoEntrar, irParaCadastro, aviso, aoLimparAviso }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [mensagemErro, setMensagemErro] = useState('');

  async function enviarLogin() {
    setMensagemErro('');
    if (aoLimparAviso) {
      aoLimparAviso();
    }

    if (!email.trim() || !senha) {
      setMensagemErro('Informe o e-mail e a senha para entrar.');
      return;
    }

    setCarregando(true);
    try {
      const corpo = await entrar({ email: email.trim(), senha });
      const dadosLogin = extrairDados(corpo) || {};

      if (!dadosLogin.token) {
        setMensagemErro('A API não devolveu o token de acesso. Verifique a rota de login.');
        return;
      }

      // O token segue na memoria (estado do App); nunca e exibido na tela.
      aoEntrar(dadosLogin.token, dadosLogin.usuario || null);
    } catch (erro) {
      // Mostra a mensagem real devolvida pela API (ex.: credenciais invalidas).
      setMensagemErro(erro.mensagem || 'Não foi possível entrar. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <ScrollView
      style={estilos.tela}
      contentContainerStyle={estilos.conteudo}
      keyboardShouldPersistTaps="handled"
    >
      <View style={estilos.cartao}>
        <Text style={estilos.titulo}>Teu Estoque</Text>
        <Text style={estilos.subtitulo}>Entre para gerenciar usuários e estoque</Text>

        {aviso && aviso.texto ? (
          <Text style={aviso.tipo === 'sucesso' ? estilos.caixaSucesso : estilos.caixaAviso}>
            {aviso.texto}
          </Text>
        ) : null}

        <Text style={estilos.rotulo}>E-mail</Text>
        <TextInput
          style={estilos.campo}
          placeholder="seu.email@email.com"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        <Text style={estilos.rotulo}>Senha</Text>
        <TextInput
          style={estilos.campo}
          placeholder="Sua senha"
          secureTextEntry
          value={senha}
          onChangeText={setSenha}
        />

        {mensagemErro ? <Text style={estilos.erro}>{mensagemErro}</Text> : null}

        <TouchableOpacity
          style={[estilos.botao, carregando && estilos.botaoDesabilitado]}
          onPress={enviarLogin}
          disabled={carregando}
        >
          <Text style={estilos.textoBotao}>{carregando ? 'Entrando...' : 'Entrar'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={irParaCadastro}>
          <Text style={estilos.link}>Não tem conta? Cadastre-se</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: '#F4F6F4' },
  conteudo: {
    flexGrow: 1,
    justifyContent: 'center',
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    padding: 16,
  },
  cartao: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E3E8E3',
    padding: 20,
  },
  titulo: { fontSize: 26, fontWeight: '700', color: '#1B5E20', textAlign: 'center' },
  subtitulo: { fontSize: 14, color: '#6B7A70', textAlign: 'center', marginBottom: 20 },
  caixaSucesso: {
    color: '#1B5E20',
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#A5D6A7',
    borderRadius: 8,
    padding: 10,
    marginBottom: 14,
    fontSize: 14,
    textAlign: 'center',
  },
  caixaAviso: {
    color: '#8D6E00',
    backgroundColor: '#FFF6D6',
    borderWidth: 1,
    borderColor: '#F9A825',
    borderRadius: 8,
    padding: 10,
    marginBottom: 14,
    fontSize: 14,
    textAlign: 'center',
  },
  rotulo: { fontSize: 13, fontWeight: '600', color: '#6B7A70', marginBottom: 6 },
  campo: {
    backgroundColor: '#FBFCFB',
    borderWidth: 1,
    borderColor: '#D6DED8',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#24312A',
    marginBottom: 14,
  },
  erro: {
    color: '#C62828',
    backgroundColor: '#FDECEA',
    borderRadius: 8,
    padding: 10,
    marginBottom: 14,
    fontSize: 14,
  },
  botao: { backgroundColor: '#2E7D32', borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  botaoDesabilitado: { opacity: 0.6 },
  textoBotao: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  link: { color: '#2E7D32', fontWeight: '600', fontSize: 14, textAlign: 'center', paddingVertical: 14 },
});
