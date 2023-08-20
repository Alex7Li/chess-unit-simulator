# https://docs.docker.com/language/nodejs/build-images/
FROM node:18-alpine3.17
ENV NODE_ENV=production
WORKDIR /frontend
COPY ["frontend/package_convert_code_server.json", "./package.json"]
RUN yarn install
COPY ["frontend/convert_code_server.ts", "frontend/tsconfig.node.json", "frontend/tsconfig.json", "./"]
COPY ["frontend/src/blockly.ts", "./src/blockly.ts"]
CMD ["yarn", "server"]
