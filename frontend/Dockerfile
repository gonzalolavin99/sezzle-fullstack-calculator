# Multi-stage build: build the static app with Node, serve it with nginx.

FROM node:24.22.0-alpine3.24 AS build
WORKDIR /app

# Dependencies first, so this layer stays cached while only the code changes.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:1.30.6-alpine
# Where nginx forwards /api; the Compose service name by default. Override it for another deployment.
ENV BACKEND_URL=http://backend:8080
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO /dev/null http://127.0.0.1/ || exit 1
