FROM node:22-alpine
WORKDIR /workspace
COPY package.json .
COPY nx.json tsconfig.base.json eslint.config.mjs .prettierrc.json ./
COPY apps ./apps
COPY libs ./libs
RUN npm install --include=dev --no-audit --no-fund
ARG APP_NAME
RUN npm run build --workspace=@sokolink/platform \
  && npm run build --workspace=@sokolink/contracts \
  && npm run build --workspace=@sokolink/${APP_NAME}
USER node
ENV NODE_ENV=production
EXPOSE 3000
CMD ["sh", "-c", "npm run start:prod --workspace=@sokolink/${APP_NAME}"]
