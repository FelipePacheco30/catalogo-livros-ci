import { describe, expect, it } from 'vitest';
import { ErroValidacao, isbnValido, validarLivro } from '../../src/livro.js';

const valido = {
  titulo: 'Dom Casmurro',
  autor: 'Machado de Assis',
  ano: 1899,
  isbn: '9788535902778',
};

describe('isbnValido', () => {
  it('aceita ISBN-13 com dígito verificador correto', () => {
    expect(isbnValido('9788535902778')).toBe(true);
  });

  it('aceita ISBN com hífens', () => {
    expect(isbnValido('978-85-359-0277-8')).toBe(true);
  });

  it('rejeita dígito verificador incorreto', () => {
    expect(isbnValido('9788535902779')).toBe(false);
  });

  it('rejeita tamanho diferente de 13 dígitos ou letras', () => {
    expect(isbnValido('978853590277')).toBe(false);
    expect(isbnValido('97885359027AB')).toBe(false);
    expect(isbnValido(undefined)).toBe(false);
  });
});

describe('validarLivro', () => {
  it('retorna os dados normalizados de um livro válido', () => {
    expect(
      validarLivro({ ...valido, titulo: '  Dom Casmurro ', isbn: '978-85-359-0277-8' }),
    ).toEqual(valido);
  });

  it('rejeita título vazio', () => {
    expect(() => validarLivro({ ...valido, titulo: '   ' })).toThrow(ErroValidacao);
  });

  it('rejeita autor com menos de 3 caracteres', () => {
    expect(() => validarLivro({ ...valido, autor: 'Ma' })).toThrow(ErroValidacao);
  });

  it('rejeita ano no futuro, anterior a 1450 ou não inteiro', () => {
    expect(() => validarLivro({ ...valido, ano: 2031 }, 2026)).toThrow(ErroValidacao);
    expect(() => validarLivro({ ...valido, ano: 1449 })).toThrow(ErroValidacao);
    expect(() => validarLivro({ ...valido, ano: '1899' })).toThrow(ErroValidacao);
  });

  it('reúne todos os erros encontrados', () => {
    try {
      validarLivro({});
    } catch (erro) {
      expect(erro.erros).toHaveLength(4);
    }
    expect.assertions(1);
  });
});
