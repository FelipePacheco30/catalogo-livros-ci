import pg from 'pg';

export function criarPool(url = process.env.DATABASE_URL) {
  return new pg.Pool({ connectionString: url });
}

export async function migrar(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS livros (
      id SERIAL PRIMARY KEY,
      titulo VARCHAR(200) NOT NULL,
      autor VARCHAR(120) NOT NULL,
      ano INTEGER NOT NULL,
      isbn CHAR(13) NOT NULL UNIQUE,
      criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
}
