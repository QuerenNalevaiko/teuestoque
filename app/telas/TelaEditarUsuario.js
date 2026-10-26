// ============================================================
// app/telas/TelaEditarUsuario.js
// Alterar os campos aceitos pela API (enviando SOMENTE o que mudou,
// conforme o testes.http) e excluir usuario com confirmacao na
// PROPIA interface (Modal do React Native) — sem Alert.alert,
// que nao funciona bem no navegador.
// ============================================================
import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
} from 'react-native';
import { alterarUsuario, excluirUsuario } from '../servicos/api';

function idDe(usuario) {
  return usuario?.id ?? usuario?.idUsuario;
}

export default function TelaEditarUsuario({ token, usuario, aoVoltar, aoExpirarSessao }) {
  const [nome, setNome] = useState('');
  const [sobrenome, setSobrenome] = useState('');
  const [email, setEmail] = useState('');
  const [usuarioLogin, setUsuarioLogin] = useState('');
  const [senha, setSenha] = useState(''); // em branco = manter a senha atual
  const [carregando, setCarregando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [mensagemErro, setMensagemErro] = useState('');
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);

  // Preenche o formulario com os dados do usuario selecionado.
  useEffect(() => {
    setNome(usuario?.nome ? String(usuario.nome) : '');
    setSobrenome(usuario?.sobrenome ? String(usuario.sobrenome) : '');
    setEmail(usuario?.email ? String(usuario.email) : '');
    setUsuarioLogin(usuario?.usuario ? String(usuario.usuario) : '');
    setSenha('');
    setMensagemErro('');
  }, [usuario]);

  if (!usuario) {
    return (
      <ScrollView style={estilos.tela} contentContainerStyle={estilos.conteudo}>
        <View style={estilos.cartao}>
          <Text style={estilos.titulo}>Editar usuário</Text>
          <Text style={estilos.info}>Nenhum usuário selecionado.</Text>
          <TouchableOpacity style={estilos.botaoSecundario} onPress={aoVoltar}>
            <Text style={estilos.textoBotaoSecundario}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  async function salvarAlteracoes() {
    setMensagemErro('');

    // Envia para a API APENAS os campos que foram alterados.
    const camposAlterados = {};
    if (nome.trim() !== String(usuario.nome ?? '')) camposAlterados.nome = nome.trim();
    if (sobrenome.trim() !== String(usuario.sobrenome ?? '')) {
      camposAlterados.sobrenome = sobrenome.trim();
    }
    if (email.trim() !== String(usuario.email ?? '')) camposAlterados.email = email.trim();
    if (usuarioLogin.trim() !== String(usuario.usuario ?? '')) {
      camposAlterados.usuario = usuarioLogin.trim();
    }
    if (senha !== '') camposAlterados.senha = senha;

    if (Object.keys(camposAlterados).length === 0) {
      setMensagemErro('Altere pelo menos um campo (ou preencha uma nova senha) para salvar.');
      return;
    }

    setCarregando(true);
    try {
      await alterarUsuario(idDe(usuario), camposAlterados, token);
      aoVoltar(); // volta para a lista, que sera recarregada
    } catch (erro) {
      if (erro && erro.sessaoExpirada) {
        aoExpirarSessao();
        return;
      }
      setMensagemErro(erro.mensagem || 'Não foi possível salvar as alterações.');
    } finally {
      setCarregando(false);
    }
  }

  async function executarExclusao() {
    setExcluindo(true);
    setMensagemErro('');
    try {
      await excluirUsuario(idDe(usuario), token);
      setConfirmandoExclusao(false);
      aoVoltar(); // volta para a lista atualizada
    } catch (erro) {
      setConfirmandoExclusao(false);
      if (erro && erro.sessaoExpirada) {
        aoExpirarSessao();
        return;
      }
      setMensagemErro(erro.mensagem || 'Não foi possível excluir o usuário.');
    } finally {
      setExcluindo(false);
    }
  }

  const nomeExibido =
    `${usuario.nome ?? ''} ${usuario.sobrenome ?? ''}`.trim() || usuario.usuario || 'usuário';

  return (
    <ScrollView style={estilos.tela} contentContainerStyle={estilos.conteudo}>
      <View style={estilos.cartao}>
        <Text style={estilos.titulo}>Editar usuário</Text>
        <Text style={estilos.info}>
          Editando: {nomeExibido} (ID: {String(idDe(usuario))})
        </Text>

        <Text style={estilos.rotulo}>Nome</Text>
        <TextInput style={estilos.campo} value={nome} onChangeText={setNome} />

        <Text style={estilos.rotulo}>Sobrenome</Text>
        <TextInput style={estilos.campo} value={sobrenome} onChangeText={setSobrenome} />

        <Text style={estilos.rotulo}>E-mail</Text>
        <TextInput
          style={estilos.campo}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        <Text style={estilos.rotulo}>Usuário</Text>
        <TextInput
          style={estilos.campo}
          autoCapitalize="none"
          value={usuarioLogin}
          onChangeText={setUsuarioLogin}
        />

        <Text style={estilos.rotulo}>Nova senha (deixe em branco para manter a atual)</Text>
        <TextInput style={estilos.campo} secureTextEntry value={senha} onChangeText={setSenha} />

        {mensagemErro ? <Text style={estilos.erro}>{mensagemErro}</Text> : null}

        <TouchableOpacity
          style={[estilos.botaoPrimario, carregando && estilos.botaoDesabilitado]}
          onPress={salvarAlteracoes}
          disabled={carregando}
        >
          <Text style={estilos.textoBotaoPrimario}>
            {carregando ? 'Salvando...' : 'Salvar alterações'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[estilos.botaoExcluir, excluindo && estilos.botaoDesabilitado]}
          onPress={() => setConfirmandoExclusao(true)}
          disabled={excluindo}
        >
          <Text style={estilos.textoBotaoExcluir}>Excluir usuário</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={aoVoltar}>
          <Text style={estilos.link}>Voltar para a lista de usuários</Text>
        </TouchableOpacity>
      </View>

      {/* Confirmacao de exclusao na propria interface (funciona no navegador). */}
      <Modal
        visible={confirmandoExclusao}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmandoExclusao(false)}
      >
        <View style={estilos.fundoModal}>
          <View style={estilos.caixaModal}>
            <Text style={estilos.tituloModal}>Confirmar exclusão</Text>
            <Text style={estilos.textoModal}>
              Tem certeza que deseja excluir o usuário "{nomeExibido}"? Esta ação não pode ser
              desfeita.
            </Text>
            <View style={estilos.linhaBotoesModal}>
              <TouchableOpacity
                style={estilos.botaoCancelarModal}
                onPress={() => setConfirmandoExclusao(false)}
                disabled={excluindo}
              >
                <Text style={estilos.textoBotaoCancelar}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[estilos.botaoConfirmarExclusao, excluindo && estilos.botaoDesabilitado]}
                onPress={executarExclusao}
                disabled={excluindo}
              >
                <Text style={estilos.textoBotaoExcluir}>
                  {excluindo ? 'Excluindo...' : 'Excluir'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: '#F4F6F4' },
  conteudo: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    padding: 16,
    paddingBottom: 48,
  },
  cartao: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E3E8E3',
    padding: 16,
  },
  titulo: { fontSize: 22, fontWeight: '700', color: '#1B5E20', marginBottom: 6 },
  info: { color: '#6B7A70', fontSize: 14, marginBottom: 16 },
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
  botaoPrimario: {
    backgroundColor: '#2E7D32',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  botaoExcluir: {
    backgroundColor: '#B3261E',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  botaoDesabilitado: { opacity: 0.6 },
  textoBotaoPrimario: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  textoBotaoExcluir: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  botaoSecundario: {
    backgroundColor: '#2E7D32',
    borderRadius: 8,
    paddingVertical: 11,
    paddingHorizontal: 18,
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  textoBotaoSecundario: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  link: { color: '#2E7D32', fontWeight: '600', fontSize: 14, textAlign: 'center', paddingVertical: 12 },
  fundoModal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  caixaModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 420,
  },
  tituloModal: { fontSize: 17, fontWeight: '700', color: '#24312A', marginBottom: 10 },
  textoModal: { fontSize: 14, color: '#24312A', marginBottom: 16 },
  linhaBotoesModal: { flexDirection: 'row', gap: 10 },
  botaoCancelarModal: {
    flex: 1,
    backgroundColor: '#EEF3EE',
    borderRadius: 8,
    paddingVertical: 11,
    alignItems: 'center',
  },
  textoBotaoCancelar: { color: '#24312A', fontWeight: '700', fontSize: 14 },
  botaoConfirmarExclusao: {
    flex: 1,
    backgroundColor: '#B3261E',
    borderRadius: 8,
    paddingVertical: 11,
    alignItems: 'center',
  },
});
