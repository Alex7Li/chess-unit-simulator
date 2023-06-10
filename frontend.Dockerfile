FROM node:20-alpine3.17
ENV NODE_ENV=production
WORKDIR /frontend
COPY ["package.json", "yarn.lock", "./"]
RUN yarn install --prod
COPY . .
EXPOSE 5173
CMD ["yarn", "dev"]
