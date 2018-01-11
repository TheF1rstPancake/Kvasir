FROM node:8

ENV NODE_PATH /node/node_modules
WORKDIR "/app"

RUN mkdir -p /node
COPY package.json /node
RUN npm install --progress=false --prefix=/node

COPY entrypoint.sh /
ENTRYPOINT ["/entrypoint.sh"]

CMD ["npm", "run", "launch"]
