// ============================================================
// app/telas/TelaPrincipal.js
// Tela principal (so abre apos o login).
// Mostra "Ola, nome", botoes Usuarios/Sair e o modulo de estoque.
// ============================================================
import React from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import ModuloEstoque from '../componentes/ModuloEstoque';
import AssistenteEstoque from '../componentes/AssistenteEstoque';
import { useState } from 'react';

function nomeParaSaudacao(usuario) {
  if (!usuario) return 'usuário(a)';
  if (typeof usuario === 'string') return usuario;
  return usuario.nome || usuario.usuario || 'usuário(a)';
}

export default function TelaPrincipal({ token, usuarioLogado, aoAbrirUsuarios, aoSair, aoExpirarSessao }) {
  const [produtos, setProdutos] = useState([]);
  return (
    <ScrollView style={estilos.tela} contentContainerStyle={estilos.conteudo}>
      <View style={estilos.cartaoCabecalho}>
        <Text style={estilos.titulo}>Teu Estoque</Text>
        <Text style={estilos.saudacao}>Olá, {nomeParaSaudacao(usuarioLogado)}</Text>

        <View style={estilos.linhaBotoes}>
          <TouchableOpacity style={estilos.botaoUsuarios} onPress={aoAbrirUsuarios}>
            <Text style={estilos.textoBotaoUsuarios}>Usuários</Text>
          </TouchableOpacity>
          <TouchableOpacity style={estilos.botaoSair} onPress={aoSair}>
            <Text style={estilos.textoBotaoSair}>Sair</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ModuloEstoque
        token={token}
        aoExpirarSessao={aoExpirarSessao}
        aoProdutosCarregados={setProdutos}
      />
      <AssistenteEstoque produtos={produtos} />
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
  cartaoCabecalho: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E3E8E3',
    padding: 16,
    marginBottom: 16,
  },
  titulo: { fontSize: 22, fontWeight: '700', color: '#1B5E20' },
  saudacao: { fontSize: 17, color: '#24312A', marginTop: 4, marginBottom: 14 },
  linhaBotoes: { flexDirection: 'row', gap: 10 },
  botaoUsuarios: {
    backgroundColor: '#2E7D32',
    borderRadius: 8,
    paddingVertical: 11,
    paddingHorizontal: 18,
    alignItems: 'center',
  },
  textoBotaoUsuarios: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  botaoSair: {
    backgroundColor: '#EEF3EE',
    borderWidth: 1,
    borderColor: '#C9D6CB',
    borderRadius: 8,
    paddingVertical: 11,
    paddingHorizontal: 18,
    alignItems: 'center',
  },
  textoBotaoSair: { color: '#B3261E', fontWeight: '700', fontSize: 14 },
});
