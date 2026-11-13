FROM node:22-alpine
WORKDIR /workspace
COPY package.json package-lock.json nx.json tsconfig.base.json eslint.config.mjs .prettierrc.json ./
COPY apps ./apps
COPY libs ./libs
RUN npm ci --include=dev --no-audit --no-fund
RUN npm run build --workspace=@sokolink/web
USER node
WORKDIR /workspace/apps/web
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
