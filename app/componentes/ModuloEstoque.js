// ============================================================
// app/componentes/ModuloEstoque.js
// Modulo de estoque exibido dentro da Tela Principal.
//
// - Lista os produtos REAIS devolvidos pela API (nome, quantidade
//   atual e aviso de estoque baixo).
// - Formulario para cadastrar produto.
// - Registro de ENTRADA e VENDA com quantidade positiva.
// - Recarrega a lista e os saldos apos cada operacao.
// - Mostra os erros da API (inclusive vender mais do que existe).
// ============================================================
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import {
  listarProdutos,
  cadastrarProduto,
  registrarEntrada,
  registrarVenda,
  extrairDados,
  estaComEstoqueBaixo,
} from '../servicos/api';

// Pequenas tolerancias de formato dos campos do produto.
function idDe(produto) {
  return produto?.id ?? produto?.idProduto ?? produto?.codigo;
}

function nomeDe(produto) {
  return produto?.nome ?? produto?.nomeProduto ?? produto?.name ?? 'Produto sem nome';
}

function quantidadeDe(produto) {
  const valor = produto?.quantidade ?? produto?.qtd ?? produto?.quantidadeAtual ?? 0;
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : 0;
}

export default function ModuloEstoque({ token, aoExpirarSessao }) {
  const [produtos, setProdutos] = useState([]);
  const [carregando, setCarregando] = useState(false);

  const [nomeProduto, setNomeProduto] = useState('');
  const [quantidadeInicial, setQuantidadeInicial] = useState('');
  const [salvandoProduto, setSalvandoProduto] = useState(false);
  const [erroFormulario, setErroFormulario] = useState('');

  // Quantidade digitada por produto: { [id]: 'texto do campo' }
  const [quantidades, setQuantidades] = useState({});
  const [movimentando, setMovimentando] = useState(false);

  const [erroLista, setErroLista] = useState('');
  const [mensagemAcao, setMensagemAcao] = useState(null); // { tipo: 'sucesso' | 'erro', texto }

  function tratarErro(erro, definirMensagem) {
    if (erro && erro.sessaoExpirada) {
      aoExpirarSessao();
      return;
    }
    definirMensagem(erro.mensagem || 'Ocorreu um erro inesperado. Tente novamente.');
  }

  const carregarProdutos = useCallback(async () => {
    setCarregando(true);
    setErroLista('');
    try {
      const corpo = await listarProdutos(token);
      const lista = extrairDados(corpo);
      if (Array.isArray(lista)) {
        setProdutos(lista);
      } else if (Array.isArray(lista && lista.produtos)) {
        setProdutos(lista.produtos);
      } else {
        setProdutos([]);
      }
    } catch (erro) {
      if (erro && erro.sessaoExpirada) {
        aoExpirarSessao();
        return;
      }
      setProdutos([]);
      setErroLista(erro.mensagem || 'Não foi possível carregar a lista de produtos.');
    } finally {
      setCarregando(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Carrega a lista real da API ao abrir o modulo.
  useEffect(() => {
    carregarProdutos();
  }, [carregarProdutos]);

  async function salvarProduto() {
    setErroFormulario('');
    setMensagemAcao(null);

    const nome = nomeProduto.trim();
    if (!nome) {
      setErroFormulario('Informe o nome do produto.');
      return;
    }

    let quantidade = 0;
    if (quantidadeInicial.trim() !== '') {
      const numero = Number(quantidadeInicial);
      if (!Number.isInteger(numero) || numero < 0) {
        setErroFormulario('A quantidade inicial deve ser um número inteiro maior ou igual a zero.');
        return;
      }
      quantidade = numero;
    }

    setSalvandoProduto(true);
    try {
      await cadastrarProduto({ nome, quantidade }, token);
      setNomeProduto('');
      setQuantidadeInicial('');
      setMensagemAcao({ tipo: 'sucesso', texto: `Produto "${nome}" cadastrado com sucesso.` });
      await carregarProdutos();
    } catch (erro) {
      tratarErro(erro, setErroFormulario);
    } finally {
      setSalvandoProduto(false);
    }
  }

  async function movimentar(produto, tipo) {
    const id = idDe(produto);
    const chave = String(id);
    const textoDigitado = quantidades[chave] ?? '';
    setMensagemAcao(null);

    const numero = Number(textoDigitado);
    if (!Number.isInteger(numero) || numero <= 0) {
      setMensagemAcao({
        tipo: 'erro',
        texto: 'A quantidade deve ser um número inteiro positivo (maior que zero).',
      });
      return;
    }

    setMovimentando(true);
    try {
      if (tipo === 'entrada') {
        await registrarEntrada(id, numero, token);
        setMensagemAcao({
          tipo: 'sucesso',
          texto: `Entrada de ${numero} unidade(s) registrada para "${nomeDe(produto)}".`,
        });
      } else {
        await registrarVenda(id, numero, token);
        setMensagemAcao({
          tipo: 'sucesso',
          texto: `Venda de ${numero} unidade(s) registrada para "${nomeDe(produto)}".`,
        });
      }
      setQuantidades((valoresAtuais) => ({ ...valoresAtuais, [chave]: '' }));
      // Atualiza a lista e os saldos apos a operacao.
      await carregarProdutos();
    } catch (erro) {
      // Aqui entra o erro real da API, inclusive vender mais do que existe.
      tratarErro(erro, (mensagem) => setMensagemAcao({ tipo: 'erro', texto: mensagem }));
    } finally {
      setMovimentando(false);
    }
  }

  return (
    <View>
      <View style={estilos.cartao}>
        <Text style={estilos.subtitulo}>Cadastrar produto</Text>

        <TextInput
          style={estilos.campo}
          placeholder="Nome do produto"
          value={nomeProduto}
          onChangeText={setNomeProduto}
        />
        <TextInput
          style={estilos.campo}
          placeholder="Quantidade inicial (opcional)"
          keyboardType="numeric"
          value={quantidadeInicial}
          onChangeText={setQuantidadeInicial}
        />

        {erroFormulario ? <Text style={estilos.erro}>{erroFormulario}</Text> : null}

        <TouchableOpacity
          style={[estilos.botaoPrimario, salvandoProduto && estilos.botaoDesabilitado]}
          onPress={salvarProduto}
          disabled={salvandoProduto}
        >
          <Text style={estilos.textoBotaoPrimario}>
            {salvandoProduto ? 'Salvando...' : 'Cadastrar produto'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={estilos.cartao}>
        <View style={estilos.linhaTituloLista}>
          <Text style={estilos.subtitulo}>Estoque ({produtos.length})</Text>
          <TouchableOpacity onPress={carregarProdutos} disabled={carregando}>
            <Text style={estilos.link}>Atualizar lista</Text>
          </TouchableOpacity>
        </View>

        {mensagemAcao ? (
          <Text style={mensagemAcao.tipo === 'sucesso' ? estilos.sucesso : estilos.erro}>
            {mensagemAcao.texto}
          </Text>
        ) : null}

        {erroLista ? <Text style={estilos.erro}>{erroLista}</Text> : null}
        {carregando ? <Text style={estilos.info}>Carregando produtos...</Text> : null}

        {!carregando && produtos.length === 0 && !erroLista ? (
          <Text style={estilos.info}>
            Nenhum produto cadastrado ainda. Use o formulário acima.
          </Text>
        ) : null}

        {produtos.map((produto) => {
          const chave = String(idDe(produto) ?? nomeDe(produto));
          const quantidade = quantidadeDe(produto);
          return (
            <View key={chave} style={estilos.itemProduto}>
              <View style={estilos.linhaProduto}>
                <Text style={estilos.nomeProduto}>{nomeDe(produto)}</Text>
                <Text style={estilos.quantidadeProduto}>{quantidade} un.</Text>
              </View>

              {estaComEstoqueBaixo(quantidade) ? (
                <Text style={estilos.avisoEstoqueBaixo}>Estoque baixo</Text>
              ) : null}

              <TextInput
                style={[estilos.campo, estilos.campoMovimentacao]}
                placeholder="Quantidade para entrada ou venda"
                keyboardType="numeric"
                value={quantidades[chave] ?? ''}
                onChangeText={(texto) =>
                  setQuantidades((valoresAtuais) => ({ ...valoresAtuais, [chave]: texto }))
                }
              />

              <View style={estilos.linhaBotoesMovimentacao}>
                <TouchableOpacity
                  style={[estilos.botaoEntrada, movimentando && estilos.botaoDesabilitado]}
                  onPress={() => movimentar(produto, 'entrada')}
                  disabled={movimentando}
                >
                  <Text style={estilos.textoBotaoPequeno}>Registrar entrada</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[estilos.botaoVenda, movimentando && estilos.botaoDesabilitado]}
                  onPress={() => movimentar(produto, 'venda')}
                  disabled={movimentando}
                >
                  <Text style={estilos.textoBotaoPequeno}>Registrar venda</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  cartao: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E3E8E3',
    padding: 16,
    marginBottom: 16,
  },
  subtitulo: { fontSize: 17, fontWeight: '700', color: '#24312A', marginBottom: 12 },
  campo: {
    backgroundColor: '#FBFCFB',
    borderWidth: 1,
    borderColor: '#D6DED8',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#24312A',
    marginBottom: 10,
  },
  campoMovimentacao: { marginTop: 10, marginBottom: 8 },
  erro: {
    color: '#C62828',
    backgroundColor: '#FDECEA',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    fontSize: 14,
  },
  sucesso: {
    color: '#1B5E20',
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#A5D6A7',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    fontSize: 14,
  },
  info: { color: '#6B7A70', fontSize: 14, paddingVertical: 6 },
  botaoPrimario: {
    backgroundColor: '#2E7D32',
    borderRadius: 8,
    paddingVertical: 11,
    alignItems: 'center',
  },
  botaoDesabilitado: { opacity: 0.6 },
  textoBotaoPrimario: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  linhaTituloLista: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  link: { color: '#2E7D32', fontWeight: '600', fontSize: 14, paddingVertical: 4 },
  itemProduto: {
    borderWidth: 1,
    borderColor: '#E3E8E3',
    backgroundColor: '#FBFCFB',
    borderRadius: 8,
    padding: 12,
    marginTop: 10,
  },
  linhaProduto: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  nomeProduto: { fontSize: 15, fontWeight: '700', color: '#24312A', flexShrink: 1 },
  quantidadeProduto: { fontSize: 15, fontWeight: '700', color: '#1B5E20', marginLeft: 8 },
  avisoEstoqueBaixo: {
    color: '#8D6E00',
    backgroundColor: '#FFF6D6',
    borderWidth: 1,
    borderColor: '#F9A825',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    fontSize: 12,
    fontWeight: '700',
    alignSelf: 'flex-start',
    marginTop: 6,
    overflow: 'hidden',
  },
  linhaBotoesMovimentacao: { flexDirection: 'row', gap: 8 },
  botaoEntrada: {
    flex: 1,
    backgroundColor: '#1565C0',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  botaoVenda: {
    flex: 1,
    backgroundColor: '#B3261E',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  textoBotaoPequeno: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
});
