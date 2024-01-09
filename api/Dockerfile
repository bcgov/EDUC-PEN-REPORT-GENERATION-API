FROM artifacts.developer.gov.bc.ca/docker-remote/node:lts-alpine3.13

ENV npm_config_cache /tmp/npm
RUN mkdir -p /logs
RUN chmod 755 /logs

WORKDIR /api

RUN ln -s /logs .
COPY package*.json ./
RUN npm ci
COPY . /api
RUN npm run build
EXPOSE 443 3000
CMD ["npm", "start"]
