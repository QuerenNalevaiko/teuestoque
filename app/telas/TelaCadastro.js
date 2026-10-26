// ============================================================
// app/telas/TelaCadastro.js
// Cadastro de usuario: nome, sobrenome, e-mail, usuario e senha.
// Ao concluir, volta ao login mostrando a mensagem de sucesso
// (a mensagem real da API, quando ela enviar uma).
// ============================================================
import React, { useState } from 'react';
import { ScrollView, View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { cadastrarUsuario } from '../servicos/api';

export default function TelaCadastro({ aoConcluir, aoVoltar }) {
  const [nome, setNome] = useState('');
  const [sobrenome, setSobrenome] = useState('');
  const [email, setEmail] = useState('');
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [mensagemErro, setMensagemErro] = useState('');

  async function enviarCadastro() {
    setMensagemErro('');

    if (!nome.trim() || !sobrenome.trim() || !email.trim() || !usuario.trim() || !senha) {
      setMensagemErro('Preencha todos os campos para concluir o cadastro.');
      return;
    }

    setCarregando(true);
    try {
      const corpo = await cadastrarUsuario({
        nome: nome.trim(),
        sobrenome: sobrenome.trim(),
        email: email.trim(),
        usuario: usuario.trim(),
        senha,
      });

      const mensagemSucesso =
        (corpo && corpo.mensagem) ||
        'Cadastro realizado com sucesso! Entre com seu e-mail e senha.';
      aoConcluir(mensagemSucesso);
    } catch (erro) {
      // Mensagens reais da API: 409 e-mail duplicado, 400 campo faltando etc.
      setMensagemErro(erro.mensagem || 'Não foi possível concluir o cadastro. Tente novamente.');
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
        <Text style={estilos.titulo}>Criar conta</Text>
        <Text style={estilos.subtitulo}>Preencha os dados para se cadastrar</Text>

        <Text style={estilos.rotulo}>Nome</Text>
        <TextInput
          style={estilos.campo}
          placeholder="Seu nome"
          value={nome}
          onChangeText={setNome}
        />

        <Text style={estilos.rotulo}>Sobrenome</Text>
        <TextInput
          style={estilos.campo}
          placeholder="Seu sobrenome"
          value={sobrenome}
          onChangeText={setSobrenome}
        />

        <Text style={estilos.rotulo}>E-mail</Text>
        <TextInput
          style={estilos.campo}
          placeholder="seu.email@email.com"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        <Text style={estilos.rotulo}>Usuário</Text>
        <TextInput
          style={estilos.campo}
          placeholder="Nome de usuario na API"
          autoCapitalize="none"
          value={usuario}
          onChangeText={setUsuario}
        />

        <Text style={estilos.rotulo}>Senha</Text>
        <TextInput
          style={estilos.campo}
          placeholder="Crie uma senha"
          secureTextEntry
          value={senha}
          onChangeText={setSenha}
        />

        {mensagemErro ? <Text style={estilos.erro}>{mensagemErro}</Text> : null}

        <TouchableOpacity
          style={[estilos.botao, carregando && estilos.botaoDesabilitado]}
          onPress={enviarCadastro}
          disabled={carregando}
        >
          <Text style={estilos.textoBotao}>{carregando ? 'Cadastrando...' : 'Cadastrar'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={aoVoltar}>
          <Text style={estilos.link}>Já tem conta? Voltar ao login</Text>
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
  titulo: { fontSize: 24, fontWeight: '700', color: '#1B5E20', textAlign: 'center' },
  subtitulo: { fontSize: 14, color: '#6B7A70', textAlign: 'center', marginBottom: 20 },
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
