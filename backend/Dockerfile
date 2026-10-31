# Container image for the backend API. The export job runs the same image with a different
# command (`node dist/jobs/export.js`).
#
# The build context is the REPOSITORY ROOT, not backend/, because the backend imports the
# site's schema and rules from ../src/app (and src/core). Build it from the root:
#
#   docker build -f backend/Dockerfile .
#
# The code is compiled inside the image (first stage), so nothing needs building beforehand.
# The final stage carries only the compiled code and the production dependencies, because the
# build leaves the @google-cloud packages external.

# Stage 1: install everything, compile, then drop the dev dependencies.
FROM node:22-slim AS build
WORKDIR /work/backend
COPY backend/package.json backend/package-lock.json ./
RUN npm ci
COPY src/app ../src/app
COPY src/core ../src/core
COPY backend/tsconfig.json ./
COPY backend/src ./src
RUN npm run build && npm prune --omit=dev

# Stage 2: the runtime image.
FROM node:22-slim
# The same path as the build stage, so the source maps' paths (backend/src and src/app) line up
# with the repository's layout under /work, for a debugger (compose.debug.yaml).
WORKDIR /work/backend
ENV NODE_ENV=production
COPY --from=build /work/backend/node_modules ./node_modules
COPY --from=build /work/backend/dist ./dist
COPY backend/package.json ./
# A directory the unprivileged user can write to, for the export job's output. A named volume
# mounted at /data inherits this ownership the first time it is used.
RUN mkdir -p /data/export && chown -R node:node /data
USER node
EXPOSE 8080
CMD ["node", "dist/server.js"]
