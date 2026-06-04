# Vue 3 SSR site (Bun). Build context = src/Frontend:  docker build src/Frontend
FROM oven/bun:1 AS build
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build   # type-check + client bundle (dist/client) + SSR bundle (dist/server)

FROM oven/bun:1 AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    PORT=5173
# server.ts (prod) serves dist/client via sirv and imports the dist/server SSR bundle.
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/server.ts ./server.ts
COPY --from=build /app/package.json ./package.json
EXPOSE 5173
CMD ["bun", "run", "server.ts"]
