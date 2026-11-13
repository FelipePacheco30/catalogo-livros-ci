const COLUNAS = 'id, titulo, autor, ano, isbn';

export function criarRepositorio(pool) {
  return {
    async listar(busca) {
      if (!busca) {
        const { rows } = await pool.query(`SELECT ${COLUNAS} FROM livros ORDER BY titulo`);
        return rows;
      }
      const { rows } = await pool.query(
        `SELECT ${COLUNAS} FROM livros WHERE titulo ILIKE $1 OR autor ILIKE $1 ORDER BY titulo`,
        [`%${busca}%`],
      );
      return rows;
    },

    async buscar(id) {
      const { rows } = await pool.query(`SELECT ${COLUNAS} FROM livros WHERE id = $1`, [id]);
      return rows[0] ?? null;
    },

    async buscarPorIsbn(isbn) {
      const { rows } = await pool.query(`SELECT ${COLUNAS} FROM livros WHERE isbn = $1`, [isbn]);
      return rows[0] ?? null;
    },

    async criar({ titulo, autor, ano, isbn }) {
      const { rows } = await pool.query(
        `INSERT INTO livros (titulo, autor, ano, isbn) VALUES ($1, $2, $3, $4) RETURNING ${COLUNAS}`,
        [titulo, autor, ano, isbn],
      );
      return rows[0];
    },

    async atualizar(id, { titulo, autor, ano, isbn }) {
      const { rows } = await pool.query(
        `UPDATE livros SET titulo = $1, autor = $2, ano = $3, isbn = $4 WHERE id = $5 RETURNING ${COLUNAS}`,
        [titulo, autor, ano, isbn, id],
      );
      return rows[0] ?? null;
    },

    async remover(id) {
      const { rowCount } = await pool.query('DELETE FROM livros WHERE id = $1', [id]);
      return rowCount > 0;
    },
  };
}
