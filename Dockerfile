# A imagem usa o artefato gerado por "npm run build" (pasta dist/).
# O bundle já inclui as dependências, então não há node_modules na imagem.
FROM node:24-alpine

ENV NODE_ENV=production PORT=3000
WORKDIR /app

COPY dist ./dist

USER node
EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=3s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "dist/server.cjs"]
