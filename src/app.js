import express from 'express';
import { rateLimit } from 'express-rate-limit';
import { ErroValidacao } from './livro.js';
import { criarRepositorio } from './repositorio.js';
import { criarServico, ErroConflito, ErroNaoEncontrado } from './servico.js';

export function criarApp(pool) {
  const servico = criarServico(criarRepositorio(pool));
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json());
  // Limita cada IP a 100 requisições por minuto (proteção contra abuso e negação de serviço).
  app.use(
    rateLimit({ windowMs: 60_000, limit: 100, standardHeaders: 'draft-8', legacyHeaders: false }),
  );

  app.get('/health', async (_req, res) => {
    try {
      await pool.query('SELECT 1');
      res.json({ status: 'ok', banco: 'ok' });
    } catch {
      res.status(503).json({ status: 'erro', banco: 'indisponível' });
    }
  });

  app.get('/api/livros', async (req, res) => {
    res.json(await servico.listar(req.query.busca, req.query.ordem));
  });

  app.get('/api/autores/:autor/livros', async (req, res) => {
    res.json(await servico.listarPorAutor(req.params.autor));
  });

  app.get('/api/livros/:id', async (req, res) => {
    res.json(await servico.buscar(Number(req.params.id)));
  });

  app.post('/api/livros', async (req, res) => {
    res.status(201).json(await servico.criar(req.body));
  });

  app.put('/api/livros/:id', async (req, res) => {
    res.json(await servico.atualizar(Number(req.params.id), req.body));
  });

  app.delete('/api/livros/:id', async (req, res) => {
    await servico.remover(Number(req.params.id));
    res.status(204).end();
  });

  app.use((erro, _req, res, _next) => {
    if (erro instanceof ErroValidacao) return res.status(400).json({ erros: erro.erros });
    if (erro instanceof ErroNaoEncontrado) return res.status(404).json({ erro: erro.message });
    if (erro instanceof ErroConflito) return res.status(409).json({ erro: erro.message });
    if (erro.type === 'entity.parse.failed') return res.status(400).json({ erro: 'JSON inválido' });
    console.error(erro);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  });

  return app;
}
