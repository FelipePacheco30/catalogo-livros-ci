import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { criarApp } from '../../src/app.js';
import { criarPool, migrar } from '../../src/db.js';

// Testes de integração: API real + PostgreSQL real (DATABASE_URL).
const pool = criarPool(
  process.env.DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/catalogo_test',
);
const app = criarApp(pool);

const domCasmurro = {
  titulo: 'Dom Casmurro',
  autor: 'Machado de Assis',
  ano: 1899,
  isbn: '9788535902778',
};
const vidasSecas = {
  titulo: 'Vidas Secas',
  autor: 'Graciliano Ramos',
  ano: 1938,
  isbn: '9788595084841',
};

describe('API /api/livros com PostgreSQL', () => {
  beforeAll(() => migrar(pool));
  beforeEach(() => pool.query('TRUNCATE livros RESTART IDENTITY'));
  afterAll(() => pool.end());

  it('GET /health confirma a conexão com o banco', async () => {
    const resposta = await request(app).get('/health');
    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual({ status: 'ok', banco: 'ok' });
  });

  it('POST grava o livro no banco', async () => {
    const resposta = await request(app).post('/api/livros').send(domCasmurro);
    expect(resposta.status).toBe(201);
    expect(resposta.body).toEqual({ id: 1, ...domCasmurro });
    const { rows } = await pool.query('SELECT titulo FROM livros');
    expect(rows).toEqual([{ titulo: 'Dom Casmurro' }]);
  });

  it('POST retorna 400 com os erros de validação', async () => {
    const resposta = await request(app).post('/api/livros').send({ titulo: 'X' });
    expect(resposta.status).toBe(400);
    expect(resposta.body.erros.length).toBeGreaterThan(0);
  });

  it('POST retorna 409 para ISBN duplicado', async () => {
    await request(app).post('/api/livros').send(domCasmurro);
    const resposta = await request(app).post('/api/livros').send(domCasmurro);
    expect(resposta.status).toBe(409);
  });

  it('GET lista em ordem alfabética e filtra por título ou autor', async () => {
    await request(app).post('/api/livros').send(vidasSecas);
    await request(app).post('/api/livros').send(domCasmurro);
    const todos = await request(app).get('/api/livros');
    expect(todos.body.map((l) => l.titulo)).toEqual(['Dom Casmurro', 'Vidas Secas']);
    const filtrados = await request(app).get('/api/livros?busca=graciliano');
    expect(filtrados.body.map((l) => l.titulo)).toEqual(['Vidas Secas']);
  });

  it('GET ordena pelo campo informado em ?ordem=', async () => {
    await request(app).post('/api/livros').send(vidasSecas);
    await request(app).post('/api/livros').send(domCasmurro);
    const resposta = await request(app).get('/api/livros?ordem=ano');
    expect(resposta.body.map((l) => l.ano)).toEqual([1899, 1938]);
  });

  it('GET retorna 400 para ordem fora da lista permitida', async () => {
    const resposta = await request(app).get('/api/livros?ordem=(SELECT 1 FROM pg_sleep(3))');
    expect(resposta.status).toBe(400);
  });

  it('GET /api/autores/:autor/livros lista os livros do autor', async () => {
    await request(app).post('/api/livros').send(vidasSecas);
    await request(app).post('/api/livros').send(domCasmurro);
    const resposta = await request(app).get('/api/autores/Machado de Assis/livros');
    expect(resposta.body.map((l) => l.titulo)).toEqual(['Dom Casmurro']);
  });

  it('GET /:id retorna o livro ou 404', async () => {
    await request(app).post('/api/livros').send(domCasmurro);
    expect((await request(app).get('/api/livros/1')).body.titulo).toBe('Dom Casmurro');
    expect((await request(app).get('/api/livros/99')).status).toBe(404);
  });

  it('PUT atualiza o livro no banco', async () => {
    await request(app).post('/api/livros').send(domCasmurro);
    const resposta = await request(app)
      .put('/api/livros/1')
      .send({ ...domCasmurro, ano: 1900 });
    expect(resposta.status).toBe(200);
    const { rows } = await pool.query('SELECT ano FROM livros WHERE id = 1');
    expect(rows[0].ano).toBe(1900);
  });

  it('DELETE remove o livro e responde 204', async () => {
    await request(app).post('/api/livros').send(domCasmurro);
    expect((await request(app).delete('/api/livros/1')).status).toBe(204);
    expect((await request(app).delete('/api/livros/1')).status).toBe(404);
  });

  it('retorna 400 quando o corpo não é um JSON válido', async () => {
    const resposta = await request(app)
      .post('/api/livros')
      .set('Content-Type', 'application/json')
      .send('{"titulo": ');
    expect(resposta.status).toBe(400);
  });
});
