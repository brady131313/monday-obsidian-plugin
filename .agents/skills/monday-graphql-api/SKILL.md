---
name: monday-graphql-api
description: Build, review, or debug monday.com GraphQL API integrations that use the @mondaydotcomorg/api JavaScript/TypeScript package. Use for monday.com API client setup, custom GraphQL queries, board and item pagination, multi-level board hierarchy, rollup column values, API versioning, rate-limit and GraphQL error handling, and the project-specific read-only Obsidian Monday sync plugin.
---

# Monday GraphQL API

## Workflow

1. Confirm whether the task is generic monday.com API work or this Obsidian sync plugin.
2. Use `@mondaydotcomorg/api` `ApiClient` for standalone/plugin code that has a token. Do not use `SeamlessApiClient` unless the code runs inside a monday.com app iframe.
3. Prefer custom GraphQL queries through `client.request<T>()` or `client.rawRequest<T>()` when the plugin needs exact fields, pagination, hierarchy, updates, or rollup data.
4. Keep Monday network access centralized behind one client/service boundary. Never log API tokens.
5. Treat Monday as the source of truth only for Monday-owned metadata. For this plugin, never write to Monday.

## References

- Read `references/sdk-client.md` for package usage, API versioning, error handling, and client wrapper patterns.
- Read `references/query-patterns.md` for board validation, current user, items pagination, hierarchy, updates, and column value query shapes.
- Read `references/obsidian-sync-contract.md` before changing this repo's sync behavior, mapping, filtering, or tests.

## Implementation Rules

- Set the API version explicitly from settings or a central default. This project currently plans `2026-04` to support multi-level boards by default.
- Use string IDs in plugin-normalized data, even when GraphQL accepts numeric IDs.
- Paginate boards with `items_page` for the first page and `next_items_page` until no cursor remains.
- Query only fields the feature needs; large nested queries increase complexity and make error recovery harder.
- Handle transport errors, non-2xx responses, GraphQL `errors` with partial `data`, complexity/rate-limit errors, missing expected fields, and request IDs.
- In tests, mock the Monday client boundary instead of making live API calls.

## Project-Specific Guardrails

- Preserve the read-only product boundary: no item creation, updates, archive/delete mutations, or updates/comments posted to Monday.
- Upsert Obsidian notes by `monday_item_id`, never by filename or item name.
- Preserve all user-owned note content. Only update frontmatter keys beginning with `monday_` and Markdown inside exact `monday-sync` fenced regions.
- Include assigned items and required ancestor context notes. Mark context notes with `monday_synced_as_context: true`.
- Support classic subitems and multi-level child items. Reconstruct parent/root/level relationships from returned item IDs and `parent_item`.
