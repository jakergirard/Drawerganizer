FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

RUN npx prisma generate

COPY . .

COPY .env.production .env
RUN npm run build

RUN echo '#!/bin/sh\n\
npx prisma db push\n\
npm start' > ./start.sh

RUN chmod +x ./start.sh

EXPOSE 3000

CMD ["./start.sh"]
