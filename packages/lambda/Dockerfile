# Base stage for shared environment setup
FROM public.ecr.aws/lambda/nodejs:20 as base
WORKDIR /usr/app
COPY package.json ./
RUN npm install -g pnpm
RUN pnpm install

# Builder stage to handle each function
FROM base AS builder
ARG FUNCTION_DIR
WORKDIR /usr/app
# Copy the specific function's directory
COPY ./src/functions/${FUNCTION_DIR} ./functions/${FUNCTION_DIR}
# Change to the function's directory
WORKDIR /usr/app/functions/${FUNCTION_DIR}
# Run esbuild to bundle the function
RUN npx esbuild ./handler.ts --bundle --minify --sourcemap --platform=node --target=es2020 --outfile=./index.js

# Final stage to prepare the image for each function
FROM public.ecr.aws/lambda/nodejs:20
ARG FUNCTION_DIR
WORKDIR ${LAMBDA_TASK_ROOT}
# Copy the built JS file from the previous stage
COPY --from=builder /usr/app/functions/${FUNCTION_DIR}/index.js ./
# Your handler is now at ./index.js
CMD ["index.handler"]
