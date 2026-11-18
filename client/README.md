# @arthurzakharov/leadfunnel-client

Typed client for the public API of `leadfunnel-server` (`/api/v1/*`), built on [Hono RPC](https://hono.dev/docs/guides/rpc). Routes, request inputs and responses are typed end to end. Internal routes (`/internal/*`) are not part of it.

## Install (leadfunnel / ovm app)

The package is published to GitHub Packages. Add an `.npmrc` next to the app's `package.json`:

```ini
@arthurzakharov:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

`GITHUB_TOKEN` must be a token with `read:packages` (locally: a personal access token, in CI: the workflow token). Then:

```sh
npm install @arthurzakharov/leadfunnel-client hono
```

`hono` is a peer dependency: keep it on the same minor version as the server.

## Usage

```ts
import { createClient, type InferResponseType } from '@arthurzakharov/leadfunnel-client';

export const api = createClient(import.meta.env.VITE_API_URL, {
  getSessionToken: () => sessionStorage.getItem('session'),
});

const res = await api.api.v1.ovm.$get();
if (res.ok) {
  const data = await res.json();
}

type OvmResponse = InferResponseType<typeof api.api.v1.ovm.$get>;
```

- `baseUrl` is the server origin (e.g. `https://api.example.com`), without `/api/v1`.
- `getSessionToken` is called before every request; when it returns a token, `Authorization: Bearer <token>` is sent.
- Any other [Hono client option](https://hono.dev/docs/guides/rpc#client) (`headers`, `fetch`, `init`, …) can be passed too.
- `DetailedError` and `parseResponse` are re-exported from `hono/client` for error handling.

## Releasing (in leadfunnel-server)

1. Change the API, then bump `version` in `client/package.json` (semver: breaking API change → major).
2. Commit and push a tag `client-v<version>`, e.g. `client-v0.2.0`.
3. The `Publish client` GitHub Action runs the tests, builds and publishes the package.

Manual alternative: `bun run client:build`, then `npm publish` in `client/` (requires a token with `write:packages`).
