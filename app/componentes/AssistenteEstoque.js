import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { extrairDados, perguntarIA } from '../servicos/api';

function formatarTrecho(trecho, indice) {
  const partes = trecho.split(/(\*\*[^*]+\*\*|\*[^*]+\*|__[^_]+__)/g);

  return partes.map((parte, parteIndice) => {
    const chave = `${indice}-${parteIndice}`;
    if (
      (parte.startsWith('**') && parte.endsWith('**')) ||
      (parte.startsWith('__') && parte.endsWith('__'))
    ) {
      return (
        <Text key={chave} style={estilos.negrito}>
          {parte.slice(2, -2)}
        </Text>
      );
    }
    if (parte.startsWith('*') && parte.endsWith('*')) {
      return (
        <Text key={chave} style={estilos.italico}>
          {parte.slice(1, -1)}
        </Text>
      );
    }
    return <Text key={chave}>{parte}</Text>;
  });
}

function renderizarResposta(texto) {
  return texto.split(/\r?\n/).map((linha, indice) => {
    const conteudo = linha.trim();
    if (!conteudo) {
      return <View key={`espaco-${indice}`} style={estilos.espaco} />;
    }

    const titulo = conteudo.match(/^#{1,3}\s+(.+)$/);
    if (titulo) {
      return (
        <Text key={`titulo-${indice}`} style={estilos.subtituloResposta}>
          {formatarTrecho(titulo[1], indice)}
        </Text>
      );
    }

    const item = conteudo.match(/^(?:[-*])\s+(.+)$/);
    if (item) {
      return (
        <View key={`item-${indice}`} style={estilos.item}>
          <Text style={estilos.marcador}>•</Text>
          <Text style={estilos.textoItem}>{formatarTrecho(item[1], indice)}</Text>
        </View>
      );
    }

    return (
      <Text key={`linha-${indice}`} style={estilos.linhaResposta}>
        {formatarTrecho(conteudo, indice)}
      </Text>
    );
  });
}

export default function AssistenteEstoque({ produtos }) {
  const [pergunta, setPergunta] = useState('');
  const [resposta, setResposta] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function enviarPergunta() {
    const texto = pergunta.trim();
    setErro('');
    setResposta('');
    if (!texto) {
      setErro('Digite uma pergunta sobre o estoque.');
      return;
    }

    setCarregando(true);
    try {
      const corpo = await perguntarIA(texto, produtos);
      const dados = extrairDados(corpo);
      setResposta(dados && dados.resposta ? dados.resposta : 'A API de IA não devolveu uma resposta válida.');
    } catch (erroRecebido) {
      setErro(erroRecebido.mensagem || 'Não foi possível consultar o assistente.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <View style={estilos.cartao}>
      <Text style={estilos.titulo}>Assistente de estoque</Text>
      <Text style={estilos.info}>A IA apenas orienta com base nos produtos exibidos e não altera o estoque.</Text>
      <TextInput
        style={estilos.campo}
        placeholder="Ex.: quais produtos estão abaixo do mínimo?"
        value={pergunta}
        onChangeText={setPergunta}
        maxLength={500}
        multiline
      />
      {erro ? <Text style={estilos.erro}>{erro}</Text> : null}
      {resposta ? <View style={estilos.resposta}>{renderizarResposta(resposta)}</View> : null}
      <TouchableOpacity
        style={[estilos.botao, carregando && estilos.desabilitado]}
        onPress={enviarPergunta}
        disabled={carregando}
      >
        <Text style={estilos.textoBotao}>{carregando ? 'Consultando...' : 'Perguntar à IA'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const estilos = StyleSheet.create({
  cartao: { backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E3E8E3', padding: 16 },
  titulo: { fontSize: 18, fontWeight: '700', color: '#1B5E20', marginBottom: 6 },
  info: { color: '#6B7A70', fontSize: 13, marginBottom: 12 },
  campo: { minHeight: 70, borderWidth: 1, borderColor: '#D6DED8', borderRadius: 8, padding: 10, marginBottom: 10 },
  erro: { color: '#C62828', backgroundColor: '#FDECEA', borderRadius: 8, padding: 10, marginBottom: 10 },
  resposta: { backgroundColor: '#F4F6F4', borderRadius: 8, padding: 12, marginBottom: 10 },
  subtituloResposta: { color: '#1B5E20', fontSize: 16, fontWeight: '700', marginTop: 6, marginBottom: 5 },
  linhaResposta: { color: '#24312A', fontSize: 14, lineHeight: 21, marginBottom: 4 },
  item: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 5, paddingLeft: 4 },
  marcador: { color: '#2E7D32', fontSize: 18, lineHeight: 21, marginRight: 7 },
  textoItem: { flex: 1, color: '#24312A', fontSize: 14, lineHeight: 21 },
  negrito: { fontWeight: '700' },
  italico: { fontStyle: 'italic' },
  espaco: { height: 7 },
  botao: { backgroundColor: '#2E7D32', borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  desabilitado: { opacity: 0.6 },
  textoBotao: { color: '#FFFFFF', fontWeight: '700' },
});
