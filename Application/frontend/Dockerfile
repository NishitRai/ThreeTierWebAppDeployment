FROM node:20 AS builder
WORKDIR /usr/src/app

ARG REACT_APP_BACKEND_URL
ENV REACT_APP_BACKEND_URL=$REACT_APP_BACKEND_URL

COPY package*.json ./
RUN npm install
RUN npx update-browserslist-db@latest
COPY . .
RUN npm run build

# Stage2: Create final image
FROM nginx:alpine
WORKDIR /app
COPY --from=builder /usr/src/app/build/ /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
