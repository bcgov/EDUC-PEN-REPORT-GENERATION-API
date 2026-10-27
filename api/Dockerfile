FROM artifacts.developer.gov.bc.ca/docker-remote/node:22.23.4-alpine3.23
RUN apk upgrade --no-cache && \
    mkdir -p /logs && \
    chmod 755 /logs

WORKDIR /api

RUN ln -s /logs .
COPY package*.json ./
RUN npm ci
COPY . /api
RUN npm run build
EXPOSE 443 3000
CMD ["node", "--max-old-space-size=250", "-r", "module-alias/register", "./dist/src/report-generation-application.js"]
