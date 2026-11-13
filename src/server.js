import { criarApp } from './app.js';
import { criarPool, migrar } from './db.js';

async function iniciar() {
  const pool = criarPool();
  await migrar(pool);

  const porta = Number(process.env.PORT ?? 3000);
  const servidor = criarApp(pool).listen(porta, () => {
    console.info(`API rodando em http://localhost:${porta}`);
  });

  process.on('SIGTERM', () => servidor.close(() => pool.end().then(() => process.exit(0))));
}

iniciar().catch((erro) => {
  console.error('Falha ao iniciar a API:', erro.message);
  process.exit(1);
});
