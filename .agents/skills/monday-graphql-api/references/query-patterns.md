# Query patterns

Sources:

- https://developer.monday.com/api-reference/docs/basics
- https://developer.monday.com/api-reference/docs/querying-board-items
- https://developer.monday.com/api-reference/docs/working-with-multi-level-boards
- https://developer.monday.com/api-reference/docs/rate-limits
- https://developer.monday.com/api-reference/docs/error-handling

## Basics to keep in mind

Monday's API is GraphQL. Request only the fields needed by the caller. Admins and members can use API tokens; guests need other authentication such as OAuth or short-lived token flows.

## Current user

Use current user data before assignment filtering:

```graphql
query CurrentUser {
  me {
    id
    name
    email
  }
}
```

Normalize `me.id` to a string and compare it with People column person IDs.

## Board metadata and validation

Validation should confirm the token can read the board, columns, groups, and at least an item page.

```graphql
query ValidateBoard($ids: [ID!]!) {
  boards(ids: $ids, hierarchy_types: [classic, multi_level]) {
    id
    name
    hierarchy_type
    columns {
      id
      title
      type
      settings_str
      capabilities {
        calculated {
          function
          calculated_type
        }
      }
    }
    groups {
      id
      title
    }
    items_page(limit: 1) {
      cursor
      items {
        id
        name
      }
    }
  }
}
```

If `boards` is empty, report invalid/inaccessible board instead of crashing the settings tab.

## Items pagination

First page:

```graphql
query BoardItemsPage($ids: [ID!]!, $limit: Int!) {
  boards(ids: $ids, hierarchy_types: [classic, multi_level]) {
    id
    name
    hierarchy_type
    items_page(limit: $limit, hierarchy_scope_config: "allItems") {
      cursor
      items {
        id
        name
        updated_at
        url
      }
    }
  }
}
```

Next pages:

```graphql
query NextItemsPage($cursor: String!, $limit: Int!) {
  next_items_page(cursor: $cursor, limit: $limit) {
    cursor
    items {
      id
      name
      updated_at
      url
    }
  }
}
```

Rules:

- `items_page` can retrieve up to 500 items per page.
- Cursors are valid for 60 minutes after the initial request.
- Continue until the cursor is null/empty.
- Merge all pages before hierarchy reconstruction.

## Hierarchy

For multi-level boards, all descendants can share the main board ID and the board can support up to five item layers. `subitems` returns descendants in a flattened list; use `parent_item` to determine direct parentage.

Useful item fields:

```graphql
fragment SyncItemFields on Item {
  id
  name
  updated_at
  url
  group {
    id
    title
  }
  parent_item {
    id
    name
  }
  subitems {
    id
    name
    parent_item {
      id
      name
    }
  }
}
```

Prefer `items_page(hierarchy_scope_config: "allItems")` for a flat item list, then compute:

- top-level item: no `parent_item`
- child item: `parent_item.id`
- `rootItemId` by walking parents
- `hierarchyLevel` by parent depth
- `childItemIds` from reverse parent lookup

Add cycle detection and unresolved-parent handling in the plugin layer.

## Column values

Request display text plus type-specific fields needed by mapping code:

```graphql
fragment ColumnValueFields on ColumnValue {
  id
  type
  text
  value
  ... on PeopleValue {
    persons_and_teams {
      id
      kind
    }
  }
  ... on DateValue {
    date
    time
    is_leaf
  }
  ... on TimelineValue {
    from
    to
    is_leaf
  }
  ... on NumbersValue {
    number
    is_leaf
  }
  ... on BatteryValue {
    battery_value {
      key
      count
    }
    is_leaf
  }
}
```

For multi-level board rollup values, call `column_values(capabilities: [CALCULATED])`. Without it, rollup-capable columns can return empty values, including on leaf items.

Status rollup columns resolve to `BatteryValue`, not `StatusValue`. Use `text` as a safe display fallback for unknown or unsupported column types.

## Updates/comments

Only fetch updates when the feature is enabled, and respect the configured limit:

```graphql
query ItemUpdates($itemIds: [ID!]!, $limit: Int!) {
  items(ids: $itemIds) {
    id
    updates(limit: $limit) {
      id
      body
      created_at
      creator {
        id
        name
      }
    }
  }
}
```

Render updates into generated Markdown sections, not frontmatter. Sanitize HTML before writing note content.

## Complexity and rate limits

Monday enforces complexity, daily call, minute, concurrency, IP, and resource protection limits. Reduce risk by:

- requesting only required fields
- reducing nested queries
- using page/limit arguments
- splitting updates fetching from core item pagination when needed
- using retry timing from `retry_in_seconds` or `Retry-After`

When debugging heavy queries, include the `complexity` field in a development-only query to inspect query cost and remaining budget.
