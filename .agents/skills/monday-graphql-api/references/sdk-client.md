# SDK client reference

Source: https://developer.monday.com/api-reference/docs/javascript-sdk

## Package

Install the JavaScript/TypeScript SDK with:

```bash
npm install @mondaydotcomorg/api
```

Use `ApiClient` for Node, browser, or Obsidian plugin code where the user supplies an API token.

```ts
import { ApiClient, ClientError } from "@mondaydotcomorg/api";

const client = new ApiClient({
  token,
  apiVersion: "2026-04",
  requestConfig: {
    errorPolicy: "none",
  },
});
```

The SDK sends `Authorization` and `API-Version` headers. The default endpoint is `https://api.monday.com/v2`; do not override it unless the user explicitly needs a test endpoint.

## Which client to use

- Use `ApiClient` for this Obsidian plugin and most standalone integrations.
- Use `SeamlessApiClient` only inside a monday.com app iframe. It depends on monday's `postMessage` bridge and does not use an API token.

## Request methods

Use `request<T>(query, variables, options)` for normal typed data responses:

```ts
const data = await client.request<{ me: { id: string; name: string } }>(
  `query CurrentUser { me { id name } }`,
);
```

Use `rawRequest<T>()` when response `errors`, `extensions`, complexity metadata, or request IDs matter:

```ts
const response = await client.rawRequest<{ me?: { id: string; name: string } }>(
  `query CurrentUser { me { id name } }`,
);

if (response.errors?.length) {
  throw new MondayGraphqlError(response.errors, response.extensions);
}
```

The third parameter supports per-request `versionOverride` and `timeoutMs`. Keep timeout at or below the SDK/API maximum of 60 seconds.

## API versions

Monday API versions use `yyyy-mm`, where the month is one of `01`, `04`, `07`, or `10`; `dev` targets preview behavior. The SDK validates this format.

For this plugin, default to `2026-04` unless the project settings say otherwise, because multi-level board behavior is part of the planned MVP. Keep version choice centralized in settings/defaults so tests and docs do not drift.

## Error handling

By default, GraphQL errors throw `ClientError` from `graphql-request`. Application-level errors may still arrive with HTTP 200 and an `errors` array. Responses can include partial `data`; do not treat partial data with errors as a full success unless the caller deliberately supports that case.

Capture safe diagnostic data:

- Error message and GraphQL `extensions.code`
- HTTP status/status code when present
- `retry_in_seconds` or `Retry-After` when present
- Monday request ID from response `extensions` when present
- Board ID, item ID, query purpose, and API version

Never log:

- API tokens
- Full vault content
- Full note body text unless the user explicitly asks during debugging

Detect common retry/action categories:

- Complexity limit: `ComplexityException` or messages containing complexity.
- Daily limit: `DAILY_LIMIT_EXCEEDED`.
- Rate/minute/concurrency limit: rate-limit code/message plus retry timing.
- Permissions/access: `UserUnauthorizedException`, `InvalidBoardIdException`, inaccessible board errors.
- Bad query/schema: invalid field, invalid argument, invalid column ID.

## Wrapper pattern

Centralize calls behind a typed project client:

```ts
export class MondayClient {
  private readonly client: ApiClient;

  constructor(options: { token: string; apiVersion: string }) {
    this.client = new ApiClient({
      token: options.token,
      apiVersion: options.apiVersion,
      requestConfig: { errorPolicy: "none" },
    });
  }

  async request<T>(purpose: string, query: string, variables?: Record<string, unknown>): Promise<T> {
    try {
      return await this.client.request<T>(query, variables);
    } catch (error) {
      throw normalizeMondayError(error, purpose);
    }
  }
}
```

Use narrower methods such as `getCurrentUser`, `validateBoard`, `fetchBoardItems`, and `fetchNextItemsPage` on top of the generic request method. This keeps sync code free of transport details.
