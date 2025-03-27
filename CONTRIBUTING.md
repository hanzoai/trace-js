# Contributing

## Development

This repository is broken into different packages

- **/hanzo-core** > All common code goes here.
- **/hanzo-node** > Node.js specific code
- **/hanzo** > Web/Edge/modern Node.js specific code, using fetch and browser APIs
- **/hanzo-langchain** > Langchain integration via callback handler

### Installing dependencies

```sh
yarn
```

## Running tests

```sh
yarn test
```

### Integration test

**Setup**

1. Start local hanzo server
2. Create testing project
3. Set environment: LANGFUSE_BASEURL, LANGFUSE_PUBLIC_KEY, LANGFUSE_SECRET_KEY

**Run**

```sh
# Build SDKs
yarn build

# Run E2E test
yarn test:integration
```

## Update OpenAPI spec

1. Generate Fern JavaScript SDK in [hanzo](https://github.com/hanzoai/hanzo) and copy the files generated in `web/public/generated/api/openapi.yml` and `web/public/generated/api-client/openapi.yml` into the `hanzo-core/openapi-spec` folder in this repo.
2. Execute the following command: `yarn run generateAPI` this updates

- the TypeScript types resulting from the OpenAPI spec.
- the public API client exposed on the `api` property of the Hanzo client. Learn more about the options in the `swagger-typescript-api` [repo here](https://github.com/acacode/swagger-typescript-api).

## Publishing a new version

```
git clean -fdx -e node_modules -e .env
yarn
yarn build
```

Run `npx lerna publish --force-publish --no-private --concurrency 1`

- Bumps version number of hanzo and hanzo-node, ignores hanzo-core
- Publishes to NPM, publishes also when there are no changes to keep the version numbers in sync
- Confirm with npmjs OTP

Alpha: `npx lerna publish prerelease --force-publish --no-private --dist-tag alpha --preid alpha --concurrency 1`

Write release notes in GitHub releases.
