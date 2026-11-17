FROM node:22-alpine
WORKDIR /workspace
COPY package.json package-lock.json nx.json tsconfig.base.json eslint.config.mjs .prettierrc.json ./
COPY apps ./apps
COPY libs ./libs
RUN npm ci --include=dev --no-audit --no-fund
ARG APP_NAME
ENV APP_NAME=${APP_NAME}
RUN find . -name '*.tsbuildinfo' -delete
RUN npm run build --workspace=@sokolink/platform \
  && npm run build --workspace=@sokolink/contracts \
  && npm run build --workspace=@sokolink/${APP_NAME}
USER node
ENV NODE_ENV=production
EXPOSE 3000
CMD ["sh", "-c", "if [ \"$RUN_MIGRATIONS\" = \"true\" ]; then npx prisma migrate deploy --schema apps/$APP_NAME/prisma/schema.prisma; fi && npm run start:prod --workspace=@sokolink/$APP_NAME"]
