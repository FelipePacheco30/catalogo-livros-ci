# Catálogo de Livros — API REST com PostgreSQL e CI no GitHub Actions

API REST de catálogo de livros (Node.js, Express e PostgreSQL) usada para implementar um
pipeline de integração contínua com análise estática, formatação, análise de segurança,
build, testes unitários, testes de integração e criação de imagem Docker.

## Endpoints

| Método | Rota                 | Descrição                              |
| ------ | -------------------- | -------------------------------------- |
| GET    | `/health`            | Saúde da API e da conexão com o banco  |
| GET    | `/api/livros?busca=` | Lista livros (filtro por título/autor) |
| GET    | `/api/livros/:id`    | Busca um livro                         |
| POST   | `/api/livros`        | Cadastra um livro                      |
| PUT    | `/api/livros/:id`    | Atualiza um livro                      |
| DELETE | `/api/livros/:id`    | Remove um livro                        |

## Executando

```bash
npm ci
npm run build
docker compose up --build
```

## Scripts

| Comando                    | O que faz                                       |
| -------------------------- | ----------------------------------------------- |
| `npm run lint`             | Análise estática com ESLint                     |
| `npm run format:check`     | Verifica a formatação com Prettier              |
| `npm run build`            | Gera o bundle de produção em `dist/`            |
| `npm run test:unit`        | Testes unitários (Vitest)                       |
| `npm run test:integration` | Testes de integração com PostgreSQL (Supertest) |
