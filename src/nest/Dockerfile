# DEV
FROM node:17-alpine3.14 AS development

WORKDIR /usr/src/digitaltwin/api

RUN mkdir -p /appdata/chats
RUN mkdir -p /appdata/user

COPY . .

RUN yarn

# PROD
FROM node:17-alpine3.14 AS run

WORKDIR /usr/src/digitaltwin/api

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

COPY --from=development /usr/src/digitaltwin/api .
COPY .env .

EXPOSE 3000
CMD ["node", "dist/server"]
