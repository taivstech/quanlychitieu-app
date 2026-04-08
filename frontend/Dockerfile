FROM node:22-alpine

WORKDIR /app

COPY frontend/package.json ./package.json
COPY frontend/package-lock.json ./package-lock.json
RUN npm install

COPY frontend/ ./

EXPOSE 19006

CMD ["npx", "expo", "start", "--web", "--host", "lan", "--port", "19006", "--non-interactive"]