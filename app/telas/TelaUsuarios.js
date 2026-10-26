// ============================================================
// app/telas/TelaUsuarios.js
// Lista de usuarios fornecida pela API, com busca pelo nome.
// O botao "Editar" abre a TelaEditarUsuario (alterar e excluir).
// ============================================================
import React, { useState, useEffect, useCallback } from 'react';
import { ScrollView, View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { listarUsuarios, extrairDados } from '../servicos/api';

function idDe(usuario) {
  return usuario?.id ?? usuario?.idUsuario;
}

function nomeCompleto(usuario) {
  const nome = `${usuario?.nome ?? ''} ${usuario?.sobrenome ?? ''}`.trim();
  return nome || usuario?.usuario || 'Sem nome';
}

export default function TelaUsuarios({
  token,
  usuarioLogado,
  aoVoltar,
  aoEditar,
  aoExpirarSessao,
}) {
  const [usuarios, setUsuarios] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [mensagemErro, setMensagemErro] = useState('');
  const [busca, setBusca] = useState('');

  const carregarUsuarios = useCallback(async () => {
    setCarregando(true);
    setMensagemErro('');
    try {
      const corpo = await listarUsuarios(token);
      const lista = extrairDados(corpo);
      if (Array.isArray(lista)) {
        setUsuarios(lista);
      } else if (Array.isArray(lista && lista.usuarios)) {
        setUsuarios(lista.usuarios);
      } else {
        setUsuarios([]);
      }
    } catch (erro) {
      if (erro && erro.sessaoExpirada) {
        aoExpirarSessao();
        return;
      }
      setMensagemErro(erro.mensagem || 'Não foi possível carregar a lista de usuários.');
    } finally {
      setCarregando(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    carregarUsuarios();
  }, [carregarUsuarios]);

  const textoBusca = busca.trim().toLowerCase();
  const usuariosFiltrados = usuarios.filter((usuario) =>
    nomeCompleto(usuario).toLowerCase().includes(textoBusca)
  );

  return (
    <ScrollView style={estilos.tela} contentContainerStyle={estilos.conteudo}>
      <View style={estilos.cartao}>
        <Text style={estilos.titulo}>Usuários</Text>

        <TouchableOpacity style={estilos.botaoVoltar} onPress={aoVoltar}>
          <Text style={estilos.textoVoltar}>Voltar para a tela principal</Text>
        </TouchableOpacity>

        <TextInput
          style={estilos.campo}
          placeholder="Buscar pelo nome (ex.: Maria)"
          value={busca}
          onChangeText={setBusca}
        />

        <View style={estilos.linhaLista}>
          <Text style={estilos.contador}>
            {usuariosFiltrados.length} de {usuarios.length} usuário(s)
          </Text>
          <TouchableOpacity onPress={carregarUsuarios} disabled={carregando}>
            <Text style={estilos.link}>Atualizar</Text>
          </TouchableOpacity>
        </View>

        {mensagemErro ? <Text style={estilos.erro}>{mensagemErro}</Text> : null}
        {carregando ? <Text style={estilos.info}>Carregando usuários...</Text> : null}

        {!carregando && usuarios.length === 0 && !mensagemErro ? (
          <Text style={estilos.info}>Nenhum usuário cadastrado na API.</Text>
        ) : null}
        {!carregando && usuarios.length > 0 && usuariosFiltrados.length === 0 ? (
          <Text style={estilos.info}>Nenhum usuário encontrado para "{busca}".</Text>
        ) : null}

        {usuariosFiltrados.map((usuario) => {
          const id = idDe(usuario);
          return (
            <View key={String(id ?? usuario.usuario)} style={estilos.item}>
              <View style={estilos.itemTexto}>
                <Text style={estilos.nomeUsuario}>{nomeCompleto(usuario)}</Text>
                <Text style={estilos.detalheUsuario}>
                  @{usuario.usuario ?? '-'}  |  {usuario.email ?? 'sem e-mail'}
                </Text>
                {id !== undefined && id !== null ? (
                  <Text style={estilos.idUsuario}>ID: {String(id)}</Text>
                ) : null}
              </View>
              <TouchableOpacity
                style={estilos.botaoEditar}
                onPress={() => aoEditar(usuario)}
              >
                <Text style={estilos.textoBotaoEditar}>Editar</Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: '#F4F6F4' },
  conteudo: {
    width: '100%',
    maxWidth: 720,
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
  titulo: { fontSize: 22, fontWeight: '700', color: '#1B5E20', marginBottom: 12 },
  botaoVoltar: {
    alignSelf: 'flex-start',
    backgroundColor: '#EEF3EE',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 14,
  },
  textoVoltar: { color: '#1B5E20', fontWeight: '600', fontSize: 13 },
  campo: {
    backgroundColor: '#FBFCFB',
    borderWidth: 1,
    borderColor: '#D6DED8',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#24312A',
    marginBottom: 8,
  },
  linhaLista: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  contador: { fontSize: 13, color: '#6B7A70' },
  link: { color: '#2E7D32', fontWeight: '600', fontSize: 14, paddingVertical: 4 },
  erro: {
    color: '#C62828',
    backgroundColor: '#FDECEA',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    fontSize: 14,
  },
  info: { color: '#6B7A70', fontSize: 14, paddingVertical: 6 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E3E8E3',
    backgroundColor: '#FBFCFB',
    borderRadius: 8,
    padding: 12,
    marginTop: 10,
  },
  itemTexto: { flex: 1 },
  nomeUsuario: { fontSize: 15, fontWeight: '700', color: '#24312A' },
  detalheUsuario: { fontSize: 13, color: '#6B7A70', marginTop: 2 },
  idUsuario: { fontSize: 12, color: '#9AA79E', marginTop: 2 },
  botaoEditar: {
    backgroundColor: '#1565C0',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginLeft: 10,
  },
  textoBotaoEditar: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
});
