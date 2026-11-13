import { validarLivro } from './livro.js';

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

export function criarServico(repositorio) {
  async function garantirIsbnUnico(isbn, idAtual) {
    const existente = await repositorio.buscarPorIsbn(isbn);
    if (existente && existente.id !== idAtual) throw new ErroConflito();
  }

  return {
    listar: (busca, ordem) => repositorio.listar(busca, ordem),

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
