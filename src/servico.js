import { ErroValidacao, validarLivro } from './livro.js';

export class ErroNaoEncontrado extends Error {
  constructor() {
    super('Livro não encontrado');
  }
}

export class ErroConflito extends Error {
  constructor() {
    super('Já existe um livro com este ISBN');
  }
}

// Nomes de coluna não podem ser parâmetros ($1) no ORDER BY: só valores desta lista chegam ao SQL.
const ORDENS = new Map([
  ['titulo', 'titulo'],
  ['autor', 'autor'],
  ['ano', 'ano'],
]);

export function criarServico(repositorio) {
  async function garantirIsbnUnico(isbn, idAtual) {
    const existente = await repositorio.buscarPorIsbn(isbn);
    if (existente && existente.id !== idAtual) throw new ErroConflito();
  }

  return {
    listar(busca, ordem = 'titulo') {
      const coluna = ORDENS.get(ordem);
      if (!coluna) throw new ErroValidacao(['A ordem deve ser titulo, autor ou ano']);
      return repositorio.listar(busca, coluna);
    },

    async buscar(id) {
      const livro = await repositorio.buscar(id);
      if (!livro) throw new ErroNaoEncontrado();
      return livro;
    },

    async criar(dados) {
      const livro = validarLivro(dados);
      await garantirIsbnUnico(livro.isbn);
      return repositorio.criar(livro);
    },

    async atualizar(id, dados) {
      const livro = validarLivro(dados);
      await this.buscar(id);
      await garantirIsbnUnico(livro.isbn, id);
      return repositorio.atualizar(id, livro);
    },

    async remover(id) {
      if (!(await repositorio.remover(id))) throw new ErroNaoEncontrado();
    },
  };
}
