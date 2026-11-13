import { beforeEach, describe, expect, it } from 'vitest';
import { ErroValidacao } from '../../src/livro.js';
import { criarServico, ErroConflito, ErroNaoEncontrado } from '../../src/servico.js';

// Repositório falso em memória: isola as regras do serviço do banco de dados.
function repositorioEmMemoria() {
  const livros = [];
  return {
    listar: async () => livros,
    buscar: async (id) => livros.find((l) => l.id === id) ?? null,
    buscarPorIsbn: async (isbn) => livros.find((l) => l.isbn === isbn) ?? null,
    criar: async (dados) => {
      const livro = { id: livros.length + 1, ...dados };
      livros.push(livro);
      return livro;
    },
    atualizar: async (id, dados) =>
      Object.assign(
        livros.find((l) => l.id === id),
        dados,
      ),
    remover: async (id) => {
      const i = livros.findIndex((l) => l.id === id);
      if (i < 0) return false;
      livros.splice(i, 1);
      return true;
    },
  };
}

const livro = {
  titulo: 'Dom Casmurro',
  autor: 'Machado de Assis',
  ano: 1899,
  isbn: '9788535902778',
};

describe('serviço de livros', () => {
  let servico;

  beforeEach(() => {
    servico = criarServico(repositorioEmMemoria());
  });

  it('cria um livro válido', async () => {
    expect(await servico.criar(livro)).toEqual({ id: 1, ...livro });
  });

  it('não cria livro inválido', async () => {
    await expect(servico.criar({ ...livro, isbn: '123' })).rejects.toThrow(ErroValidacao);
  });

  it('não permite dois livros com o mesmo ISBN', async () => {
    await servico.criar(livro);
    await expect(servico.criar({ ...livro, titulo: 'Outro' })).rejects.toThrow(ErroConflito);
  });

  it('permite atualizar um livro mantendo o próprio ISBN', async () => {
    const { id } = await servico.criar(livro);
    expect((await servico.atualizar(id, { ...livro, ano: 1900 })).ano).toBe(1900);
  });

  it('não permite atualizar para o ISBN de outro livro', async () => {
    await servico.criar(livro);
    const { id } = await servico.criar({ ...livro, isbn: '9788575214336' });
    await expect(servico.atualizar(id, livro)).rejects.toThrow(ErroConflito);
  });

  it('só aceita ordenar por titulo, autor ou ano', async () => {
    expect(() => servico.listar(undefined, '(SELECT 1 FROM pg_sleep(3))')).toThrow(ErroValidacao);
    await expect(servico.listar(undefined, 'ano')).resolves.toEqual([]);
  });

  it('lança ErroNaoEncontrado para id inexistente', async () => {
    await expect(servico.buscar(99)).rejects.toThrow(ErroNaoEncontrado);
    await expect(servico.atualizar(99, livro)).rejects.toThrow(ErroNaoEncontrado);
    await expect(servico.remover(99)).rejects.toThrow(ErroNaoEncontrado);
  });
});
