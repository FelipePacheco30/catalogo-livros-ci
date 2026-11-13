export class ErroValidacao extends Error {
  constructor(erros) {
    super('Dados inválidos');
    this.erros = erros;
  }
}

export function normalizarIsbn(isbn) {
  return String(isbn ?? '').replace(/[-\s]/g, '');
}

export function isbnValido(isbn) {
  const digitos = normalizarIsbn(isbn);
  if (!/^\d{13}$/.test(digitos)) return false;
  const soma = [...digitos.slice(0, 12)].reduce(
    (total, digito, i) => total + Number(digito) * (i % 2 === 0 ? 1 : 3),
    0,
  );
  return (10 - (soma % 10)) % 10 === Number(digitos[12]);
}

export function validarLivro(dados, anoAtual = new Date().getFullYear()) {
  const erros = [];
  const titulo = typeof dados?.titulo === 'string' ? dados.titulo.trim() : '';
  const autor = typeof dados?.autor === 'string' ? dados.autor.trim() : '';
  const ano = dados?.ano;

  if (titulo.length === 0 || titulo.length > 200)
    erros.push('O título deve ter de 1 a 200 caracteres');
  if (autor.length < 3 || autor.length > 120) erros.push('O autor deve ter de 3 a 120 caracteres');
  if (!Number.isInteger(ano) || ano < 1450 || ano > anoAtual) {
    erros.push(`O ano deve ser um número inteiro entre 1450 e ${anoAtual}`);
  }
  if (!isbnValido(dados?.isbn)) erros.push('O ISBN-13 é inválido');

  if (erros.length > 0) throw new ErroValidacao(erros);
  return { titulo, autor, ano, isbn: normalizarIsbn(dados.isbn) };
}
