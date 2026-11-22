FROM node:20-alpine
WORKDIR /app
COPY package.json server.js hash.js ./
ENV PORT=3000 DATA_DIR=/data
EXPOSE 3000
CMD ["node", "server.js"]
