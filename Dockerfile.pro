FROM node:18-alpine

WORKDIR /app

RUN apk add --no-cache git

ARG GIT_COMMIT=main

COPY . .

RUN git checkout --force ${GIT_COMMIT} && \
    npm install && \
    npm run build && \
    rm -rf .git

EXPOSE 3000
    
CMD ["npm", "start"]